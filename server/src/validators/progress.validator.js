// src/validators/progress.validator.js
export function validateProgressLog(data) {
  if (!data || typeof data !== "object") {
    const err = new Error("Progress log payload is missing or invalid");
    err.name = "ValidationError";
    err.details = ["Request body is empty or malformed"];
    throw err;
  }

  const errors = [];

  if (data.weight_kg !== undefined && (typeof data.weight_kg !== "number" || data.weight_kg < 30 || data.weight_kg > 300)) {
    errors.push("weight_kg must be between 30 and 300");
  }

  if (data.body_fat_percentage !== undefined && (typeof data.body_fat_percentage !== "number" || data.body_fat_percentage < 0 || data.body_fat_percentage > 100)) {
    errors.push("body_fat_percentage must be between 0 and 100");
  }

  if (data.measurements !== undefined && (typeof data.measurements !== "object" || Array.isArray(data.measurements))) {
    errors.push("measurements must be an object");
  }

  if (data.progress_photos !== undefined && !Array.isArray(data.progress_photos)) {
    errors.push("progress_photos must be an array");
  }

  if (data.energy_level !== undefined && (!Number.isInteger(data.energy_level) || data.energy_level < 1 || data.energy_level > 10)) {
    errors.push("energy_level must be between 1 and 10");
  }

  if (data.sleep_hours !== undefined && (typeof data.sleep_hours !== "number" || data.sleep_hours < 0 || data.sleep_hours > 24)) {
    errors.push("sleep_hours must be between 0 and 24");
  }

  if (data.water_intake_liters !== undefined && (typeof data.water_intake_liters !== "number" || data.water_intake_liters < 0 || data.water_intake_liters > 20)) {
    errors.push("water_intake_liters must be between 0 and 20");
  }

  if (data.log_date !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.log_date)) {
      errors.push("log_date must be in YYYY-MM-DD format");
    }
  }

  if (errors.length) {
    const err = new Error("Progress log validation failed");
    err.name = "ValidationError";
    err.details = errors;
    throw err;
  }
}