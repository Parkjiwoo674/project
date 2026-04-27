import { useState, useCallback, useEffect } from "react";
import type { User } from "@/types";
import { authApi } from "@/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("soma_token");
    if (!token) return;
    authApi
      .me()
      .then((res) => {
        if (res.data) setUser(res.data);
      })
      .catch(() => localStorage.removeItem("soma_token"));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      localStorage.setItem("soma_token", res.token);
      if (res.user) setUser(res.user);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ adminCode 파라미터 추가
  const signup = useCallback(
    async (
      name: string,
      nickname: string,
      email: string,
      password: string,
      role: "user" | "instructor" | "admin" = "user",
      adminCode?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.signup({
          name,
          nickname,
          email,
          password,
          role,
          adminCode,
        });
        localStorage.setItem("soma_token", res.token);
        if (res.user) setUser(res.user);
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("soma_token");
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  return { user, loading, error, login, signup, logout, updateUser };
}
