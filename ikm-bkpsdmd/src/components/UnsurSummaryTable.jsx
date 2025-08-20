import { useMemo } from "react";

const UnsurSummaryTable = ({ unsurData }) => {
  const { minScore, maxScore } = useMemo(() => {
    if (!unsurData || unsurData.length === 0)
      return { minScore: 0, maxScore: 0 };
    const scores = unsurData.map((u) => u.nilai);
    return { minScore: Math.min(...scores), maxScore: Math.max(...scores) };
  }, [unsurData]);

  const getRowClass = (nilai) => {
    if (minScore === maxScore) return "";
    if (nilai === maxScore) return "ikm-paling-tinggi";
    if (nilai === minScore) return "ikm-paling-rendah";
    return "";
  };

  return (
    <div id="unsur-summary-container">
      <h3
        className="section-title"
        style={{ fontSize: "1.0rem", marginBottom: "1rem" }}
      >
        Ringkasan IKM per Unsur
      </h3>
      <table className="unsur-summary-table">
        <thead>
          <tr>
            <th>Unsur Pelayanan</th>
            <th>Nilai IKM</th>
          </tr>
        </thead>
        <tbody>
          {unsurData.map(({ nama, nilai }) => (
            <tr key={nama} className={getRowClass(nilai)}>
              <td>{nama}</td>
              <td>{nilai.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UnsurSummaryTable;
