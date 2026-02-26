// src/routes/plan.routes.js
//
// ⚠️  ROUTE ORDER MATTERS IN EXPRESS
//
//  Express matches routes top-to-bottom.
//  If  GET /:id  is registered before  GET /gamification,
//  Express treats "gamification" as the :id param value.
//  validateNumericId then rejects it → 400 Bad Request.
//
//  Rule: every named route  (fixed path, no param)
//        MUST be registered BEFORE any  /:param  route.

import { Router } from "express";
import PlanController from "../controllers/plan.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// All plan routes require authentication.
router.use(protect);

// ─── ID validator (only used on param routes) ─────────────────────────────────

const validateNumericId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid plan ID — must be a positive integer." });
  }
  req.params.id = id;
  next();
};

// ════════════════════════════════════════════════════════════════════════════════
//  SECTION 1 — NAMED ROUTES (no :id param)
//  These MUST come before any  /:id  route.
// ════════════════════════════════════════════════════════════════════════════════

// POST   /api/plans/generate
router.post("/generate", PlanController.generatePlan);

// GET    /api/plans/active
//   ← FIX: was after /:id in old file, so "active" matched /:id and blew up
router.get("/active", PlanController.getActivePlan);

// GET    /api/plans/history
router.get("/history", PlanController.getPlanHistory);

// GET    /api/plans/stats
router.get("/stats", PlanController.getPlanStats);

// ── Gamification ────────────────────────────────────────────────────────────
// GET    /api/plans/gamification
//   ← ROOT CAUSE OF THE 400:
//     When this was after /:id, Express matched "gamification" as the :id value.
//     validateNumericId correctly rejected it → 400.
//     Solution: move it here, above /:id.
router.get("/gamification", PlanController.getGamification);

// POST   /api/plans/missed-workout    body: { split }
router.post("/missed-workout", PlanController.missedWorkout);

// POST   /api/plans/adaptive-difficulty    body: { recent_logs }
router.post("/adaptive-difficulty", PlanController.adaptiveDifficulty);

// ── Analytics ────────────────────────────────────────────────────────────────
// POST   /api/plans/insights
router.post("/insights", PlanController.getInsights);

// POST   /api/plans/calorie-adjustment
router.post("/calorie-adjustment", PlanController.getCalorieAdjustment);

// POST   /api/plans/progression
router.post("/progression", PlanController.getProgression);

// POST   /api/plans/progress-metrics
router.post("/progress-metrics", PlanController.getProgressMetrics);

// GET    /api/plans/:id
router.get("/:id", validateNumericId, PlanController.getPlanById);

// PATCH  /api/plans/:id/activate
router.patch("/:id/activate", validateNumericId, PlanController.activatePlan);

// PATCH  /api/plans/:id/complete
router.patch("/:id/complete", validateNumericId, PlanController.completePlan);

// DELETE /api/plans/:id
router.delete("/:id", validateNumericId, PlanController.deletePlan);

export default router;