const SummaryBox = ({ title, value, subValue, data, type = 'value' }) => {
  // Cek apakah ada data yang valid untuk ditampilkan dalam mode tabel
  const hasTableData = type === 'table' && data && Object.keys(data).length > 0;

  return (
    <div className="summary-box">
      <h3>{title}</h3>
      
      {/* Jika tipe adalah 'value', tampilkan angka besar */}
      {type === 'value' && (
        <>
          <p className="big-number">{value}</p>
          {subValue && <p id="ikm-mutu">{subValue}</p>}
        </>
      )}

      {/* Jika tipe adalah 'table' dan ada datanya, tampilkan tabel */}
      {hasTableData && (
        <table>
          <tbody>
            {Object.entries(data).map(([item, count]) => (
              <tr key={item}>
                <td>{item}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Jika tipe 'table' tapi tidak ada data, tampilkan pesan "(Belum ada data)" */}
      {type === 'table' && !hasTableData && (
        <div style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          (Belum ada data)
        </div>
      )}
    </div>
  );
};

export default SummaryBox;