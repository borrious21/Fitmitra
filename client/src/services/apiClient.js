// src/services/apiClient.js


const BASE_URL = 'https://fitmitra-fyp.vercel.app/api';

export const tokenStore = {
  getToken:        () => localStorage.getItem('token'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setToken:        (t) => localStorage.setItem('token', t),
  setRefreshToken: (t) => localStorage.setItem('refreshToken', t),
  clearAll:        () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

let refreshPromise = null;

const attemptTokenRefresh = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      tokenStore.clearAll();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new Error('Refresh token expired');
    }

    const json = await res.json();
    const newAccessToken = json?.data?.accessToken ?? json?.accessToken;
    if (!newAccessToken) throw new Error('No access token in refresh response');

    tokenStore.setToken(newAccessToken);
    return newAccessToken;
  })().finally(() => { refreshPromise = null; });

  return refreshPromise;
};

export const apiFetch = async (endpoint, options = {}, _retry = true) => {
  const token = tokenStore.getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, config);

  if (res.status === 401 && _retry) {
    try {
      const newToken = await attemptTokenRefresh();
      return apiFetch(endpoint, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      }, false);
    } catch {
      throw { status: 401, message: 'Session expired. Please log in again.' };
    }
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw { status: res.status, message: res.statusText || 'Network error' };
  }

  if (!res.ok) {
    throw {
      status: res.status,
      message: json?.message || json?.error || `Request failed (${res.status})`,
      data: json,
    };
  }

  return json.data ?? json;
};