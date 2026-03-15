import pool from "../config/db.config.js";

export default class SessionModel {

  static async create(userId, title = "New Chat") {
    const { rows } = await pool.query(
      `INSERT INTO chat_sessions (user_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, title]
    );
    return rows[0];
  }

  static async findAllByUser(userId) {
    const { rows } = await pool.query(
      `SELECT cs.*,
              COUNT(cm.id)::INT AS message_count
       FROM   chat_sessions cs
       LEFT JOIN chat_messages cm ON cm.session_id = cs.id
       WHERE  cs.user_id = $1
       GROUP  BY cs.id
       ORDER  BY cs.updated_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findOne(sessionId, userId) {
    const { rows } = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    return rows[0] || null;
  }

  static async touch(sessionId) {
    await pool.query(
      `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  }

  static async delete(sessionId, userId) {
    const { rows } = await pool.query(
      `DELETE FROM chat_sessions
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [sessionId, userId]
    );
    return rows[0] || null;
  }
}