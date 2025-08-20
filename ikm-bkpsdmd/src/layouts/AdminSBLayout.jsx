import { useEffect, useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AdminSBLayout({ title = "Admin IKM" }) {
  const nav = useNavigate();
  const auth = useAuth();
  const token = auth?.token || "";     // ← token falsy = belum login
  const logout = auth?.logout || (() => {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) nav("/admin/login", { replace: true });
  }, [token, nav]);

  if (!token) return <div style={{ padding: 24 }}>Memeriksa sesi…</div>;

  return (
    <div className={`sb-wrap ${open ? "drawer-open" : ""}`}>
      <aside className={`sb-sidebar ${open ? "is-open" : ""}`}>
        <div className="sb-brand" onClick={() => { setOpen(false); nav("/admin-sb"); }}>
          <span>IKM Admin</span>
        </div>

        <nav className="sb-nav" onClick={() => setOpen(false)}>
          <NavLink to="/admin" end className="sb-link">Dashboard</NavLink>
          <NavLink to="/admin/survey" className="sb-link">Survey</NavLink>
          <NavLink to="/admin/responses" className="sb-link">Data Respon</NavLink>
          <NavLink to="/admin/clone" className="sb-link">Duplikat Survey</NavLink>
        </nav>

        <div className="sb-sidebar-footer">
          <button className="btn-outline btn-block" onClick={() => { setOpen(false); nav("/"); }}>
            ← Kembali
          </button>
          <button className="btn-danger btn-block" onClick={() => { setOpen(false); logout(); }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="sb-main">
        <header className="sb-topbar">
          <button className="sb-burger" onClick={() => setOpen(v => !v)}>☰</button>
          <h1 className="sb-title">{title}</h1>
          <div />
        </header>
        <div className="sb-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
