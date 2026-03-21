import dotenv from "dotenv";
dotenv.config();

export const port = process.env.PORT || 5000;

export const dbConfig = {
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "12345",
  name:     process.env.DB_NAME     || "fitmitra",
  ssl:      process.env.DB_SSL === "true",
};
