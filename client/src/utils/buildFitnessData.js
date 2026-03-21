// src/utils/buildFitnessData.js
export function buildFitnessData({ nutrition, workout, health, streak, weight, goalLabel }) {
  const workoutDone = workout
    ? workout.exercises?.every((e) => e.done) ? "yes"
    : workout.exercises?.some((e) => e.done)  ? "partial"
    : "no"
    : "no";

  return {
    goal:            goalLabel ?? "general_fitness",
    weight:          weight?.current ?? 0,
    target_calories: nutrition?.calories?.target   ?? 0,
    calories:        nutrition?.calories?.consumed ?? 0,
    protein:         nutrition?.protein?.consumed  ?? 0,
    protein_goal:    nutrition?.protein?.target    ?? 150,
    carbs:           nutrition?.carbs?.consumed    ?? 0,
    carbs_goal:      nutrition?.carbs?.target      ?? 200,
    fats:            nutrition?.fats?.consumed     ?? 0,
    fats_goal:       nutrition?.fats?.target       ?? 60,
    water:           nutrition?.water?.consumed    ?? 0,
    sleep:           health?.sleep ?? 0,
    workout:         workoutDone,
    activity:        workout && !workout.is_rest_day ? "moderately_active" : "lightly_active",
    energy:          health?.energy ?? 7,
    streak:          streak ?? 0,
  };
}