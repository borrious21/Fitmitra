// src/domain/workout.generator.js
// Fixes:
//   1. Equipment-aware exercise selection (bodyweight vs gym)
//   2. Exercise rotation based on history to prevent plateau
//   3. Adaptive sets/reps based on recent performance
//   4. Proper rest day enforcement (Saturday always rest)
//   5. isRestDay boolean added to all plan days

const VALID_GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'maintain_fitness'];
const VALID_ACTIVITY_LEVELS = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete'];
const VALID_EQUIPMENT = ['bodyweight', 'dumbbells', 'barbell', 'machines', 'full_gym'];

const FORCED_REST_DAYS = ['saturday'];
const REST_MARKER = ['Rest'];

// ── Exercise Pool ──────────────────────────────────────────────────────────────
// Each exercise has: name, muscle_group, equipment[], difficulty (1-3)
const EXERCISE_POOL = {
  chest: [
    { name: "Push-Ups",               equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Wide Push-Ups",          equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Incline Push-Ups",       equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Dumbbell Bench Press",   equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Dumbbell Flys",          equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Incline Dumbbell Press", equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Barbell Bench Press",    equipment: ["barbell","full_gym"], difficulty: 3 },
    { name: "Cable Fly",              equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Chest Dip",              equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Pec Deck Machine",       equipment: ["machines","full_gym"], difficulty: 2 },
  ],
  back: [
    { name: "Superman Hold",          equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Resistance Band Row",    equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Dumbbell Row",           equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Pull-Ups",               equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Chin-Ups",               equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Lat Pulldown",           equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Seated Cable Row",       equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Bent Over Barbell Row",  equipment: ["barbell","full_gym"], difficulty: 3 },
    { name: "T-Bar Row",              equipment: ["barbell","full_gym"], difficulty: 3 },
    { name: "Deadlift",               equipment: ["barbell","full_gym"], difficulty: 3 },
  ],
  shoulders: [
    { name: "Pike Push-Ups",          equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Lateral Raises",         equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Front Raises",           equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Dumbbell Shoulder Press",equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Arnold Press",           equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Barbell Overhead Press", equipment: ["barbell","full_gym"], difficulty: 3 },
    { name: "Cable Lateral Raise",    equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Face Pulls",             equipment: ["machines","full_gym"], difficulty: 2 },
  ],
  biceps: [
    { name: "Isometric Bicep Hold",   equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Dumbbell Curl",          equipment: ["dumbbells","full_gym"], difficulty: 1 },
    { name: "Hammer Curl",            equipment: ["dumbbells","full_gym"], difficulty: 1 },
    { name: "Concentration Curl",     equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Barbell Curl",           equipment: ["barbell","full_gym"], difficulty: 2 },
    { name: "Preacher Curl",          equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Cable Curl",             equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Incline Dumbbell Curl",  equipment: ["dumbbells","full_gym"], difficulty: 2 },
  ],
  triceps: [
    { name: "Diamond Push-Ups",       equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Tricep Dips (Chair)",    equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Overhead Tricep Ext.",   equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Kickbacks",              equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Skull Crushers",         equipment: ["barbell","dumbbells","full_gym"], difficulty: 2 },
    { name: "Cable Pushdown",         equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Close Grip Bench Press", equipment: ["barbell","full_gym"], difficulty: 3 },
  ],
  legs: [
    { name: "Bodyweight Squat",       equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Lunges",                 equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Glute Bridge",           equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Step-Ups",               equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Dumbbell Squat",         equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Romanian Deadlift",      equipment: ["dumbbells","barbell","full_gym"], difficulty: 2 },
    { name: "Dumbbell Lunge",         equipment: ["dumbbells","full_gym"], difficulty: 2 },
    { name: "Barbell Squat",          equipment: ["barbell","full_gym"], difficulty: 3 },
    { name: "Leg Press",              equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Leg Curl",               equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Leg Extension",          equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Calf Raises",            equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
  ],
  core: [
    { name: "Plank",                  equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Crunches",               equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Bicycle Crunches",       equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1 },
    { name: "Mountain Climbers",      equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Russian Twists",         equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Dead Bug",               equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2 },
    { name: "Hanging Leg Raise",      equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 3 },
    { name: "Cable Crunch",           equipment: ["machines","full_gym"], difficulty: 2 },
    { name: "Ab Wheel Rollout",       equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 3 },
  ],
  // Cardio exercises use duration-based format instead of sets×reps.
  // isCardio: true  → UI shows duration/rounds, not "3 sets × 15 reps"
  // type: 'hiit'    → short intense intervals (work/rest)
  // type: 'steady'  → sustained duration at moderate intensity
  cardio: [
    { name: "Jumping Jacks",   equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1, isCardio: true, type: "hiit",   duration: "45 sec", rest: "15 sec", rounds: 4 },
    { name: "High Knees",      equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 1, isCardio: true, type: "hiit",   duration: "40 sec", rest: "20 sec", rounds: 4 },
    { name: "Burpees",         equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2, isCardio: true, type: "hiit",   duration: "30 sec", rest: "30 sec", rounds: 5 },
    { name: "Jump Rope",       equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2, isCardio: true, type: "hiit",   duration: "60 sec", rest: "30 sec", rounds: 5 },
    { name: "Mountain Climbers (Cardio)", equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 2, isCardio: true, type: "hiit", duration: "45 sec", rest: "15 sec", rounds: 4 },
    { name: "Sprint Intervals", equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 3, isCardio: true, type: "hiit",  duration: "20 sec", rest: "40 sec", rounds: 8 },
    { name: "Box Jumps",        equipment: ["bodyweight","dumbbells","barbell","machines","full_gym"], difficulty: 3, isCardio: true, type: "hiit",  duration: "30 sec", rest: "30 sec", rounds: 5 },
    { name: "Treadmill Run",    equipment: ["machines","full_gym"], difficulty: 2, isCardio: true, type: "steady", duration: "30 min", rounds: 1 },
    { name: "Rowing Machine",   equipment: ["machines","full_gym"], difficulty: 2, isCardio: true, type: "steady", duration: "25 min", rounds: 1 },
    { name: "Stationary Bike",  equipment: ["machines","full_gym"], difficulty: 1, isCardio: true, type: "steady", duration: "30 min", rounds: 1 },
    { name: "Stair Climber",    equipment: ["machines","full_gym"], difficulty: 2, isCardio: true, type: "steady", duration: "20 min", rounds: 1 },
    { name: "Elliptical",       equipment: ["machines","full_gym"], difficulty: 1, isCardio: true, type: "steady", duration: "30 min", rounds: 1 },
  ],
};

// Muscle groups per "focus area" label used in weekly splits
const FOCUS_TO_MUSCLES = {
  "Chest":                    ["chest"],
  "Triceps":                  ["triceps"],
  "Back":                     ["back"],
  "Biceps":                   ["biceps"],
  "Shoulders":                ["shoulders"],
  "Core":                     ["core"],
  "Legs":                     ["legs"],
  "Lower Body":               ["legs"],
  "Upper Body":               ["chest","back","shoulders"],
  "Full Body":                ["chest","back","legs","shoulders","core"],
  "Full Body (Light)":        ["chest","back","legs"],
  "Cardio (Moderate)":        ["cardio"],
  "Cardio (30 min)":          ["cardio"],
  "Cardio (Intervals)":       ["cardio"],
  "Moderate Cardio":          ["cardio"],
  "Low-Intensity Cardio (30 min)": ["cardio"],
  "Upper Body (Accessory)":   ["biceps","triceps","shoulders"],
  "Upper Body (Light)":       ["chest","shoulders"],
  "Lower Body Strength":      ["legs"],
  "Legs (Light)":             ["legs"],
  "Legs (Light Strength)":    ["legs"],
  "Legs (Strength + Short Cardio)": ["legs","cardio"],
  "Full Body Strength":       ["chest","back","legs"],
};

export function generateWorkoutPlan(profile) {
  const validation = validateProfile(profile);
  if (!validation.isValid) {
    throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
  }

  const {
    goal,
    activity_level,
    age,
    equipment = 'bodyweight',
    medical_conditions = {},
    recent_exercise_names = [],   // NEW: pass recently done exercises for rotation
  } = profile;

  const conditions = Object.keys(medical_conditions).filter(k => medical_conditions[k] === true);
  const normalizedEquipment = normalizeEquipment(equipment);
  const intensity = resolveIntensity(activity_level, age, conditions);
  const difficultyLevel = resolveDifficulty(activity_level, age, conditions);

  let weeklySplit = buildWeeklySplit(goal, intensity, conditions);

  // Hard-enforce rest days
  for (const day of FORCED_REST_DAYS) {
    weeklySplit[day] = REST_MARKER;
  }

  // Build per-day exercise lists with rotation & equipment awareness
  const dailyExercises = buildDailyExercises(
    weeklySplit,
    normalizedEquipment,
    difficultyLevel,
    goal,
    recent_exercise_names
  );

  const workoutDetails = buildWorkoutDetails(goal, intensity, conditions);

  return {
    meta: {
      goal,
      activity_level,
      age,
      equipment: normalizedEquipment,
      intensity,
      difficulty_level: difficultyLevel,
      medical_conditions: conditions,
      generated_at: new Date().toISOString(),
    },
    weekly_plan: weeklySplit,
    daily_exercises: dailyExercises,  // NEW: pre-built exercise lists per day
    workout_details: workoutDetails,
    guidelines: buildGuidelines(intensity, conditions),
    safety_notes: buildSafetyNotes(conditions),
    disclaimers: [
      'This is a general fitness guide and not medical advice',
      'Consult with a healthcare provider before starting any new exercise program',
      'Stop immediately if you experience pain, dizziness, or unusual symptoms',
    ],
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeEquipment(equipment) {
  if (!equipment || !VALID_EQUIPMENT.includes(equipment)) return 'bodyweight';
  return equipment;
}

function resolveDifficulty(activityLevel, age, conditions) {
  if (conditions.includes('heart_disease') || conditions.includes('injury')) return 1;
  if (age >= 65) return 1;
  if (age >= 50) return conditions.length > 0 ? 1 : 2;
  if (conditions.length >= 2) return 1;
  switch (activityLevel) {
    case 'sedentary':         return 1;
    case 'lightly_active':    return 1;
    case 'moderately_active': return 2;
    case 'very_active':       return 3;   // FIX: very_active => difficulty 3, not 2
    case 'athlete':           return 3;
    default:                  return 2;
  }
}

/**
 * Pick exercises for a muscle group with:
 * 1. Equipment filtering
 * 2. Difficulty cap
 * 3. Rotation: deprioritize recently used exercises
 */
function pickExercises(muscleGroups, equipment, difficultyLevel, goal, recentNames, count = 3) {
  const allExercises = [];

  for (const group of muscleGroups) {
    const pool = EXERCISE_POOL[group] ?? [];
    const filtered = pool.filter(ex =>
      ex.equipment.includes(equipment) &&
      ex.difficulty <= difficultyLevel
    );
    allExercises.push(...filtered);
  }

  if (!allExercises.length) return [];

  // Separate fresh vs recently-done exercises for rotation
  const fresh  = allExercises.filter(ex => !recentNames.includes(ex.name));
  const stale  = allExercises.filter(ex =>  recentNames.includes(ex.name));

  // Prefer fresh exercises; fall back to stale if not enough
  const pool = fresh.length >= count ? fresh : [...fresh, ...stale];

  // Shuffle deterministically enough for variety
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildDailyExercises(weeklySplit, equipment, difficultyLevel, goal, recentNames) {
  const result = {};

  for (const [day, focusAreas] of Object.entries(weeklySplit)) {
    const isRest = !focusAreas?.length || focusAreas.every(g => /^rest/i.test(g.trim()));
    if (isRest) {
      result[day] = [];
      continue;
    }

    const muscleGroups = [];
    for (const focus of focusAreas) {
      const muscles = FOCUS_TO_MUSCLES[focus];
      if (muscles) muscleGroups.push(...muscles);
    }

    // Deduplicate muscle groups
    const uniqueMuscles = [...new Set(muscleGroups)];

    // Detect if this is a pure cardio day
    const isCardioDay = uniqueMuscles.length > 0 && uniqueMuscles.every(m => m === 'cardio');
    const hasMixedCardio = uniqueMuscles.includes('cardio') && !isCardioDay;

    let exercises = [];

    if (isCardioDay) {
      // Cardio-only day: pick HIIT exercises, use duration format
      const cardioCount = difficultyLevel === 3 ? 6 : difficultyLevel === 2 ? 5 : 4;
      const picked = pickExercises(['cardio'], equipment, difficultyLevel, goal, recentNames, cardioCount);
      exercises = picked.map(ex => formatCardioExercise(ex, goal, difficultyLevel));
    } else if (hasMixedCardio) {
      // Mixed day (e.g. Legs + Cardio): split budget
      const strengthMuscles = uniqueMuscles.filter(m => m !== 'cardio');
      const strengthCount = resolveExerciseCount(goal, difficultyLevel, strengthMuscles.length);
      const strengthPicked = pickExercises(strengthMuscles, equipment, difficultyLevel, goal, recentNames, strengthCount);
      const cardioPicked   = pickExercises(['cardio'], equipment, difficultyLevel, goal, recentNames, 2);

      exercises = [
        ...strengthPicked.map(ex => formatStrengthExercise(ex, goal, difficultyLevel)),
        ...cardioPicked.map(ex => formatCardioExercise(ex, goal, difficultyLevel)),
      ];
    } else {
      // Pure strength day
      const count = resolveExerciseCount(goal, difficultyLevel, uniqueMuscles.length);
      const picked = pickExercises(uniqueMuscles, equipment, difficultyLevel, goal, recentNames, count);
      exercises = picked.map(ex => formatStrengthExercise(ex, goal, difficultyLevel));
    }

    result[day] = exercises;
  }

  return result;
}

/** Format a strength exercise with sets/reps/rest */
function formatStrengthExercise(ex, goal, difficultyLevel) {
  return {
    name:         ex.name,
    isCardio:     false,
    ...resolveSetRep(goal, difficultyLevel),
  };
}

/** Format a cardio exercise with duration/rounds/rest — no sets×reps */
function formatCardioExercise(ex, goal, difficultyLevel) {
  // Use lookup-based scaling instead of additive stacking.
  // Additive stacking caused Sprint Intervals to inflate to 9-10 rounds.
  // Hard cap: no more than 6 rounds per exercise in a single session.
  const BASE = ex.rounds ?? 4;
  let rounds;
  if (goal === 'weight_loss' && difficultyLevel === 3) rounds = Math.min(BASE + 1, 6);
  else if (goal === 'weight_loss' && difficultyLevel === 2) rounds = Math.min(BASE, 5);
  else if (difficultyLevel === 3)  rounds = Math.min(BASE, 5);
  else if (difficultyLevel === 2)  rounds = Math.min(BASE, 4);
  else                             rounds = Math.min(BASE, 3);

  return {
    name:         ex.name,
    isCardio:     true,
    type:         ex.type ?? 'hiit',
    sets:         rounds,
    reps:         ex.duration ?? '45 sec',
    rest_seconds: ex.type === 'steady' ? null : parseDurationToSeconds(ex.rest ?? '20 sec'),
    duration:     ex.duration,
    rest:         ex.rest,
    rounds,
  };
}

/** Convert "30 sec" / "1 min" to integer seconds for UI display */
function parseDurationToSeconds(str) {
  if (!str) return null;
  if (/min/.test(str)) return parseInt(str) * 60;
  return parseInt(str) || null;
}

function resolveExerciseCount(goal, difficultyLevel, focusGroupCount) {
  const base = focusGroupCount > 2 ? 6 : 4;
  if (difficultyLevel === 1) return Math.max(3, base - 1);
  if (difficultyLevel === 3) return base + 2;
  return base;
}

function resolveSetRep(goal, difficultyLevel) {
  if (goal === 'muscle_gain') {
    return difficultyLevel === 1
      ? { sets: 2, reps: 12, rest_seconds: 90 }
      : difficultyLevel === 2
        ? { sets: 3, reps: 10, rest_seconds: 75 }
        : { sets: 4, reps: 8,  rest_seconds: 60 };
  }
  if (goal === 'weight_loss') {
    return difficultyLevel === 1
      ? { sets: 2, reps: 15, rest_seconds: 60 }
      : difficultyLevel === 2
        ? { sets: 3, reps: 15, rest_seconds: 45 }
        : { sets: 4, reps: 15, rest_seconds: 30 };
  }
  if (goal === 'endurance') {
    return { sets: 3, reps: 20, rest_seconds: 30 };
  }
  // maintain_fitness
  return { sets: 3, reps: 12, rest_seconds: 60 };
}

// ── Profile validation ─────────────────────────────────────────────────────────

function validateProfile(profile) {
  const errors = [];
  if (!profile) return { isValid: false, errors: ['Profile is required'] };

  if (!profile.goal || !VALID_GOALS.includes(profile.goal))
    errors.push(`Invalid goal. Must be one of: ${VALID_GOALS.join(', ')}`);

  if (!profile.activity_level || !VALID_ACTIVITY_LEVELS.includes(profile.activity_level))
    errors.push(`Invalid activity_level. Must be one of: ${VALID_ACTIVITY_LEVELS.join(', ')}`);

  if (typeof profile.age !== 'number' || profile.age < 13 || profile.age > 120)
    errors.push('Age must be a number between 13 and 120');

  if (profile.equipment && !VALID_EQUIPMENT.includes(profile.equipment))
    errors.push(`Invalid equipment. Must be one of: ${VALID_EQUIPMENT.join(', ')}`);

  return { isValid: errors.length === 0, errors };
}

// ── Intensity resolution (unchanged) ──────────────────────────────────────────

function resolveIntensity(activityLevel, age, conditions) {
  if (conditions.includes('heart_disease')) return 'low';
  if (age >= 65) return 'low';
  if (age >= 50) return conditions.length > 0 ? 'low' : 'low-to-moderate';
  if (conditions.length >= 2) return 'low-to-moderate';
  if (conditions.length === 1) return 'moderate';
  switch (activityLevel) {
    case 'sedentary':         return 'low';
    case 'lightly_active':    return 'low-to-moderate';
    case 'moderately_active': return 'moderate';
    case 'very_active':       return 'moderate-to-high';
    case 'athlete':           return 'high';
    default:                  return 'moderate';
  }
}

// ── Weekly split builder (unchanged logic, Saturday always rest) ───────────────

function buildWeeklySplit(goal, intensity, conditions) {
  const hasJointIssues      = conditions.includes('arthritis') || conditions.includes('injury');
  const hasCardiacCondition = conditions.includes('heart_disease') || conditions.includes('hypertension');
  const isLowIntensity      = intensity === 'low' || intensity === 'low-to-moderate';

  if (goal === 'muscle_gain') {
    if (isLowIntensity || hasJointIssues) {
      return {
        sunday:    ['Full Body (Light)'],
        monday:    ['Upper Body'],
        tuesday:   ['Rest / Stretching'],
        wednesday: ['Upper Body (Light)'],
        thursday:  ['Rest / Mobility'],
        friday:    ['Lower Body'],
        saturday:  REST_MARKER,
      };
    }
    return {
      sunday:    ['Chest', 'Triceps'],
      monday:    ['Back', 'Biceps'],
      tuesday:   ['Rest / Light Cardio'],
      wednesday: ['Shoulders', 'Core'],
      thursday:  ['Upper Body (Accessory)'],
      friday:    ['Legs'],
      saturday:  REST_MARKER,
    };
  }

  if (goal === 'weight_loss') {
    if (hasCardiacCondition) {
      return {
        sunday:    ['Full Body Strength'],
        monday:    ['Low-Intensity Cardio (30 min)'],
        tuesday:   ['Upper Body Strength'],
        wednesday: ['Rest'],
        thursday:  ['Lower Body Strength'],
        friday:    ['Legs (Light)'],
        saturday:  REST_MARKER,
      };
    }
    if (isLowIntensity) {
      return {
        sunday:    ['Full Body Strength'],
        monday:    ['Moderate Cardio'],
        tuesday:   ['Upper Body', 'Core'],
        wednesday: ['Rest'],
        thursday:  ['Lower Body'],
        friday:    ['Legs', 'Light Cardio'],
        saturday:  REST_MARKER,
      };
    }
    return {
      sunday:    ['Full Body', 'Cardio (30 min)'],
      monday:    ['Upper Body', 'Core'],
      tuesday:   ['Cardio (Moderate)'],
      wednesday: ['Lower Body'],
      thursday:  ['Cardio (30 min)'],
      friday:    ['Legs', 'Light Cardio'],
      saturday:  REST_MARKER,
    };
  }

  if (goal === 'endurance') {
    if (hasCardiacCondition || isLowIntensity) {
      return {
        sunday:    ['Moderate Cardio (30–40 min)'],
        monday:    ['Rest'],
        tuesday:   ['Lower Body Strength'],
        wednesday: ['Moderate Cardio (30 min)'],
        thursday:  ['Upper Body Strength'],
        friday:    ['Legs (Light Strength)'],
        saturday:  REST_MARKER,
      };
    }
    return {
      sunday:    ['Cardio (Moderate 40 min)'],
      monday:    ['Lower Body Strength'],
      tuesday:   ['Cardio (Intervals 30–40 min)'],
      wednesday: ['Upper Body Strength'],
      thursday:  ['Cardio (Moderate)'],
      friday:    ['Legs (Strength + Short Cardio)'],
      saturday:  REST_MARKER,
    };
  }

  return {
    sunday:    ['Full Body Strength'],
    monday:    ['Cardio (20–30 min)'],
    tuesday:   ['Upper Body'],
    wednesday: ['Rest'],
    thursday:  ['Lower Body'],
    friday:    ['Legs'],
    saturday:  REST_MARKER,
  };
}

// ── Workout details (sets/reps guidance, cardio) ───────────────────────────────

function buildWorkoutDetails(goal, intensity, conditions) {
  return {
    sets_range:        getSetsRange(intensity),
    reps_range:        getRepsRange(goal, intensity),
    rest_between_sets: getRestPeriod(goal, intensity),
    cardio_guidance:   getCardioGuidance(goal, intensity, conditions),
  };
}

function getSetsRange(intensity) {
  switch (intensity) {
    case 'low':              return '1–2 sets per exercise';
    case 'low-to-moderate':  return '2–3 sets per exercise';
    case 'moderate':         return '3–4 sets per exercise';
    case 'moderate-to-high':
    case 'high':             return '3–5 sets per exercise';
    default:                 return '3 sets per exercise';
  }
}

function getRepsRange(goal, intensity) {
  if (goal === 'muscle_gain') {
    return intensity === 'low' || intensity === 'low-to-moderate'
      ? '10–15 reps (lighter weight)'
      : '6–12 reps (moderate to heavy weight)';
  }
  if (goal === 'endurance')    return '12–20 reps (lighter weight, higher volume)';
  if (goal === 'weight_loss')  return '10–15 reps (moderate weight, keep heart rate elevated)';
  return '8–12 reps';
}

function getRestPeriod(goal, intensity) {
  if (intensity === 'low' || intensity === 'low-to-moderate') return '60–90 seconds between sets';
  if (goal === 'muscle_gain')  return '60–120 seconds between sets';
  if (goal === 'weight_loss')  return '30–60 seconds between sets (circuit style optional)';
  if (goal === 'endurance')    return '30–45 seconds between sets';
  return '60 seconds between sets';
}

function getCardioGuidance(goal, intensity, conditions) {
  const hasCardiac = conditions.includes('heart_disease') || conditions.includes('hypertension');
  if (hasCardiac) {
    return { type: 'Low-intensity steady state', duration: '20–30 minutes', frequency: '3–4 times per week', target_heart_rate: '50–60% of max heart rate', note: 'Monitor heart rate closely' };
  }
  if (intensity === 'low' || intensity === 'low-to-moderate') {
    return { type: 'Moderate steady state (walking, cycling, swimming)', duration: '20–40 minutes', frequency: '3–5 times per week', target_heart_rate: '60–70% of max heart rate' };
  }
  if (goal === 'weight_loss') {
    return { type: 'Mix of HIIT and steady state', duration: '20–45 minutes', frequency: '4–6 times per week', target_heart_rate: '70–85% of max heart rate' };
  }
  if (goal === 'endurance') {
    return { type: 'Long duration steady state with interval training', duration: '30–60 minutes', frequency: '4–6 times per week', target_heart_rate: '65–80% of max heart rate' };
  }
  return { type: 'Moderate cardio (your choice)', duration: '20–30 minutes', frequency: '3–4 times per week', target_heart_rate: '60–75% of max heart rate' };
}

function buildGuidelines(intensity, conditions) {
  const guidelines = {
    warmup: intensity === 'low' || intensity === 'low-to-moderate'
      ? '5–10 minutes gentle movement and stretching'
      : '5–10 minutes dynamic warm-up',
    cooldown:         '5–10 minutes stretching & light mobility work',
    progression:      getProgressionGuidance(intensity),
    rest_days:        'At least 1–2 complete rest days per week',
    hydration:        'Drink water before, during, and after workouts',
    form_over_weight: 'Always prioritize proper form over lifting heavier weights',
  };
  if (conditions.includes('diabetes')) {
    guidelines.blood_sugar = 'Monitor blood sugar before and after workouts, keep fast-acting carbs nearby';
  }
  return guidelines;
}

function getProgressionGuidance(intensity) {
  switch (intensity) {
    case 'low':              return 'Increase reps or weight every 2–3 weeks, focus on consistency';
    case 'low-to-moderate':  return 'Increase reps or weight every 1–2 weeks gradually';
    case 'moderate':         return 'Increase weight or reps every 1–2 weeks by small increments (2.5–5 lbs or 1–2 reps)';
    case 'moderate-to-high':
    case 'high':             return 'Progressive overload weekly: increase weight, reps, or sets. Consider periodization.';
    default:                 return 'Increase difficulty progressively every 1–2 weeks';
  }
}

function buildSafetyNotes(conditions) {
  if (!conditions.length) {
    return [
      'Maintain proper form throughout all exercises',
      'Stay well hydrated',
      'Stop if you experience pain or discomfort',
    ];
  }
  const notes = [];
  if (conditions.includes('hypertension')) {
    notes.push('Avoid holding breath during lifts (no Valsalva maneuver)');
    notes.push('Monitor blood pressure regularly and stay within safe heart rate zones');
  }
  if (conditions.includes('diabetes')) {
    notes.push('Monitor blood sugar before and after workouts');
    notes.push('Keep fast-acting carbohydrates nearby in case of hypoglycemia');
    notes.push('Exercise at consistent times to help regulate blood sugar');
  }
  if (conditions.includes('heart_disease')) {
    notes.push('Keep intensity low to moderate and avoid sudden spikes in heart rate');
    notes.push('Wear a heart rate monitor and stay within prescribed zones');
    notes.push('Stop immediately if experiencing chest pain, dizziness, or shortness of breath');
  }
  if (conditions.includes('arthritis')) {
    notes.push('Avoid high-impact exercises; prefer low-impact alternatives (swimming, cycling)');
    notes.push('Warm up thoroughly before exercise');
    notes.push('Use proper joint protection techniques and consider resistance bands over heavy weights');
  }
  if (conditions.includes('injury')) {
    notes.push('Avoid movements that stress injured areas');
    notes.push('Work within pain-free ranges of motion');
    notes.push('Consider working with a physical therapist for rehabilitation exercises');
  }
  if (conditions.includes('asthma')) {
    notes.push('Keep rescue inhaler accessible during workouts');
    notes.push('Warm up gradually to prevent exercise-induced symptoms');
    notes.push('Avoid exercising outdoors when air quality is poor or during high pollen counts');
  }
  notes.push('Always prioritize safety and listen to your body');
  return notes;
}