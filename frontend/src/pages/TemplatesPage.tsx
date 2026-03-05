import { useState, useEffect } from 'react';
import axios from 'axios';
import { Template } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

const FLAGS: Record<string, string> = { AT: '🇦🇹', DE: '🇩🇪', CH: '🇨🇭' };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [modal, setModal] = useState(false);
  const [sel, setSel] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', className: '', schoolYear: '2025/26', headTeacher: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { axios.get('/api/tables/templates').then(r => setTemplates(r.data)); }, []);

  const create = async () => {
    if (!form.className || !form.name) { toast.error('Klasse und Name erforderlich'); return; }
    const r = await axios.post('/api/tables', { ...form, templateId: sel?.id, country: user?.country });
    navigate(`/editor/${r.data.id}`);
  };

  const grouped: Record<string, Template[]> = {};
  templates.forEach(t => {
    const k = t.isBlank ? 'Leer' : t.country;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(t);
  });

  const cnames: Record<string, string> = { AT: 'Österreich 🇦🇹', DE: 'Deutschland 🇩🇪', CH: 'Schweiz 🇨🇭', Leer: 'Leere Vorlagen' };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="page-kicker">Bibliothek</div>
        <h1>Alle Vorlagen</h1>
        <p>Wähle eine Vorlage aus um ein neues Notenprojekt zu starten.</p>
      </div>

      {Object.entries(grouped).map(([key, tmps]) => (
        <div key={key} style={{ marginBottom: 32 }}>
          <div className="sec-head"><h2>{cnames[key] || key}</h2></div>
          <div className="tpl-grid">
            {tmps.map(t => (
              <div key={t.id} className={`tpl-card ${t.isBlank ? 'blank' : ''}`} onClick={() => { setSel(t); setModal(true); }}>
                <div className="tpl-icon">{t.isBlank ? '📄' : FLAGS[t.country]}</div>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <div className="tpl-meta">
                  {!t.isBlank && <span className="chip chip-gold">{t.subjects.length} Fächer</span>}
                  {!t.isBlank && <span className="chip chip-emerald">{t.sampleStudents.length} Beispielschüler</span>}
                  {t.isBlank && <span className="chip chip-muted">Komplett leer</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && sel && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h2>Neues Projekt</h2>
              <p>Basierend auf: <strong>{sel.name}</strong></p>
            </div>
            <div className="fg">
              <label>Projektname</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Notenübersicht SJ 2025/26" />
            </div>
            <div className="fg-row">
              <div className="fg">
                <label>Klasse *</label>
                <input value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value.toUpperCase() }))} placeholder="z.B. 1BHIF" />
              </div>
              <div className="fg">
                <label>Schuljahr</label>
                <input value={form.schoolYear} onChange={e => setForm(f => ({ ...f, schoolYear: e.target.value }))} placeholder="2025/26" />
              </div>
            </div>
            <div className="fg">
              <label>Klassenvorstand</label>
              <input value={form.headTeacher} onChange={e => setForm(f => ({ ...f, headTeacher: e.target.value }))} placeholder="Prof. Max Mustermann" />
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Abbrechen</button>
              <button className="btn btn-gold" onClick={create}><Plus size={14} /> Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
