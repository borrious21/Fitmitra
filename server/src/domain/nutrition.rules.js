// src/domain/nutrition.rules.js

import { ACTIVITY_MULTIPLIERS, MEAL_RATIOS } from "./profile.enum.js";

/* ── Mifflin-St Jeor BMR ─────────────────────────────────────
   Male:   10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
   Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
─────────────────────────────────────────────────────────── */
function calcBMR(profile) {
  const { weight_kg, height_cm, age, gender } = profile;
  if (!weight_kg || !height_cm || !age) return null;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

/* ── TDEE ────────────────────────────────────────────────────
   Total Daily Energy Expenditure = BMR × activity multiplier
─────────────────────────────────────────────────────────── */
function calcTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}

/* ── Goal-adjusted calorie target ───────────────────────────
   weight_loss:      TDEE - 500  (≈ 0.5 kg/week deficit)
   muscle_gain:      TDEE + 300  (lean bulk)
   maintain_fitness: TDEE
   endurance:        TDEE + 200  (fuel for cardio)
   wellness:         TDEE
─────────────────────────────────────────────────────────── */
function goalAdjustedCalories(tdee, goal) {
  const adjustments = {
    weight_loss:      -500,
    muscle_gain:      +300,
    maintain_fitness:    0,
    endurance:        +200,
    wellness:            0,
  };
  return tdee + (adjustments[goal] ?? 0);
}

/* ════════════════════════════════════════════════════════════
   EXPORTS
════════════════════════════════════════════════════════════ */

/**
 * Returns calorie targets and BMR/TDEE breakdown.
 */
export function calculateRecommendedCalories(profile) {
  const bmr = calcBMR(profile);
  if (!bmr) return null;

  const tdee     = calcTDEE(bmr, profile.activity_level);
  const calories = goalAdjustedCalories(tdee, profile.goal);

  return {
    bmr:      Math.round(bmr),
    tdee,
    calories,
    goal:     profile.goal,
    activity: profile.activity_level,
  };
}

/**
 * Returns daily macro targets in grams.
 *
 * Macro splits by goal:
 *   weight_loss:      P 35% / C 35% / F 30%
 *   muscle_gain:      P 35% / C 45% / F 20%
 *   endurance:        P 20% / C 55% / F 25%
 *   maintain_fitness: P 25% / C 50% / F 25%
 *   wellness:         P 25% / C 50% / F 25%
 */
export function calculateMacroSplit(profile) {
  const calData = calculateRecommendedCalories(profile);
  if (!calData) return null;

  const { calories } = calData;

  const splits = {
    weight_loss:      { protein: 0.35, carbs: 0.35, fats: 0.30 },
    muscle_gain:      { protein: 0.35, carbs: 0.45, fats: 0.20 },
    endurance:        { protein: 0.20, carbs: 0.55, fats: 0.25 },
    maintain_fitness: { protein: 0.25, carbs: 0.50, fats: 0.25 },
    wellness:         { protein: 0.25, carbs: 0.50, fats: 0.25 },
  };

  const split = splits[profile.goal] ?? splits.maintain_fitness;

  // protein & carbs = 4 kcal/g, fats = 9 kcal/g
  const protein_g = Math.round((calories * split.protein) / 4);
  const carbs_g   = Math.round((calories * split.carbs)   / 4);
  const fats_g    = Math.round((calories * split.fats)    / 9);

  return {
    calories,
    protein_g,
    carbs_g,
    fats_g,
    split_pct: {
      protein: Math.round(split.protein * 100),
      carbs:   Math.round(split.carbs   * 100),
      fats:    Math.round(split.fats    * 100),
    },
  };
}

/**
 * Breaks daily macros into per-meal targets using MEAL_RATIOS.
 * Default ratios: breakfast 25% / lunch 35% / dinner 30% / snacks 10%
 */
export function calculateMealWiseMacros(profile) {
  const macros = calculateMacroSplit(profile);
  if (!macros) return null;

  const meals = {};

  for (const [meal, ratio] of Object.entries(MEAL_RATIOS)) {
    meals[meal] = {
      calories:  Math.round(macros.calories  * ratio),
      protein_g: Math.round(macros.protein_g * ratio),
      carbs_g:   Math.round(macros.carbs_g   * ratio),
      fats_g:    Math.round(macros.fats_g    * ratio),
    };
  }

  return {
    daily:  macros,
    meals,
  };
}