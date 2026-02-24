import WorkoutService from "../services/workout.service.js";
import { isValidDateString } from "../utils/validation.util.js";
import { validateWorkoutLog } from "../validators/workout.validator.js";

class WorkoutController {
  static async logWorkout(req, res, next) {
    try {
      const userId = req.user.id;

      try {
        validateWorkoutLog(req.body);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          code: "VALIDATION_ERROR",
          errors: err.details || [],
        });
      }

      const hasActivePlan = await WorkoutService.hasActivePlan(userId);
      if (!hasActivePlan) {
        return res.status(404).json({
          success: false,
          message: "No active workout plan found.",
          code: "NO_ACTIVE_PLAN",
        });
      }

      const logs = await WorkoutService.logMultipleExercises(userId, req.body);
      
      return res.status(201).json({
        success: true,
        message: "Workout logged successfully",
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }

static async getTodayWorkout(req, res, next) {
  try {
    const userId = req.user.id;

    let workout = await WorkoutService.getTodayWorkout(userId);

    if (!workout) {
      workout = await WorkoutService.generateTodayWorkout(userId);
    }

    return res.json({
      success: true,
      message: "Today's workout retrieved successfully",
      data: workout,
    });
  } catch (err) {
    next(err);
  }
}

  static async getWorkoutByDate(req, res, next) {
    try {
      const { date } = req.query;
      if (!date || !isValidDateString(date)) {
        return res.status(400).json({
          success: false,
          message: "Valid date query parameter required (YYYY-MM-DD)",
          code: "INVALID_DATE",
        });
      }

      const targetDate = new Date(date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const oneMonthAhead = new Date();
      oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

      if (targetDate < sixMonthsAgo) {
        return res.status(400).json({
          success: false,
          message: "Cannot retrieve workouts older than 6 months",
          code: "DATE_TOO_OLD",
        });
      }
      if (targetDate > oneMonthAhead) {
        return res.status(400).json({
          success: false,
          message: "Cannot retrieve workouts more than 1 month in advance",
          code: "DATE_TOO_FAR",
        });
      }

      const workout = await WorkoutService.getWorkoutForDate(req.user.id, targetDate);

      return res.json({
        success: true,
        message: workout ? "Workout retrieved successfully" : "No workout found for this date",
        data: workout || null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWeeklyPlan(req, res, next) {
    try {
      const plan = await WorkoutService.getWeeklyPlan(req.user.id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "No active workout plan found.",
          code: "NO_ACTIVE_PLAN",
        });
      }

      res.set("Cache-Control", "private, max-age=3600");
      return res.json({
        success: true,
        message: "Weekly workout plan retrieved successfully",
        data: plan,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkoutHistory(req, res, next) {
    try {
      const { limit = 30, offset = 0, startDate, endDate, completedOnly } = req.query;

      if ((startDate && !isValidDateString(startDate)) || (endDate && !isValidDateString(endDate))) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
          code: "INVALID_DATE",
        });
      }

      const history = await WorkoutService.getWorkoutHistory(req.user.id, {
        limit: Number(limit),
        offset: Number(offset),
        startDate,
        endDate,
        completedOnly: completedOnly === "true",
      });

      const total = await WorkoutService.getWorkoutHistoryCount(req.user.id, {
        startDate,
        endDate,
        completedOnly: completedOnly === "true",
      });

      return res.json({
        success: true,
        message: "Workout history retrieved successfully",
        data: history,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total,
          hasMore: total > Number(offset) + Number(limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkoutStats(req, res, next) {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
      const stats = await WorkoutService.getWorkoutStats(req.user.id, { days });

      return res.json({
        success: true,
        message: "Workout statistics retrieved successfully",
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStreak(req, res, next) {
    try {
      const streak = await WorkoutService._getCurrentStreak(req.user.id);
      return res.json({ 
        success: true, 
        data: { current_streak: streak } 
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAchievements(req, res, next) {
    try {
      return res.json({ 
        success: true, 
        count: 0, 
        data: [],
        message: "Achievements feature not yet implemented in service layer"
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteWorkout(req, res, next) {
    try {
      const workoutId = Number(req.params.id);
      if (isNaN(workoutId) || workoutId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid workout ID",
          code: "INVALID_WORKOUT_ID",
        });
      }

      const deleted = await WorkoutService.deleteWorkoutLog(req.user.id, workoutId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Workout log not found",
          code: "WORKOUT_NOT_FOUND",
        });
      }

      return res.json({ success: true, message: "Workout deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export default WorkoutController;