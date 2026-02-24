// src/domain/nutrition.rules.js

import { ACTIVITY_MULTIPLIERS, MEAL_RATIOS } from "./profile.enum.js";

function calcBMR(profile) {
  const { weight_kg, height_cm, age, gender } = profile;
  if (!weight_kg || !height_cm || !age) return null;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

function calcTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}

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