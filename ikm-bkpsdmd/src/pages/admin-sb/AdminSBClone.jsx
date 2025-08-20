import { useEffect, useState } from "react";
import { useApi } from "@/utils/API";

export default function AdminSBClone(){
  const api = useApi();
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ title:"", year:new Date().getFullYear(), semester:1 });
  const [msg, setMsg] = useState("");

  useEffect(()=>{ (async ()=>{ setActive(await api.getActiveSurvey().catch(()=>null)); })(); },[]);

  const doClone = async ()=>{
    if(!active?.id) return alert("Tidak ada survey sumber");
    try{
      await api.adminCloneSurvey(active.id, form);
      setMsg("Survey berhasil di-clone.");
    }catch{ setMsg("Gagal clone survey."); }
  };

  return (
    <section className="sb-card">
      {msg && <div className="sb-alert">{msg}</div>}
      <div className="sb-card-head"><h3>Clone Survey (Semester Berikutnya)</h3></div>
      <div className="sb-card-body">
        <div className="sb-row">
          <div className="sb-col">
            <label className="form-label">Judul Baru</label>
            <input className="textarea" value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
          </div>
          <div className="sb-col sm">
            <label className="form-label">Tahun</label>
            <input className="textarea" type="number" value={form.year} onChange={e=>setForm(f=>({...f, year:Number(e.target.value)}))}/>
          </div>
          <div className="sb-col xs">
            <label className="form-label">Semester</label>
            <select className="textarea" value={form.semester} onChange={e=>setForm(f=>({...f, semester:Number(e.target.value)}))}>
              <option value={1}>1</option><option value={2}>2</option>
            </select>
          </div>
          <div className="sb-col end">
            <button className="btn-primary btn-small" onClick={doClone}>Clone dari Survey Aktif</button>
          </div>
        </div>
      </div>
    </section>
  );
}
