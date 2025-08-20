import { useMemo, useState } from "react";

export default function SurveyForm({ schema, services = [], onSubmit, submitting }) {
  // ===== helpers
  const extractNumber = (s) => {
    const m = String(s.name).trim().match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 9999;
  };

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => extractNumber(a) - extractNumber(b)),
    [services]
  );

  const genderOpts = ["Laki-laki", "Perempuan"];
  const statusOpts = ["ASN", "Non ASN"];
  const usiaOpts = ["24-29", "30–34", "35–39", "40–44", "45-49", "50–54", "≥55"];
  const pendidikanOpts = ["SMA sederajat", "D-III", "D-IV / S-1", "S-2", "S-3"];

  // ===== state
  const initial = useMemo(() => {
    const x = {
      layanan: sortedServices[0]?.id || "", // Langsung pilih layanan pertama
      jenis_kelamin: "",
      status_kepegawaian: "",
      usia: "",
      pendidikan_terakhir: "",
      saran: "",
    };
    schema.questions.forEach((q) => {
      x[q.id] = "";
    });
    return x;
  }, [schema, sortedServices]);

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const setValue = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  // ===== validasi & pemrosesan data
  const validateAndSubmit = (ev) => {
    ev.preventDefault();

    // 1. Validasi
    const e = {};
    if (!values.layanan) e.layanan = "Pilih layanan yang digunakan.";
    if (!values.jenis_kelamin) e.jenis_kelamin = "Pilih jenis kelamin.";
    if (!values.status_kepegawaian) e.status_kepegawaian = "Pilih status.";
    if (!values.usia) e.usia = "Pilih rentang usia.";
    if (!values.pendidikan_terakhir) e.pendidikan_terakhir = "Pilih pendidikan terakhir.";

    for (const q of schema.questions) {
      const v = values[q.id];
      if (q.type === "scale" && (v === "" || v === null)) {
        e[q.id] = "Wajib diisi.";
      }
    }
    
    setErrors(e);

    if (Object.keys(e).length > 0) {
        console.log("Validasi gagal, form tidak dikirim:", e);
        return; 
    }

    // 2. Pemrosesan & Normalisasi Data
    const answersArr = [];
    for (const q of schema.questions) {
        const val = values[q.id];
        if (q.type === 'scale' && val) {
            answersArr.push({ code: q.id, value: Number(val) });
        } else if (q.type === 'text' && val) {
            answersArr.push({ code: q.id, text: val });
        }
    }

    if (answersArr.length === 0) {
        alert("Harap isi setidaknya satu pertanyaan kuesioner.");
        return;
    }

    // 3. Membuat Payload Final
    const payload = {
      survey_id: schema.id,
      service_id: Number(values.layanan),
      answers: answersArr,
      gender: values.jenis_kelamin,
      status: values.status_kepegawaian,
      usia: values.usia,
      pendidikan: values.pendidikan_terakhir,
    };
    
    // 4. Kirim ke parent (Header.jsx)
    onSubmit(payload);
  };

  return (
    <form onSubmit={validateAndSubmit} className="kuesioner-form">
      <h3 style={{ marginTop: 0 }}>{schema.title}</h3>

      {/* Dropdown Layanan */}
      <div className="form-group">
        <label>
          Layanan yang digunakan <span className="required">*</span>
        </label>
        <select
          className="form-control"
          value={values.layanan}
          onChange={(e) => setValue("layanan", e.target.value)}
        >
          <option value="">— Pilih layanan —</option>
          {sortedServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.layanan && <div className="error-text">{errors.layanan}</div>}
      </div>

      {/* Dropdown Demografi */}
      <div className="form-group">
        <label>Jenis kelamin <span className="required">*</span></label>
        <select
          className="form-control"
          value={values.jenis_kelamin}
          onChange={(e) => setValue("jenis_kelamin", e.target.value)}
        >
          <option value="">— Pilih jenis kelamin —</option>
          {genderOpts.map((g) => (<option key={g} value={g}>{g}</option>))}
        </select>
        {errors.jenis_kelamin && <div className="error-text">{errors.jenis_kelamin}</div>}
      </div>
      
      {/* ... sisa dropdown demografi (status, usia, pendidikan) ... */}
       <div className="form-group">
        <label>Status (ASN/Non ASN) <span className="required">*</span></label>
        <select
          className="form-control"
          value={values.status_kepegawaian}
          onChange={(e) => setValue("status_kepegawaian", e.target.value)}
        >
          <option value="">— Pilih status —</option>
          {statusOpts.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        {errors.status_kepegawaian && <div className="error-text">{errors.status_kepegawaian}</div>}
      </div>

       <div className="form-group">
        <label>Usia <span className="required">*</span></label>
        <select
          className="form-control"
          value={values.usia}
          onChange={(e) => setValue("usia", e.target.value)}
        >
          <option value="">— Pilih usia —</option>
          {usiaOpts.map((u) => (<option key={u} value={u}>{u}</option>))}
        </select>
        {errors.usia && <div className="error-text">{errors.usia}</div>}
      </div>

       <div className="form-group">
        <label>Pendidikan terakhir <span className="required">*</span></label>
        <select
          className="form-control"
          value={values.pendidikan_terakhir}
          onChange={(e) => setValue("pendidikan_terakhir", e.target.value)}
        >
          <option value="">— Pilih pendidikan —</option>
          {pendidikanOpts.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
        {errors.pendidikan_terakhir && <div className="error-text">{errors.pendidikan_terakhir}</div>}
      </div>

      {/* Pertanyaan Kuesioner */}
      <p style={{ marginTop: 16, marginBottom: 8, color: "#4a5568" }}>
        1 – 4, <em>Kurang – Cukup – Baik – Sangat Baik</em>
      </p>
      {schema.questions.map((q) => (
        <div className="form-group" key={q.id}>
          <label>
            <span dangerouslySetInnerHTML={{ __html: q.label }} />
            {q.required && <span className="required"> *</span>}
          </label>
          {q.type === "scale" && (
            <div className="scale-row">
              {[1, 2, 3, 4].map((n) => (
                <label key={n} className="scale-item">
                  <input
                    type="radio"
                    name={q.id}
                    value={n}
                    checked={String(values[q.id]) === String(n)}
                    onChange={(e) => setValue(q.id, e.target.value)}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === "text" && (
            <textarea
              className="form-control"
              rows={3}
              placeholder={"Tulis jawaban Anda…"}
              value={values[q.id] || ''}
              onChange={(e) => setValue(q.id, e.target.value)}
            />
          )}
          {errors[q.id] && <div className="error-text">{errors[q.id]}</div>}
        </div>
      ))}

      {/* Tombol Submit */}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim"}
        </button>
      </div>
    </form>
  );
}