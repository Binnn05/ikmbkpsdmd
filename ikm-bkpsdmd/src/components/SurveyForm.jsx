import { useMemo, useState } from "react";

/**
 * Form Kuesioner IKM
 * - Tambahan dropdown: jenis_kelamin, status, usia, pendidikan
 * - Daftar layanan diurutkan berdasar angka prefix "1. ... 40."
 * - Payload kirim: { surveyId, serviceName, answers:{U1..U9,saran}, demographics:{gender,status,age,education} }
 */
export default function SurveyForm({ schema, services = [], onSubmit, submitting }) {
  // ===== helpers
  const extractNumber = (s) => {
    const m = String(s).trim().match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 9999;
  };

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => extractNumber(a) - extractNumber(b)),
    [services]
  );

  // opsi dropdown (bisa disesuaikan)
  const genderOpts = ["Laki-laki", "Perempuan"];
  const statusOpts = ["ASN", "Non ASN"];
  const usiaOpts = ["24-29", "30–34", "35–39", "40–44", "45-49", "50–54", "≥55"];
  const pendidikanOpts = ["SMA sederajat", "D-III", "D-IV / S-1", "S-2", "S-3"];

  // ===== state
  const initial = useMemo(() => {
    const x = {
      layanan: "",
      jenis_kelamin: "",
      status_kepegawaian: "",
      usia: "",
      pendidikan_terakhir: "",
      saran: "",
    };
    schema.questions.forEach((q) => {
      // pastikan U1..U9 ada
      x[q.id] = "";
    });
    return x;
  }, [schema]);

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const setValue = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  // ===== validasi minimal
  const validate = () => {
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
      if (q.type === "text" && q.required && !String(v || "").trim()) {
        e[q.id] = "Wajib diisi.";
      }
      if (q.type === "text" && q.maxLength && (v?.length || 0) > q.maxLength) {
        e[q.id] = `Maks ${q.maxLength} karakter.`;
      }
      if (q.type === "scale" && v !== "") {
        const n = Number(v);
        if (Number.isNaN(n) || (q.min && n < q.min) || (q.max && n > q.max)) {
          e[q.id] = `Nilai ${q.min ?? 1}–${q.max ?? 4}.`;
        }
      }
    }
    setErrors(e);
    return e;
  };

  // ===== submit
  const handleSubmit = (ev) => {
    ev.preventDefault();
    const validationErrors = validate();
if (Object.keys(validationErrors).length > 0) {
    console.log("Validasi gagal, errors:", validationErrors); // Ini akan menampilkan error dengan benar
    return; // Hentikan submit jika ada error
  }

    // pisahkan jawaban skala + saran
    const answers = {};
    schema.questions.forEach((q) => (answers[q.id] = values[q.id]));

    const payload = {
      surveyId: schema.id,
      service: values.layanan,
      answers,
      demographics: {
        gender: values.jenis_kelamin,
        status: values.status_kepegawaian,
        age: values.usia,
        education: values.pendidikan_terakhir,
      },
      // untuk kompatibilitas lama, tetap kirim saran jika ada di schema
      saran: values.saran ?? "",
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="kuesioner-form">
      <h3 style={{ marginTop: 0 }}>{schema.title}</h3>

      {/* ===== Blok layanan (diurutkan 1..40) */}
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
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.layanan && <div className="error-text">{errors.layanan}</div>}
      </div>

      {/* ===== Demografi responden */}
      <div className="form-group">
        <label>
          Jenis kelamin <span className="required">*</span>
        </label>
        <select
          className="form-control"
          value={values.jenis_kelamin}
          onChange={(e) => setValue("jenis_kelamin", e.target.value)}
        >
          <option value="">— Pilih jenis kelamin —</option>
          {genderOpts.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {errors.jenis_kelamin && <div className="error-text">{errors.jenis_kelamin}</div>}
      </div>

      <div className="form-group">
        <label>
          Status (ASN/Non ASN) <span className="required">*</span>
        </label>
        <select
          className="form-control"
          value={values.status_kepegawaian}
          onChange={(e) => setValue("status_kepegawaian", e.target.value)}
        >
          <option value="">— Pilih status —</option>
          {statusOpts.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.status_kepegawaian && <div className="error-text">{errors.status_kepegawaian}</div>}
      </div>

      <div className="form-group">
        <label>
          Usia <span className="required">*</span>
        </label>
        <select
          className="form-control"
          value={values.usia}
          onChange={(e) => setValue("usia", e.target.value)}
        >
          <option value="">— Pilih usia —</option>
          {usiaOpts.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {errors.usia && <div className="error-text">{errors.usia}</div>}
      </div>

      <div className="form-group">
        <label>
          Pendidikan terakhir <span className="required">*</span>
        </label>
        <select
          className="form-control"
          value={values.pendidikan_terakhir}
          onChange={(e) => setValue("pendidikan_terakhir", e.target.value)}
        >
          <option value="">— Pilih pendidikan —</option>
          {pendidikanOpts.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.pendidikan_terakhir && <div className="error-text">{errors.pendidikan_terakhir}</div>}
      </div>

      {/* ===== Petunjuk skala */}
      <p style={{ marginTop: 16, marginBottom: 8, color: "#4a5568" }}>
        1 – 4, <em>Kurang – Cukup – Baik – Sangat Baik</em>
      </p>

      {/* ===== Pertanyaan U1..U9 & Saran (mengikuti schema) */}
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
              placeholder={q.placeholder || "Tulis jawaban Anda…"}
              value={values[q.id]}
              onChange={(e) => setValue(q.id, e.target.value)}
              maxLength={q.maxLength || 2000}
            />
          )}

          {errors[q.id] && <div className="error-text">{errors[q.id]}</div>}
        </div>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim"}
        </button>
      </div>
    </form>
  );
}
