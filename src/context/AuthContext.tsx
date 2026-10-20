"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "participant" | "judge" | "visitor";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
  phone?: string;
  interests?: string[];
  judgeCode?: string;
  projectId?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginJudge: (code: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateInterests: (interests: string[]) => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  isAdmin: boolean;
  isParticipant: boolean;
  isJudge: boolean;
  isVisitor: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "eventos_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    setLoading(false);
  }, []);

  function saveUser(u: AuthUser | null) {
    setUser(u);
    if (u) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Login failed" };
      }
      saveUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async function loginJudge(judgeCode: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgeCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Invalid judge code" };
      }
      saveUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async function quickLogin(email: string, password: string) {
    const result = await login(email, password);
    if (result.success) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === "admin") router.push("/console");
        else if (u.role === "participant") router.push("/participant");
        else if (u.role === "judge") router.push("/judge");
        else if (u.role === "visitor") router.push("/visitor");
      }
      return true;
    }
    return false;
  }

  async function register(data: any) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || "Registration failed" };
      }
      saveUser(resData.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error occurred" };
    }
  }

  function logout() {
    saveUser(null);
    router.push("/login");
  }

  async function updateInterests(interests: string[]) {
    if (!user) return;
    const updated = { ...user, interests };
    saveUser(updated);
    try {
      await fetch("/api/visitor/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, userId: user.id, interests }),
      });
    } catch {}
  }

  function updateUser(updates: Partial<AuthUser>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    saveUser(updated);
  }

  const isAdmin = user?.role === "admin";
  const isParticipant = user?.role === "participant";
  const isJudge = user?.role === "judge";
  const isVisitor = user?.role === "visitor";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginJudge,
        quickLogin,
        register,
        logout,
        updateInterests,
        updateUser,
        isAdmin,
        isParticipant,
        isJudge,
        isVisitor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
