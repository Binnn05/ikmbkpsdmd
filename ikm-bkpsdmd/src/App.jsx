// src/App.jsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import FrontPage from "./pages/FrontPage"; 

import AdminSBLayout from "./layouts/AdminSBLayout";
import AdminSBDashboard from "./pages/admin-sb/AdminSBDashboard";
import AdminSBSurvey from "./pages/admin-sb/AdminSBSurvey";
import AdminSBResponses from "./pages/admin-sb/AdminSBResponses";
import AdminSBClone from "./pages/admin-sb/AdminSBClone";
import AdminLoginPage from "./pages/AdminLoginPage";

export default function App() {
  return (
    <Routes>
      {/* FRONT PAGE */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<FrontPage />} />
      </Route>

      {/* LOGIN ADMIN */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* ADMIN */}
      <Route path="/admin/*" element={<AdminSBLayout title="Admin IKM" />}>
        <Route index element={<AdminSBDashboard />} />
        <Route path="survey" element={<AdminSBSurvey />} />
        <Route path="responses" element={<AdminSBResponses />} />
        <Route path="clone" element={<AdminSBClone />} />
      </Route>
    </Routes>
  );
}
