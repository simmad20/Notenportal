import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FolderOpen, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Template, GradeTable } from '../types';
import toast from 'react-hot-toast';

const FLAGS: Record<string, string> = { AT: '🇦🇹', DE: '🇩🇪', CH: '🇨🇭' };
const CLASS_RE = /^\d[A-Za-z0-9]+$/;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<GradeTable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selTpl, setSelTpl] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', className: '', schoolYear: '2025/26', headTeacher: '' });

  useEffect(() => {
    axios.get('/api/tables/templates').then(r => setTemplates(r.data));
    axios.get('/api/tables').then(r => setProjects(r.data));
  }, []);

  const openTpl = (t: Template) => {
    setSelTpl(t);
    setForm(f => ({ ...f, headTeacher: user?.username || '' }));
    setShowModal(true);
  };

  const create = async () => {
    if (!form.className) { toast.error('Bitte Klasse eingeben'); return; }
    if (!CLASS_RE.test(form.className)) { toast.error('Klasse muss mit einer Zahl beginnen (z.B. 1A, 4BHIF)'); return; }
    if (!form.name) { toast.error('Bitte Projektname eingeben'); return; }
    try {
      const r = await axios.post('/api/tables', { ...form, templateId: selTpl?.id, country: user?.country });
      toast.success('Projekt erstellt!');
      navigate(`/editor/${r.data.id}`);
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Fehler'); }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Projekt wirklich löschen?')) return;
    await axios.delete(`/api/tables/${id}`);
    setProjects(p => p.filter(x => x.id !== id));
    toast.success('Gelöscht');
  };

  const myTpls = templates.filter(t => !user?.country || t.country === user.country || t.isBlank);
  const otherTpls = templates.filter(t => user?.country && t.country !== user.country && !t.isBlank);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-kicker">Dashboard</div>
        <h1>Willkommen, {user?.username} 👋</h1>
        <p>Wähle eine Vorlage aus oder öffne ein bestehendes Projekt.</p>
      </div>

      <div className="sec-head">
        <h2>Vorlagen – {FLAGS[user?.country || 'AT']} {user?.country === 'AT' ? 'Österreich' : user?.country === 'DE' ? 'Deutschland' : 'Schweiz'}</h2>
      </div>
      <div className="tpl-grid">
        {myTpls.map(t => (
          <div key={t.id} className={`tpl-card ${t.isBlank ? 'blank' : ''}`} onClick={() => openTpl(t)}>
            <div className="tpl-icon">{t.isBlank ? '📄' : FLAGS[t.country]}</div>
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <div className="tpl-meta">
              {!t.isBlank && <span className="chip chip-gold">{t.subjects.length} Fächer</span>}
              {!t.isBlank && <span className="chip chip-emerald">{t.sampleStudents.length} Musterschüler</span>}
              {t.isBlank && <span className="chip chip-muted">Leer</span>}
            </div>
          </div>
        ))}
      </div>

      {otherTpls.length > 0 && (
        <>
          <div className="sec-head" style={{ marginTop: 10 }}>
            <h2>Weitere Länder</h2>
          </div>
          <div className="tpl-grid">
            {otherTpls.map(t => (
              <div key={t.id} className="tpl-card" style={{ opacity: 0.7 }} onClick={() => openTpl(t)}>
                <div className="tpl-icon">{FLAGS[t.country]}</div>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <div className="tpl-meta"><span className="chip chip-gold">{t.subjects.length} Fächer</span></div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sec-divider" />

      <div className="sec-head">
        <h2><FolderOpen size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />Meine Projekte ({projects.length})</h2>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📁</div>
          <h3>Noch keine Projekte</h3>
          <p>Wähle eine Vorlage oben aus, um dein erstes Projekt zu erstellen.</p>
        </div>
      ) : (
        <div className="proj-grid">
          {projects.map(p => (
            <div key={p.id} className="proj-card" onClick={() => navigate(`/editor/${p.id}`)}>
              <div className="proj-top">
                <div className="proj-class">{p.className}</div>
                <div className="proj-year">{FLAGS[p.country]} {p.schoolYear}</div>
              </div>
              <h3>{p.name}</h3>
              {p.headTeacher && <p>KV: {p.headTeacher}</p>}
              <div className="proj-stats">
                <div className="proj-stat"><div className="proj-stat-v">{p.students.length}</div><div className="proj-stat-l">Schüler</div></div>
                <div className="proj-stat"><div className="proj-stat-v">{p.subjects.length}</div><div className="proj-stat-l">Fächer</div></div>
                <div className="proj-stat">
                  <div className="proj-stat-v" style={{ fontSize: '0.72rem' }}><Clock size={12} style={{ display: 'inline' }} /></div>
                  <div className="proj-stat-l">{new Date(p.updatedAt).toLocaleDateString('de-AT')}</div>
                </div>
              </div>
              <div className="proj-acts">
                <button className="btn btn-navy btn-sm" onClick={() => navigate(`/editor/${p.id}`)}>Öffnen</button>
                <button className="btn btn-danger btn-sm" onClick={e => deleteProject(p.id, e)}>Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selTpl && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h2>Neues Projekt</h2>
              <p>Vorlage: <strong>{selTpl.name}</strong></p>
            </div>
            <div className="fg">
              <label>Projektname / Bezeichnung</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Notenübersicht SJ 2025/26" />
            </div>
            <div className="fg-row">
              <div className="fg">
                <label>Klasse *</label>
                <input type="text" value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value.toUpperCase() }))} placeholder="z.B. 1BHIF, 4A" />
              </div>
              <div className="fg">
                <label>Schuljahr</label>
                <input type="text" value={form.schoolYear} onChange={e => setForm(f => ({ ...f, schoolYear: e.target.value }))} placeholder="2025/26" />
              </div>
            </div>
            <div className="fg">
              <label>Klassenvorstand (optional)</label>
              <input type="text" value={form.headTeacher} onChange={e => setForm(f => ({ ...f, headTeacher: e.target.value }))} placeholder="Prof. DI Max Mustermann" />
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Abbrechen</button>
              <button className="btn btn-gold" onClick={create}><Plus size={14} /> Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
