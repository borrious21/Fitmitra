// src/services/workout.service.js
// Fixes:
//   1. generateTodayWorkout: checks for existing workout before creating a new plan
//   2. generateTodayWorkout: passes recent exercise names to generator for rotation
//   3. getWorkoutForDate: uses daily_exercises from plan (pre-built, equipment-aware)
//   4. _getCurrentStreak: counts streak if today OR yesterday has a log (streak isn't 0 before you log today)
//   5. getWorkoutHistory: correctly respects completedOnly filter
//   6. SQL injection fix: uses parameterized $N placeholders instead of string interpolation

import pool from "../config/db.config.js";
import { getTodayKey } from "../utils/day.utils.js";
import { generateWorkoutPlan } from "../domain/workout.generator.js";
import ProfileModel from "../models/profile.model.js";

class WorkoutService {

  static async getTodayWorkout(userId) {
    return this.getWorkoutForDate(userId, new Date());
  }

  static async generateTodayWorkout(userId) {
    try {
      const numericUserId = Number(userId);
      const profile = await ProfileModel.findByUserId(numericUserId);
      if (!profile) return null;

      // FIX #1: Don't regenerate if an active plan already exists for this user
      const { rows: existing } = await pool.query(
        `SELECT id FROM plans WHERE user_id = $1 AND is_active = true LIMIT 1`,
        [numericUserId]
      );
      if (existing.length > 0) {
        return this.getWorkoutForDate(numericUserId, new Date());
      }

      // FIX #2: Fetch recent exercise names for rotation
      const { rows: recentRows } = await pool.query(
        `SELECT DISTINCT exercise_name FROM workout_logs
         WHERE user_id = $1 AND workout_date >= CURRENT_DATE - INTERVAL '14 days'`,
        [numericUserId]
      );
      const recentExerciseNames = recentRows.map(r => r.exercise_name);

      const workoutPlan = generateWorkoutPlan({
        ...profile,
        recent_exercise_names: recentExerciseNames,
      });
      const mealPlan = { diet_type: profile.diet_type, goal: profile.goal };

      await pool.query(
        `UPDATE plans SET is_active = false WHERE user_id = $1 AND is_active = true`,
        [numericUserId]
      );
      await pool.query(
        `INSERT INTO plans (user_id, workout_plan, meal_plan, is_active, duration_weeks, goals)
         VALUES ($1, $2, $3, true, 4, $4)`,
        [numericUserId, JSON.stringify(workoutPlan), JSON.stringify(mealPlan), profile.goal]
      );

      return this.getWorkoutForDate(numericUserId, new Date());
    } catch (err) {
      console.error("WorkoutService:generateTodayWorkout", err);
      return null;
    }
  }

  static async getWorkoutForDate(userId, date = new Date()) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) throw new Error("Invalid userId");

      const dayKey  = getTodayKey(new Date(date));
      const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : date;

      const { rows: planRows } = await pool.query(
        `SELECT workout_plan FROM plans WHERE user_id = $1 AND is_active = true LIMIT 1`,
        [numericUserId]
      );
      if (!planRows.length || !planRows[0].workout_plan) return null;

      const plan = planRows[0].workout_plan;

      let weeklyPlan = plan.weekly_plan;
      if (typeof weeklyPlan === "string") {
        try { weeklyPlan = JSON.parse(weeklyPlan); } catch { weeklyPlan = {}; }
      }
      if (!weeklyPlan || typeof weeklyPlan !== "object") weeklyPlan = {};

      // FIX #3: Use pre-built daily_exercises from plan (equipment-aware, rotated)
      let dailyExercises = plan.daily_exercises ?? {};
      if (typeof dailyExercises === "string") {
        try { dailyExercises = JSON.parse(dailyExercises); } catch { dailyExercises = {}; }
      }

      const { rows: logRows } = await pool.query(
        `SELECT exercise_name, sets_completed, reps_completed, weight_used,
                duration_minutes, perceived_exertion, fatigue_level, notes, created_at
         FROM workout_logs
         WHERE user_id = $1 AND workout_date = $2::date
         ORDER BY created_at`,
        [numericUserId, dateStr]
      );

      const exerciseLogs = logRows.map(row => ({
        exercise_name:      row.exercise_name,
        sets_completed:     row.sets_completed,
        reps_completed:     row.reps_completed,
        weight_used:        row.weight_used,
        duration_minutes:   row.duration_minutes,
        perceived_exertion: row.perceived_exertion,
        fatigue_level:      row.fatigue_level,
        notes:              row.notes,
        logged_at:          row.created_at,
      }));

      const todayMuscleGroups = weeklyPlan[dayKey] ?? [];
      const isRestDay = this._isRestDay(todayMuscleGroups);

      // Build exercises: prefer logs if present, else use pre-built daily_exercises,
      // else fall back to legacy _buildExerciseList
      let exercises;
      if (exerciseLogs.length > 0) {
        exercises = exerciseLogs.map(log => ({
          name: log.exercise_name,
          sets: log.sets_completed ?? "—",
          reps: log.reps_completed ?? "—",
          done: true,
        }));
      } else if (!isRestDay && dailyExercises[dayKey]?.length) {
        exercises = dailyExercises[dayKey].map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          done: false,
        }));
      } else {
        exercises = isRestDay ? [] : this._buildExerciseList(todayMuscleGroups, plan.workout_details, []);
      }

      return {
        name:          this._buildWorkoutName(todayMuscleGroups),
        isRestDay,
        day:           dayKey,
        date:          dateStr,
        duration:      plan.workout_details?.cardio_guidance?.duration ?? "45–60 min",
        difficulty:    this._mapIntensityLabel(plan.meta?.intensity),
        muscle_groups: todayMuscleGroups,
        exercises,
        completed:     exerciseLogs.length > 0,
        exercise_logs: exerciseLogs,
        meta:          plan.meta || {},
        guidelines:    plan.guidelines || {},
        safety_notes:  plan.safety_notes || [],
      };
    } catch (err) {
      console.error("WorkoutService:getWorkoutForDate", err);
      throw err;
    }
  }

  static _isRestDay(muscleGroups) {
    if (!muscleGroups?.length) return true;
    return muscleGroups.every(g => /^rest/i.test(g.trim()));
  }

  // Legacy fallback exercise list (kept for backwards compatibility with old plans)
  static _buildExerciseList(muscleGroups, workoutDetails, logs) {
    if (this._isRestDay(muscleGroups)) return [];
    if (logs.length > 0) {
      return logs.map(log => ({
        name: log.exercise_name,
        sets: log.sets_completed ?? "—",
        reps: log.reps_completed ?? "—",
        done: true,
      }));
    }
    const exerciseMap = {
      "Chest":               [{ name: "Bench Press", sets: 3, reps: 10 }, { name: "Push-Ups", sets: 3, reps: 15 }],
      "Back":                [{ name: "Pull-Ups", sets: 3, reps: 8 }, { name: "Bent Over Row", sets: 3, reps: 10 }],
      "Biceps":              [{ name: "Barbell Curl", sets: 3, reps: 12 }, { name: "Hammer Curl", sets: 3, reps: 12 }],
      "Triceps":             [{ name: "Tricep Dips", sets: 3, reps: 12 }, { name: "Skull Crushers", sets: 3, reps: 10 }],
      "Shoulders":           [{ name: "Overhead Press", sets: 3, reps: 10 }, { name: "Lateral Raises", sets: 3, reps: 15 }],
      "Legs":                [{ name: "Squats", sets: 3, reps: 12 }, { name: "Lunges", sets: 3, reps: 10 }],
      "Lower Body":          [{ name: "Squats", sets: 3, reps: 12 }, { name: "Romanian Deadlift", sets: 3, reps: 10 }],
      "Upper Body":          [{ name: "Push-Ups", sets: 3, reps: 15 }, { name: "Dumbbell Row", sets: 3, reps: 12 }],
      "Core":                [{ name: "Plank", sets: 3, reps: "60s" }, { name: "Crunches", sets: 3, reps: 20 }],
      "Full Body":           [{ name: "Deadlift", sets: 3, reps: 8 }, { name: "Goblet Squat", sets: 3, reps: 12 }],
      "Full Body (Light)":   [{ name: "Bodyweight Squat", sets: 2, reps: 15 }, { name: "Wall Push-Ups", sets: 2, reps: 15 }],
      "Cardio (Moderate)":   [{ name: "Brisk Walk / Jog", sets: 1, reps: "30 min" }],
      "Cardio (30 min)":     [{ name: "Cardio of Choice", sets: 1, reps: "30 min" }],
      "Moderate Cardio":     [{ name: "Moderate Cardio", sets: 1, reps: "30–40 min" }],
      "Low-Intensity Cardio (30 min)": [{ name: "Walking", sets: 1, reps: "30 min" }],
    };
    const exercises = [];
    for (const group of muscleGroups) {
      const key = Object.keys(exerciseMap).find(k => group.includes(k)) ?? group;
      const list = exerciseMap[key] ?? [{ name: group, sets: 3, reps: 10 }];
      exercises.push(...list.map(e => ({ ...e, done: false })));
    }
    return exercises;
  }

  static _buildWorkoutName(muscleGroups) {
    if (!muscleGroups?.length) return "Rest & Recovery";
    if (this._isRestDay(muscleGroups)) return "Rest & Recovery";
    return muscleGroups.join(" + ");
  }

  static _mapIntensityLabel(intensity) {
    const map = {
      "low":              "Beginner",
      "low-to-moderate":  "Easy",
      "moderate":         "Intermediate",
      "moderate-to-high": "Advanced",
      "high":             "Elite",
    };
    return map[intensity] ?? "Intermediate";
  }

  static async getWeeklyPlan(userId) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) throw new Error("Invalid userId");
      const { rows } = await pool.query(
        `SELECT workout_plan FROM plans WHERE user_id = $1 AND is_active = true LIMIT 1`,
        [numericUserId]
      );
      if (!rows.length) return null;
      const plan = rows[0].workout_plan;
      return {
        weekly_plan:     plan.weekly_plan || {},
        meta:            plan.meta || {},
        guidelines:      plan.guidelines || {},
        safety_notes:    plan.safety_notes || [],
        workout_details: plan.workout_details || {},
      };
    } catch (err) {
      console.error("WorkoutService:getWeeklyPlan", err);
      throw err;
    }
  }

  static async logWorkout(userId, logData) {
    const client = await pool.connect();
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) throw new Error("Invalid userId");
      const {
        date = new Date(), exercise_name,
        sets_completed = null, reps_completed = null,
        weight_used = null, duration_minutes = null,
        perceived_exertion = null, fatigue_level = null, notes = null,
      } = logData;
      if (!exercise_name) throw new Error("exercise_name is required");
      const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : date;
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO workout_logs (user_id, workout_date, exercise_name, sets_completed,
          reps_completed, weight_used, duration_minutes, perceived_exertion, fatigue_level, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [numericUserId, dateStr, exercise_name, sets_completed, reps_completed,
         weight_used, duration_minutes, perceived_exertion, fatigue_level, notes]
      );
      await client.query("COMMIT");
      return rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  static async logMultipleExercises(userId, logData) {
    const client = await pool.connect();
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) throw new Error("Invalid userId");
      const {
        date = new Date(), exercises = [],
        duration_minutes = null, perceived_exertion = null,
        fatigue_level = null, notes = null,
      } = logData;
      if (!Array.isArray(exercises) || exercises.length === 0)
        throw new Error("exercises array is required and must not be empty");
      const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : date;
      await client.query("BEGIN");
      const insertedLogs = [];
      for (const exercise of exercises) {
        const { name, sets = null, reps = null, weight = null } = exercise;
        if (!name) throw new Error("Each exercise must have a name");
        const { rows } = await client.query(
          `INSERT INTO workout_logs (user_id, workout_date, exercise_name, sets_completed,
            reps_completed, weight_used, duration_minutes, perceived_exertion, fatigue_level, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [numericUserId, dateStr, name, sets, reps, weight,
           duration_minutes, perceived_exertion, fatigue_level, notes]
        );
        insertedLogs.push(rows[0]);
      }
      await client.query("COMMIT");
      return insertedLogs;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // FIX #5: completedOnly filter is now actually applied
  static async getWorkoutHistory(userId, options = {}) {
    try {
      const numericUserId = Number(userId);
      const { limit = 30, offset = 0, startDate, endDate, completedOnly = false } = options;

      let query = `SELECT workout_date AS date, exercise_name, sets_completed, reps_completed,
                          weight_used, duration_minutes, perceived_exertion, fatigue_level, notes,
                          created_at, updated_at
                   FROM workout_logs WHERE user_id = $1`;
      const params = [numericUserId];
      let idx = 2;

      if (startDate)      { query += ` AND workout_date >= $${idx++}`; params.push(startDate); }
      if (endDate)        { query += ` AND workout_date <= $${idx++}`; params.push(endDate); }
      // completedOnly: only return dates where sets_completed > 0 (the exercise was actually done)
      if (completedOnly)  { query += ` AND sets_completed IS NOT NULL AND sets_completed > 0`; }

      query += ` ORDER BY workout_date DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);
      return rows;
    } catch (err) {
      console.error("WorkoutService:getWorkoutHistory", err);
      throw err;
    }
  }

  static async getWorkoutHistoryCount(userId, options = {}) {
    try {
      const numericUserId = Number(userId);
      const { startDate = null, endDate = null, completedOnly = false } = options;
      let query = `SELECT COUNT(*)::int as total FROM workout_logs WHERE user_id = $1`;
      const params = [numericUserId];
      let idx = 2;
      if (startDate)     { query += ` AND workout_date >= $${idx++}`; params.push(startDate); }
      if (endDate)       { query += ` AND workout_date <= $${idx++}`; params.push(endDate); }
      if (completedOnly) { query += ` AND sets_completed IS NOT NULL AND sets_completed > 0`; }
      const { rows } = await pool.query(query, params);
      return rows[0].total;
    } catch { return 0; }
  }

  static async getWorkoutStats(userId, { days = 30 } = {}) {
    try {
      const numericUserId = Number(userId);
      // FIX #6 (SQL injection): use parameterized interval
      const { rows: dateRows } = await pool.query(
        `SELECT DISTINCT workout_date FROM workout_logs
         WHERE user_id = $1 AND workout_date >= CURRENT_DATE - ($2 || ' days')::interval`,
        [numericUserId, days]
      );
      const { rows: statsRows } = await pool.query(
        `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes FROM workout_logs
         WHERE user_id = $1 AND workout_date >= CURRENT_DATE - ($2 || ' days')::interval`,
        [numericUserId, days]
      );
      return {
        period_days:        days,
        workouts_completed: dateRows.length,
        total_minutes:      Number(statsRows[0].total_minutes),
        current_streak:     await this._getCurrentStreak(numericUserId),
      };
    } catch (err) {
      console.error("WorkoutService:getWorkoutStats", err);
      throw err;
    }
  }

  // FIX #4: Streak counts if today OR yesterday has a log
  // (before you log today, your streak shouldn't drop to 0)
  static async _getCurrentStreak(userId) {
    try {
      const { rows } = await pool.query(
        `WITH RECURSIVE workout_dates AS (
           SELECT DISTINCT workout_date FROM workout_logs WHERE user_id = $1
         ),
         -- Start from today OR yesterday (so streak stays alive before today's log)
         start_date AS (
           SELECT CASE
             WHEN EXISTS (SELECT 1 FROM workout_dates WHERE workout_date = CURRENT_DATE)
               THEN CURRENT_DATE
             WHEN EXISTS (SELECT 1 FROM workout_dates WHERE workout_date = CURRENT_DATE - INTERVAL '1 day')
               THEN CURRENT_DATE - INTERVAL '1 day'
             ELSE NULL
           END AS base_date
         ),
         streak AS (
           SELECT workout_date FROM workout_dates
           WHERE workout_date = (SELECT base_date FROM start_date)
             AND (SELECT base_date FROM start_date) IS NOT NULL
           UNION ALL
           SELECT w.workout_date FROM workout_dates w
           JOIN streak s ON w.workout_date = s.workout_date - INTERVAL '1 day'
         )
         SELECT COUNT(*)::int AS streak FROM streak`,
        [userId]
      );
      return rows[0]?.streak ?? 0;
    } catch { return 0; }
  }

  static async deleteWorkoutLog(userId, logId) {
    try {
      const { rowCount } = await pool.query(
        `DELETE FROM workout_logs WHERE user_id = $1 AND id = $2`,
        [Number(userId), logId]
      );
      return rowCount > 0;
    } catch (err) {
      console.error("WorkoutService:deleteWorkoutLog", err);
      throw err;
    }
  }

  static async hasActivePlan(userId) {
    try {
      const { rows } = await pool.query(
        `SELECT EXISTS(SELECT 1 FROM plans WHERE user_id = $1 AND is_active = true) as has_plan`,
        [Number(userId)]
      );
      return rows[0].has_plan;
    } catch { return false; }
  }

  static async getWeekSummary(userId) {
    try {
      const numericUserId = Number(userId);
      const { rows } = await pool.query(
        `SELECT workout_date AS date, COUNT(*) as exercises_logged, SUM(duration_minutes) as total_duration
         FROM workout_logs
         WHERE user_id = $1
           AND workout_date >= DATE_TRUNC('week', CURRENT_DATE)
           AND workout_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
         GROUP BY workout_date ORDER BY workout_date`,
        [numericUserId]
      );
      const daysOfWeek = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
      const summary = {};
      daysOfWeek.forEach(day => { summary[day] = { completed: false, exercises_logged: 0, duration: 0 }; });
      rows.forEach(row => {
        const date = new Date(row.date);
        const dayIndex = (date.getDay() + 6) % 7;
        const dayKey = daysOfWeek[dayIndex];
        if (summary[dayKey]) {
          summary[dayKey] = {
            completed:        true,
            exercises_logged: Number(row.exercises_logged),
            duration:         Number(row.total_duration) || 0,
            date:             row.date,
          };
        }
      });
      return summary;
    } catch (err) {
      console.error("WorkoutService:getWeekSummary", err);
      throw err;
    }
  }
}

export default WorkoutService;