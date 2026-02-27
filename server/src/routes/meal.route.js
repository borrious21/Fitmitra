// src/routes/meal.route.js

import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import {
  logMeal,
  getMealLogs,
  getMealLogById,
  getMealLogsByDate,
  updateMealLog,
  deleteMealLog,
  deleteMealLogsByDate,
  getMealSummaryDaily,
  getMealSummaryWeekly,
} from "../controllers/meal.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/summary/daily",  getMealSummaryDaily);
router.get("/summary/weekly", getMealSummaryWeekly);
router.get("/daily",          getMealSummaryDaily);
router.get("/weekly",         getMealSummaryWeekly);

router.get("/date/:date",    getMealLogsByDate);
router.delete("/date/:date", deleteMealLogsByDate);
router.post("/log",             logMeal);
router.get("/",              getMealLogs);
router.get("/:id",           getMealLogById);
router.patch("/:id",         updateMealLog);
router.delete("/:id",        deleteMealLog);

export default router;