// src/routes/plan.routes.js
import { Router } from "express";
import PlanController from "../controllers/plan.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

const validateNumericId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid plan ID. ID must be numeric.",
    });
  }

  req.params.id = id;
  next();
};

// URL: /api/plans/generate
router.post("/generate", PlanController.generatePlan);

// URL: /api/plans/active
router.get("/active", PlanController.getActivePlan);

// URL: /api/plans/history
router.get("/history", PlanController.getPlanHistory);

// URL: /api/plans/stats
router.get("/stats", PlanController.getPlanStats);

// URL: /api/plans/:id
router.get("/:id", validateNumericId, PlanController.getPlanById);

// URL: /api/plans/:id/activate
router.patch("/:id/activate", validateNumericId, PlanController.activatePlan);

// URL: /api/plans/:id/complete
router.patch("/:id/complete", validateNumericId, PlanController.completePlan);

// URL: /api/plans/:id
router.delete("/:id", validateNumericId, PlanController.deletePlan);

export default router;