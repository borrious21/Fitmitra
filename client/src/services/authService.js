// src/services/authService.js
import { apiFetch } from './apiClient';

export const signupService = async (name, email, password) => {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
};

export const loginService = async (email, password) => {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getMeService = async () => {
  return apiFetch('/auth/me');
};

export const logoutService = async () => {
  return apiFetch('/auth/logout', { method: 'POST' });
};

export const verifyEmailService = async (email, otp) => {
  return apiFetch('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
};

export const resendVerificationService = async (email) => {
  return apiFetch('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const forgotPasswordService = async (email) => {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const verifyResetOtpService = async (email, otp) => {
  return apiFetch('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
};

export const resetPasswordService = async (email, otp, newPassword) => {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
};

export const changePasswordService = async (currentPassword, newPassword) => {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};