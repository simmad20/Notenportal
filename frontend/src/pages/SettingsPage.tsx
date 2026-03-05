import { useState } from 'react';
import { Settings, Moon, Globe, User, Key, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', password: '', password2: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.password2) { toast.error('Passwörter stimmen nicht überein'); return; }
    setSaving(true);
    try {
      const d: any = { username: form.username, email: form.email };
      if (form.password) d.password = form.password;
      await updateUser(d);
      toast.success('Einstellungen gespeichert');
      setForm(f => ({ ...f, password: '', password2: '' }));
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Fehler'); }
    finally { setSaving(false); }
  };

  const toggleTheme = async () => {
    const t = user?.theme === 'dark' ? 'light' : 'dark';
    await updateUser({ theme: t });
    document.documentElement.setAttribute('data-theme', t);
    toast.success(t === 'dark' ? 'Dunkles Design' : 'Helles Design');
  };

  const setCountry = async (c: 'AT' | 'DE' | 'CH') => { await updateUser({ country: c }); toast.success('Land gespeichert'); };
  const setLang = async (l: 'de' | 'en') => { await updateUser({ language: l }); toast.success('Sprache gespeichert'); };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-kicker">Konto & Darstellung</div>
        <h1>Einstellungen</h1>
        <p>Passe dein Profil, die Sprache und das Design an.</p>
      </div>

      <div className="settings-wrap">
        {/* Darstellung */}
        <div className="s-card">
          <div className="s-card-h"><Moon size={15} /><h3>Darstellung</h3></div>
          <div className="s-card-b">
            <div className="s-row">
              <div>
                <div className="s-row-lbl">Dunkles Design</div>
                <div className="s-row-desc">Wechselt zwischen hellem und dunklem Modus</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={user?.theme === 'dark'} onChange={toggleTheme} />
                <div className="t-track" />
              </label>
            </div>
          </div>
        </div>

        {/* Sprache & Land */}
        <div className="s-card">
          <div className="s-card-h"><Globe size={15} /><h3>Sprache & Region</h3></div>
          <div className="s-card-b">
            <div className="fg" style={{ marginBottom: 20 }}>
              <label>Sprache / Language</label>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className={`btn ${user?.language === 'de' ? 'btn-gold' : 'btn-outline'}`} onClick={() => setLang('de')}>🇩🇪 Deutsch</button>
                <button className={`btn ${user?.language === 'en' ? 'btn-gold' : 'btn-outline'}`} onClick={() => setLang('en')}>🇬🇧 English</button>
              </div>
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Mein Land</label>
              <div className="country-g">
                {(['AT', 'DE', 'CH'] as const).map(c => (
                  <button key={c} className={`c-tile ${user?.country === c ? 'sel' : ''}`} onClick={() => setCountry(c)}>
                    <span className="c-flag">{c === 'AT' ? '🇦🇹' : c === 'DE' ? '🇩🇪' : '🇨🇭'}</span>
                    <span className="c-name">{c === 'AT' ? 'Österreich' : c === 'DE' ? 'Deutschland' : 'Schweiz'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profil */}
        <div className="s-card">
          <div className="s-card-h"><User size={15} /><h3>Profil bearbeiten</h3></div>
          <div className="s-card-b">
            <form onSubmit={save}>
              <div className="fg-row">
                <div className="fg">
                  <label>Benutzername</label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div className="fg">
                  <label>E-Mail</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="fg-row">
                <div className="fg">
                  <label><Key size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Neues Passwort</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leer = unverändert" />
                </div>
                <div className="fg">
                  <label>Passwort bestätigen</label>
                  <input type="password" value={form.password2} onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Speichert…' : 'Änderungen speichern'}</button>
            </form>
          </div>
        </div>

        {/* Konto-Aktionen */}
        <div className="s-card">
          <div className="s-card-h" style={{ background: 'var(--crimson-light)' }}>
            <LogOut size={15} style={{ color: 'var(--crimson)' }} />
            <h3 style={{ color: 'var(--crimson)' }}>Konto-Aktionen</h3>
          </div>
          <div className="s-card-b">
            <p style={{ fontSize: '0.83rem', color: 'var(--text-3)', marginBottom: 14 }}>Beim Abmelden bleiben alle deine Projekte gespeichert.</p>
            <button className="btn btn-danger" onClick={() => { logout(); toast.success('Abgemeldet'); }}>
              <LogOut size={14} /> Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
