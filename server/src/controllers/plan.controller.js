// src/controllers/plan.controller.js

import PlanService from "../services/plan.service.js"; 
import response from "../utils/response.util.js";

class PlanController {

  static async generatePlan(req, res, next) {
    try {
      const saved = await PlanService.generateAndSave(req.user.id);
      return response(res, 201, true, "Plan generated successfully", saved);
    } catch (error) {
      next(error);
    }
  }

  static async getActivePlan(req, res, next) {
    try {
      const plan = await PlanService.getActivePlan(req.user.id);
      return response(res, 200, true, "Active plan retrieved", plan);
    } catch (error) {
      next(error);
    }
  }

  static async getPlanHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await PlanService.getPlanHistory(req.user.id, { page, limit });
      return response(res, 200, true, "Plan history retrieved", data);
    } catch (error) {
      next(error);
    }
  }

  static async getPlanById(req, res, next) {
    try {
      const plan = await PlanService.getPlanById(req.params.id, req.user.id);
      return response(res, 200, true, "Plan retrieved", plan);
    } catch (error) {
      next(error);
    }
  }

  static async activatePlan(req, res, next) {
    try {
      const activated = await PlanService.activatePlan(req.params.id, req.user.id);
      return response(res, 200, true, "Plan activated", activated);
    } catch (error) {
      next(error);
    }
  }

  static async completePlan(req, res, next) {
    try {
      const completed = await PlanService.completePlan(req.params.id, req.user.id);
      return response(res, 200, true, "Plan completed", completed);
    } catch (error) {
      next(error);
    }
  }

  static async deletePlan(req, res, next) {
    try {
      await PlanService.deletePlan(req.params.id, req.user.id);
      return response(res, 200, true, "Plan deleted");
    } catch (error) {
      next(error);
    }
  }

  static async getPlanStats(req, res, next) {
    try {
      const stats = await PlanService.getStats(req.user.id);
      return response(res, 200, true, "Plan stats retrieved", stats);
    } catch (error) {
      next(error);
    }
  }
}

export default PlanController;