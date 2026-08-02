import { useState } from 'react';
import { GOAL_OPTIONS } from '../../lib/rubric.js';

export default function NewQueryModal({ onClose, onSubmit, submitting, error }) {
  const [goal, setGoal] = useState(GOAL_OPTIONS[0].value);
  const [goalDetail, setGoalDetail] = useState('');
  const [context, setContext] = useState('');
  const [tool, setTool] = useState('');
  const [prompt, setPrompt] = useState('');

  function handleSubmit() {
    onSubmit({ goal, goalDetail, context, tool, prompt });
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>New Query</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Goal — define your goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}>
              {GOAL_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Goal detail <span style={{ color: 'var(--gray)', fontWeight: 400 }}>(optional, one line)</span></label>
            <input type="text" value={goalDetail} onChange={e => setGoalDetail(e.target.value)}
              placeholder="e.g. LinkedIn post announcing a new feature" />
          </div>
          <div className="field">
            <label>Context — what's this all about?</label>
            <textarea rows={3} value={context} onChange={e => setContext(e.target.value)}
              placeholder="Company, product, brand voice, audience, constraints..." />
          </div>
          <div className="field">
            <label>Tool you're using</label>
            <input type="text" value={tool} onChange={e => setTool(e.target.value)}
              placeholder="e.g. ChatGPT, Claude, Midjourney, Runway, Lovable" />
          </div>
          <div className="field">
            <label>Your prompt</label>
            <textarea rows={5} value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Paste the exact prompt you used..." />
          </div>
          {error && <div className="err-text">{error}</div>}
          {submitting && <div className="loading-row"><div className="spinner"></div> Scoring your submission…</div>}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSubmit} disabled={submitting}>
            Calculate Result
          </button>
        </div>
      </div>
    </div>
  );
}
