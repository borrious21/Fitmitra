// src/controllers/plan.controller.js

import PlanService, {
  generateInsights,
  computeCalorieAdjustment,
  recommendProgression,
  computeProgressMetrics,
} from "../services/plan.service.js";

import {
  computeXP,
  getMissedWorkoutRecovery,
  adaptiveDifficultySignal,
} from "../services/gamification.service.js";

import response from "../utils/response.util.js";

class PlanController {

  // ── PLAN CRUD ───────────────────────────────────────────────────────────────

  // POST /api/plans/generate
  static async generatePlan(req, res, next) {
    try {
      const saved = await PlanService.generateAndSave(req.user.id);
      return response(res, 201, true, "Plan generated successfully", saved);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/plans/active
  static async getActivePlan(req, res, next) {
    try {
      const plan = await PlanService.getActivePlan(req.user.id);
      return response(res, 200, true, "Active plan retrieved", plan);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/plans/history
  static async getPlanHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await PlanService.getPlanHistory(req.user.id, { page, limit });
      return response(res, 200, true, "Plan history retrieved", data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/plans/:id
  static async getPlanById(req, res, next) {
    try {
      const plan = await PlanService.getPlanById(req.params.id, req.user.id);
      return response(res, 200, true, "Plan retrieved", plan);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/plans/stats
  static async getPlanStats(req, res, next) {
    try {
      const stats = await PlanService.getStats(req.user.id);
      return response(res, 200, true, "Plan stats retrieved", stats);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/plans/:id/activate
  static async activatePlan(req, res, next) {
    try {
      const activated = await PlanService.activatePlan(req.params.id, req.user.id);
      return response(res, 200, true, "Plan activated", activated);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/plans/:id/complete
  static async completePlan(req, res, next) {
    try {
      const completed = await PlanService.completePlan(req.params.id, req.user.id);
      return response(res, 200, true, "Plan completed", completed);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/plans/:id
  static async deletePlan(req, res, next) {
    try {
      await PlanService.deletePlan(req.params.id, req.user.id);
      return response(res, 200, true, "Plan deleted");
    } catch (error) {
      next(error);
    }
  }

  static async getGamification(req, res, next) {
    try {
      const workoutLogs = [];   
      const weeklyPlans = []; 

      const gamification = computeXP(workoutLogs, weeklyPlans);
      return response(res, 200, true, "Gamification data retrieved", gamification);
    } catch (error) {
      next(error);
    }
  }

  static async missedWorkout(req, res, next) {
    try {
      const { split } = req.body ?? {};
      if (!split) {
        return response(res, 400, false, "split is required (e.g. 'Push', 'Legs')");
      }
      const recovery = getMissedWorkoutRecovery(split);
      return response(res, 200, true, "Missed workout recovery suggestion", recovery);
    } catch (error) {
      next(error);
    }
  }

  static async adaptiveDifficulty(req, res, next) {
    try {
      const { recent_logs = [] } = req.body ?? {};
      const signal = adaptiveDifficultySignal(recent_logs);
      return response(res, 200, true, "Adaptive difficulty signal", signal);
    } catch (error) {
      next(error);
    }
  }

  static async getInsights(req, res, next) {
    try {
      const {
        this_week_logs           = [],
        last_week_logs           = [],
        total_workouts_this_week = 0,
      } = req.body ?? {};

      const insights = generateInsights({
        thisWeekLogs:          this_week_logs,
        lastWeekLogs:          last_week_logs,
        totalWorkoutsThisWeek: total_workouts_this_week,
      });
      return response(res, 200, true, "Insights generated", { insights });
    } catch (error) {
      next(error);
    }
  }

  static async getCalorieAdjustment(req, res, next) {
    try {
      const { weight_trend, target_kcal, goal } = req.body ?? {};
      const result = computeCalorieAdjustment({
        weightTrend: weight_trend,
        targetKcal:  target_kcal,
        goal,
      });
      return response(res, 200, true, "Calorie adjustment computed", result);
    } catch (error) {
      next(error);
    }
  }

  static async getProgression(req, res, next) {
    try {
      const { log, current_exercise } = req.body ?? {};
      if (!log || !current_exercise) {
        return response(res, 400, false, "log and current_exercise are required");
      }
      const result = recommendProgression({ log, currentExercise: current_exercise });
      return response(res, 200, true, "Progression recommendation", result);
    } catch (error) {
      next(error);
    }
  }

  static async getProgressMetrics(req, res, next) {
    try {
      const {
        weight_logs   = [],
        strength_logs = [],
        measurements  = [],
      } = req.body ?? {};

      const metrics = computeProgressMetrics({
        weightLogs:   weight_logs,
        strengthLogs: strength_logs,
        measurements,
      });
      return response(res, 200, true, "Progress metrics computed", metrics);
    } catch (error) {
      next(error);
    }
  }
}

export default PlanController;