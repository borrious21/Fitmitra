// src/services/profileService.js

import { apiFetch } from './apiClient';

/** GET /api/profile/me — returns unwrapped profile object */
export const getMyProfile = () =>
  apiFetch('/profile/me', { method: 'GET' });

/** POST /api/profile — create a new profile */
export const createProfile = (profileData) =>
  apiFetch('/profile', {
    method : 'POST',
    body   : JSON.stringify(profileData),
  });

/** PUT /api/profile — update existing profile */
export const updateProfile = (profileData) =>
  apiFetch('/profile', {
    method : 'PUT',
    body   : JSON.stringify(profileData),
  });

/** DELETE /api/profile */
export const deleteProfile = () =>
  apiFetch('/profile', { method: 'DELETE' });

/** GET /api/profile/check — returns { exists: boolean } */
export const checkProfile = () =>
  apiFetch('/profile/check', { method: 'GET' }).then(d => {
    console.log('CHECKPROFILE RESPONSE:', d);
    return d;
  });

/** GET /api/profile/dashboard */
export const getDashboard = () =>
  apiFetch('/profile/dashboard', { method: 'GET' });

/** GET /api/profile/calories */
export const getCalorieRecommendation = () =>
  apiFetch('/profile/calories', { method: 'GET' });

/** GET /api/profile/macros */
export const getMacroSplit = () =>
  apiFetch('/profile/macros', { method: 'GET' });

/** GET /api/profile/macros/meals */
export const getMealWiseMacros = () =>
  apiFetch('/profile/macros/meals', { method: 'GET' });

/** GET /api/profile/macros/meals/suggestions */
export const getMealSuggestions = () =>
  apiFetch('/profile/macros/meals/suggestions', { method: 'GET' });

/** GET /api/profile/workout */
export const getWorkoutPlan = () =>
  apiFetch('/profile/workout', { method: 'GET' });

/** GET /api/profile/admin/profiles */
export const getAllProfiles = (limit = 50, offset = 0) =>
  apiFetch(`/profile/admin/profiles?limit=${limit}&offset=${offset}`, { method: 'GET' });

/** GET /api/profile/admin/analytics */
export const getAdminAnalytics = (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return apiFetch(`/profile/admin/analytics${query ? `?${query}` : ''}`, { method: 'GET' });
};