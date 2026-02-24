// src/domain/workout.generator.js

const VALID_GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'maintain_fitness'];
const VALID_ACTIVITY_LEVELS = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete'];

export function generateWorkoutPlan(profile) {
  
  const validation = validateProfile(profile);
  if (!validation.isValid) {
    throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
  }

  const {
    goal,
    activity_level,
    age,
    medical_conditions = {},
  } = profile;

  const conditions = Object.keys(medical_conditions).filter(
    (k) => medical_conditions[k] === true
  );

  const intensity = resolveIntensity(activity_level, age, conditions);
  const weeklySplit = buildWeeklySplit(goal, intensity, conditions);
  const workoutDetails = buildWorkoutDetails(goal, intensity, conditions);

  return {
    meta: {
      goal,
      activity_level,
      age,
      intensity,
      medical_conditions: conditions,
      generated_at: new Date().toISOString(),
    },
    weekly_plan: weeklySplit,
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

function validateProfile(profile) {
  const errors = [];

  if (!profile) {
    return { isValid: false, errors: ['Profile is required'] };
  }

  if (!profile.goal || !VALID_GOALS.includes(profile.goal)) {
    errors.push(`Invalid goal. Must be one of: ${VALID_GOALS.join(', ')}`);
  }

  if (!profile.activity_level || !VALID_ACTIVITY_LEVELS.includes(profile.activity_level)) {
    errors.push(`Invalid activity_level. Must be one of: ${VALID_ACTIVITY_LEVELS.join(', ')}`);
  }

  if (typeof profile.age !== 'number' || profile.age < 13 || profile.age > 120) {
    errors.push('Age must be a number between 13 and 120');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function resolveIntensity(activityLevel, age, conditions) {
  if (conditions.includes('heart_disease')) return 'low';
  
  if (age >= 65) return 'low';
  if (age >= 50) {
    return conditions.length > 0 ? 'low' : 'low-to-moderate';
  }

  if (conditions.length >= 2) return 'low-to-moderate';
  if (conditions.length === 1) return 'moderate';

  switch (activityLevel) {
    case 'sedentary':
      return 'low';
    case 'lightly_active':
      return 'low-to-moderate';
    case 'moderately_active':
      return 'moderate';
    case 'very_active':
      return 'moderate-to-high';
    case 'athlete':
      return 'high';
    default:
      return 'moderate';
  }
}

function buildWeeklySplit(goal, intensity, conditions) {
  const hasJointIssues =
    conditions.includes('arthritis') || conditions.includes('injury');
  const hasCardiacCondition =
    conditions.includes('heart_disease') || conditions.includes('hypertension');
  
  const isLowIntensity = intensity === 'low' || intensity === 'low-to-moderate';
  
if (goal === 'muscle_gain') {
  if (isLowIntensity || hasJointIssues) {
    return {
      sunday: ['Full Body (Light)'],
      monday: ['Upper Body'],
      tuesday: ['Rest / Stretching'],
      wednesday: ['Upper Body (Light)'],
      thursday: ['Rest / Mobility'],
      friday: ['Lower Body'],
      saturday: ['Rest'],
    };
  }

  return {
    sunday: ['Chest', 'Triceps'],
    monday: ['Back', 'Biceps'],
    tuesday: ['Rest / Light Cardio'],
    wednesday: ['Shoulders', 'Core'],
    thursday: ['Upper Body (Accessory)'],
    friday: ['Legs'],
    saturday: ['Rest'],
  };
}

if (goal === 'weight_loss') {
  if (hasCardiacCondition) {
    return {
      sunday: ['Full Body Strength'],
      monday: ['Low-Intensity Cardio (30 min)'],
      tuesday: ['Upper Body Strength'],
      wednesday: ['Rest'],
      thursday: ['Lower Body Strength'],
      friday: ['Legs (Light)'],
      saturday: ['Rest'],
    };
  }

  if (isLowIntensity) {
    return {
      sunday: ['Full Body Strength'],
      monday: ['Moderate Cardio'],
      tuesday: ['Upper Body', 'Core'],
      wednesday: ['Rest'],
      thursday: ['Lower Body'],
      friday: ['Legs', 'Light Cardio'],
      saturday: ['Rest'],
    };
  }

  return {
    sunday: ['Full Body', 'Cardio (30 min)'],
    monday: ['Upper Body', 'Core'],
    tuesday: ['Cardio (Moderate)'],
    wednesday: ['Lower Body'],
    thursday: ['Cardio (30 min)'],
    friday: ['Legs', 'Light Cardio'],
    saturday: ['Rest'],
  };
}

if (goal === 'endurance') {
  if (hasCardiacCondition || isLowIntensity) {
    return {
      sunday: ['Moderate Cardio (30–40 min)'],
      monday: ['Rest'],
      tuesday: ['Lower Body Strength'],
      wednesday: ['Moderate Cardio (30 min)'],
      thursday: ['Upper Body Strength'],
      friday: ['Legs (Light Strength)'],
      saturday: ['Rest'],
    };
  }

  return {
    sunday: ['Cardio (Moderate 40 min)'],
    monday: ['Lower Body Strength'],
    tuesday: ['Cardio (Intervals 30–40 min)'],
    wednesday: ['Upper Body Strength'],
    thursday: ['Cardio (Moderate)'],
    friday: ['Legs (Strength + Short Cardio)'],
    saturday: ['Rest'],
  };
}

return {
  sunday: ['Full Body Strength'],
  monday: ['Cardio (20–30 min)'],
  tuesday: ['Upper Body'],
  wednesday: ['Rest'],
  thursday: ['Lower Body'],
  friday: ['Legs'],
  saturday: ['Rest'],
};
}

function buildWorkoutDetails(goal, intensity, conditions) {
  const details = {
    sets_range: getSetsRange(intensity),
    reps_range: getRepsRange(goal, intensity),
    rest_between_sets: getRestPeriod(goal, intensity),
    cardio_guidance: getCardioGuidance(goal, intensity, conditions),
  };

  return details;
}

function getSetsRange(intensity) {
  switch (intensity) {
    case 'low':
      return '1–2 sets per exercise';
    case 'low-to-moderate':
      return '2–3 sets per exercise';
    case 'moderate':
      return '3–4 sets per exercise';
    case 'moderate-to-high':
    case 'high':
      return '3–5 sets per exercise';
    default:
      return '3 sets per exercise';
  }
}

function getRepsRange(goal, intensity) {
  if (goal === 'muscle_gain') {
    return intensity === 'low' || intensity === 'low-to-moderate'
      ? '10–15 reps (lighter weight)'
      : '6–12 reps (moderate to heavy weight)';
  }
  
  if (goal === 'endurance') {
    return '12–20 reps (lighter weight, higher volume)';
  }
  
  if (goal === 'weight_loss') {
    return '10–15 reps (moderate weight, keep heart rate elevated)';
  }
  
  return '8–12 reps';
}

function getRestPeriod(goal, intensity) {
  if (intensity === 'low' || intensity === 'low-to-moderate') {
    return '60–90 seconds between sets';
  }
  
  if (goal === 'muscle_gain') {
    return '60–120 seconds between sets';
  }
  
  if (goal === 'weight_loss') {
    return '30–60 seconds between sets (circuit style optional)';
  }
  
  if (goal === 'endurance') {
    return '30–45 seconds between sets';
  }
  
  return '60 seconds between sets';
}

function getCardioGuidance(goal, intensity, conditions) {
  const hasCardiac = conditions.includes('heart_disease') || 
                     conditions.includes('hypertension');
  
  if (hasCardiac) {
    return {
      type: 'Low-intensity steady state',
      duration: '20–30 minutes',
      frequency: '3–4 times per week',
      target_heart_rate: '50–60% of max heart rate',
      note: 'Monitor heart rate closely and stay in safe zone',
    };
  }

  if (intensity === 'low' || intensity === 'low-to-moderate') {
    return {
      type: 'Moderate steady state (walking, cycling, swimming)',
      duration: '20–40 minutes',
      frequency: '3–5 times per week',
      target_heart_rate: '60–70% of max heart rate',
    };
  }

  if (goal === 'weight_loss') {
    return {
      type: 'Mix of HIIT and steady state',
      duration: '20–45 minutes',
      frequency: '4–6 times per week',
      target_heart_rate: '70–85% of max heart rate',
    };
  }

  if (goal === 'endurance') {
    return {
      type: 'Long duration steady state with interval training',
      duration: '30–60 minutes',
      frequency: '4–6 times per week',
      target_heart_rate: '65–80% of max heart rate',
    };
  }

  return {
    type: 'Moderate cardio (your choice)',
    duration: '20–30 minutes',
    frequency: '3–4 times per week',
    target_heart_rate: '60–75% of max heart rate',
  };
}

function buildGuidelines(intensity, conditions) {
  const guidelines = {
    warmup: intensity === 'low' || intensity === 'low-to-moderate'
      ? '5–10 minutes gentle movement and stretching'
      : '5–10 minutes dynamic warm-up',
    cooldown: '5–10 minutes stretching & light mobility work',
    progression: getProgressionGuidance(intensity),
    rest_days: 'At least 1–2 complete rest days per week',
    hydration: 'Drink water before, during, and after workouts',
    form_over_weight: 'Always prioritize proper form over lifting heavier weights',
  };

  if (conditions.includes('diabetes')) {
    guidelines.blood_sugar = 'Monitor blood sugar before and after workouts, keep fast-acting carbs nearby';
  }

  return guidelines;
}

function getProgressionGuidance(intensity) {
  switch (intensity) {
    case 'low':
      return 'Increase reps or weight every 2–3 weeks, focus on consistency';
    case 'low-to-moderate':
      return 'Increase reps or weight every 1–2 weeks gradually';
    case 'moderate':
      return 'Increase weight or reps every 1–2 weeks by small increments (2.5–5 lbs or 1–2 reps)';
    case 'moderate-to-high':
    case 'high':
      return 'Progressive overload weekly: increase weight, reps, or sets. Consider periodization.';
    default:
      return 'Increase difficulty progressively every 1–2 weeks';
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