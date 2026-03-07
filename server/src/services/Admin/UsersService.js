// admin/services/usersService.js
import pool from "../../db/pool.js";

export const getAllUsers = async ({ limit = 50, offset = 0, search = "", role = "" }) => {
  const params = [];
  let where = "WHERE 1=1";

  if (search) {
    params.push(`%${search}%`);
    where += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
  }

  if (role) {
    params.push(role);
    where += ` AND u.role = $${params.length}`;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT
       u.id, u.name, u.email, u.role, u.is_verified,
       u.is_banned, u.has_completed_onboarding, u.created_at,
       p.goal, p.activity_level
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM users u ${where}`,
    params.slice(0, params.length - 2)
  );

  return { users: rows, total: Number(countRows[0].count) };
};

export const getUserById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       u.id, u.name, u.email, u.role, u.is_verified,
       u.is_banned, u.has_completed_onboarding, u.created_at,
       p.age, p.gender, p.height, p.weight, p.goal,
       p.activity_level, p.diet_type, p.bmi, p.bmr, p.tdee,
       up.avatar_url
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN user_preferences up ON up.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
};

export const banUser = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_banned = true, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, email, is_banned`,
    [userId]
  );
  return rows[0] || null;
};

export const activateUser = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_banned = false, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, email, is_banned`,
    [userId]
  );
  return rows[0] || null;
};

export const verifyUser = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_verified = true, updated_at = NOW()
     WHERE id = $1 RETURNING id, name, email, is_verified`,
    [userId]
  );
  return rows[0] || null;
};

export const deleteUser = async (userId) => {
  const { rows } = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );
  return rows[0] || null;
};

export const resetUserPassword = async (userId, hashedPassword) => {
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [userId, hashedPassword]
  );
  return rows[0] || null;
};