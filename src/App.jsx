import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import Onboarding from './components/Onboarding.jsx';
import Topbar from './components/Topbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import NewQueryModal from './components/NewQueryModal.jsx';
import ResultView from './components/ResultView.jsx';
import AdminView from './components/AdminView.jsx';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [results, setResults] = useState([]);
  const [mainView, setMainView] = useState('empty'); // empty | result | admin
  const [currentResult, setCurrentResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close the profile dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) { if (!e.target.closest('.profile-wrap')) setMenuOpen(false); }
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [menuOpen]);

  const loadResults = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setResults(data || []);
  }, [session]);

  useEffect(() => { loadResults(); }, [loadResults]);

  if (session === undefined) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lavender)', color: 'var(--gray)' }}>
        Loading…
      </div>
    );
  }
  if (!session) return <Onboarding />;

  async function handleSubmitQuery(payload) {
    if (!payload.tool || !payload.prompt) {
      setSubmitError("Add the tool you used and the prompt itself — those are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Scoring failed');

      setResults(prev => [body.result, ...prev].slice(0, 50));
      setCurrentResult(body.result);
      setMainView('result');
      setModalOpen(false);

      if (body.alert && body.alert.crossed_now) {
        setAlertBanner(
          `Total AI spend just crossed $${Number(body.alert.threshold).toFixed(2)} (now $${Number(body.alert.new_total).toFixed(4)}).`
        );
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Scoring failed — try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function openAdmin() {
    setMenuOpen(false);
    setMainView('admin');
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin-usage', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) { setAdminError(body.error || 'Not authorized'); setAdminData(null); }
      else setAdminData(body);
    } catch (err) {
      setAdminError('Could not load usage data.');
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setResults([]);
    setMainView('empty');
    setCurrentResult(null);
  }

  return (
    <>
      <Topbar
        email={session.user.email}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(o => !o)}
        onUsage={openAdmin}
        onLogout={handleLogout}
      />
      <div className="shell">
        <Sidebar
          results={results}
          currentId={currentResult?.id}
          onNew={() => { setModalOpen(true); setSubmitError(''); }}
          onSelect={(r) => { setCurrentResult(r); setMainView('result'); }}
        />
        <div className="main">
          {alertBanner && (
            <div className="banner">
              <span>⚠ {alertBanner}</span>
              <button onClick={() => setAlertBanner(null)}>Dismiss</button>
            </div>
          )}
          {mainView === 'result' && currentResult && <ResultView result={currentResult} />}
          {mainView === 'admin' && <AdminView loading={adminLoading} data={adminData} error={adminError} />}
          {mainView === 'empty' && (
            <div className="empty-state">
              <h2>No scans yet</h2>
              <p>Grade your first prompt — tell us your goal, the tool you're using, and paste the prompt itself. We'll score it and tell you exactly what to fix.</p>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setModalOpen(true)}>+ New Query</button>
            </div>
          )}
        </div>
      </div>
      {modalOpen && (
        <NewQueryModal
          submitting={submitting}
          error={submitError}
          onClose={() => { if (!submitting) setModalOpen(false); }}
          onSubmit={handleSubmitQuery}
        />
      )}
    </>
  );
}
