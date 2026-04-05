import { useState, useCallback } from "react";
import type { User } from "@/types";
import { authApi } from "@/api";

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
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

  const signup = useCallback(async (
    name: string, nickname: string, email: string, password: string
  ) => {
    setLoading(true); setError(null);
    try {
      const res = await authApi.signup({ name, nickname, email, password });
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

  const logout = useCallback(() => {
    localStorage.removeItem("soma_token");
    setUser(null);
  }, []);

  return { user, loading, error, login, signup, logout };
}
