import { useEffect, useState } from "react";
import { useApi } from "@/utils/API";
import Modal from "../../components/Modal";

export default function AdminSBResponses(){
  const api = useApi();
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState(null);
  const [services, setServices] = useState([]);

  // list + filter
  const [resp, setResp] = useState({ items:[], page:1, total:0, pageSize:10 });
  const [rFilters, setRFilters] = useState({ q:'', service:'' });

  // edit modal
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(()=>{
    (async ()=>{
      const act = await api.getActiveSurvey().catch(()=>null);
      setActive(act);
      if (act?.services) setServices(act.services.map(s=>s.name));
      if (act?.id) await load(1);
    })();
  },[]);

  const extractSuggestion = (answers=[])=>{
    const t = answers.find(a => (a.type==='text') || (String(a.code||'').toUpperCase()==='Q10'));
    return t?.value || '';
  };

  const load = async (page=1)=>{
    if(!active?.id) return;
    try{
      const data = await api.adminListResponses(active.id, { page, q:rFilters.q, service:rFilters.service });
      setResp(data);
    }catch{ setMsg("Gagal memuat data respon."); }
  };

  const doExport = async (type) => {
    if(!active?.id) return;
    try{
      const blob = await api.adminExportCSV(active.id, type); // type: 'raw' | 'summary'
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type==='raw'
        ? `ikm_raw_${active.year}_${active.semester}.csv`
        : `ikm_summary_${active.year}_${active.semester}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setMsg("Export siap diunduh.");
    }catch{ setMsg("Gagal ekspor data."); }
  };

  return (
    <>
      {msg && <div className="sb-alert">{msg}</div>}

      {/* Moderasi */}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Data Respon (Moderasi)</h3></div>
        <div className="sb-card-body">
          <div className="sb-row">
            <div className="sb-col">
              <label className="form-label">Cari</label>
              <input className="textarea" placeholder="kata kunci…" value={rFilters.q}
                onChange={e=>setRFilters(f=>({...f, q:e.target.value}))}/>
            </div>
            <div className="sb-col">
              <label className="form-label">Layanan</label>
              <select className="textarea" value={rFilters.service}
                onChange={e=>setRFilters(f=>({...f, service:e.target.value}))}>
                <option value="">(Semua)</option>
                {services.map((s,i)=>(<option key={i} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="sb-col end">
              <button className="btn-primary btn-small" onClick={()=>load(1)}>Terapkan Filter</button>
            </div>
          </div>

          <div style={{ overflowX:'auto', marginTop:12 }}>
            <table className="sb-table">
              <thead>
                <tr>
                  <th style={{minWidth:110}}>Tanggal</th>
                  <th style={{minWidth:180}}>Layanan</th>
                  <th>Komentar / Saran</th>
                  <th style={{width:140}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {resp.items.length===0 ? (
                  <tr><td colSpan={4} style={{textAlign:'center', color:'#6b7280', padding:'16px'}}>Belum ada data / tidak ditemukan.</td></tr>
                ) : resp.items.map(row=>(
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>{row.service_name}</td>
                    <td style={{maxWidth:520, whiteSpace:'pre-wrap'}}>{extractSuggestion(row.answers)}</td>
                    <td>
                      <div className="sb-row">
                        <button className="btn-outline" onClick={()=>setEditing({ id:row.id, suggestion: extractSuggestion(row.answers) })}>Edit</button>
                        <button className="btn-danger" onClick={async ()=>{
                          if(!confirm('Hapus respon ini?')) return;
                          try{ await api.adminDeleteResponse(row.id);
                            setResp(d=>({...d, items:d.items.filter(x=>x.id!==row.id), total:d.total-1 }));
                          }catch{ setMsg("Gagal menghapus."); }
                        }}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sb-row" style={{ justifyContent:'space-between', marginTop:10 }}>
            <div>Halaman {resp.page} • Total {resp.total}</div>
            <div className="sb-row">
              <button className="btn-outline" disabled={resp.page<=1} onClick={()=>load(resp.page-1)}>Sebelumnya</button>
              <button className="btn-outline" disabled={(resp.page*resp.pageSize)>=resp.total} onClick={()=>load(resp.page+1)}>Berikutnya</button>
            </div>
          </div>

          {/* Modal edit */}
          <Modal open={!!editing} onClose={()=>setEditing(null)} title="Edit Komentar/Saran">
            <div className="form-group">
              <label className="form-label">Komentar</label>
              <textarea className="textarea" rows={6}
                value={editing?.suggestion || ''} onChange={e=>setEditing(ed=>({...ed, suggestion:e.target.value}))}/>
            </div>
            <div className="form-actions">
              <button className="btn-primary btn-small" disabled={busy} onClick={async ()=>{
                if(!editing) return;
                try{
                  setBusy(true);
                  await api.adminUpdateResponse(editing.id, { suggestion: editing.suggestion });
                  setResp(d=>({
                    ...d,
                    items: d.items.map(x=>{
                      if(x.id!==editing.id) return x;
                      const arr = Array.isArray(x.answers)? [...x.answers] : [];
                      const idx = arr.findIndex(a => (a.type==='text') || (String(a.code||'').toUpperCase()==='Q10'));
                      if(idx>=0) arr[idx] = { ...arr[idx], value: editing.suggestion };
                      else arr.push({ code:'Q10', type:'text', value: editing.suggestion });
                      return { ...x, answers: arr };
                    })
                  }));
                  setEditing(null);
                }catch{ setMsg("Gagal memperbarui."); } finally{ setBusy(false); }
              }}>Simpan</button>
              <button className="btn-outline btn-small" onClick={()=>setEditing(null)}>Batal</button>
            </div>
          </Modal>
        </div>
      </section>

      {/* Ekspor – selalu di paling bawah */}
      <section className="sb-card">
        <div className="sb-card-head"><h3>Ekspor Data</h3></div>
        <div className="sb-card-body">
          {!active?.id ? (
            <div>Tidak ada survey aktif.</div>
          ) : (
            <div className="sb-row">
              <button className="btn-primary btn-small" onClick={()=>doExport('raw')}>Export CSV (Raw)</button>
              <button className="btn-primary btn-small" onClick={()=>doExport('summary')}>Export CSV (Rekap)</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
