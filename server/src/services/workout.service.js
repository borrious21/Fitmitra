// src/services/workout.service.js
import pool from "../config/db.config.js";
import { getTodayKey } from "../utils/day.utils.js";

class WorkoutService {

  static async getTodayWorkout(userId) {
    return this.getWorkoutForDate(userId, new Date());
  }

  static async getWorkoutForDate(userId, date = new Date()) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const dayKey = getTodayKey(new Date(date));
      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : date;

      // Get the workout plan
      const { rows: planRows } = await pool.query(
        `
        SELECT workout_plan
        FROM plans
        WHERE user_id = $1 AND is_active = true
        LIMIT 1
        `,
        [numericUserId]
      );

      if (!planRows.length || !planRows[0].workout_plan) return null;

      const plan = planRows[0].workout_plan;

      let weeklyPlan = plan.weekly_plan;

      if (typeof weeklyPlan === "string") {
        try {
          weeklyPlan = JSON.parse(weeklyPlan);
        } catch {
          weeklyPlan = {};
        }
      }

      if (!weeklyPlan || typeof weeklyPlan !== "object") {
        weeklyPlan = {};
      }

      // Get exercise logs for this date
      const { rows: logRows } = await pool.query(
        `
        SELECT 
          exercise_name,
          sets_completed,
          reps_completed,
          weight_used,
          duration_minutes,
          perceived_exertion,
          fatigue_level,
          notes,
          created_at
        FROM workout_logs
        WHERE user_id = $1 AND workout_date = $2::date
        ORDER BY created_at
        `,
        [numericUserId, dateStr]
      );

      const exerciseLogs = logRows.map(row => ({
        exercise_name: row.exercise_name,
        sets_completed: row.sets_completed,
        reps_completed: row.reps_completed,
        weight_used: row.weight_used,
        duration_minutes: row.duration_minutes,
        perceived_exertion: row.perceived_exertion,
        fatigue_level: row.fatigue_level,
        notes: row.notes,
        logged_at: row.created_at,
      }));

      const completed = exerciseLogs.length > 0;

      return {
        day: dayKey,
        date: dateStr,
        workout: weeklyPlan[dayKey] || [],
        completed: completed,
        exercise_logs: exerciseLogs,
        meta: plan.meta || {},
        guidelines: plan.guidelines || {},
        safety_notes: plan.safety_notes || [],
      };

    } catch (err) {
      console.error("WorkoutService:getWorkoutForDate", err);
      throw err;
    }
  }

  static async getWeeklyPlan(userId) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const { rows } = await pool.query(
        `
        SELECT workout_plan
        FROM plans
        WHERE user_id = $1 AND is_active = true
        LIMIT 1
        `,
        [numericUserId]
      );

      if (!rows.length) return null;

      const plan = rows[0].workout_plan;

      return {
        weekly_plan: plan.weekly_plan || {},
        meta: plan.meta || {},
        guidelines: plan.guidelines || {},
        safety_notes: plan.safety_notes || [],
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
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const {
        date = new Date(),
        exercise_name,
        sets_completed = null,
        reps_completed = null,
        weight_used = null,
        duration_minutes = null,
        perceived_exertion = null,
        fatigue_level = null,
        notes = null,
      } = logData;

      if (!exercise_name) {
        throw new Error("exercise_name is required");
      }

      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : date;

      await client.query("BEGIN");

      const { rows } = await client.query(
        `
        INSERT INTO workout_logs (
          user_id,
          workout_date,
          exercise_name,
          sets_completed,
          reps_completed,
          weight_used,
          duration_minutes,
          perceived_exertion,
          fatigue_level,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
          numericUserId,
          dateStr,
          exercise_name,
          sets_completed,
          reps_completed,
          weight_used,
          duration_minutes,
          perceived_exertion,
          fatigue_level,
          notes,
        ]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("WorkoutService:logWorkout", err);
      throw err;
    } finally {
      client.release();
    }
  }

  static async logMultipleExercises(userId, logData) {
    const client = await pool.connect();

    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const {
        date = new Date(),
        exercises = [],
        duration_minutes = null,
        perceived_exertion = null,
        fatigue_level = null,
        notes = null,
      } = logData;

      if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new Error("exercises array is required and must not be empty");
      }

      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : date;

      await client.query("BEGIN");

      const insertedLogs = [];

      for (const exercise of exercises) {
        const {
          name,
          sets = null,
          reps = null,
          weight = null,
        } = exercise;

        if (!name) {
          throw new Error("Each exercise must have a name");
        }

        const { rows } = await client.query(
          `
          INSERT INTO workout_logs (
            user_id,
            workout_date,
            exercise_name,
            sets_completed,
            reps_completed,
            weight_used,
            duration_minutes,
            perceived_exertion,
            fatigue_level,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
          `,
          [
            numericUserId,
            dateStr,
            name,
            sets,
            reps,
            weight,
            duration_minutes,
            perceived_exertion,
            fatigue_level,
            notes,
          ]
        );

        insertedLogs.push(rows[0]);
      }

      await client.query("COMMIT");
      return insertedLogs;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("WorkoutService:logMultipleExercises", err);
      throw err;
    } finally {
      client.release();
    }
  }

  static async getWorkoutHistory(userId, options = {}) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const {
        limit = 30,
        offset = 0,
        startDate,
        endDate,
      } = options;

      let query = `
        SELECT 
          workout_date AS date,
          exercise_name,
          sets_completed,
          reps_completed,
          weight_used,
          duration_minutes,
          perceived_exertion,
          fatigue_level,
          notes,
          created_at,
          updated_at
        FROM workout_logs
        WHERE user_id = $1
      `;
      const params = [numericUserId];
      let idx = 2;

      if (startDate) {
        query += ` AND workout_date >= $${idx++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND workout_date <= $${idx++}`;
        params.push(endDate);
      }

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
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const { startDate = null, endDate = null } = options;

      let query = `
        SELECT COUNT(*)::int as total
        FROM workout_logs
        WHERE user_id = $1
      `;

      const params = [numericUserId];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND workout_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND workout_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      const { rows } = await pool.query(query, params);
      return rows[0].total;
    } catch (error) {
      console.error("WorkoutService:getWorkoutHistoryCount", error);
      return 0;
    }
  }

  static async getWorkoutStats(userId, { days = 30 } = {}) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      // Get distinct workout dates (days with any exercise logged)
      const { rows: dateRows } = await pool.query(
        `
        SELECT DISTINCT workout_date
        FROM workout_logs
        WHERE user_id = $1
          AND workout_date >= CURRENT_DATE - INTERVAL '1 day' * $2
        ORDER BY workout_date
        `,
        [numericUserId, days]
      );

      const completedWorkouts = dateRows.length;

      // Get total calories and minutes
      const { rows: statsRows } = await pool.query(
        `
        SELECT
          COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM workout_logs
        WHERE user_id = $1
          AND workout_date >= CURRENT_DATE - INTERVAL '1 day' * $2
        `,
        [numericUserId, days]
      );

      return {
        period_days: days,
        workouts_completed: completedWorkouts,
        total_minutes: Number(statsRows[0].total_minutes),
        current_streak: await this._getCurrentStreak(numericUserId),
      };
    } catch (err) {
      console.error("WorkoutService:getWorkoutStats", err);
      throw err;
    }
  }

  static async _getCurrentStreak(userId) {
    try {
      const { rows } = await pool.query(
        `
        WITH RECURSIVE workout_dates AS (
          SELECT DISTINCT workout_date
          FROM workout_logs
          WHERE user_id = $1
        ),
        streak AS (
          SELECT workout_date 
          FROM workout_dates
          WHERE workout_date = CURRENT_DATE
          UNION ALL
          SELECT w.workout_date
          FROM workout_dates w
          JOIN streak s ON w.workout_date = s.workout_date - INTERVAL '1 day'
        )
        SELECT COUNT(*)::int AS streak FROM streak
        `,
        [userId]
      );

      return rows[0].streak;
    } catch (err) {
      console.error("WorkoutService:_getCurrentStreak", err);
      return 0;
    }
  }

  static async deleteWorkoutLog(userId, logId) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const { rowCount } = await pool.query(
        `
        DELETE FROM workout_logs
        WHERE user_id = $1 AND id = $2
        `,
        [numericUserId, logId]
      );

      return rowCount > 0;
    } catch (error) {
      console.error("WorkoutService:deleteWorkoutLog", error);
      throw error;
    }
  }

  static async deleteWorkoutLogsByDate(userId, date) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : date;

      const { rowCount } = await pool.query(
        `
        DELETE FROM workout_logs
        WHERE user_id = $1 AND workout_date = $2
        `,
        [numericUserId, dateStr]
      );

      return rowCount > 0;
    } catch (error) {
      console.error("WorkoutService:deleteWorkoutLogsByDate", error);
      throw error;
    }
  }

  static async hasActivePlan(userId) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const { rows } = await pool.query(
        `
        SELECT EXISTS(
          SELECT 1 
          FROM plans 
          WHERE user_id = $1 AND is_active = true
        ) as has_plan
        `,
        [numericUserId]
      );

      return rows[0].has_plan;
    } catch (error) {
      console.error("WorkoutService:hasActivePlan", error);
      return false;
    }
  }

  static async getWorkoutsForDates(userId, dates) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      if (!Array.isArray(dates) || dates.length === 0) {
        return {};
      }

      const { rows } = await pool.query(
        `
        SELECT 
          workout_date AS date,
          exercise_name,
          sets_completed,
          reps_completed,
          weight_used,
          duration_minutes,
          perceived_exertion,
          fatigue_level,
          notes
        FROM workout_logs
        WHERE user_id = $1
          AND workout_date = ANY($2::date[])
        ORDER BY workout_date DESC, created_at
        `,
        [numericUserId, dates]
      );

      const workoutMap = {};
      rows.forEach((row) => {
        const dateKey = row.date;
        if (!workoutMap[dateKey]) {
          workoutMap[dateKey] = [];
        }
        workoutMap[dateKey].push({
          exercise_name: row.exercise_name,
          sets_completed: row.sets_completed,
          reps_completed: row.reps_completed,
          weight_used: row.weight_used,
          duration_minutes: row.duration_minutes,
          perceived_exertion: row.perceived_exertion,
          fatigue_level: row.fatigue_level,
          notes: row.notes,
        });
      });

      return workoutMap;
    } catch (err) {
      console.error("WorkoutService:getWorkoutsForDates", err);
      throw err;
    }
  }

  static async getWeekSummary(userId) {
    try {
      const numericUserId = Number(userId);
      if (!numericUserId || isNaN(numericUserId)) {
        throw new Error("Invalid userId");
      }

      const { rows } = await pool.query(
        `
        SELECT 
          workout_date AS date,
          COUNT(*) as exercises_logged,
          SUM(duration_minutes) as total_duration
        FROM workout_logs
        WHERE user_id = $1
          AND workout_date >= DATE_TRUNC('week', CURRENT_DATE)
          AND workout_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
        GROUP BY workout_date
        ORDER BY workout_date
        `,
        [numericUserId]
      );

      const daysOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const summary = {};

      daysOfWeek.forEach((day) => {
        summary[day] = {
          completed: false,
          exercises_logged: 0,
          duration: 0,
        };
      });

      rows.forEach((row) => {
        const date = new Date(row.date);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const dayKey = daysOfWeek[dayIndex];
        
        if (summary[dayKey]) {
          summary[dayKey] = {
            completed: true,
            exercises_logged: Number(row.exercises_logged),
            duration: Number(row.total_duration) || 0,
            date: row.date,
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