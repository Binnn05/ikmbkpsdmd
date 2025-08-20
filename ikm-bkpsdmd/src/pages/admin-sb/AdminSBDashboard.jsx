import { useEffect, useState } from "react";
import { useApi } from "@/utils/API";

export default function AdminSBDashboard(){
  const api = useApi();
  const [active, setActive] = useState(null);
  const [summary, setSummary] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(()=>{
    (async ()=>{
      try{
        const act = await api.getActiveSurvey().catch(()=>null);
        setActive(act);
        if (act?.id) setSummary(await api.adminGetSummary(act.id));
      }catch{ setMsg("Gagal memuat dashboard."); }
    })();
  },[]);

  return (
    <>
      {msg && <div className="sb-alert">{msg}</div>}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Dashboard Ringkas</h3></div>
        <div className="sb-card-body">
          <div className="sb-kpis">
            <div className="sb-kpi"><div className="sb-kpi-title">Judul</div><div className="sb-kpi-value">{active?.title ?? "—"}</div></div>
            <div className="sb-kpi"><div className="sb-kpi-title">Tahun/Semester</div><div className="sb-kpi-value">{active?.year ?? "—"} / {active?.semester ?? "—"}</div></div>
            <div className="sb-kpi"><div className="sb-kpi-title">Status</div><div className="sb-kpi-value">{active?.isActive ? "Aktif" : "Nonaktif"}</div></div>
            <div className="sb-kpi"><div className="sb-kpi-title">Total Respon</div><div className="sb-kpi-value">{summary?.totalResponses ?? "—"}</div></div>
            <div className="sb-kpi"><div className="sb-kpi-title">Rata IKM</div><div className="sb-kpi-value">{summary?.avgIKM ?? "—"}</div></div>
          </div>
        </div>
      </section>
    </>
  );
}
