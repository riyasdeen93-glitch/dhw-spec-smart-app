import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isAdminEmail, recordSuccessfulLogin } from "./betaAccess";

const STORAGE_KEY = "instaspec:user";
// How long a beta login should last (in hours)
const BETA_SESSION_HOURS = 1;

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const createUser = useCallback((email, plan) => {
    if (plan === "beta_tester") {
      const expiresAt = Date.now() + BETA_SESSION_HOURS * 60 * 60 * 1000;
      return { email, plan, expiresAt };
    }
    return { email, plan, expiresAt: null };
  }, []);
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      // If there's an expiry and it's in the past, treat as logged out
      if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });


  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
  if (!user || !user.expiresAt) return;

  const msLeft = user.expiresAt - Date.now();
  if (msLeft <= 0) {
    setUser(null);
    return;
  }

  const timeoutId = setTimeout(() => {
    setUser(null);
  }, msLeft);

  return () => clearTimeout(timeoutId);
}, [user]);

  const login = useCallback((email, plan) => {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const nextUser = createUser(normalizedEmail, plan);
    setUser(nextUser);
    recordSuccessfulLogin(normalizedEmail, isAdminEmail(normalizedEmail));
  }, [createUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
