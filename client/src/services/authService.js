// src/services/authService.js

import { apiFetch } from './apiClient';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.data   = data;
  }
}

/** POST /api/auth/signup */
export const signupService = (name, email, password) =>
  apiFetch('/auth/signup', {
    method : 'POST',
    body   : JSON.stringify({ name, email, password }),
  });

/**
 * POST /api/auth/login
 * Returns: { token, refreshToken, user }  ← unwrapped by apiClient
 */
export const loginService = (email, password) =>
  apiFetch('/auth/login', {
    method : 'POST',
    body   : JSON.stringify({ email, password }),
  });

/** POST /api/auth/verify-email */
export const verifyEmailService = (email, otp) =>
  apiFetch('/auth/verify-email', {
    method : 'POST',
    body   : JSON.stringify({ email, otp }),
  });

/** POST /api/auth/resend-verification */
export const resendVerificationService = (email) =>
  apiFetch('/auth/resend-verification', {
    method : 'POST',
    body   : JSON.stringify({ email }),
  });

/** POST /api/auth/refresh */
export const refreshTokenService = (refreshToken) =>
  apiFetch('/auth/refresh', {
    method : 'POST',
    body   : JSON.stringify({ refreshToken }),
  });

/** GET /api/auth/me  (token attached automatically by apiClient) */
export const getMeService = () =>
  apiFetch('/auth/me', { method: 'GET' });

/** POST /api/auth/forgot-password */
export const forgotPasswordService = (email) =>
  apiFetch('/auth/forgot-password', {
    method : 'POST',
    body   : JSON.stringify({ email }),
  });

/** POST /api/auth/verify-reset-otp */
export const verifyResetOtpService = (email, otp) =>
  apiFetch('/auth/verify-reset-otp', {
    method : 'POST',
    body   : JSON.stringify({ email, otp }),
  });

/** POST /api/auth/reset-password */
export const resetPasswordService = (email, otp, newPassword) =>
  apiFetch('/auth/reset-password', {
    method : 'POST',
    body   : JSON.stringify({ email, otp, newPassword }),
  });

/** POST /api/auth/change-password  (token attached automatically) */
export const changePasswordService = (currentPassword, newPassword) =>
  apiFetch('/auth/change-password', {
    method : 'POST',
    body   : JSON.stringify({ currentPassword, newPassword }),
  });

/** POST /api/auth/complete-onboarding  (token attached automatically) */
export const completeOnboardingService = (onboardingData) =>
  apiFetch('/auth/complete-onboarding', {
    method : 'POST',
    body   : JSON.stringify(onboardingData),
  });

/** POST /api/auth/logout  (token attached automatically) */
export const logoutService = () =>
  apiFetch('/auth/logout', { method: 'POST' });