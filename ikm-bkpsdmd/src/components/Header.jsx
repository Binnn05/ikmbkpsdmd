import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import logoBabel from '../assets/logo-babel.png';
import Modal from './Modal.jsx';
import SurveyForm from './SurveyForm.jsx';
import { useApi } from '@/utils/api';

const Header = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getActiveSurvey, submitResponse } = useApi();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [schema, setSchema] = useState(null);
  const [serviceMap, setServiceMap] = useState({}); // nama -> id

  const year = searchParams.get('year') || '2025';
  const semester = searchParams.get('semester') || '1';

  const mainTitleLine1 = `Layanan BKPSDMD Provinsi Kepulauan Bangka Belitung`;
  const mainTitleLine2 = `Tahun ${year} Semester ${semester}`;

  const handlePeriodeChange = (s) => {
    setSearchParams({ year, semester: s });
    setSchema(null);
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!schema) {
      try {
        const res = await getActiveSurvey({ year: Number(year), semester: Number(semester) });

        const q = (res.questions || []).map((it) => ({
          id: it.code,
          label: it.label,
          type: it.type,
          min: it.min,
          max: it.max,
          required: !!it.required,
        }));

        // simpan layanan (nama untuk dropdown, map nama->id untuk submit)
        const svNames = [];
        const map = {};
        (res.services || []).forEach((s) => {
          const name = s.name ?? String(s);
          svNames.push(name);
          if (s.id) map[name] = s.id;
        });

        setServiceMap(map);
        setSchema({ id: res.id, title: res.title, questions: q, services: svNames });
      } catch (err) {
        console.error(err);
        alert('Gagal memuat kuesioner dari server.');
      }
    }
  };

  const handleSubmit = async (payload) => {
  setSubmitting(true);
  try {
    // Tentukan service_id dari nama layanan
    const service_id =
      serviceMap[payload.service] ??
      (payload.service_id ? Number(payload.service_id) : null);

    if (!service_id) {
      alert("Silakan pilih jenis layanan yang dinilai terlebih dahulu.");
      setSubmitting(false);
      return;
    }

    // --- PERBAIKAN LOGIKA NORMALISASI ANSWERS ---
    const answersArr = [];
    if (payload.answers && typeof payload.answers === 'object') {
      for (const [code, val] of Object.entries(payload.answers)) {
        const key = String(code).trim();
        if (!key) continue;

        if (key.toLowerCase() === 'saran') {
          const txt = (val ?? '').toString().trim();
          if (txt) {
            answersArr.push({ code: 'saran', text: txt });
          }
        } else if (val !== undefined && val !== null && val !== '') {
          answersArr.push({ code: key, value: Number(val) });
        }
      }
    }

    // Pastikan `answersArr` tidak kosong sebelum mengirim
    if (answersArr.length === 0) {
        // Ini seharusnya tidak terjadi jika validasi di form sudah benar,
        // tapi sebagai pengaman terakhir.
        alert("Harap isi setidaknya satu pertanyaan kuesioner.");
        setSubmitting(false);
        return;
    }

    await submitResponse({
      survey_id: Number(schema?.id),
      service_id,
      // PERBAIKAN PENGAMBILAN DATA DEMOGRAFI
      gender: payload.demographics?.gender || null,
      status: payload.demographics?.status || null,
      usia: payload.demographics?.age || null,
      pendidikan: payload.demographics?.education || null,
      answers: answersArr,
    });

    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
    }, 1200);
  } catch (e) {
    console.error(e);
    alert('Gagal menyimpan jawaban ke server.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <header className="widget-header">
      <img src={logoBabel} alt="Logo" className="header-logo" />

      <div className="header-text">
        <h2>Indeks Kepuasan Masyarakat</h2>
        <p>{mainTitleLine1}</p>
        <p>{mainTitleLine2}</p>
      </div>

      <div className="header-actions">
        {/* Periode */}
        <div className="dropdown">
          <button className="btn-primary">{`${year} Semester ${semester} ▾`}</button>
          <div className="dropdown-content">
            <button onClick={() => handlePeriodeChange('1')}>{`${year} Semester 1`}</button>
            <button onClick={() => handlePeriodeChange('2')}>{`${year} Semester 2`}</button>
          </div>
        </div>

        {/* Login */}
        <Link to="/admin/login" className="btn-primary">Login</Link>

        {/* Isi kuesioner */}
        <button className="btn-primary" onClick={handleOpen}>Isi Kuesioner</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Isi Kuesioner IKM">
        {!schema ? (
          <div style={{ padding: 8 }}>Memuat pertanyaan…</div>
        ) : done ? (
          <div style={{ padding: 8 }}>
            <h3>Terima kasih!</h3>
            <p>Jawaban Anda sudah direkam.</p>
          </div>
        ) : (
          <SurveyForm
            schema={{ id: schema.id, title: schema.title, questions: schema.questions }}
            services={schema.services}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </Modal>
    </header>
  );
};

export default Header;
