import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Upload, UserPlus, BookPlus, Save, FileText } from 'lucide-react';
import { GradeTable, Student, Subject } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from '../utils/uuid';

// Grade colour class
function gc(v: string | number | null): string {
  const n = parseFloat(String(v));
  if (isNaN(n)) return '';
  if (n === 1) return 'g1';
  if (n === 2) return 'g2';
  if (n === 3) return 'g3';
  if (n === 4) return 'g4';
  if (n === 5) return 'g5';
  return '';
}

function avg(s: Student, subjects: Subject[]): string {
  const vals = subjects.map(sub => parseFloat(String(s.grades[sub.id]))).filter(v => !isNaN(v));
  if (!vals.length) return '–';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

function count5(s: Student, subjects: Subject[]): number {
  return subjects.filter(sub => parseFloat(String(s.grades[sub.id])) === 5).length;
}

// Columns exactly like the Austrian Notenübersicht
// Groups: E (Entsch.), A (Absenzen), PG (Pflichtgegenstände/subjects), VÜ, FG, Erf.
// Fixed left cols: Name, #, Nicht genügend, Nicht beurteilt, Befreit
// Fixed abs cols: Fehlstunden gesamt, Fehlstunden unentschuldigt, Verhalten, Ethik, Religion
// Then subjects (rotating)
// Then: VÜ (Ausgezeichneter Erfolg), FG (Guter Erfolg), Erf. (Aufstieg/NEIN)
// Final: Notendurchschnitt

interface CorrectionData {
  [studentId: string]: {
    nichtGenuegend: string;    // "Nicht genügend" override
    nichtBeurteilt: string;    // "Nicht beurteilt"
    befreit: string;           // "Befreit"
    korrektur5: string;        // manual correction count of 5s
    ausgezeichnet: string;     // Ausgezeichneter Erfolg (T=true)
    guterErfolg: string;       // Guter Erfolg (number)
    aufstieg: string;          // Aufstieg (J/N/–)
  }
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<GradeTable | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '' });
  const [newSubject, setNewSubject] = useState({ name: '', shortName: '' });
  const [corr, setCorr] = useState<CorrectionData>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get(`/api/tables/${id}`).then(r => {
      setTable(r.data);
      // init correction data
      const c: CorrectionData = {};
      r.data.students.forEach((s: Student) => {
        c[s.id] = { nichtGenuegend: '', nichtBeurteilt: '', befreit: '', korrektur5: '', ausgezeichnet: 'T', guterErfolg: '', aufstieg: '–' };
      });
      setCorr(c);
    }).catch(() => navigate('/'));
  }, [id, navigate]);

  const scheduleAutoSave = useCallback((t: GradeTable) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => axios.put(`/api/tables/${t.id}`, t).catch(() => {}), 1400);
  }, []);

  const upd = (t: GradeTable) => { setTable(t); scheduleAutoSave(t); };

  const setGrade = (sid: string, subId: string, val: string) => {
    if (!table) return;
    upd({ ...table, students: table.students.map(s => s.id === sid ? { ...s, grades: { ...s.grades, [subId]: val === '' ? null : val } } : s) });
  };

  const setAbs = (sid: string, field: 'total' | 'unexcused' | 'behavior', val: string) => {
    if (!table) return;
    upd({ ...table, students: table.students.map(s => s.id === sid ? { ...s, absences: { ...s.absences, [field]: field === 'behavior' ? val : (parseInt(val) || 0) } } : s) });
  };

  const setName = (sid: string, f: 'firstName' | 'lastName', val: string) => {
    if (!table) return;
    upd({ ...table, students: table.students.map(s => s.id === sid ? { ...s, [f]: val } : s) });
  };

  const setC = (sid: string, field: string, val: string) => {
    setCorr(c => ({ ...c, [sid]: { ...(c[sid] || {}), [field]: val } as any }));
  };

  const saveNow = async () => {
    if (!table) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    try { await axios.put(`/api/tables/${table.id}`, table); toast.success('Gespeichert!'); }
    catch { toast.error('Speichern fehlgeschlagen'); }
    finally { setSaving(false); }
  };

  const addStudent = () => {
    if (!table || !newStudent.firstName || !newStudent.lastName) { toast.error('Vor- und Nachname eingeben'); return; }
    const s: Student = {
      id: uuidv4(), firstName: newStudent.firstName, lastName: newStudent.lastName,
      grades: table.subjects.reduce((a, sub) => ({ ...a, [sub.id]: null }), {}),
      absences: { total: 0, unexcused: 0, behavior: 'SZ' }
    };
    const newTable = { ...table, students: [...table.students, s] };
    upd(newTable);
    setCorr(c => ({ ...c, [s.id]: { nichtGenuegend: '', nichtBeurteilt: '', befreit: '', korrektur5: '', ausgezeichnet: 'T', guterErfolg: '', aufstieg: '–' } }));
    setNewStudent({ firstName: '', lastName: '' });
    setShowAddStudent(false);
    toast.success('Schüler hinzugefügt');
  };

  const removeStudent = (sid: string) => {
    if (!table || !confirm('Schüler wirklich entfernen?')) return;
    upd({ ...table, students: table.students.filter(s => s.id !== sid) });
    setCorr(c => { const n = { ...c }; delete n[sid]; return n; });
  };

  const addSubject = () => {
    if (!table || !newSubject.name) { toast.error('Fachname eingeben'); return; }
    const sub: Subject = { id: uuidv4(), name: newSubject.name, shortName: newSubject.shortName || newSubject.name.substring(0, 5) };
    const students = table.students.map(s => ({ ...s, grades: { ...s.grades, [sub.id]: null } }));
    upd({ ...table, subjects: [...table.subjects, sub], students });
    setNewSubject({ name: '', shortName: '' });
    setShowAddSubject(false);
    toast.success('Fach hinzugefügt');
  };

  const removeSubject = (subId: string) => {
    if (!table || !confirm('Fach wirklich entfernen?')) return;
    const students = table.students.map(s => { const g = { ...s.grades }; delete g[subId]; return { ...s, grades: g }; });
    upd({ ...table, subjects: table.subjects.filter(s => s.id !== subId), students });
  };

  const importStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !table) return;
    const r = new FileReader();
    r.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').map(l => l.trim()).filter(Boolean);
      const added: Student[] = lines.map(line => {
        const p = line.split(/[,;|\t]/);
        return { id: uuidv4(), lastName: p[0]?.trim() || '', firstName: p[1]?.trim() || '',
          grades: table.subjects.reduce((a, s) => ({ ...a, [s.id]: null }), {}),
          absences: { total: 0, unexcused: 0, behavior: 'SZ' } };
      }).filter(s => s.lastName);
      const newC: CorrectionData = {};
      added.forEach(s => { newC[s.id] = { nichtGenuegend: '', nichtBeurteilt: '', befreit: '', korrektur5: '', ausgezeichnet: 'T', guterErfolg: '', aufstieg: '–' }; });
      upd({ ...table, students: [...table.students, ...added] });
      setCorr(c => ({ ...c, ...newC }));
      toast.success(`${added.length} Schüler importiert`);
    };
    r.readAsText(file);
    e.target.value = '';
  };

  const importSubjects = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !table) return;
    const r = new FileReader();
    r.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').map(l => l.trim()).filter(Boolean);
      const added: Subject[] = lines.map(l => { const p = l.split(/[,;|\t]/); return { id: uuidv4(), name: p[0]?.trim() || '', shortName: p[1]?.trim() || p[0]?.substring(0, 5) || '' }; }).filter(s => s.name);
      const students = table.students.map(s => ({ ...s, grades: { ...s.grades, ...added.reduce((a, sub) => ({ ...a, [sub.id]: null }), {}) } }));
      upd({ ...table, subjects: [...table.subjects, ...added], students });
      toast.success(`${added.length} Fächer importiert`);
    };
    r.readAsText(file);
    e.target.value = '';
  };

  if (!table) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 58px)', flexDirection: 'column', gap: 12, color: 'var(--text-3)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--gold)', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '0.85rem' }}>Wird geladen…</span>
    </div>
  );

  const sorted = [...table.students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'de'));
  const total5s = sorted.reduce((sum, s) => sum + count5(s, table.subjects), 0);

  return (
    <div className="editor-shell">
      {/* Toolbar */}
      <div className="editor-bar">
        <div className="ed-bar-l">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <ArrowLeft size={14} /> Zurück
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ed-class">{table.className}</span>
              <span className="ed-sep">·</span>
              <span className="ed-name">{table.name}</span>
              {table.headTeacher && <><span className="ed-sep">·</span><span className="ed-kv">KV: {table.headTeacher}</span></>}
            </div>
          </div>
          <div className="save-dot" title="Auto-Save aktiv" />
        </div>
        <div className="ed-bar-r">
          <input ref={studentRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={importStudents} />
          <input ref={subjectRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={importSubjects} />
          <button className="btn btn-outline btn-sm" onClick={() => studentRef.current?.click()}><Upload size={13} /> Schüler CSV</button>
          <button className="btn btn-outline btn-sm" onClick={() => subjectRef.current?.click()}><BookPlus size={13} /> Fächer CSV</button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAddSubject(true)}><Plus size={13} /> Fach</button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAddStudent(true)}><UserPlus size={13} /> Schüler</button>
          <button className="btn btn-success btn-sm" onClick={() => exportToPDF(table)}><FileText size={13} /> Notendruck PDF</button>
          <button className="btn btn-gold btn-sm" onClick={saveNow} disabled={saving}><Save size={13} /> {saving ? '…' : 'Speichern'}</button>
        </div>
      </div>

      {/* Table area */}
      <div className="editor-body">

        {/* ── MAIN GRADE TABLE ── */}
        <div className="grade-outer" style={{ overflowX: 'auto' }}>
          <table className="grade-table">
            <thead>
              {/* Group header row */}
              <tr>
                <th className="gr-group gr-group-title" colSpan={2}>
                  Notenübersicht {table.className} · SJ {table.schoolYear}
                  {table.headTeacher && <> · {table.headTeacher}</>}
                </th>
                {/* E group: Nicht genügend, Nicht beurteilt, Befreit */}
                <th className="gr-group" colSpan={3}>E</th>
                {/* A group: Fehlstunden gesamt, unentschuldigt, Verhalten */}
                <th className="gr-group" colSpan={3}>A</th>
                {/* PG group: Ethik, Religion + all subjects */}
                <th className="gr-group" colSpan={2 + table.subjects.length}>PG</th>
                {/* VÜ / FG / Erf. / Avg */}
                <th className="gr-group" colSpan={1}>VÜ</th>
                <th className="gr-group" colSpan={1}>FG</th>
                <th className="gr-group" colSpan={2}>Erf.</th>
                <th className="gr-group" colSpan={1}></th>
                <th className="gr-group" colSpan={1}></th>
              </tr>
              {/* Column header row */}
              <tr>
                <th className="gr-th gr-th-name">Familienname, Vorname</th>
                <th className="gr-th gr-th-nr">#</th>
                {/* E */}
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Nicht genügend</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Nicht beurteilt</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Befreit</div></div></th>
                {/* A */}
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Fehlstunden gesamt</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Fehlstunden unentschuldigt</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Verhalten in der Schule</div></div></th>
                {/* PG fixed */}
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Ethik</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Religion</div></div></th>
                {/* Subjects */}
                {table.subjects.map(s => (
                  <th key={s.id} className="gr-th rot" style={{ position: 'relative' }}>
                    <div className="rot-wrap"><div className="rot-txt">{s.name}</div></div>
                    <button className="rot-del" onClick={() => removeSubject(s.id)} title="Fach entfernen">✕</button>
                  </th>
                ))}
                {/* VÜ / FG / Erf */}
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Ausgez. Erfolg</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Guter Erfolg</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">AufstiegJA</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">AufstiegNEIN</div></div></th>
                <th className="gr-th rot"><div className="rot-wrap"><div className="rot-txt">Notendurchschnitt</div></div></th>
                <th className="gr-th" style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((student, idx) => {
                const c = corr[student.id] || {};
                const fives = count5(student, table.subjects);
                return (
                  <tr key={student.id}>
                    <td className="td-name">
                      <div style={{ display: 'flex', gap: 3 }}>
                        <input className="ni" value={student.lastName} onChange={e => setName(student.id, 'lastName', e.target.value)} placeholder="Nachname" style={{ flex: '1.1' }} />
                        <input className="ni" value={student.firstName} onChange={e => setName(student.id, 'firstName', e.target.value)} placeholder="Vorname" style={{ flex: '1' }} />
                      </div>
                    </td>
                    <td className="td-nr">{idx + 1}</td>
                    {/* E group */}
                    <td><input className="gi" value={c.nichtGenuegend || ''} onChange={e => setC(student.id, 'nichtGenuegend', e.target.value)} /></td>
                    <td><input className="gi" value={c.nichtBeurteilt || ''} onChange={e => setC(student.id, 'nichtBeurteilt', e.target.value)} /></td>
                    <td><input className="gi" value={c.befreit || ''} onChange={e => setC(student.id, 'befreit', e.target.value)} /></td>
                    {/* A group */}
                    <td><input className="ai" value={student.absences.total || ''} onChange={e => setAbs(student.id, 'total', e.target.value)} /></td>
                    <td><input className="ai" value={student.absences.unexcused || ''} onChange={e => setAbs(student.id, 'unexcused', e.target.value)} /></td>
                    <td><input className="ai" value={student.absences.behavior || ''} onChange={e => setAbs(student.id, 'behavior', e.target.value)} style={{ width: 32 }} /></td>
                    {/* Ethik + Religion */}
                    <td><input className="gi" placeholder="–" defaultValue="–" style={{ width: 24 }} /></td>
                    <td><input className="gi" placeholder="–" defaultValue="–" style={{ width: 24 }} /></td>
                    {/* Subject grades */}
                    {table.subjects.map(s => (
                      <td key={s.id}>
                        <input
                          className={`gi ${gc(student.grades[s.id])}`}
                          value={student.grades[s.id] !== null && student.grades[s.id] !== undefined ? String(student.grades[s.id]) : ''}
                          onChange={e => setGrade(student.id, s.id, e.target.value)}
                          maxLength={3}
                        />
                      </td>
                    ))}
                    {/* VÜ / FG / Erf */}
                    <td><input className="gi" value={c.ausgezeichnet || ''} onChange={e => setC(student.id, 'ausgezeichnet', e.target.value)} style={{ width: 24 }} /></td>
                    <td><input className="gi" value={c.guterErfolg || ''} onChange={e => setC(student.id, 'guterErfolg', e.target.value)} /></td>
                    <td><input className="gi" value={c.aufstieg === '–' || !c.aufstieg ? '' : c.aufstieg} placeholder="–" onChange={e => setC(student.id, 'aufstieg', e.target.value)} style={{ width: 24 }} /></td>
                    <td>
                      <span className={`c5-badge ${fives > 0 ? 'c5-has' : 'c5-zero'}`}>{fives > 0 ? fives : '–'}</span>
                    </td>
                    <td className="avg-c">{avg(student, table.subjects)}</td>
                    <td>
                      <button className="del-btn" onClick={() => removeStudent(student.id)} title="Schüler entfernen">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={100} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Keine Schüler vorhanden. Klicke auf „Schüler" oben um welche hinzuzufügen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── KORREKTUREN – Anzahl der Fünfer ── */}
        <div className="corr-outer">
          <div className="corr-head">
            <span className="corr-head-t">Korrekturen – Anzahl Nicht genügend (5)</span>
            <span className="corr-head-sub">Gesamt: {total5s} Fünfer in der Klasse</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="corr-table">
              <thead>
                <tr>
                  <th>Familienname, Vorname</th>
                  {table.subjects.map(s => (
                    <th key={s.id}>{s.shortName || s.name.substring(0, 6)}</th>
                  ))}
                  <th>Σ Fünfer</th>
                  <th>Korrekt. Fünfer</th>
                  <th>Notenschnitt</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(student => {
                  const c = corr[student.id] || {};
                  const fives = count5(student, table.subjects);
                  const corrected = parseInt(c.korrektur5 || '0') || 0;
                  return (
                    <tr key={student.id}>
                      <td>{student.lastName} {student.firstName}</td>
                      {table.subjects.map(s => {
                        const v = student.grades[s.id];
                        const is5 = parseFloat(String(v)) === 5;
                        return (
                          <td key={s.id}>
                            <span className={`c5-badge ${is5 ? 'c5-has' : 'c5-zero'}`}>
                              {v !== null && v !== undefined && String(v) !== '' ? String(v) : '–'}
                            </span>
                          </td>
                        );
                      })}
                      <td>
                        <span className={`c5-badge ${fives > 0 ? 'c5-has' : 'c5-zero'}`}>{fives}</span>
                      </td>
                      <td>
                        <input className="ci" value={c.korrektur5 || ''} onChange={e => setC(student.id, 'korrektur5', e.target.value)} placeholder="0" title="Korrigierte Anzahl der Fünfer" />
                      </td>
                      <td className="avg-c" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{avg(student, table.subjects)}</td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                {sorted.length > 0 && (
                  <tr className="corr-total">
                    <td>Klasse gesamt</td>
                    {table.subjects.map(s => {
                      const cnt = sorted.filter(st => parseFloat(String(st.grades[s.id])) === 5).length;
                      return (
                        <td key={s.id}>
                          <span className={`c5-badge ${cnt > 0 ? 'c5-has' : 'c5-zero'}`}>{cnt}</span>
                        </td>
                      );
                    })}
                    <td><span className={`c5-badge ${total5s > 0 ? 'c5-has' : 'c5-zero'}`}>{total5s}</span></td>
                    <td>
                      <span style={{ fontSize: '0.75rem' }}>
                        {sorted.reduce((s, st) => s + (parseInt(corr[st.id]?.korrektur5 || '0') || 0), 0)}
                      </span>
                    </td>
                    <td className="avg-c">
                      {(() => {
                        const avgs = sorted.map(s => {
                          const vals = table.subjects.map(sub => parseFloat(String(s.grades[sub.id]))).filter(v => !isNaN(v));
                          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                        }).filter(v => v !== null) as number[];
                        return avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2) : '–';
                      })()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="overlay" onClick={() => setShowAddStudent(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h2>Schüler hinzufügen</h2>
              <p>Gib den Namen des neuen Schülers ein.</p>
            </div>
            <div className="fg-row">
              <div className="fg">
                <label>Nachname</label>
                <input type="text" value={newStudent.lastName} onChange={e => setNewStudent(d => ({ ...d, lastName: e.target.value }))} placeholder="Mustermann" autoFocus />
              </div>
              <div className="fg">
                <label>Vorname</label>
                <input type="text" value={newStudent.firstName} onChange={e => setNewStudent(d => ({ ...d, firstName: e.target.value }))} placeholder="Max"
                  onKeyDown={e => e.key === 'Enter' && addStudent()} />
              </div>
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={() => setShowAddStudent(false)}>Abbrechen</button>
              <button className="btn btn-gold" onClick={addStudent}><UserPlus size={14} /> Hinzufügen</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="overlay" onClick={() => setShowAddSubject(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h2>Fach hinzufügen</h2>
              <p>Gib den Namen des neuen Fachs ein.</p>
            </div>
            <div className="fg">
              <label>Fachname</label>
              <input type="text" value={newSubject.name} onChange={e => setNewSubject(d => ({ ...d, name: e.target.value }))} placeholder="z.B. Informatik" autoFocus />
            </div>
            <div className="fg">
              <label>Kürzel (optional)</label>
              <input type="text" value={newSubject.shortName} onChange={e => setNewSubject(d => ({ ...d, shortName: e.target.value }))} placeholder="z.B. INF"
                onKeyDown={e => e.key === 'Enter' && addSubject()} />
            </div>
            <div className="modal-f">
              <button className="btn btn-outline" onClick={() => setShowAddSubject(false)}>Abbrechen</button>
              <button className="btn btn-gold" onClick={addSubject}><Plus size={14} /> Hinzufügen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
