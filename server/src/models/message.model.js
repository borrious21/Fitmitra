import pool from "../config/db.config.js";

export default class MessageModel {

  static async insert(sessionId, role, content) {
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, role, content]
    );
    return rows[0];
  }

  static async insertPair(sessionId, userContent, assistantContent, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'user', $2), ($1, 'assistant', $3)
       RETURNING *`,
      [sessionId, userContent, assistantContent]
    );
    return rows; 
  }

  static async findBySession(sessionId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT * FROM chat_messages
       WHERE  session_id = $1
       ORDER  BY created_at ASC
       LIMIT  $2 OFFSET $3`,
      [sessionId, limit, offset]
    );
    return rows;
  }

  static async getHistory(sessionId, limit = 20) {
    const { rows } = await pool.query(
      `SELECT role, content FROM (
         SELECT role, content, created_at
         FROM   chat_messages
         WHERE  session_id = $1
         ORDER  BY created_at DESC
         LIMIT  $2
       ) sub
       ORDER BY created_at ASC`,
      [sessionId, limit]
    );
    return rows;
  }
}