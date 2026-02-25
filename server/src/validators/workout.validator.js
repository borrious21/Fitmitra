// src/validators/workout.validator.js

export function validateWorkoutLog(data) {
  if (!data || typeof data !== "object") {
    const err = new Error("Workout log payload is missing or invalid");
    err.name = "ValidationError";
    err.details = ["Request body is empty or malformed"];
    throw err;
  }

  const errors = [];

  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    errors.push("exercises array is required and cannot be empty");
  } else {
    data.exercises.forEach((ex, index) => {
      // name
      if (!ex.name || typeof ex.name !== "string" || !ex.name.trim()) {
        errors.push(`exercises[${index}].name is required and must be a non-empty string`);
      }

      // sets — must be a non-negative integer (Number() coerces "3" → 3 fine,
      // but Math.floor guards against 3.7 etc.)
      const sets = Number(ex.sets);
      if (ex.sets === undefined || ex.sets === null || isNaN(sets) || sets < 0 || Math.floor(sets) !== sets) {
        errors.push(`exercises[${index}].sets must be a non-negative integer (got: ${ex.sets})`);
      }

      // reps — must be a non-negative integer.
      // NOTE: cardio exercises send reps=1 from the frontend; duration is
      // stored in notes. Never send a duration string ("45 sec") as reps.
      const reps = Number(ex.reps);
      if (ex.reps === undefined || ex.reps === null || isNaN(reps) || reps < 0 || Math.floor(reps) !== reps) {
        errors.push(`exercises[${index}].reps must be a non-negative integer (got: ${ex.reps})`);
      }

      // weight — optional, null is explicitly allowed (bodyweight exercises)
      if (ex.weight !== undefined && ex.weight !== null) {
        const w = Number(ex.weight);
        if (isNaN(w) || w < 0) {
          errors.push(`exercises[${index}].weight must be a non-negative number or null (got: ${ex.weight})`);
        }
      }

      // notes — optional string
      if (ex.notes !== undefined && ex.notes !== null && typeof ex.notes !== "string") {
        errors.push(`exercises[${index}].notes must be a string or null`);
      }
    });
  }

  // date — optional, YYYY-MM-DD if provided
  if (data.date !== undefined && data.date !== null) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push("date must be in YYYY-MM-DD format");
    }
  }

  if (errors.length) {
    const err = new Error("Workout log validation failed: " + errors[0]);
    err.name = "ValidationError";
    err.details = errors;
    throw err;
  }
}