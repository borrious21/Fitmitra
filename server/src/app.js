// src/app.js
import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import corsOptions from "./config/cors.config.js";
import errorMiddleware from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.route.js";
import workoutRoutes from "./routes/workout.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only auth routes
app.use("/api/auth", authRoutes);

// Protected profile routes
app.use("/api/profile", profileRoutes);

// Protected workout routes
app.use("/api/workouts", workoutRoutes);

// Protected dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// 404 for any other route
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handler
app.use(errorMiddleware);

export default app;
