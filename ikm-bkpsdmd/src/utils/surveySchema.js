// src/utils/surveySchema.js
export const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRVtaug-Qlvq_4Ji1iQphvIULlP8q6LGI1ghaBaD8AzG-N80zN_OijlSNrFoaZqomaSFC1_hMzVgTmX/pub?gid=396319872&single=true&output=csv";

const FALLBACK_LABELS = {
  U1: "1. Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya",
  U2: "2. Bagaimana pemahaman Saudara tentang kemudahan prosedur pelayanan di unit ini.",
  U3: "3. Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan.",
  U4: "4. Bagaimana pendapat Saudara tentang kewajaran biaya/tarif dalam pelayanan ?",
  U5: "5. Bagaimana pendapat Saudara tentang kesesuaian produk pelayanan antara yang tercantum dalam standar pelayanan dengan hasil yang diberikan.",
  U6: "6. Bagaimana pendapat Saudara tentang kompetensi/ kemampuan petugas dalam pelayanan ?",
  U7: "7. Bagamana pendapat saudara perilaku petugas dalam  pelayanan terkait kesopanan dan keramahan ?",
  U8: "8. Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana ?",
  U9: "9. Bagaimana pendapat Saudara tentang penanganan pengaduan pengguna layanan",
};

function parseCSV(text) {
  const rows = [];
  let i = 0, cur = "", row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cur += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(cur); cur = ""; i++; continue; }
    if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ""; i++; continue; }
    if (c === '\r') { i++; continue; }
    cur += c; i++;
  }
  row.push(cur); rows.push(row);
  return rows;
}

const norm = (s) => (s ?? "").toString().trim();

export async function loadSurveySchema() {
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal fetch CSV: ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text).filter(r => r.length && r.some(c => norm(c) !== ""));
  if (!rows.length) throw new Error("CSV kosong.");

  const headers = rows[0].map(norm);
  const data = rows.slice(1);

  // 1) Kolom layanan — fokus pada "Jenis Layanan ... yang ... gunakan" (bukan "Apakah ...")
  let layananIdx = headers.findIndex(h =>
    /(jenis|nama)\s*layanan/i.test(h) &&
    !/^apakah/i.test(h)
  );
  if (layananIdx === -1) {
    layananIdx = headers.findIndex(h => /layanan/i.test(h) && !/^apakah/i.test(h));
  }
  if (layananIdx === -1) throw new Error("Kolom Layanan tidak ditemukan.");

  // 3) Petakan kolom bernomor "1. ...", ..., "10. ..."
  const numbered = headers
    .map((h, idx) => {
      const m = /^(\d+)\s*\./.exec(h);
      return m ? { idx, num: Number(m[1]), header: h } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.num - b.num);

  const qCols = numbered.filter(n => n.num >= 1 && n.num <= 9);
  const saranCol = numbered.find(n => n.num === 10);

  if (qCols.length < 9) {
    throw new Error(`Ditemukan hanya ${qCols.length} kolom pertanyaan bernomor 1..9. Cek header CSV.`);
  }

  // 4) Layanan unik
  const servicesSet = new Set();
  for (const row of data) {
    const v = norm(row[layananIdx]);
    if (v) servicesSet.add(v);
  }
  const services = Array.from(servicesSet);

  // 5) Susun pertanyaan
  const questions = [];

  // 9 pertanyaan skala 1–4
  qCols.forEach((q, i) => {
    const id = `U${i + 1}`;
    const label = FALLBACK_LABELS[id] || headers[q.idx] || id;
    questions.push({
      id,
      type: "scale",
      label,
      min: 1,
      max: 4,
      required: true,
    });
  });

  // Saran/Masukan
  questions.push({
    id: "saran",
    type: "text",
    label: saranCol ? headers[saranCol.idx] : "10. Saran / Masukan :",
    maxLength: 500,
    required: false,
  });

  return {
    id: "ikm-2025",
    title: "Kuesioner IKM",
    services,
    questions,
  };
}

let _cache = null;
export async function loadSurveySchemaCached() {
  if (_cache) return _cache;
  _cache = await loadSurveySchema();
  return _cache;
}
