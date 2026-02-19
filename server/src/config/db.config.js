// src/config/db.config.js
import pkg from "pg";
import { dbConfig } from "./env.config.js";

const { Pool } = pkg;

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.name,
  ssl: dbConfig.ssl,
});

export default pool;
