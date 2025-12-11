import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getBetaUser, recordSuccessfulLogin } from "./betaAccess";

const STORAGE_KEY = "instaspec:user";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const logoutTimerRef = useRef(null);

  const toUserState = useCallback((record) => {
    if (!record?.email) return null;
    const normalizedEmail = record.email.trim().toLowerCase();
    if (!normalizedEmail) return null;
    const plan = record.plan || (record.isAdmin ? "beta_admin" : "beta_tester");
    return {
      email: normalizedEmail,
      plan,
      isAdmin: typeof record.isAdmin === "boolean" ? record.isAdmin : plan === "beta_admin",
      expiresAt: typeof record.expiresAt === "number" ? record.expiresAt : null
    };
  }, []);

  const clearUserState = useCallback(
    (reason, payload = {}) => {
      if (import.meta.env.DEV) {
        console.warn("[Auth] Clearing cached user", reason, payload);
      }
      setUser(null);
      return null;
    },
    []
  );

  const refreshFromServer = useCallback(
    async (email) => {
      const normalized = (email || "").trim().toLowerCase();
      if (!normalized) return null;
      try {
        const latest = await getBetaUser(normalized);
        const devAllowBetaOverride =
          import.meta.env.DEV && normalized === "admin@techarix.com";
        if (!latest || (latest.expiresAt && latest.expiresAt <= Date.now())) {
          if (devAllowBetaOverride) {
            console.warn("[Auth] Using dev override for expired/missing beta record", {
              normalized,
              latest
            });
            return user;
          }
          return clearUserState("expired-or-missing-latest", { latest });
        }
        const mapped = toUserState({ ...latest, email: normalized });
        if (!mapped) {
          return clearUserState("mapped-user-invalid", { latest });
        }
        setUser((prev) => {
          if (
            prev &&
            prev.email === mapped.email &&
            prev.plan === mapped.plan &&
            prev.isAdmin === mapped.isAdmin &&
            prev.expiresAt === mapped.expiresAt
          ) {
            return prev;
          }
          return mapped;
        });
        return mapped;
      } catch (err) {
        console.warn("Failed to verify beta session", err);
        return null;
      }
    },
    [clearUserState, toUserState, user]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (!user || !user.expiresAt) return;

    const msLeft = user.expiresAt - Date.now();
    if (msLeft <= 0) {
      return clearUserState("expired-timer", { msLeft });
    }
    logoutTimerRef.current = setTimeout(() => {
      clearUserState("timer-signout");
    }, msLeft);

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [user, clearUserState]);

  useEffect(() => {
    if (!user?.email) return undefined;
    refreshFromServer(user.email);
  }, [user?.email, refreshFromServer]);

  const login = useCallback(
    (userRecord) => {
      const mapped = toUserState(userRecord);
      if (!mapped) return;
      setUser(mapped);
      recordSuccessfulLogin(mapped.email, mapped.isAdmin);
    },
    [toUserState]
  );

  const logout = useCallback(() => {
    clearUserState("manual-logout");
  }, [clearUserState]);

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
