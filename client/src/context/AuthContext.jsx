// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { getMeService, logoutService, signupService } from '../services/authService';
import { tokenStore } from '../services/apiClient';

export const AuthContext = createContext(null);

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  const normalized = {
    ...rawUser,
    hasCompletedOnboarding:
      rawUser.hasCompletedOnboarding ??
      rawUser.has_completed_onboarding ??
      rawUser.onboarding_complete ??
      rawUser.isOnboarded ??
      rawUser.is_onboarded ??
      rawUser.profile_complete ??
      rawUser.profileComplete ??
      false,
    isVerified:
      rawUser.isVerified ??
      rawUser.is_verified ??
      rawUser.email_verified ??
      rawUser.emailVerified ??
      false,
  };

  // DEBUG: remove this once the issue is resolved
  console.log('[normalizeUser] raw input:', rawUser);
  console.log('[normalizeUser] hasCompletedOnboarding resolved to:', normalized.hasCompletedOnboarding);

  return normalized;
};

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const persistUser = (u) => {
  if (u) localStorage.setItem('user', JSON.stringify(u));
  else   localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
  const [user, setUserRaw]    = useState(loadStoredUser);
  const [token, setToken]     = useState(() => tokenStore.getToken());
  const [isInitializing, setIsInitializing] = useState(
    () => !!tokenStore.getToken()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState(null);

  const isAuthenticated = !!token && !!user;

  const setUser = useCallback((rawUser) => {
    const normalized = normalizeUser(rawUser);
    setUserRaw(normalized);
    persistUser(normalized);
  }, []);

  const updateUserProfile = useCallback((partialUpdate) => {
    setUserRaw(prev => {
      const merged = normalizeUser({ ...prev, ...partialUpdate });
      persistUser(merged);
      return merged;
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signup = useCallback(async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signupService(name, email, password);
      return result;
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((tokenOrData, rawUser) => {
    let newToken, newUser, newRefresh;

    if (typeof tokenOrData === 'string') {
      newToken   = tokenOrData;
      newUser    = rawUser;
      newRefresh = null;
    } else {
      newToken   = tokenOrData?.token;
      newUser    = tokenOrData?.user;
      newRefresh = tokenOrData?.refreshToken ?? null;
    }

    if (newToken)   tokenStore.setToken(newToken);
    if (newRefresh) tokenStore.setRefreshToken(newRefresh);

    setIsInitializing(false);
    setToken(newToken);
    setUser(newUser);
  }, [setUser]);

  const logout = useCallback(async () => {
    try { await logoutService(); } catch { /* ignore */ }
    tokenStore.clearAll();
    setToken(null);
    setUserRaw(null);
    persistUser(null);
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => {
      tokenStore.clearAll();
      setToken(null);
      setUserRaw(null);
      persistUser(null);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  useEffect(() => {
    const storedToken = tokenStore.getToken();

    if (!storedToken) {
      setIsInitializing(false);
      return;
    }

    (async () => {
      try {
        const freshData = await getMeService();

        // DEBUG: remove once resolved
        console.log('[AuthContext] /me raw response:', freshData);

        const normalized = normalizeUser(freshData);
        setUserRaw(normalized);
        persistUser(normalized);

        const currentToken = tokenStore.getToken();
        if (currentToken !== storedToken) setToken(currentToken);

      } catch (err) {
        if (err?.status === 401) {
          tokenStore.clearAll();
          setToken(null);
          setUserRaw(null);
          persistUser(null);
        }
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isInitializing,
        isLoading,
        error,
        clearError,
        signup,
        login,
        logout,
        setUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};