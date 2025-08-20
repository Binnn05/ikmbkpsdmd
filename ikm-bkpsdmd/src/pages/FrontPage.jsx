// src/pages/FrontPage.jsx

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "@/utils/api";
import SummaryBox from "../components/SummaryBox";
import UnsurSummaryTable from "../components/UnsurSummaryTable";
import UnsurChart from "../components/UnsurChart";
import SaranList from "../components/SaranList";
import { CHART_LABELS } from "../components/UnsurChart";

export default function FrontPage() {
  const { getActiveSurvey, getAnalytics } = useApi();
  const [params, setSearchParams] = useSearchParams();

  const year = Number(params.get("year") || "2025");
  const semester = Number(params.get("semester") || "1");
  const serviceId = params.get("serviceId") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [survey, setSurvey] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let off = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const s = await getActiveSurvey({ year, semester });
        const a = await getAnalytics({ surveyId: s?.id, year, semester, serviceId });
        if (off) return;
        setSurvey(s);
        setAnalytics(a);
      } catch (e) {
        if (!off) setError("Gagal memuat data.");
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => { off = true; };
  }, [year, semester, serviceId]);

  const unsurRows = useMemo(() => {
    if (!analytics?.unsur) return [];
    return Object.keys(CHART_LABELS).map(k => ({
      key: k,
      nama: CHART_LABELS[k],
      nilai: analytics.unsur[k]?.ikm ?? 0,
      counts: analytics.unsur[k]?.counts ?? [0,0,0,0],
    }));
  }, [analytics]);

  const handleServiceChange = (event) => {
    const newServiceId = event.target.value;
    setSearchParams({ year, semester, serviceId: newServiceId }, { replace: true });
  };

  if (loading) return <div className="widget-body" style={{ padding: 24 }}>Memuat…</div>;
  if (error) return <div className="widget-body" style={{ padding: 24, color: "#b91c1c" }}>{error}</div>;
  if (!analytics || (analytics.totalResponses ?? 0) === 0)
    return <div className="widget-body" style={{ padding: 24 }}>Belum ada data untuk periode ini.</div>;

  const demo = analytics.demografi || { status:{}, gender:{}, pendidikan:{} };

  return (
    <div className="widget-body">
      <div className="summary-container">
        <SummaryBox title="TOTAL RESPONDEN" value={analytics.totalResponses} />
        <SummaryBox title="INDEKS KEPUASAN" value={analytics.ikm.toFixed(2)} subValue={analytics.mutu} />
        <SummaryBox title="STATUS KEPEGAWAIAN" data={demo.status} type="table" />
        <SummaryBox title="JENIS KELAMIN" data={demo.gender} type="table" />
        <SummaryBox title="PENDIDIKAN" data={demo.pendidikan} type="table" />
      </div>

      <div style={{ margin: '2.5rem 0', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontWeight: 600, fontSize: '1.2rem' }}>
          Grafik Per Unsur Pelayanan
        </h4>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-light)' }}>
          Pilih jenis layanan untuk melihat detail Indeks Kepuasan Masyarakat (IKM) per unsur.
        </p>
        <select
          value={serviceId}
          onChange={handleServiceChange}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            minWidth: '400px',
            maxWidth: '100%',
            fontWeight: 500,
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          <option value="">-- Tampilkan Grafik Gabungan Semua Layanan --</option>
          {(analytics?.services || []).map(service => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      {/* --- BLOK BARU: Tampilkan statistik ini HANYA JIKA layanan dipilih --- */}
      {serviceId && analytics && (
        <div style={{
          textAlign: 'center',
          marginTop: '-1.5rem', // Sesuaikan spasi agar pas di bawah dropdown
          marginBottom: '2rem',
          fontSize: '1.1rem',
          color: 'var(--text-color)',
        }}>
          IKM Layanan: <strong>{analytics.ikm.toFixed(2)}</strong> | 
          Mutu: <strong>{analytics.mutu}</strong> | 
          ({analytics.totalResponses} Responden)
        </div>
      )}
      {/* --- AKHIR BLOK BARU --- */}

      <UnsurSummaryTable unsurData={unsurRows.map(r => ({ nama: r.nama, nilai: r.nilai }))} />

      <div className="chart-grid">
        {unsurRows.map(r => (
          <UnsurChart key={r.key} title={r.nama} dataCounts={r.counts} ikmValue={r.nilai} />
        ))}
      </div>

      <div className="saran-container">
        <SaranList data={(analytics.saran || []).map(s => ({ saran: s }))} saranKey="saran" />
      </div>
    </div>
  );
}