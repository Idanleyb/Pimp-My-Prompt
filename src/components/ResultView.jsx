import { CRITERIA, GOAL_OPTIONS } from '../../lib/rubric.js';
import { relTime } from '../format.js';

function goalLabel(key) {
  const g = GOAL_OPTIONS.find(g => g.value === key);
  return g ? g.label : key;
}

export default function ResultView({ result: r }) {
  const circumference = 2 * Math.PI * 50;
  const offset = circumference * (1 - r.overall / 100);

  return (
    <>
      <div className="result-header">
        <div>
          <div className="result-tags">
            <span className="tag">{goalLabel(r.goal)}</span>
            <span className="tag">{r.tool}</span>
            <span className="tag">{relTime(new Date(r.created_at).getTime())}</span>
          </div>
          <h2 style={{ fontSize: 24 }}>Scan result</h2>
          {r.goal_detail && <div className="prompt-echo">{r.goal_detail}</div>}
        </div>
        <div className="dial-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" stroke="var(--line)" strokeWidth="10" fill="none" />
            <circle cx="60" cy="60" r="50" stroke="var(--mint)" strokeWidth="10" fill="none"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              transform="rotate(-90 60 60)" />
            <text x="60" y="58" textAnchor="middle" className="dial-number">{r.overall}</text>
            <text x="60" y="76" textAnchor="middle" className="dial-label">/ 100</text>
          </svg>
          <div className="dial-caption">{r.label}</div>
        </div>
      </div>

      <div className="section-title">Prompt Quality</div>
      <table className="score-table">
        <thead><tr><th style={{ width: '26%' }}>Criterion</th><th style={{ width: '12%' }}>Score</th><th>Tip</th></tr></thead>
        <tbody>
          {CRITERIA.map(c => {
            const item = r.prompt_quality?.[c.key] || { score: 0, tip: '' };
            return (
              <tr key={c.key}>
                <td className="crit-name">
                  {c.label}<br />
                  <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: 11 }}>{c.hint}</span>
                </td>
                <td className="score-cell">{item.score}/10</td>
                <td className="tip-text">{item.tip}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="section-title">Tool Fit</div>
      <div className="fit-card">
        <div className="fit-top">
          <div className="fit-score">{r.tool_fit?.score ?? 0}/100</div>
          <div style={{ color: 'var(--gray)', fontSize: 12 }}>
            using {r.tool} for {goalLabel(r.goal).toLowerCase()}
          </div>
        </div>
        <div className="fit-assessment">{r.tool_fit?.assessment}</div>
        {r.tool_fit?.recommended_alternative && (
          <div className="fit-alt">
            <b>Consider instead:</b> {r.tool_fit.recommended_alternative} — {r.tool_fit.reason}
          </div>
        )}
      </div>
    </>
  );
}
