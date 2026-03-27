// src/db/pool.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false, 
  },
  max: 20,                   
  idleTimeoutMillis: 30000,   
  connectionTimeoutMillis: 2000, 
});

pool.connect()
  .then(client => {
    console.log("Database connected successfully");
    client.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });

export default pool;