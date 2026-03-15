import pkg from "pg";
import { dbConfig } from "./env.config.js";

const { Pool } = pkg;

const pool = new Pool({
  host:     dbConfig.host,
  port:     dbConfig.port,
  user:     dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.name,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,

  max:                     10,
  min:                     2,
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis: 3_000,
  allowExitOnIdle:         false,
});

pool.on("error", (err) => {
  console.error("[pg pool] unexpected error:", err.message);
});

export async function connectDB() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT current_database() AS db, NOW() AS time"
    );
    console.log(`[pg] connected → db: ${rows[0].db}  at: ${rows[0].time}`);
  } finally {
    client.release();
  }
}

export async function disconnectDB() {
  await pool.end();
  console.log("[pg] pool closed");
}

export default pool;