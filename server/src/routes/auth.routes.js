// src/routes/auth.routes.js
import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import authenticate, { requireVerified } from "../middlewares/auth.middleware.js";

const router = Router();

// URL: /api/auth/signup
// Registers a new user and sends a 6-digit OTP to their email
router.post("/signup", AuthController.signup);

// URL: /api/auth/login
// Authenticates a user and returns access + refresh tokens
router.post("/login", AuthController.login);

// URL: /api/auth/refresh
// Refreshes the access token using a valid refresh token
router.post("/refresh", AuthController.refresh);

// URL: /api/auth/verify-email
// Verifies a user's email using OTP
router.post("/verify-email", AuthController.verifyEmail);

// URL: /api/auth/resend-verification
// Resends the email verification OTP if the user is unverified
router.post("/resend-verification", AuthController.resendVerification);

// URL: /api/auth/forgot-password
// Sends a password reset OTP to the user's email
router.post("/forgot-password", AuthController.forgotPassword);

// URL: /api/auth/verify-reset-otp
// Verifies the password reset OTP before allowing password change
router.post("/verify-reset-otp", AuthController.verifyResetOtp);

// URL: /api/auth/reset-password
// Resets user's password after verifying OTP
router.post("/reset-password", AuthController.resetPassword);

// URL: /api/auth/me
// Retrieves the profile of the authenticated user
router.get("/me", authenticate, AuthController.getMe);

// URL: /api/auth/logout
// Logs out the user by clearing their refresh token
router.post("/logout", authenticate, AuthController.logout);

// URL: /api/auth/change-password
// Changes password of the authenticated and verified user
router.post("/change-password", authenticate, requireVerified, AuthController.changePassword);

// URL: /api/auth/complete-onboarding
// Marks onboarding as complete for the authenticated and verified user
router.post("/complete-onboarding", authenticate, requireVerified, AuthController.completeOnboarding);

export default router;
