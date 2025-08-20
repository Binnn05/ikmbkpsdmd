const SummaryBox = ({ title, value, subValue, data, type = 'value' }) => {
  return (
    <div className="summary-box">
      <h3>{title}</h3>
      {type === 'value' && (
        <>
          <p className="big-number">{value}</p>
          {subValue && <p id="ikm-mutu">{subValue}</p>}
        </>
      )}
      {type === 'table' && data && (
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
    </div>
  );
};

export default SummaryBox;