import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";
import type { AdminUser } from "../types";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (reason?: "idle" | "manual") => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Admins are auto-logged-out after this much inactivity (no mouse/keyboard/
// scroll/touch activity) -- separate from, and shorter than, the backend's
// absolute 12-hour session cap. 20 minutes is a reasonable default for a
// CMS handling applicants' personal data (resumes, contact info).
const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());

  const loadMe = async () => {
    const token = localStorage.getItem("dsh_access");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data);
    } catch {
      localStorage.removeItem("dsh_access");
      localStorage.removeItem("dsh_refresh");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("dsh_access", data.access);
    localStorage.setItem("dsh_refresh", data.refresh);
    sessionStorage.removeItem("dsh_logout_reason");
    await loadMe();
  };

  const logout = (reason: "idle" | "manual" = "manual") => {
    localStorage.removeItem("dsh_access");
    localStorage.removeItem("dsh_refresh");
    if (reason === "idle") sessionStorage.setItem("dsh_logout_reason", "idle");
    setUser(null);
  };

  // Idle-timeout: track user activity while logged in, and auto-logout after
  // IDLE_TIMEOUT_MS of no interaction.
  useEffect(() => {
    if (!user) return;

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        logout("idle");
      }
    }, 30_000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
