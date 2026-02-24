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
      if (!ex.name || typeof ex.name !== "string") {
        errors.push(`exercises[${index}].name is required and must be a string`);
      }
      if (ex.sets === undefined || !Number.isInteger(ex.sets) || ex.sets < 0) {
        errors.push(`exercises[${index}].sets must be a non-negative integer`);
      }
      if (ex.reps === undefined || !Number.isInteger(ex.reps) || ex.reps < 0) {
        errors.push(`exercises[${index}].reps must be a non-negative integer`);
      }
      if (ex.weight !== undefined && (typeof ex.weight !== "number" || ex.weight < 0)) {
        errors.push(`exercises[${index}].weight must be a non-negative number`);
      }
    });
  }

  if (data.date !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push("date must be in YYYY-MM-DD format");
    }
  }

  if (errors.length) {
    const err = new Error("Workout log validation failed");
    err.name = "ValidationError";
    err.details = errors;
    throw err;
  }
}
