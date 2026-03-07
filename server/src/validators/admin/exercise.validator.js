// admin/validators/exerciseValidator.js

const VALID_MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "legs", "core", "cardio", "full_body",
];
const VALID_DIFFICULTY = [1, 2, 3];
const VALID_EQUIPMENT  = ["bodyweight", "dumbbells", "barbell", "machines", "full_gym"];

export const validateExercise = (body, isUpdate = false) => {
  const errors = [];

  if (!isUpdate) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      errors.push("name is required");
    }
    if (!body.muscle_group) {
      errors.push("muscle_group is required");
    }
  }

  if (body.muscle_group !== undefined && !VALID_MUSCLE_GROUPS.includes(body.muscle_group)) {
    errors.push(`muscle_group must be one of: ${VALID_MUSCLE_GROUPS.join(", ")}`);
  }

  if (body.difficulty !== undefined && !VALID_DIFFICULTY.includes(Number(body.difficulty))) {
    errors.push("difficulty must be 1, 2, or 3");
  }

  if (body.equipment !== undefined && !VALID_EQUIPMENT.includes(body.equipment)) {
    errors.push(`equipment must be one of: ${VALID_EQUIPMENT.join(", ")}`);
  }

  if (errors.length) {
    const err = new Error(errors.join("; "));
    err.name = "ValidationError";
    err.details = errors;
    throw err;
  }
};