// 
import pool from "../../db/pool.js";

export const getAllMeals = async ({ limit = 50, offset = 0, search = "", diet_type = "" }) => {
  const params = [];
  let where = "WHERE 1=1";

  if (search) {
    params.push(`%${search}%`);
    where += ` AND name ILIKE $${params.length}`;
  }

  if (diet_type) {
    params.push(diet_type);
    where += ` AND diet_type = $${params.length}`;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM meals ${where}
     ORDER BY name ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM meals ${where}`,
    params.slice(0, params.length - 2)
  );

  return { meals: rows, total: Number(countRows[0].count) };
};

export const getMealById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM meals WHERE id = $1`, [id]);
  return rows[0] || null;
};

export const createMeal = async (data) => {
  const {
    name, calories, protein_g = 0, carbs_g = 0, fats_g = 0,
    fiber_g = 0, diet_type = "veg", cuisine = null,
    serving_size = null, serving_unit = null,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO meals
       (name, calories, protein_g, carbs_g, fats_g, fiber_g,
        diet_type, cuisine, serving_size, serving_unit, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
     RETURNING *`,
    [name, calories, protein_g, carbs_g, fats_g, fiber_g,
     diet_type, cuisine, serving_size, serving_unit]
  );
  return rows[0];
};

export const updateMeal = async (id, data) => {
  const fields = [];
  const params = [];

  const allowed = [
    "name", "calories", "protein_g", "carbs_g", "fats_g",
    "fiber_g", "diet_type", "cuisine", "serving_size", "serving_unit",
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (!fields.length) return getMealById(id);

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE meals SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] || null;
};

export const deleteMeal = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM meals WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] || null;
};