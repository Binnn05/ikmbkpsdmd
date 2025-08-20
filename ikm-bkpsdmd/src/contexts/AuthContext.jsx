import { createContext, useContext, useMemo, useState, useEffect } from "react";

const TOKEN_KEY = "adminToken";
const API_BASE = import.meta.env.VITE_API_URL || "";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  async function login(username, password) {
    if (!API_BASE) { // dev mock
      if (username && password) { setToken("mock-token"); return { ok: true }; }
      return { ok: false, error: "Username/password kosong" };
    }
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return { ok: false, error: "Login gagal" };
    const data = await res.json();
    setToken(data.accessToken || data.token || "");
    return { ok: true };
  }

  function logout() { setToken(""); }

  function authFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(path, { ...options, headers });
  }

  const value = useMemo(() => ({ token, login, logout, authFetch, API: API_BASE }), [token]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
