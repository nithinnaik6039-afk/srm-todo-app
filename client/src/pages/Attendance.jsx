import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { exportAttendancePDF } from '../utils/exportPDF';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, X, AlertTriangle, BookOpen, TrendingUp, Download } from 'lucide-react';

const statusColor = { safe:'var(--success)', warning:'var(--warning)', danger:'var(--danger)' };
const statusEmoji = { safe:'🟢', warning:'🟡', danger:'🔴' };

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords]  = useState([]);
  const [summary, setSummary]  = useState(null);
  const [alerts,  setAlerts]   = useState([]);
  const [loading, setLoading]  = useState(true);
  const [showAdd, setShowAdd]  = useState(false);
  const [logModal, setLogModal]= useState(null); // record id
  const [form, setForm] = useState({ subject:'', subjectCode:'', faculty:'', minimumRequired:75 });
  const [logForm, setLogForm] = useState({ status:'present', note:'' });

  const load = async () => {
    try {
      const [r, s, a] = await Promise.all([
        api.get('/attendance'),
        api.get('/attendance/summary'),
        api.get('/attendance/alerts'),
      ]);
      setRecords(r.data.attendance);
      setSummary(s.data.summary);
      setAlerts(a.data.alerts);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance', form);
      toast.success('Subject added!');
      setShowAdd(false);
      setForm({ subject:'', subjectCode:'', faculty:'', minimumRequired:75 });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/attendance/${logModal}/log`, logForm);
      toast.success(`Marked as ${logForm.status} ✅`);
      setLogModal(null);
      setLogForm({ status:'present', note:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this subject?')) return;
    try { await api.delete(`/attendance/${id}`); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div><h1>📈 Attendance Tracker</h1><p>Track your SRM subject attendance — stay above 75%!</p></div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => exportAttendancePDF(records, user?.name)} title="Export PDF">
              <Download size={15}/> PDF
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16}/> Add Subject</button>
          </div>
        </div>
      </div>

      {/* Danger Alerts */}
      {alerts.length > 0 && (
        <div className="card mb-4" style={{ borderLeft:'4px solid var(--danger)', marginBottom:20 }}>
          <div className="flex gap-2" style={{ alignItems:'center', marginBottom:10 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <strong style={{ color:'var(--danger)' }}>{alerts.length} Subject(s) Below Minimum!</strong>
          </div>
          {alerts.map((a,i) => (
            <div key={i} className="alert-banner alert-danger">{a.message}</div>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom:24 }}>
          {[
            { label:'Subjects',    value: summary.subjects,           color:'var(--primary)' },
            { label:'Overall %',   value: summary.overallPercentage+'%', color: summary.overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)' },
            { label:'🟢 Safe',     value: summary.safeSubjects,       color:'var(--success)' },
            { label:'🟡 Warning',  value: summary.warningSubjects,    color:'var(--warning)' },
            { label:'🔴 Danger',   value: summary.dangerSubjects,     color:'var(--danger)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-info">
                <h3 style={{ color: s.color }}>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subject Cards */}
      {records.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><BookOpen size={48} /></div>
          <h3>No subjects yet</h3>
          <p>Add your subjects to start tracking attendance</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
          {records.map((rec) => (
            <div key={rec._id} className="card" style={{ borderLeft:`4px solid ${statusColor[rec.insights?.status]}` }}>
              <div className="flex-between mb-4">
                <div>
                  <div className="fw-600" style={{ fontSize:16 }}>
                    {statusEmoji[rec.insights?.status]} {rec.subject}
                  </div>
                  {rec.subjectCode && <div className="text-muted text-sm">{rec.subjectCode}</div>}
                  {rec.faculty && <div className="text-muted text-sm">👨‍🏫 {rec.faculty}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:28, fontWeight:800, color: statusColor[rec.insights?.status] }}>
                    {rec.percentage}%
                  </div>
                  <div className="text-muted text-sm">{rec.attendedClasses}/{rec.totalClasses} classes</div>
                </div>
              </div>

              <div className="attendance-bar-wrap">
                <div className="attendance-bar-bg">
                  <div className={`attendance-bar-fill ${rec.insights?.status}`}
                    style={{ width: `${Math.min(rec.percentage, 100)}%` }} />
                </div>
                <div className="text-muted text-sm mt-1">{rec.insights?.alertMessage}</div>
              </div>

              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button className="btn btn-sm btn-primary" onClick={() => setLogModal(rec._id)}>
                  📋 Log Class
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rec._id)}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Subject</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X/></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group"><label>Subject Name *</label>
                <input placeholder="e.g., DBMS" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required/>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Subject Code</label>
                  <input placeholder="CS3492" value={form.subjectCode} onChange={e=>setForm({...form,subjectCode:e.target.value})}/>
                </div>
                <div className="form-group"><label>Min Required %</label>
                  <input type="number" min={1} max={100} value={form.minimumRequired} onChange={e=>setForm({...form,minimumRequired:Number(e.target.value)})}/>
                </div>
              </div>
              <div className="form-group"><label>Faculty Name</label>
                <input placeholder="Dr. Smith" value={form.faculty} onChange={e=>setForm({...form,faculty:e.target.value})}/>
              </div>
              <div style={{display:'flex',gap:12}}>
                <button type="button" className="btn btn-outline btn-full" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Class Modal */}
      {logModal && (
        <div className="modal-overlay" onClick={() => setLogModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Attendance</h2>
              <button className="modal-close" onClick={() => setLogModal(null)}><X/></button>
            </div>
            <form onSubmit={handleLog}>
              <div className="form-group"><label>Status</label>
                <select value={logForm.status} onChange={e=>setLogForm({...logForm,status:e.target.value})}>
                  <option value="present">✅ Present</option>
                  <option value="absent">❌ Absent</option>
                  <option value="od">📋 On Duty (OD)</option>
                  <option value="medical">🏥 Medical Leave</option>
                </select>
              </div>
              <div className="form-group"><label>Note (optional)</label>
                <input placeholder="e.g., Lab session" value={logForm.note} onChange={e=>setLogForm({...logForm,note:e.target.value})}/>
              </div>
              <div style={{display:'flex',gap:12}}>
                <button type="button" className="btn btn-outline btn-full" onClick={()=>setLogModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Log Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
