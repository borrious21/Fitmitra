// src/config/cors.config.js

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export default corsOptions;
