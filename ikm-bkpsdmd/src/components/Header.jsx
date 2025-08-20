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
        
        const services = (res.services || []).map(s => ({ id: s.id, name: s.name }));

        setSchema({ id: res.id, title: res.title, questions: q, services: services });
      } catch (err) {
        console.error(err);
        alert('Gagal memuat kuesioner dari server.');
      }
    }
  };

  // FUNGSI INI SEKARANG JAUH LEBIH SEDERHANA
  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await submitResponse(payload);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 1200);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Gagal menyimpan jawaban ke server.');
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
        <div className="dropdown">
          <button className="btn-primary">{`${year} Semester ${semester} ▾`}</button>
          <div className="dropdown-content">
            <button onClick={() => handlePeriodeChange('1')}>{`${year} Semester 1`}</button>
            <button onClick={() => handlePeriodeChange('2')}>{`${year} Semester 2`}</button>
          </div>
        </div>
        <Link to="/admin/login" className="btn-primary">Login</Link>
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