// src/models/workout.model.js
import pool from "../config/db.config.js";

class WorkoutModel {
  static async logWorkout(userId, data) {
    const {
      workout_date = new Date().toISOString().split('T')[0],
      exercise_name,
      sets_completed,
      reps_completed,
      weight_used = 0,
      duration_minutes = 0,
      perceived_exertion = 5,
      fatigue_level = 5,
      notes = "",
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO workout_logs (
        user_id, workout_date, exercise_name, sets_completed, 
        reps_completed, weight_used, duration_minutes, 
        perceived_exertion, fatigue_level, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        workout_date,
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

    await this.updateStreak(userId, workout_date);

    return rows[0];
  }
  static async getWorkoutHistory(userId, filters = {}) {
    const {
      start_date,
      end_date,
      exercise_name,
      limit = 50,
      offset = 0,
    } = filters;

    let query = `
      SELECT * FROM workout_logs 
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (start_date) {
      params.push(start_date);
      query += ` AND workout_date >= $${++paramCount}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND workout_date <= $${++paramCount}`;
    }

    if (exercise_name) {
      params.push(`%${exercise_name}%`);
      query += ` AND exercise_name ILIKE $${++paramCount}`;
    }

    query += ` ORDER BY workout_date DESC, created_at DESC`;
    
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getWorkoutStats(userId, days = 30) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(DISTINCT workout_date) as total_workout_days,
        COUNT(*) as total_exercises,
        AVG(perceived_exertion) as avg_exertion,
        AVG(duration_minutes) as avg_duration,
        SUM(duration_minutes) as total_minutes,
        array_agg(DISTINCT exercise_name ORDER BY exercise_name) as exercises_done
      FROM workout_logs
      WHERE user_id = $1 
      AND workout_date >= CURRENT_DATE - INTERVAL '${days} days'`,
      [userId]
    );

    return rows[0];
  }

  static async updateStreak(userId, workoutDate) {
    const { rows: streakRows } = await pool.query(
      `SELECT * FROM user_streaks WHERE user_id = $1`,
      [userId]
    );

    const today = new Date(workoutDate);
    let currentStreak = 1;
    let longestStreak = 1;
    let totalWorkouts = 1;

    if (streakRows.length > 0) {
      const streak = streakRows[0];
      const lastDate = streak.last_workout_date ? new Date(streak.last_workout_date) : null;
      
      if (lastDate) {
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          return streak;
        } else if (diffDays === 1) {
          currentStreak = streak.current_workout_streak + 1;
        } else {
          currentStreak = 1;
        }
      }

      longestStreak = Math.max(currentStreak, streak.longest_workout_streak);
      totalWorkouts = streak.total_workouts + 1;

      await this.checkStreakAchievements(userId, currentStreak);
    }

    const { rows } = await pool.query(
      `INSERT INTO user_streaks (
        user_id, current_workout_streak, longest_workout_streak, 
        last_workout_date, total_workouts
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        current_workout_streak = $2,
        longest_workout_streak = $3,
        last_workout_date = $4,
        total_workouts = $5,
        updated_at = NOW()
      RETURNING *`,
      [userId, currentStreak, longestStreak, workoutDate, totalWorkouts]
    );

    return rows[0];
  }
  static async checkStreakAchievements(userId, streak) {
    const milestones = [
      { days: 7, name: "Week Warrior", type: "workout_streak_7" },
      { days: 30, name: "Monthly Master", type: "workout_streak_30" },
      { days: 60, name: "Consistency Champion", type: "workout_streak_60" },
      { days: 100, name: "Century Athlete", type: "workout_streak_100" },
    ];

    for (const milestone of milestones) {
      if (streak === milestone.days) {
        await this.awardAchievement(userId, milestone.type, milestone.name, {
          streak_days: streak,
        });
      }
    }
  }

  static async awardAchievement(userId, type, name, metadata = {}) {
    const { rows } = await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_type, achievement_name, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [userId, type, name, JSON.stringify(metadata)]
    );
    return rows[0];
  }
  static async getUserAchievements(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_achievements 
      WHERE user_id = $1 
      ORDER BY earned_at DESC`,
      [userId]
    );
    return rows;
  }
  static async getUserStreak(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_streaks WHERE user_id = $1`,
      [userId]
    );
    return rows[0] || {
      current_workout_streak: 0,
      longest_workout_streak: 0,
      total_workouts: 0,
    };
  }

  static async countWorkoutLogs() {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total FROM workout_logs`
    );
    return Number(rows[0].total);
  }

  static async activeUsersLastDays(days = 30) {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT user_id) AS total
       FROM workout_logs
       WHERE workout_date >= CURRENT_DATE - INTERVAL '${days} days'`
    );
    return Number(rows[0].total);
  }

  static async avgWorkoutDurationLastDays(days = 30) {
    const { rows } = await pool.query(
      `SELECT AVG(duration_minutes) AS avg_duration
       FROM workout_logs
       WHERE workout_date >= CURRENT_DATE - INTERVAL '${days} days'`
    );
    return Number(rows[0].avg_duration);
  }

  static async deleteWorkout(userId, workoutId) {
    const { rowCount } = await pool.query(
      `DELETE FROM workout_logs WHERE id = $1 AND user_id = $2`,
      [workoutId, userId]
    );
    return rowCount > 0;
  }
}

export default WorkoutModel;