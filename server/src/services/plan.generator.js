// src/services/plan.generator.js
// ─────────────────────────────────────────────────────────────
//  Upgraded Plan Generator
//  Features:
//    • Exercise rotation (different variations per week)
//    • Real progression logic (reps / weight / sets)
//    • Deload every 4th week (−20% volume)
//    • Estimated calories burned per session
//    • Muscle group tagging
//    • Adaptive meal calories (hook-ready for weekly adjustment)
// ─────────────────────────────────────────────────────────────

// ── EXERCISE LIBRARY ─────────────────────────────────────────
// Each split has a pool of exercise variations.
// The generator rotates through them week-over-week so the user
// never sees the exact same session twice.

const EXERCISE_POOL = {
  "Full Body": [
    {
      name: "Goblet Squat",
      muscles: ["Quads", "Glutes", "Core"],
      sets: 3,
      reps: 12,
      weight_kg: 0,       // 0 = bodyweight / user sets it
      est_kcal: 180,
    },
    {
      name: "Push-Up",
      muscles: ["Chest", "Triceps", "Shoulders"],
      sets: 3,
      reps: 12,
      weight_kg: 0,
      est_kcal: 100,
    },
    {
      name: "Dumbbell Row",
      muscles: ["Back", "Biceps"],
      sets: 3,
      reps: 12,
      weight_kg: 10,
      est_kcal: 120,
    },
    {
      name: "Plank",
      muscles: ["Core"],
      sets: 3,
      reps: null,
      duration_sec: 30,
      weight_kg: 0,
      est_kcal: 60,
    },
  ],
  "Full Body B": [
    {
      name: "Romanian Deadlift",
      muscles: ["Hamstrings", "Glutes", "Lower Back"],
      sets: 3,
      reps: 10,
      weight_kg: 20,
      est_kcal: 200,
    },
    {
      name: "Pike Push-Up",
      muscles: ["Shoulders", "Triceps"],
      sets: 3,
      reps: 10,
      weight_kg: 0,
      est_kcal: 90,
    },
    {
      name: "Inverted Row",
      muscles: ["Back", "Biceps"],
      sets: 3,
      reps: 10,
      weight_kg: 0,
      est_kcal: 110,
    },
    {
      name: "Dead Bug",
      muscles: ["Core"],
      sets: 3,
      reps: 10,
      weight_kg: 0,
      est_kcal: 50,
    },
  ],
  Push: [
    {
      name: "Bench Press",
      muscles: ["Chest", "Triceps", "Shoulders"],
      sets: 4,
      reps: 8,
      weight_kg: 40,
      est_kcal: 220,
    },
    {
      name: "Overhead Press",
      muscles: ["Shoulders", "Triceps"],
      sets: 3,
      reps: 10,
      weight_kg: 25,
      est_kcal: 160,
    },
    {
      name: "Incline Dumbbell Press",
      muscles: ["Upper Chest", "Shoulders"],
      sets: 3,
      reps: 10,
      weight_kg: 15,
      est_kcal: 150,
    },
    {
      name: "Tricep Dips",
      muscles: ["Triceps"],
      sets: 3,
      reps: 12,
      weight_kg: 0,
      est_kcal: 100,
    },
  ],
  "Push B": [
    {
      name: "Dumbbell Fly",
      muscles: ["Chest"],
      sets: 3,
      reps: 12,
      weight_kg: 10,
      est_kcal: 130,
    },
    {
      name: "Arnold Press",
      muscles: ["Shoulders"],
      sets: 3,
      reps: 10,
      weight_kg: 12,
      est_kcal: 140,
    },
    {
      name: "Decline Push-Up",
      muscles: ["Lower Chest", "Triceps"],
      sets: 3,
      reps: 12,
      weight_kg: 0,
      est_kcal: 100,
    },
    {
      name: "Skull Crushers",
      muscles: ["Triceps"],
      sets: 3,
      reps: 10,
      weight_kg: 15,
      est_kcal: 90,
    },
  ],
  Pull: [
    {
      name: "Pull-Up",
      muscles: ["Back", "Biceps"],
      sets: 4,
      reps: 6,
      weight_kg: 0,
      est_kcal: 200,
    },
    {
      name: "Barbell Row",
      muscles: ["Back", "Rear Delts"],
      sets: 3,
      reps: 8,
      weight_kg: 40,
      est_kcal: 190,
    },
    {
      name: "Face Pull",
      muscles: ["Rear Delts", "Rotator Cuff"],
      sets: 3,
      reps: 15,
      weight_kg: 10,
      est_kcal: 90,
    },
    {
      name: "Hammer Curl",
      muscles: ["Biceps", "Forearms"],
      sets: 3,
      reps: 12,
      weight_kg: 10,
      est_kcal: 80,
    },
  ],
  "Pull B": [
    {
      name: "Lat Pulldown",
      muscles: ["Lats", "Biceps"],
      sets: 4,
      reps: 10,
      weight_kg: 40,
      est_kcal: 180,
    },
    {
      name: "Seated Cable Row",
      muscles: ["Mid Back", "Biceps"],
      sets: 3,
      reps: 10,
      weight_kg: 35,
      est_kcal: 170,
    },
    {
      name: "Reverse Fly",
      muscles: ["Rear Delts"],
      sets: 3,
      reps: 15,
      weight_kg: 5,
      est_kcal: 70,
    },
    {
      name: "Concentration Curl",
      muscles: ["Biceps"],
      sets: 3,
      reps: 12,
      weight_kg: 8,
      est_kcal: 75,
    },
  ],
  Legs: [
    {
      name: "Back Squat",
      muscles: ["Quads", "Glutes", "Hamstrings"],
      sets: 4,
      reps: 8,
      weight_kg: 60,
      est_kcal: 280,
    },
    {
      name: "Bulgarian Split Squat",
      muscles: ["Quads", "Glutes"],
      sets: 3,
      reps: 10,
      weight_kg: 20,
      est_kcal: 220,
    },
    {
      name: "Leg Press",
      muscles: ["Quads", "Glutes"],
      sets: 3,
      reps: 12,
      weight_kg: 80,
      est_kcal: 200,
    },
    {
      name: "Standing Calf Raise",
      muscles: ["Calves"],
      sets: 4,
      reps: 15,
      weight_kg: 0,
      est_kcal: 80,
    },
  ],
  "Legs B": [
    {
      name: "Romanian Deadlift",
      muscles: ["Hamstrings", "Glutes"],
      sets: 4,
      reps: 8,
      weight_kg: 50,
      est_kcal: 260,
    },
    {
      name: "Sumo Squat",
      muscles: ["Inner Thighs", "Glutes"],
      sets: 3,
      reps: 12,
      weight_kg: 20,
      est_kcal: 200,
    },
    {
      name: "Walking Lunges",
      muscles: ["Quads", "Glutes"],
      sets: 3,
      reps: 12,
      weight_kg: 10,
      est_kcal: 210,
    },
    {
      name: "Seated Calf Raise",
      muscles: ["Calves"],
      sets: 4,
      reps: 15,
      weight_kg: 20,
      est_kcal: 70,
    },
  ],
  Core: [
    {
      name: "Cable Crunch",
      muscles: ["Abs"],
      sets: 3,
      reps: 15,
      weight_kg: 15,
      est_kcal: 80,
    },
    {
      name: "Hanging Leg Raise",
      muscles: ["Abs", "Hip Flexors"],
      sets: 3,
      reps: 12,
      weight_kg: 0,
      est_kcal: 90,
    },
    {
      name: "Ab Wheel Rollout",
      muscles: ["Abs", "Core"],
      sets: 3,
      reps: 10,
      weight_kg: 0,
      est_kcal: 100,
    },
    {
      name: "Russian Twist",
      muscles: ["Obliques"],
      sets: 3,
      reps: 20,
      weight_kg: 5,
      est_kcal: 75,
    },
  ],
  "Core B": [
    {
      name: "Plank",
      muscles: ["Core"],
      sets: 3,
      duration_sec: 45,
      reps: null,
      weight_kg: 0,
      est_kcal: 60,
    },
    {
      name: "Bicycle Crunch",
      muscles: ["Abs", "Obliques"],
      sets: 3,
      reps: 20,
      weight_kg: 0,
      est_kcal: 80,
    },
    {
      name: "V-Up",
      muscles: ["Abs"],
      sets: 3,
      reps: 15,
      weight_kg: 0,
      est_kcal: 85,
    },
    {
      name: "Side Plank",
      muscles: ["Obliques"],
      sets: 3,
      duration_sec: 30,
      reps: null,
      weight_kg: 0,
      est_kcal: 55,
    },
  ],
  HIIT: [
    {
      name: "Burpees",
      muscles: ["Full Body"],
      sets: 4,
      reps: 10,
      weight_kg: 0,
      est_kcal: 160,
    },
    {
      name: "Jump Squats",
      muscles: ["Quads", "Glutes"],
      sets: 4,
      reps: 12,
      weight_kg: 0,
      est_kcal: 140,
    },
    {
      name: "Mountain Climbers",
      muscles: ["Core", "Shoulders"],
      sets: 4,
      duration_sec: 30,
      reps: null,
      weight_kg: 0,
      est_kcal: 120,
    },
    {
      name: "Box Jumps",
      muscles: ["Quads", "Glutes", "Calves"],
      sets: 3,
      reps: 10,
      weight_kg: 0,
      est_kcal: 130,
    },
  ],
  Cardio: [
    {
      name: "Treadmill Run",
      muscles: ["Full Body"],
      sets: 1,
      duration_min: 30,
      reps: null,
      weight_kg: 0,
      est_kcal: 300,
    },
  ],
  "Cardio B": [
    {
      name: "Cycling",
      muscles: ["Quads", "Calves"],
      sets: 1,
      duration_min: 30,
      reps: null,
      weight_kg: 0,
      est_kcal: 260,
    },
  ],
  Stretching: [
    {
      name: "Full Body Stretch Routine",
      muscles: ["Full Body"],
      sets: 1,
      duration_min: 20,
      reps: null,
      weight_kg: 0,
      est_kcal: 80,
    },
  ],
};

// ── WORKOUT SPLITS PER LEVEL ──────────────────────────────────
// Each level defines a weekly rotation of splits.
// Alternating variants (Push / Push B) drives exercise rotation.

const SPLITS = {
  beginner: ["Full Body", "Cardio", "Stretching"],
  intermediate: ["Push", "Pull", "Legs", "Core"],
  advanced: ["Push", "Pull", "Legs", "HIIT", "Core"],
};

// ── MEAL LIBRARY ──────────────────────────────────────────────
// Enough variety for 4+ weeks without repetition within a week.

const MEAL_POOL = {
  veg: {
    breakfast: [
      "Oats with banana & chia seeds",
      "Greek yogurt with mixed berries",
      "Avocado toast on whole grain bread",
      "Moong dal chilla with mint chutney",
      "Smoothie bowl (spinach, banana, protein powder)",
      "Besan cheela with curd",
      "Poha with peanuts",
      "Upma with vegetables",
    ],
    lunch: [
      "Dal Bhat with mixed veg sabji",
      "Paneer tikka wrap with salad",
      "Rajma chawal",
      "Chana masala with brown rice",
      "Palak tofu with roti",
      "Quinoa vegetable stir-fry",
      "Lentil soup with whole wheat bread",
      "Veg biryani with raita",
    ],
    dinner: [
      "Vegetable soup with multigrain roti",
      "Tofu stir-fry with brown rice",
      "Sautéed vegetables with dal",
      "Mixed vegetable curry with roti",
      "Miso soup with edamame",
      "Baked sweet potato with black beans",
      "Grilled paneer salad",
      "Lentil dhal with naan",
    ],
    snack: [
      "Handful of almonds & walnuts",
      "Apple with peanut butter",
      "Roasted chickpeas",
      "Protein shake",
      "Hummus with veggie sticks",
      "Cottage cheese with fruit",
    ],
  },
  non_veg: {
    breakfast: [
      "Scrambled eggs with whole wheat toast",
      "Egg white omelette with vegetables",
      "Greek yogurt with granola",
      "Chicken sausage with oats",
      "Boiled eggs with avocado",
      "Smoked salmon on rye bread",
      "Turkey & egg wrap",
      "Protein smoothie with milk",
    ],
    lunch: [
      "Grilled chicken breast with brown rice",
      "Tuna salad with whole grain crackers",
      "Chicken wrap with veggies",
      "Fish curry with rice",
      "Turkey & quinoa bowl",
      "Egg fried rice (brown rice)",
      "Chicken + vegetable stir-fry",
      "Grilled fish with steamed broccoli",
    ],
    dinner: [
      "Baked salmon with asparagus",
      "Grilled chicken with sweet potato",
      "Chicken soup with vegetables",
      "Beef stir-fry with bell peppers",
      "Prawn curry with brown rice",
      "Egg scramble with spinach",
      "Grilled tuna steak with salad",
      "Turkey meatballs with zucchini noodles",
    ],
    snack: [
      "Boiled eggs (2)",
      "Chicken jerky",
      "Protein shake",
      "Tuna on rice cakes",
      "Greek yogurt",
      "Cottage cheese with fruit",
    ],
  },
};

// Normalize diet key to match our pool
function normalizeDiet(dietType = "") {
  const d = dietType.toLowerCase();
  if (d.includes("non") || d.includes("chicken") || d.includes("meat") || d.includes("fish")) {
    return "non_veg";
  }
  return "veg";
}

// ── PROGRESSION ENGINE ────────────────────────────────────────
// Given a base exercise and the current week number,
// applies a simple linear progression model.
//
// Week 1 → base values
// Week 2 → +1 rep on rep-based exercises
// Week 3 → +1 more rep OR flag for weight increase
// Week 4 → DELOAD (−20% sets & reps, same weight)
// Week 5+ → new block starts, but weight permanently increased

function applyProgression(exercise, week) {
  const ex = { ...exercise }; // don't mutate the library

  const blockWeek = ((week - 1) % 4) + 1; // 1–4 cycling

  const isDeload = blockWeek === 4;

  if (isDeload) {
    // Deload: reduce sets by 1 (min 2), reduce reps by ~20%
    ex.sets = Math.max(2, ex.sets - 1);
    if (ex.reps) ex.reps = Math.max(5, Math.round(ex.reps * 0.8));
    if (ex.duration_sec) ex.duration_sec = Math.round(ex.duration_sec * 0.8);
    ex.est_kcal = Math.round(ex.est_kcal * 0.8);
    ex.deload = true;
    ex.progression_note = "Deload week — reduced volume for recovery.";
    return ex;
  }

  // Normal weeks: progressive overload
  const weekOffset = blockWeek - 1; // 0, 1, 2

  if (ex.reps) {
    ex.reps += weekOffset; // +1 rep per week within a block
  }
  if (ex.duration_sec) {
    ex.duration_sec += weekOffset * 5; // +5s per week
  }
  if (ex.duration_min) {
    ex.duration_min += weekOffset * 2; // +2 min per week
  }

  // After first block (week > 4), bump base weight for weighted exercises
  if (week > 4 && ex.weight_kg > 0) {
    const blocks = Math.floor((week - 1) / 4);
    ex.weight_kg = ex.weight_kg + blocks * 2.5; // +2.5kg per completed block
    ex.progression_note = `Weight increased by ${blocks * 2.5}kg vs. Week 1.`;
  }

  // Track total volume for the session
  if (ex.reps && ex.weight_kg > 0) {
    ex.total_volume_kg = ex.sets * ex.reps * ex.weight_kg;
  }

  // Recalc estimated kcal proportional to volume increase
  if (weekOffset > 0) {
    ex.est_kcal = Math.round(ex.est_kcal * (1 + weekOffset * 0.05));
  }

  ex.deload = false;
  return ex;
}

// ── SPLIT ROTATION ────────────────────────────────────────────
// Alternates between primary and variant splits week-over-week.
// Week 1 → Push, Pull, Legs, Core
// Week 2 → Push B, Pull B, Legs B, Core B
// Week 3 → Push (with progression), Pull (with progression), …
// Week 4 → DELOAD versions of the same

function getRotatedSplit(splitName, week) {
  const blockWeek = ((week - 1) % 4) + 1;
  const useVariant = blockWeek % 2 === 0; // even block-weeks use variant
  const variantKey = `${splitName} B`;
  const key = useVariant && EXERCISE_POOL[variantKey] ? variantKey : splitName;
  return key;
}

// ── MEAL ROTATION ────────────────────────────────────────────
// Picks non-repeating meals across the week by offsetting
// into the pool array using the week number.

function buildWeekMeals(dietKey, week, daysPerWeek = 7) {
  const pool = MEAL_POOL[dietKey];
  const meals = [];

  for (let day = 1; day <= daysPerWeek; day++) {
    const idx = (week - 1 + day - 1) % pool.breakfast.length;
    meals.push({
      day,
      breakfast: pool.breakfast[idx],
      lunch:
        pool.lunch[idx % pool.lunch.length],
      dinner:
        pool.dinner[idx % pool.dinner.length],
      snack:
        pool.snack[idx % pool.snack.length],
    });
  }

  return meals;
}

// ── FOCUS TAG ─────────────────────────────────────────────────

function weekFocusTag(blockWeek, goals) {
  const tags = {
    1: `Foundation — ${goals}`,
    2: `Volume increase — ${goals}`,
    3: `Intensity peak — ${goals}`,
    4: `Deload & recovery`,
  };
  return tags[blockWeek] ?? `Week ${blockWeek} — ${goals}`;
}

// ── MAIN EXPORT ───────────────────────────────────────────────

export function generatePlan({
  fitnessLevel = "beginner",
  dietType = "veg",
  duration = 4,
  goals = "general fitness",
  habits = [],
  medicalConditions = [],
}) {
  const ACTIVITY_TO_FITNESS = {
    sedentary:         "beginner",
    lightly_active:    "beginner",
    moderately_active: "intermediate",
    very_active:       "advanced",
  };
  const mappedLevel = ACTIVITY_TO_FITNESS[fitnessLevel] ?? fitnessLevel;
  const splits = SPLITS[mappedLevel] ?? SPLITS.beginner;
  const dietKey = normalizeDiet(dietType);
  const schedule = [];

  for (let week = 1; week <= duration; week++) {
    const blockWeek = ((week - 1) % 4) + 1;
    const isDeload = blockWeek === 4;

    // Build workout days for this week
    const workouts = splits.map((splitName) => {
      const rotatedSplit = getRotatedSplit(splitName, week);
      const exercisePool = EXERCISE_POOL[rotatedSplit] ?? EXERCISE_POOL[splitName] ?? [];

      const exercises = exercisePool.map((ex) => applyProgression(ex, week));

      const totalKcal = exercises.reduce((sum, ex) => sum + (ex.est_kcal ?? 0), 0);

      // Collect unique muscle groups
      const muscleGroups = [...new Set(exercises.flatMap((ex) => ex.muscles))];

      return {
        split: splitName,            // logical split name (e.g. "Push")
        variation: rotatedSplit,     // actual variant used (e.g. "Push B")
        exercises,
        estimated_kcal_burned: totalKcal,
        muscle_groups: muscleGroups,
        is_deload: isDeload,
        difficulty_rating: null,     // filled in by user after session
      };
    });

    // Build meals for this week
    const meals = buildWeekMeals(dietKey, week);

    schedule.push({
      week,
      block_week: blockWeek,
      is_deload: isDeload,
      focus: weekFocusTag(blockWeek, goals),
      workouts,
      meals,
      habits,
    });
  }

  return {
    summary: {
      duration_weeks: duration,
      fitness_level: mappedLevel,
      diet_type: dietKey,
      goal: goals,
      medical_conditions: medicalConditions,
      total_workouts: schedule.length * splits.length,
    },
    schedule,
    generated_at: new Date().toISOString(),
  };
}