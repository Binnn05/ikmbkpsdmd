// src/pages/admin/AdminLoginPage.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState({ type: "", text: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res?.ok) {
        setMsg({ type: "success", text: "Login berhasil. Mengalihkan…" });
        setTimeout(() => navigate("/admin"), 600); 
      } else {
        setMsg({ type: "error", text: "Pastikan username atau password sudah benar" });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Pastikan username atau password sudah benar" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="login-card">
        <h1 className="login-title">Login Admin</h1>

        {msg.text ? (
          <div
            className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`}
            role="alert"
            aria-live="polite"
          >
            {msg.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          <div className="form-row">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Masuk…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
