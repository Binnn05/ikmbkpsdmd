import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSBLayout from "../layouts/AdminSBLayout";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../../utils/API";
import Modal from "../components/Modal";

function Card({ title, children, id }) {
  return (
    <section id={id} className="sb-card">
      {title && (
        <div className="sb-card-head">
          <h3>{title}</h3>
        </div>
      )}
      <div className="sb-card-body">{children}</div>
    </section>
  );
}

export default function AdminSBPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [active, setActive] = useState(null);
  const [surveys, setSurveys] = useState([]);

  // data ringkasan
  const [summary, setSummary] = useState(null);

  // form survey baru
  const [formSurvey, setFormSurvey] = useState({
    title: "Kuesioner IKM",
    year: new Date().getFullYear(),
    semester: 1,
    is_active: true,
  });

  // periode
  const [period, setPeriod] = useState({ openFrom: "", openUntil: "" });

  // pertanyaan & layanan
  const [questions, setQuestions] = useState([]);
  const [services, setServices] = useState([]);

  // clone
  const [cloneForm, setCloneForm] = useState({
    title: "",
    year: new Date().getFullYear(),
    semester: 1,
  });

  // MODERASI RESPON
const [resp, setResp] = useState({ items:[], page:1, total:0, pageSize:10 });
const [rFilters, setRFilters] = useState({ q:'', service:'' });
const [editing, setEditing] = useState(null); // { id, suggestion }
const [busy, setBusy] = useState(false);

  useEffect(() => {
  if (active?.id) loadResponses(1);
}, [active]);


  useEffect(() => {
    if (!token) {
      nav("/admin/login");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const list = await api.adminGetSurveys();
        setSurveys(list || []);
        const act = await api.getActiveSurvey().catch(() => null);
        setActive(act);
        if (act?.questions) {
          setQuestions(
            [...act.questions].sort(
              (a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0)
            )
          );
        }
        if (act?.services) {
          setServices(act.services.map((s) => s.name));
        }
        if (act?.id) {
          try {
            setSummary(await api.adminGetSummary(act.id));
          } catch {}
        }
      } catch (e) {
        console.error(e);
        setMsg("Gagal memuat data admin.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // actions
  const createSurvey = async () => {
    try {
      const created = await api.adminCreateSurvey(formSurvey);
      setSurveys((s) => [created, ...s]);
      setMsg("Survey dibuat.");
    } catch {
      setMsg("Gagal membuat survey.");
    }
  };

  const updatePeriod = async () => {
    if (!active?.id) return;
    try {
      await api.adminSetPeriod(
        active.id,
        period.openFrom || null,
        period.openUntil || null
      );
      setMsg("Periode diperbarui.");
    } catch {
      setMsg("Gagal memperbarui periode.");
    }
  };

  const toggleActive = async () => {
    if (!active?.id) return;
    try {
      const next = !(active.isActive ?? active.is_active);
      await api.adminSetActive(active.id, next);
      setActive({ ...active, isActive: next, is_active: next });
      setMsg(next ? "Survey diaktifkan." : "Survey dinonaktifkan.");
    } catch {
      setMsg("Gagal ubah status aktif.");
    }
  };

  const addQuestion = (type = "scale") => {
    const nextOrder = (questions.at(-1)?.order_idx ?? questions.length) + 1;
    setQuestions((q) => [
      ...q,
      {
        code: `Q${Date.now()}`,
        label: "Pertanyaan baru",
        type,
        min: type === "scale" ? 1 : null,
        max: type === "scale" ? 4 : null,
        required: true,
        order_idx: nextOrder,
      },
    ]);
  };
  const saveQuestions = async () => {
    if (!active?.id) return;
    try {
      await api.adminUpsertQuestions(active.id, questions);
      setMsg("Pertanyaan disimpan.");
    } catch {
      setMsg("Gagal simpan pertanyaan.");
    }
  };

  const addService = () =>
    setServices((s) => [...s, `Layanan ${s.length + 1}`]);
  const saveServices = async () => {
    if (!active?.id) return;
    try {
      await api.adminUpsertServices(active.id, services);
      setMsg("Layanan disimpan.");
    } catch {
      setMsg("Gagal simpan layanan.");
    }
  };

  const exportCsv = async (type = "raw") => {
    if (!active?.id) return;
    try {
      const blob = await api.adminExportCSV(active.id, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "raw"
          ? `ikm_raw_${active.year}_${active.semester}.csv`
          : `ikm_summary_${active.year}_${active.semester}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Export siap diunduh.");
    } catch {
      setMsg("Gagal ekspor data.");
    }
  };

  const doClone = async () => {
    if (!active?.id) {
      alert("Tidak ada survey sumber.");
      return;
    }
    try {
      const created = await api.adminCloneSurvey(active.id, cloneForm);
      setSurveys((list) => [created, ...list]);
      setMsg("Survey berhasil di-clone.");
    } catch {
      setMsg("Gagal clone survey.");
    }
  };

  const extractSuggestion = (answers=[]) => {
  // ambil jawaban text (Q10/saran)
  const t = answers.find(a => (a.type==='text') || (String(a.code||'').toUpperCase()==='Q10'));
  return t?.value || '';
};

const loadResponses = async (page = 1) => {
  if (!active?.id) return;
  try {
    const data = await api.adminListResponses(active.id, { page, q: rFilters.q, service: rFilters.service });
    setResp(data);
  } catch {
    setMsg('Gagal memuat data respon');
  }
};

  if (!token) return null;
  if (loading)
    return (
      <AdminSBLayout title="Admin IKM">
        <div className="sb-skeleton">Memuat admin…</div>
      </AdminSBLayout>
    );

  return (
    <AdminSBLayout title="Admin Kuesioner IKM">
      {msg && <div className="sb-alert">{msg}</div>}

      {/* DASHBOARD */}
      <Card id="dashboard" title="Dashboard Ringkas">
        <div className="sb-kpis">
          <div className="sb-kpi">
            <div className="sb-kpi-title">Judul</div>
            <div className="sb-kpi-value">{active?.title ?? "—"}</div>
          </div>
          <div className="sb-kpi">
            <div className="sb-kpi-title">Tahun/Semester</div>
            <div className="sb-kpi-value">
              {active?.year ?? "—"} / {active?.semester ?? "—"}
            </div>
          </div>
          <div className="sb-kpi">
            <div className="sb-kpi-title">Status</div>
            <div className="sb-kpi-value">
              {active?.isActive ? "Aktif" : "Nonaktif"}
            </div>
          </div>
          <div className="sb-kpi">
            <div className="sb-kpi-title">Total Respon</div>
            <div className="sb-kpi-value">{summary?.totalResponses ?? "—"}</div>
          </div>
          <div className="sb-kpi">
            <div className="sb-kpi-title">Rata IKM</div>
            <div className="sb-kpi-value">{summary?.avgIKM ?? "—"}</div>
          </div>
        </div>
        <div className="sb-row">
          <button className="btn-primary btn-small" onClick={toggleActive}>
            {active?.isActive ? "Nonaktifkan" : "Aktifkan"} Survey
          </button>
        </div>
      </Card>

      {/* SURVEY */}
      <Card id="survey" title="Survey Aktif & Periode">
        <div className="sb-row">
          <div className="sb-col">
            <label className="form-label">Buka dari</label>
            <input
              className="textarea"
              type="datetime-local"
              value={period.openFrom}
              onChange={(e) =>
                setPeriod((p) => ({ ...p, openFrom: e.target.value }))
              }
            />
          </div>
          <div className="sb-col">
            <label className="form-label">Sampai</label>
            <input
              className="textarea"
              type="datetime-local"
              value={period.openUntil}
              onChange={(e) =>
                setPeriod((p) => ({ ...p, openUntil: e.target.value }))
              }
            />
          </div>
          <div className="sb-col end">
            <button className="btn-primary btn-small" onClick={updatePeriod}>
              Simpan Periode
            </button>
          </div>
        </div>

        <hr className="sb-hr" />

        <div className="sb-row">
          <div className="sb-col">
            <label className="form-label">Judul</label>
            <input
              className="textarea"
              value={formSurvey.title}
              onChange={(e) =>
                setFormSurvey((s) => ({ ...s, title: e.target.value }))
              }
            />
          </div>
          <div className="sb-col sm">
            <label className="form-label">Tahun</label>
            <input
              className="textarea"
              type="number"
              value={formSurvey.year}
              onChange={(e) =>
                setFormSurvey((s) => ({ ...s, year: Number(e.target.value) }))
              }
            />
          </div>
          <div className="sb-col xs">
            <label className="form-label">Semester</label>
            <select
              className="textarea"
              value={formSurvey.semester}
              onChange={(e) =>
                setFormSurvey((s) => ({
                  ...s,
                  semester: Number(e.target.value),
                }))
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <div className="sb-col end">
            <button className="btn-primary btn-small" onClick={createSurvey}>
              Buat Survey Baru
            </button>
          </div>
        </div>
      </Card>

      {/* LAYANAN */}
      <Card id="services" title="Layanan (target 40)">
        <div className="sb-row">
          <button className="btn-primary btn-small" onClick={addService}>
            + Tambah Layanan
          </button>
          <button className="btn-primary btn-small" onClick={saveServices}>
            Simpan
          </button>
        </div>
        <ol className="service-list" style={{ marginTop: 8 }}>
          {services.map((name, idx) => (
            <li key={idx} className="service-item">
              <input
                className="textarea"
                value={name}
                onChange={(e) =>
                  setServices((s) =>
                    s.map((x, i) => (i === idx ? e.target.value : x))
                  )
                }
              />
            </li>
          ))}
        </ol>
      </Card>

      {/* PERTANYAAN */}
      <Card id="questions" title="Pertanyaan">
        <div className="sb-row">
          <button
            className="btn-primary btn-small"
            onClick={() => addQuestion("scale")}
          >
            + Skala (1-4)
          </button>
          <button
            className="btn-primary btn-small"
            onClick={() => addQuestion("text")}
          >
            + Teks (Saran)
          </button>
          <button className="btn-primary btn-small" onClick={saveQuestions}>
            Simpan
          </button>
        </div>

        {questions.map((q, idx) => (
          <div key={q.code} className="q-item">
            <div className="q-grid">
              <input
                className="textarea"
                value={q.code}
                onChange={(e) =>
                  setQuestions((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, code: e.target.value } : x
                    )
                  )
                }
              />
              <input
                className="textarea"
                value={q.label}
                onChange={(e) =>
                  setQuestions((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, label: e.target.value } : x
                    )
                  )
                }
              />
              <select
                className="textarea"
                value={q.type}
                onChange={(e) => {
                  const t = e.target.value;
                  setQuestions((arr) =>
                    arr.map((x, i) =>
                      i === idx
                        ? {
                            ...x,
                            type: t,
                            min: t === "scale" ? 1 : null,
                            max: t === "scale" ? 4 : null,
                          }
                        : x
                    )
                  );
                }}
              >
                <option value="scale">scale</option>
                <option value="text">text</option>
                <option value="choice">choice</option>
              </select>
              <input
                className="textarea"
                type="number"
                value={q.order_idx ?? idx + 1}
                onChange={(e) =>
                  setQuestions((arr) =>
                    arr.map((x, i) =>
                      i === idx
                        ? { ...x, order_idx: Number(e.target.value) || idx + 1 }
                        : x
                    )
                  )
                }
              />
            </div>

            {q.type === "scale" && (
              <div className="sb-row" style={{ marginTop: 6 }}>
                <div className="sb-col xs">
                  <label className="form-label">Min</label>
                  <input
                    className="textarea"
                    type="number"
                    value={q.min ?? 1}
                    onChange={(e) =>
                      setQuestions((arr) =>
                        arr.map((x, i) =>
                          i === idx ? { ...x, min: Number(e.target.value) } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="sb-col xs">
                  <label className="form-label">Max</label>
                  <input
                    className="textarea"
                    type="number"
                    value={q.max ?? 4}
                    onChange={(e) =>
                      setQuestions((arr) =>
                        arr.map((x, i) =>
                          i === idx ? { ...x, max: Number(e.target.value) } : x
                        )
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* DATA & EKSPOR */}
      <Card id="export" title="Data & Ekspor">
        {!active?.id ? (
          <div>Tidak ada survey aktif.</div>
        ) : (
          <div className="sb-row">
            <button
              className="btn-primary btn-small"
              onClick={() => exportCsv("raw")}
            >
              Export CSV (Raw)
            </button>
            <button
              className="btn-primary btn-small"
              onClick={() => exportCsv("summary")}
            >
              Export CSV (Rekap)
            </button>
          </div>
        )}
      </Card>

      {/* CLONE SURVEY */}
      <Card id="clone" title="Clone Survey (Semester Berikutnya)">
        <div className="sb-row">
          <div className="sb-col">
            <label className="form-label">Judul Baru</label>
            <input
              className="textarea"
              value={cloneForm.title}
              onChange={(e) =>
                setCloneForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="sb-col sm">
            <label className="form-label">Tahun</label>
            <input
              className="textarea"
              type="number"
              value={cloneForm.year}
              onChange={(e) =>
                setCloneForm((f) => ({ ...f, year: Number(e.target.value) }))
              }
            />
          </div>
          <div className="sb-col xs">
            <label className="form-label">Semester</label>
            <select
              className="textarea"
              value={cloneForm.semester}
              onChange={(e) =>
                setCloneForm((f) => ({
                  ...f,
                  semester: Number(e.target.value),
                }))
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <div className="sb-col end">
            <button className="btn-primary btn-small" onClick={doClone}>
              Clone dari Survey Aktif
            </button>
          </div>
        </div>
      </Card>
      
      <Card id="responses" title="Data Respon (Moderasi)">
  {/* Filter bar */}
  <div className="sb-row">
    <div className="sb-col">
      <label className="form-label">Cari (komentar / layanan)</label>
      <input className="textarea"
        placeholder="ketik kata kunci…"
        value={rFilters.q}
        onChange={e=>setRFilters(f=>({...f, q:e.target.value}))}/>
    </div>
    <div className="sb-col">
      <label className="form-label">Filter Layanan</label>
      <select className="textarea"
        value={rFilters.service}
        onChange={e=>setRFilters(f=>({...f, service:e.target.value}))}>
        <option value="">(Semua layanan)</option>
        {services.map((s,i)=>(<option key={i} value={s}>{s}</option>))}
      </select>
    </div>
    <div className="sb-col end">
      <button className="btn-primary btn-small" onClick={()=>loadResponses(1)}>Terapkan Filter</button>
    </div>
  </div>

  {/* Tabel */}
  <div style={{ overflowX:'auto', marginTop:12 }}>
    <table className="sb-table">
      <thead>
        <tr>
          <th style={{minWidth:110}}>Tanggal</th>
          <th style={{minWidth:180}}>Layanan</th>
          <th>Komentar / Saran</th>
          <th style={{width:120}}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {resp.items.length===0 ? (
          <tr><td colSpan={4} style={{textAlign:'center', color:'#6b7280', padding:'16px'}}>Belum ada data / tidak ditemukan.</td></tr>
        ) : resp.items.map(row=>(
          <tr key={row.id}>
            <td>{new Date(row.created_at).toLocaleString()}</td>
            <td>{row.service_name}</td>
            <td style={{maxWidth:480, whiteSpace:'pre-wrap'}}>{extractSuggestion(row.answers)}</td>
            <td>
              <div className="sb-row">
                <button className="btn-outline" onClick={()=>{
                  setEditing({ id: row.id, suggestion: extractSuggestion(row.answers) });
                }}>Edit</button>
                <button className="btn-danger" onClick={async ()=>{
                  if (!confirm('Hapus respon ini?')) return;
                  try {
                    await api.adminDeleteResponse(row.id);
                    setResp(d=>({ ...d, items: d.items.filter(x=>x.id!==row.id), total: d.total-1 }));
                    setMsg('Respon dihapus.');
                  } catch { setMsg('Gagal menghapus.'); }
                }}>Hapus</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  <div className="sb-row" style={{ justifyContent:'space-between', marginTop:10 }}>
    <div>
      Halaman {resp.page} • Total {resp.total}
    </div>
    <div className="sb-row">
      <button className="btn-outline" disabled={resp.page<=1}
        onClick={()=>loadResponses(resp.page-1)}>Sebelumnya</button>
      <button className="btn-outline"
        disabled={(resp.page*resp.pageSize)>=resp.total}
        onClick={()=>loadResponses(resp.page+1)}>Berikutnya</button>
    </div>
  </div>

  {/* Modal edit */}
  <Modal open={!!editing} onClose={()=>setEditing(null)} title="Edit Komentar/Saran">
    <div className="form-group">
      <label className="form-label">Komentar</label>
      <textarea className="textarea" rows={6}
        value={editing?.suggestion || ''}
        onChange={e=>setEditing(ed=>({...ed, suggestion:e.target.value}))}/>
    </div>
    <div className="form-actions">
      <button className="btn-primary btn-small" disabled={busy} onClick={async ()=>{
        if (!editing) return;
        try {
          setBusy(true);
          await api.adminUpdateResponse(editing.id, { suggestion: editing.suggestion });
          // Optimistic update di tabel
          setResp(d=>({
            ...d,
            items: d.items.map(x=>{
              if (x.id!==editing.id) return x;
              // Update jawaban text lokal
              const arr = Array.isArray(x.answers) ? [...x.answers] : [];
              const idx = arr.findIndex(a => (a.type==='text') || (String(a.code||'').toUpperCase()==='Q10'));
              if (idx>=0) arr[idx] = { ...arr[idx], value: editing.suggestion };
              else arr.push({ code:'Q10', type:'text', value: editing.suggestion });
              return { ...x, answers: arr };
            })
          }));
          setEditing(null);
          setMsg('Komentar diperbarui.');
        } catch {
          setMsg('Gagal memperbarui komentar.');
        } finally { setBusy(false); }
      }}>Simpan</button>
      <button className="btn-outline btn-small" onClick={()=>setEditing(null)}>Batal</button>
    </div>
  </Modal>
</Card>


    </AdminSBLayout>
  );
}
