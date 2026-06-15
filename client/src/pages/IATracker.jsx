import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { exportIAPDF } from '../utils/exportPDF';
import { Plus, Trash2, X, Edit2, Download } from 'lucide-react';

const GRADES = ['O','A+','A','B+','B','C','F'];
const GRADE_POINTS = { O:10, 'A+':9, A:8, 'B+':7, B:6, C:5, F:0 };
const SEMESTERS = ['1','2','3','4','5','6','7','8'];

const emptyForm = {
  subject:'', subjectCode:'', semester:'1',
  ia1:0, ia2:0, ia3:0, maxMarks:30,
  credits:3, grade:'O', gradePoint:10,
};

export default function IATracker() {
  const { user } = useAuth();
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(emptyForm);

  const load = async () => {
    try {
      const { data } = await api.get('/ia');
      setRecords(data.records);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const f = (k) => (e) => {
    const v = e.target.value;
    const upd = { ...form, [k]: v };
    if (k === 'grade') upd.gradePoint = GRADE_POINTS[v] ?? 0;
    setForm(upd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/ia/${editId}`, form);
        toast.success('Updated!');
      } else {
        await api.post('/ia', form);
        toast.success('Subject added!');
      }
      setShowModal(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openEdit = (r) => {
    setForm({ subject:r.subject, subjectCode:r.subjectCode||'', semester:r.semester||'1',
      ia1:r.ia1, ia2:r.ia2, ia3:r.ia3, maxMarks:r.maxMarks||30,
      credits:r.credits||3, grade:r.grade||'O', gradePoint:r.gradePoint||10 });
    setEditId(r._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this record?')) return;
    try { await api.delete(`/ia/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  // CGPA from loaded records
  const cgpa = records.length
    ? (records.reduce((s,r) => s + (r.gradePoint * r.credits), 0) /
       records.reduce((s,r) => s + r.credits, 0)).toFixed(2)
    : 0;

  const gradeColor = { O:'var(--primary)', 'A+':'var(--success)', A:'var(--success)', 'B+':'var(--warning)', B:'var(--warning)', C:'var(--danger)', F:'var(--danger)' };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>🎯 IA Tracker</h1>
            <p>Track Internal Assessment marks — CGPA: <strong style={{ color:'var(--primary)', fontSize:18 }}>{cgpa}</strong></p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {records.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => exportIAPDF(records, user?.name)}>
                <Download size={15}/> PDF
              </button>
            )}
            <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(emptyForm); setShowModal(true); }}>
              <Plus size={16}/> Add Subject
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No subjects added yet</h3>
          <p>Add your subjects to track IA marks and calculate CGPA</p>
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Subject','Code','Sem','IA1','IA2','IA3','Best 2 Avg','Credits','Grade','GP','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r._id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent':'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{r.subject}</td>
                  <td style={{ padding:'10px 14px', color:'var(--text-muted)' }}>{r.subjectCode || '-'}</td>
                  <td style={{ padding:'10px 14px' }}>{r.semester}</td>
                  <td style={{ padding:'10px 14px' }}>{r.ia1}/{r.maxMarks}</td>
                  <td style={{ padding:'10px 14px' }}>{r.ia2}/{r.maxMarks}</td>
                  <td style={{ padding:'10px 14px' }}>{r.ia3}/{r.maxMarks}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--primary)' }}>{r.bestTwo}</td>
                  <td style={{ padding:'10px 14px' }}>{r.credits}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontWeight:700, color: gradeColor[r.grade] || 'var(--text)' }}>{r.grade || '-'}</span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>{r.gradePoint}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(r)}><Edit2 size={12}/></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:'2px solid var(--border)', background:'rgba(108,99,255,0.05)' }}>
                <td colSpan={8} style={{ padding:'12px 14px', fontWeight:700 }}>CGPA (Weighted)</td>
                <td colSpan={3} style={{ padding:'12px 14px', fontWeight:800, fontSize:18, color:'var(--primary)' }}>{cgpa}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:500 }}>
            <div className="modal-header">
              <h2>{editId ? '✏️ Edit Record' : '➕ Add Subject'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Subject Name *</label>
                  <input placeholder="e.g., DBMS" value={form.subject} onChange={f('subject')} required/>
                </div>
                <div className="form-group">
                  <label>Subject Code</label>
                  <input placeholder="e.g., CS3492" value={form.subjectCode} onChange={f('subjectCode')}/>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select value={form.semester} onChange={f('semester')}>
                    {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input type="number" min={1} max={5} value={form.credits} onChange={f('credits')}/>
                </div>
                <div className="form-group">
                  <label>IA 1 (/{form.maxMarks})</label>
                  <input type="number" min={0} max={form.maxMarks} value={form.ia1} onChange={f('ia1')}/>
                </div>
                <div className="form-group">
                  <label>IA 2 (/{form.maxMarks})</label>
                  <input type="number" min={0} max={form.maxMarks} value={form.ia2} onChange={f('ia2')}/>
                </div>
                <div className="form-group">
                  <label>IA 3 (/{form.maxMarks})</label>
                  <input type="number" min={0} max={form.maxMarks} value={form.ia3} onChange={f('ia3')}/>
                </div>
                <div className="form-group">
                  <label>Final Grade</label>
                  <select value={form.grade} onChange={f('grade')}>
                    {GRADES.map(g => <option key={g} value={g}>{g} ({GRADE_POINTS[g]} GP)</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">
                  {editId ? '✅ Update' : '✅ Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
