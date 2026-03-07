// admin/validators/mealValidator.js

const VALID_DIET_TYPES = ["veg", "non_veg", "vegan", "keto", "paleo"];

export const validateMeal = (body, isUpdate = false) => {
  const errors = [];

  if (!isUpdate) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      errors.push("name is required");
    }
    if (body.calories === undefined || body.calories === null) {
      errors.push("calories is required");
    }
  }

  if (body.calories !== undefined && (isNaN(Number(body.calories)) || Number(body.calories) < 0)) {
    errors.push("calories must be a non-negative number");
  }

  if (body.protein_g !== undefined && (isNaN(Number(body.protein_g)) || Number(body.protein_g) < 0)) {
    errors.push("protein_g must be a non-negative number");
  }

  if (body.carbs_g !== undefined && (isNaN(Number(body.carbs_g)) || Number(body.carbs_g) < 0)) {
    errors.push("carbs_g must be a non-negative number");
  }

  if (body.fats_g !== undefined && (isNaN(Number(body.fats_g)) || Number(body.fats_g) < 0)) {
    errors.push("fats_g must be a non-negative number");
  }

  if (body.diet_type !== undefined && !VALID_DIET_TYPES.includes(body.diet_type)) {
    errors.push(`diet_type must be one of: ${VALID_DIET_TYPES.join(", ")}`);
  }

  if (errors.length) {
    const err = new Error(errors.join("; "));
    err.name = "ValidationError";
    err.details = errors;
    throw err;
  }
};