import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [ld, setLd] = useState({ email: '', password: '' });
  const [rd, setRd] = useState({ username: '', email: '', password: '', password2: '', country: 'AT' });

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await login(ld.email, ld.password); toast.success('Willkommen zurück!'); }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Login fehlgeschlagen'); }
    finally { setLoading(false); }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rd.password !== rd.password2) { toast.error('Passwörter stimmen nicht überein'); return; }
    setLoading(true);
    try { await register(rd.username, rd.email, rd.password, rd.country); toast.success('Konto erstellt!'); }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Registrierung fehlgeschlagen'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-grid" />
        <div className="auth-left-cnt">
          <div className="auth-logo">
            <div className="auth-logo-dot" />
            NotenPortal
          </div>
          <div className="auth-hl">
            <h1>Digitales<br /><em>Klassenbuch</em><br />für Lehrkräfte</h1>
            <p>Professionelle Notenverwaltung für Österreich, Deutschland und die Schweiz – modern, schnell und sicher.</p>
          </div>
          <div className="auth-flags">
            <div className="auth-flag"><span>🇦🇹</span> Österreich</div>
            <div className="auth-flag"><span>🇩🇪</span> Deutschland</div>
            <div className="auth-flag"><span>🇨🇭</span> Schweiz</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-title">Anmelden</div>
          <div className="auth-sub">Zugang zum NotenPortal</div>

          <div className="tab-bar">
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Anmelden</button>
            <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Registrieren</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={doLogin}>
              <div className="fg">
                <label>E-Mail-Adresse</label>
                <input type="email" value={ld.email} onChange={e => setLd(d => ({ ...d, email: e.target.value }))} placeholder="lehrer@schule.at" required />
              </div>
              <div className="fg">
                <label>Passwort</label>
                <input type="password" value={ld.password} onChange={e => setLd(d => ({ ...d, password: e.target.value }))} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-gold btn-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
                {loading ? 'Wird angemeldet…' : 'Anmelden'}
              </button>
            </form>
          ) : (
            <form onSubmit={doRegister}>
              <div className="fg">
                <label>Benutzername</label>
                <input type="text" value={rd.username} onChange={e => setRd(d => ({ ...d, username: e.target.value }))} placeholder="mein-benutzername" required />
              </div>
              <div className="fg">
                <label>E-Mail-Adresse</label>
                <input type="email" value={rd.email} onChange={e => setRd(d => ({ ...d, email: e.target.value }))} placeholder="lehrer@schule.at" required />
              </div>
              <div className="fg-row">
                <div className="fg">
                  <label>Passwort</label>
                  <input type="password" value={rd.password} onChange={e => setRd(d => ({ ...d, password: e.target.value }))} placeholder="••••••••" required minLength={6} />
                </div>
                <div className="fg">
                  <label>Bestätigen</label>
                  <input type="password" value={rd.password2} onChange={e => setRd(d => ({ ...d, password2: e.target.value }))} placeholder="••••••••" required />
                </div>
              </div>
              <div className="fg">
                <label>Land</label>
                <select value={rd.country} onChange={e => setRd(d => ({ ...d, country: e.target.value }))}>
                  <option value="AT">🇦🇹 Österreich</option>
                  <option value="DE">🇩🇪 Deutschland</option>
                  <option value="CH">🇨🇭 Schweiz</option>
                </select>
              </div>
              <button type="submit" className="btn btn-gold btn-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
                {loading ? 'Wird registriert…' : 'Konto erstellen'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
