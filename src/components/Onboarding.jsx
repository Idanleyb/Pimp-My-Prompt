import { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Onboarding() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Enter both an email and a password.');
      return;
    }
    setLoading(true);
    const authCall = mode === 'signup'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { data, error: authError } = await authCall;
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    if (mode === 'signup' && data?.user && !data.session) {
      // Email confirmation is enabled in this Supabase project.
      setCheckEmail(true);
    }
    // Otherwise App.jsx's onAuthStateChange listener picks up the new session.
  }

  return (
    <div className="onboard-wrap">
      <div className="onboard-card">
        <div className="onboard-brand">
          <div>
            <div className="mark">
              <div className="dot"></div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, letterSpacing: '.08em' }}>
                PIMP MY PROMPT
              </span>
            </div>
            <h1>Find out if your prompt needs a glow-up.</h1>
            <p>
              Score how you brief your AI tools — the prompt itself, and whether the tool you picked
              is even the right one for the job. Get a rubric score and specific fixes, not just a vibe check.
            </p>
            <div className="free-tag">Free while we're building this</div>
          </div>
          <div className="foot">
            Works with any AI tool — ChatGPT, Claude, Midjourney, Runway, Lovable, and anything else you're briefing.
          </div>
        </div>
        <div className="onboard-form">
          {checkEmail ? (
            <>
              <h2>Check your email</h2>
              <div className="sub">We sent a confirmation link to {email}. Click it, then come back here and log in.</div>
              <button className="btn btn-ghost" onClick={() => { setCheckEmail(false); setMode('login'); }}>
                Back to login
              </button>
            </>
          ) : (
            <>
              <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
              <div className="sub">{mode === 'signup' ? 'Takes 10 seconds. No credit card.' : 'Log in to see your scan history.'}</div>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create a password' : 'Your password'} required />
                </div>
                {error && <div className="err-text">{error}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Working…' : (mode === 'signup' ? 'Create account →' : 'Log in →')}
                </button>
              </form>
              <div className="hint-text">
                {mode === 'signup' ? (
                  <>Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Log in</a>
                  </>
                ) : (
                  <>New here?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); }}>Create an account</a>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
