import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

export const CHART_LABELS = {
    1: 'Kesesuaian Persyaratan',
    2: 'Kemudahan Prosedur',
    3: 'Kecepatan Pelayanan',
    4: 'Kewajaran Tarif',
    5: 'Kesesuaian Hasil',
    6: 'Kompetensi Petugas',
    7: 'Perilaku Petugas',
    8: 'Kualitas Sarpras',
    9: 'Penanganan Pengaduan',
};

const UnsurChart = ({ title, ikmValue, dataCounts }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Kurang', 'Cukup', 'Baik', 'Sangat Baik'],
        datasets: [
          {
            label: 'Jml',
            data: dataCounts,
            backgroundColor: ['#f87171', '#facc15', '#4ade80', '#60a5fa'],
            barPercentage: 0.6,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // ikut tinggi .chart-wrap
        layout: { padding: { left: 6, right: 16, top: 6, bottom: 6 } },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: title,
            font: { size: 14, weight: '500' },
            padding: { top: 10, bottom: 0 },
          },
          subtitle: {
            display: true,
            text: `Nilai IKM: ${ikmValue.toFixed(2)}`,
            color: '#718096',
            font: { size: 12, weight: 'normal' },
            padding: { bottom: 10 },
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (value) => (value > 0 ? value : ''),
            color: '#4a5568',
            font: { weight: '600', size: 12 },
            clamp: true,
            clip: false,
          },
          tooltip: { intersect: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { drawOnChartArea: false },
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false },
          },
        },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [title, ikmValue, dataCounts]);

  return (
    <div className="chart-box">
      <div className="chart-wrap">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default UnsurChart;
