import { GOAL_OPTIONS } from '../../lib/rubric.js';
import { relTime } from '../format.js';

function goalLabel(key) {
  const g = GOAL_OPTIONS.find(g => g.value === key);
  return g ? g.label : key;
}

export default function Sidebar({ results, currentId, onSelect, onNew }) {
  return (
    <div className="sidebar">
      <div className="sidebar-inner">
        <button className="new-btn" onClick={onNew}>+ &nbsp;New Query</button>
        <div className="sidebar-label">Last results</div>
        {results.length === 0 && (
          <div className="empty-side">No scans yet. Hit + New Query to grade your first prompt.</div>
        )}
        {results.map(r => (
          <button key={r.id} className={`result-item ${currentId === r.id ? 'active' : ''}`} onClick={() => onSelect(r)}>
            <div className="result-badge">{r.overall}</div>
            <div className="result-meta">
              <div className="rt">{r.tool} · {goalLabel(r.goal)}</div>
              <div className="rs">{relTime(new Date(r.created_at).getTime())}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
