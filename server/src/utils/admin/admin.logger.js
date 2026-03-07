// admin/utils/adminLogger.js
import pool from "../../db/pool.js";

const logAdminAction = async (adminId, action, payload = {}) => {
  try {
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, payload, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [adminId, action, JSON.stringify(payload)]
    );
  } 
  catch (err) 
  {
    console.error("[adminLogger] Failed to write admin log:", err.message);
  }
};

export default logAdminAction;