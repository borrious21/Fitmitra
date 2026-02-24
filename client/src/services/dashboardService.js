// services/dashboardService.js
import api from "./apiClient";

export const getDashboardNutrition  = () => api.get("/dashboard/nutrition/today");
export const getDashboardWorkout    = () => api.get("/dashboard/workout/today");
export const getDashboardMeals      = () => api.get("/dashboard/meals/today");
export const getDashboardHealth     = () => api.get("/dashboard/health/snapshot");
export const getDashboardWeekly     = () => api.get("/dashboard/progress/weekly");
export const getDashboardInsights   = () => api.get("/dashboard/insights");
export const getDashboardStreak     = () => api.get("/dashboard/streak");