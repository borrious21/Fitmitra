// admin/services/exercisesService.js
import pool from "../../db/pool.js";

export const getAllExercises = async ({ limit = 50, offset = 0, search = "", muscle_group = "", equipment = "" }) => {
  const params = [];
  let where = "WHERE 1=1";

  if (search) {
    params.push(`%${search}%`);
    where += ` AND name ILIKE $${params.length}`;
  }
  if (muscle_group) {
    params.push(muscle_group);
    where += ` AND muscle_group = $${params.length}`;
  }
  if (equipment) {
    params.push(equipment);
    where += ` AND equipment = $${params.length}`;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM exercises ${where}
     ORDER BY name ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM exercises ${where}`,
    params.slice(0, params.length - 2)
  );

  return { exercises: rows, total: Number(countRows[0].count) };
};

export const getExerciseById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM exercises WHERE id = $1`, [id]);
  return rows[0] || null;
};

export const createExercise = async (data) => {
  const {
    name, muscle_group, equipment = "bodyweight",
    difficulty = 1, tier = "A", instructions = null,
    video_url = null, is_cardio = false,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO exercises
       (name, muscle_group, equipment, difficulty, tier,
        instructions, video_url, is_cardio, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     RETURNING *`,
    [name, muscle_group, equipment, difficulty, tier,
     instructions, video_url, is_cardio]
  );
  return rows[0];
};

export const updateExercise = async (id, data) => {
  const fields  = [];
  const params  = [];
  const allowed = [
    "name", "muscle_group", "equipment", "difficulty",
    "tier", "instructions", "video_url", "is_cardio",
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (!fields.length) return getExerciseById(id);

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE exercises SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] || null;
};

export const deleteExercise = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM exercises WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] || null;
};