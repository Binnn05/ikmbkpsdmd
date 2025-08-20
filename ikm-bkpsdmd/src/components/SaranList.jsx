import { useMemo } from 'react';

const SaranList = ({ data, saranKey }) => {
    
  const saranList = useMemo(() => {
    if (!data || !saranKey) return [];
    return data
      .map(row => (row[saranKey] || '').trim())
      .filter(saran => saran && saran.toLowerCase() !== 'tidak ada' && saran.toLowerCase() !== '-');
  }, [data, saranKey]);

  if (saranList.length === 0) {
    return null;
  }

  return (
    <div className="saran-container">
      <hr />
      <h3 className="section-title">Saran & Masukan Responden</h3>
      <div className="saran-scroll-box">
        {saranList.map((saran, index) => (
          <div key={index} className="saran-box">
            {saran}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaranList;