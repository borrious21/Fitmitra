// src/services/dashboardService.js
import { apiFetch } from "./apiClient";

export const getDashboardNutrition  = () => apiFetch("/dashboard/nutrition/today");
export const getDashboardWorkout    = () => apiFetch("/dashboard/workout/today");
export const getDashboardMeals      = () => apiFetch("/dashboard/meals/today");
export const getDashboardHealth     = () => apiFetch("/dashboard/health/snapshot");
export const getDashboardWeekly     = () => apiFetch("/dashboard/progress/weekly");
export const getDashboardInsights   = () => apiFetch("/dashboard/insights");
export const getDashboardStreak     = () => apiFetch("/dashboard/streak");