// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { getMeService, logoutService } from '../services/authService';
import { tokenStore } from '../services/apiClient';

export const AuthContext = createContext(null);

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  return {
    ...rawUser,
    hasCompletedOnboarding:
      rawUser.hasCompletedOnboarding ??
      rawUser.has_completed_onboarding ??
      false,
    isVerified:
      rawUser.isVerified ??
      rawUser.is_verified ??
      false,
  };
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

  const login = useCallback((tokenOrData, rawUser) => {
    console.log('AuthContext: login called with', { tokenOrData, rawUser });
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
    console.log('AuthContext: Login succesful', newToken, 'user:', newUser);
  }, [setUser]);

  const logout = useCallback(async () => {
    try { await logoutService(); } catch {  }
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
        const freshData  = await getMeService();
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
        error,
        clearError,
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