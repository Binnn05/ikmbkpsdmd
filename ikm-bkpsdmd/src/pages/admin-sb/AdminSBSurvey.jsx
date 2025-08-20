import { useEffect, useState } from "react";
import { useApi } from "@/utils/API";

export default function AdminSBSurvey(){
  const api = useApi();
  const [msg, setMsg] = useState("");

  // survey aktif + periode
  const [active, setActive] = useState(null);
  const [period, setPeriod] = useState({ openFrom:"", openUntil:"" });

  // form buat survey baru
  const [form, setForm] = useState({
    title:"Kuesioner IKM",
    year:new Date().getFullYear(),
    semester:1
  });

  // LAYANAN
  const [services, setServices] = useState([]);

  // PERTANYAAN
  const [questions, setQuestions] = useState([]);

  useEffect(()=>{
    (async ()=>{
      try{
        const act = await api.getActiveSurvey().catch(()=>null);
        setActive(act);
        if (act?.services) setServices(act.services.map(s=>s.name));
        if (act?.questions) {
          setQuestions([...act.questions].sort((a,b)=>(a.order_idx??0)-(b.order_idx??0)));
        }
      }catch{ setMsg("Gagal memuat survey."); }
    })();
  },[]);

  // actions: periode & status
  const savePeriod = async ()=>{
    if (!active?.id) return;
    try {
      await api.adminSetPeriod(active.id, period.openFrom||null, period.openUntil||null);
      setMsg("Periode diperbarui.");
    } catch { setMsg("Gagal memperbarui periode."); }
  };

  const toggleActive = async ()=>{
    if(!active?.id) return;
    const next = !(active.isActive ?? active.is_active);
    try{
      await api.adminSetActive(active.id, next);
      setActive(a=>({...a, isActive: next, is_active: next}));
    }catch{ setMsg("Gagal ubah status."); }
  };

  const createSurvey = async ()=>{
    try{
      const created = await api.adminCreateSurvey({ ...form, is_active:true });
      setMsg("Survey dibuat.");
      setActive(created); // opsional: fetch ulang active
    }catch{ setMsg("Gagal membuat survey."); }
  };

  // actions: layanan
  const addService = ()=> setServices(s=>[...s, `Layanan ${s.length+1}`]);
  const saveServices = async ()=>{
    if(!active?.id) return;
    try{ await api.adminUpsertServices(active.id, services); setMsg("Layanan disimpan."); }
    catch{ setMsg("Gagal simpan layanan."); }
  };

  // actions: pertanyaan
  const addQuestion = (type="scale")=>{
    const nextOrder = (questions.at(-1)?.order_idx ?? questions.length) + 1;
    setQuestions(q=>[
      ...q,
      { code:`Q${Date.now()}`, label:"Pertanyaan baru", type, min:type==='scale'?1:null, max:type==='scale'?4:null, required:true, order_idx:nextOrder }
    ]);
  };
  const saveQuestions = async ()=>{
    if(!active?.id) return;
    try{ await api.adminUpsertQuestions(active.id, questions); setMsg("Pertanyaan disimpan."); }
    catch{ setMsg("Gagal simpan pertanyaan."); }
  };

  return (
    <>
      {msg && <div className="sb-alert">{msg}</div>}

      {/* A. Survey aktif & periode */}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Survey Aktif & Periode</h3></div>
        <div className="sb-card-body">
          <div className="sb-row">
            <div className="sb-col"><b>Judul:</b> {active?.title ?? "—"}</div>
            <div className="sb-col sm"><b>Tahun/Semester:</b> {active?.year ?? "—"} / {active?.semester ?? "—"}</div>
            <div className="sb-col sm"><b>Status:</b> {active?.isActive ? "Aktif" : "Nonaktif"}</div>
          </div>

          <div className="sb-row" style={{ marginTop:10 }}>
            <div className="sb-col">
              <label className="form-label">Buka dari</label>
              <input className="textarea" type="datetime-local" value={period.openFrom}
                onChange={e=>setPeriod(p=>({...p, openFrom:e.target.value}))}/>
            </div>
            <div className="sb-col">
              <label className="form-label">Sampai</label>
              <input className="textarea" type="datetime-local" value={period.openUntil}
                onChange={e=>setPeriod(p=>({...p, openUntil:e.target.value}))}/>
            </div>
            <div className="sb-col end">
              <button className="btn-primary btn-small" onClick={savePeriod}>Simpan Periode</button>
            </div>
          </div>

          <div className="sb-row" style={{ marginTop:10 }}>
            <button className="btn-primary btn-small" onClick={toggleActive}>
              {active?.isActive ? "Nonaktifkan" : "Aktifkan"} Survey
            </button>
          </div>
        </div>
      </section>

      {/* B. Buat survey baru */}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Buat Survey Baru</h3></div>
        <div className="sb-card-body">
          <div className="sb-row">
            <div className="sb-col">
              <label className="form-label">Judul</label>
              <input className="textarea" value={form.title}
                onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
            </div>
            <div className="sb-col sm">
              <label className="form-label">Tahun</label>
              <input className="textarea" type="number" value={form.year}
                onChange={e=>setForm(f=>({...f, year:Number(e.target.value)}))}/>
            </div>
            <div className="sb-col xs">
              <label className="form-label">Semester</label>
              <select className="textarea" value={form.semester}
                onChange={e=>setForm(f=>({...f, semester:Number(e.target.value)}))}>
                <option value={1}>1</option><option value={2}>2</option>
              </select>
            </div>
            <div className="sb-col end">
              <button className="btn-primary btn-small" onClick={createSurvey}>Buat Survey</button>
            </div>
          </div>
        </div>
      </section>

      {/* C. Layanan */}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Layanan</h3></div>
        <div className="sb-card-body">
          <div className="sb-row" style={{ marginBottom:8 }}>
            <button className="btn-primary btn-small" onClick={addService}>+ Tambah Layanan</button>
            <button className="btn-primary btn-small" onClick={saveServices}>Simpan</button>
          </div>
          <ol className="service-list">
            {services.map((name, idx)=>(
              <li key={idx} className="service-item">
                <input className="textarea" value={name}
                  onChange={e=>setServices(s=>s.map((x,i)=> i===idx ? e.target.value : x))}/>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* D. Pertanyaan */}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Pertanyaan</h3></div>
        <div className="sb-card-body">
          <div className="sb-row" style={{ marginBottom: 8 }}>
            <button className="btn-primary btn-small" onClick={() => addQuestion("scale")}>+ Skala (1–4)</button>
            <button className="btn-primary btn-small" onClick={() => addQuestion("text")}>+ Teks (Saran)</button>
            <button className="btn-primary btn-small" onClick={saveQuestions}>Simpan</button>
          </div>

          {questions.map((q, idx)=>(
            <div key={q.code} className="q-item">
              <div className="q-grid">
                <input className="textarea" value={q.code}
                  onChange={e=>setQuestions(arr=>arr.map((x,i)=> i===idx? {...x, code:e.target.value } : x))}/>
                <input className="textarea" value={q.label}
                  onChange={e=>setQuestions(arr=>arr.map((x,i)=> i===idx? {...x, label:e.target.value } : x))}/>
                <select className="textarea" value={q.type}
                  onChange={e=>{
                    const t=e.target.value;
                    setQuestions(arr=>arr.map((x,i)=> i===idx ? {...x, type:t, min:t==='scale'?1:null, max:t==='scale'?4:null } : x));
                  }}>
                  <option value="scale">scale</option>
                  <option value="text">text</option>
                  <option value="choice">choice</option>
                </select>
                <input className="textarea" type="number" value={q.order_idx ?? idx+1}
                  onChange={e=>setQuestions(arr=>arr.map((x,i)=> i===idx ? {...x, order_idx:Number(e.target.value)||idx+1 } : x))}/>
              </div>

              {q.type==='scale' && (
                <div className="sb-row" style={{ marginTop:6 }}>
                  <div className="sb-col xs">
                    <label className="form-label">Min</label>
                    <input className="textarea" type="number" value={q.min ?? 1}
                      onChange={e=>setQuestions(arr=>arr.map((x,i)=> i===idx ? {...x, min:Number(e.target.value)} : x))}/>
                  </div>
                  <div className="sb-col xs">
                    <label className="form-label">Max</label>
                    <input className="textarea" type="number" value={q.max ?? 4}
                      onChange={e=>setQuestions(arr=>arr.map((x,i)=> i===idx ? {...x, max:Number(e.target.value)} : x))}/>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
