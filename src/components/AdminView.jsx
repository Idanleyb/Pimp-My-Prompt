import { money } from '../format.js';

export default function AdminView({ loading, data, error }) {
  if (loading) return <div className="loading-row"><div className="spinner"></div> Loading usage data…</div>;
  if (error) return <div className="empty-state"><h2>No access</h2><p>{error}</p></div>;
  if (!data) return null;

  const pct = Math.min(100, Math.round((data.global.total_cost / data.global.alert_threshold) * 100));

  return (
    <>
      <h2 style={{ fontSize: 22, marginBottom: 18 }}>Usage &amp; alerts</h2>
      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Total spend</div>
          <div className="value">{money(data.global.total_cost)}</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: pct + '%' }}></div></div>
        </div>
        <div className="stat-card">
          <div className="label">Alert threshold</div>
          <div className="value">{money(data.global.alert_threshold)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Alert status</div>
          <div className="value" style={{ fontSize: 15 }}>{data.global.alert_fired ? 'Fired ⚠' : 'Not yet'}</div>
        </div>
      </div>
      <div className="section-title">Tokens by user</div>
      <table className="score-table">
        <thead><tr><th>Email</th><th>Sessions</th><th>Input tok.</th><th>Output tok.</th><th>Cost</th></tr></thead>
        <tbody>
          {data.users.length === 0 && (
            <tr><td colSpan={5} style={{ color: 'var(--gray)' }}>No usage logged yet.</td></tr>
          )}
          {data.users.map(u => (
            <tr key={u.user_id}>
              <td>{u.email}</td>
              <td className="score-cell">{u.sessions}</td>
              <td className="score-cell">{u.input_tokens.toLocaleString()}</td>
              <td className="score-cell">{u.output_tokens.toLocaleString()}</td>
              <td className="score-cell">{money(u.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
