import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const LOCAL_STORAGE_KEYS = {
  user: 'wg_auth_user',
  isLoggedIn: 'wg_auth_logged_in'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.user);
      const storedLoggedIn = localStorage.getItem(LOCAL_STORAGE_KEYS.isLoggedIn);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoggedIn(storedLoggedIn === 'true');
    } catch (_) {}
  }, []);

  const signup = (payload) => {
    // payload: { name, email, password }
    const newUser = { name: payload.name, email: payload.email };
    localStorage.setItem(LOCAL_STORAGE_KEYS.user, JSON.stringify(newUser));
    localStorage.setItem(LOCAL_STORAGE_KEYS.isLoggedIn, 'true');
    setUser(newUser);
    setIsLoggedIn(true);
  };

  const login = ({ email, password }) => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.user);
    if (!storedUser) {
      throw new Error('No account found. Please sign up.');
    }
    const parsed = JSON.parse(storedUser);
    if (!parsed.email || parsed.email !== email) {
      throw new Error('Invalid credentials');
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.isLoggedIn, 'true');
    setUser(parsed);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.isLoggedIn, 'false');
    setIsLoggedIn(false);
  };

  const updateUser = (partial) => {
    const next = { ...(user || {}), ...partial };
    localStorage.setItem(LOCAL_STORAGE_KEYS.user, JSON.stringify(next));
    setUser(next);
  };

  const value = useMemo(() => ({ user, isLoggedIn, signup, login, logout, updateUser }), [user, isLoggedIn]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


