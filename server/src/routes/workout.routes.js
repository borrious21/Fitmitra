import { Router } from "express";
import WorkoutController from "../controllers/workout.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// URL: /api/workouts/log
router.post("/log", WorkoutController.logWorkout);

// URL: /api/workouts/today
router.get("/today", WorkoutController.getTodayWorkout);

// URL: /api/workouts/date
router.get("/date", WorkoutController.getWorkoutByDate);

// URL: /api/workouts/weekly
router.get("/weekly", WorkoutController.getWeeklyPlan);

// URL: /api/workouts/history
router.get("/history", WorkoutController.getWorkoutHistory);

// URL: /api/workouts/stats
router.get("/stats", WorkoutController.getWorkoutStats);

// URL: /api/workouts/streak
router.get("/streak", WorkoutController.getStreak);

// URL: /api/workouts/achievements
router.get("/achievements", WorkoutController.getAchievements);

// URL: /api/workouts/log/:id
router.delete("/log/:id", WorkoutController.deleteWorkout);

export default router;
