// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import AuthError from "../errors/auth.error.js";
import { jwtSecret } from "../config/jwt.config.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError("Authorization denied. No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret);

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      throw new AuthError("User not found.", 401);
    }

    if (!user.is_active) {
      throw new AuthError("Account is deactivated.", 403);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      has_completed_onboarding: user.has_completed_onboarding,
      is_verified: user.is_verified,
      is_active: user.is_active,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AuthError("Session expired. Please login again.", 401));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new AuthError("Invalid token.", 401));
    }

    next(error);
  }
};

export const requireVerified = (req, res, next) => {
  if (!req.user?.is_verified) {
    return next(
      new AuthError("Please verify your email to access this resource.", 403)
    );
  }
  next();
};

export default authenticate;
