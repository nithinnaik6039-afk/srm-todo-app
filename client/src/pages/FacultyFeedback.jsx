import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Star, X, Trash2 } from 'lucide-react';

const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const FACULTIES  = ['Dr. Rajesh Kumar','Prof. Priya Sharma','Dr. Venkat Rao','Dr. Anitha S','Prof. Karthik M','Other'];
const SUBJECTS   = ['Mathematics','Physics','Chemistry','DBMS','Networks','OS','DSA','Software Engineering','Other'];

const emptyForm = {
  subject:'', faculty:'', semester:'1',
  rating:5, teaching:5, clarity:5, helpfulness:5,
  comment:'', isAnonymous:false,
};

function StarRating({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:4 }}>{label}</label>
      <div style={{ display:'flex', gap:4 }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button"
            onClick={() => onChange(s)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, padding:0,
              color: s <= value ? '#f59e0b' : 'var(--border)', transition:'color 0.15s' }}>
            ★
          </button>
        ))}
        <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:6, alignSelf:'center' }}>
          {value}/5
        </span>
      </div>
    </div>
  );
}

export default function FacultyFeedback() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary,   setSummary]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [tab,       setTab]       = useState('list'); // 'list' | 'summary'

  const isStudent = user?.role === 'student';
  const isAdmin   = ['admin','faculty'].includes(user?.role);

  const load = async () => {
    try {
      const calls = [api.get('/feedback')];
      if (isAdmin) calls.push(api.get('/feedback/summary'));
      const [fb, sum] = await Promise.all(calls);
      setFeedbacks(fb.data.feedbacks || []);
      if (sum) setSummary(sum.data.summary || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', form);
      toast.success('Feedback submitted! Thank you 🙏');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try { await api.delete(`/feedback/${id}`); setFeedbacks(f => f.filter(x => x._id !== id)); }
    catch { toast.error('Failed'); }
  };

  const f = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));

  const ratingLabel = (r) => ['','Poor','Fair','Good','Very Good','Excellent'][Math.round(r)] || '';

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>📝 Faculty Feedback</h1>
            <p>{isStudent ? 'Share your experience' : 'Student feedback overview'}</p>
          </div>
          {isStudent && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Star size={16}/> Submit Feedback
            </button>
          )}
        </div>
      </div>

      {/* Tab toggle for admin/faculty */}
      {isAdmin && (
        <div style={{ display:'flex', gap:4, marginBottom:20 }}>
          {['list','summary'].map(t => (
            <button key={t} className={`btn btn-sm ${tab===t?'btn-primary':'btn-outline'}`}
              onClick={() => setTab(t)} style={{ textTransform:'capitalize' }}>
              {t === 'list' ? '📋 All Feedback' : '📊 Summary'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : tab === 'summary' && isAdmin ? (
        /* ── Summary View ── */
        <div>
          {summary.length === 0 ? (
            <div className="empty-state"><div className="icon">📭</div><h3>No feedback yet</h3></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {summary.map((s, i) => (
                <div key={s._id} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div>
                      <h3 style={{ fontWeight:700 }}>{s._id}</h3>
                      <p style={{ fontSize:13, color:'var(--text-muted)' }}>{s.totalResponses} responses · {s.subjects.join(', ')}</p>
                    </div>
                    <div style={{ fontSize:32, fontWeight:800, color:'var(--warning)' }}>
                      {s.avgRating.toFixed(1)} ⭐
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                    {[
                      { label:'Teaching',    val: s.avgTeaching },
                      { label:'Clarity',     val: s.avgClarity },
                      { label:'Helpfulness', val: s.avgHelpfulness },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background:'var(--bg3)', borderRadius:8, padding:12, textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:700, color:'var(--primary)' }}>{val.toFixed(1)}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{label}</div>
                        <div style={{ color:'var(--warning)', fontSize:14 }}>{'★'.repeat(Math.round(val))}{'☆'.repeat(5-Math.round(val))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── List View ── */
        <div>
          {feedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>{isStudent ? 'You haven\'t submitted any feedback yet' : 'No feedback received yet'}</h3>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {feedbacks.map(fb => (
                <div key={fb._id} className="card" style={{ padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700 }}>{fb.faculty}</span>
                        <span style={{ background:'var(--bg3)', borderRadius:6, padding:'2px 8px', fontSize:12 }}>{fb.subject}</span>
                        <span style={{ background:'var(--bg3)', borderRadius:6, padding:'2px 8px', fontSize:12 }}>Sem {fb.semester}</span>
                        {fb.isAnonymous && <span style={{ background:'rgba(108,99,255,0.15)', color:'var(--primary)', borderRadius:6, padding:'2px 8px', fontSize:11 }}>Anonymous</span>}
                      </div>
                      {!fb.isAnonymous && fb.student && (
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                          By: {fb.student.name} ({fb.student.regNumber || 'N/A'})
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:'var(--warning)' }}>{fb.rating}⭐</div>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(fb._id)}><Trash2 size={12}/></button>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
                    {[['Teaching', fb.teaching], ['Clarity', fb.clarity], ['Helpfulness', fb.helpfulness]].map(([lbl, val]) => (
                      <div key={lbl} style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {lbl}: <span style={{ color:'var(--warning)' }}>{'★'.repeat(val)}{'☆'.repeat(5-val)}</span>
                      </div>
                    ))}
                  </div>

                  {fb.comment && (
                    <p style={{ fontSize:13, marginTop:10, padding:'8px 12px', background:'var(--bg3)', borderRadius:8, borderLeft:'3px solid var(--primary)' }}>
                      "{fb.comment}"
                    </p>
                  )}
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>
                    {new Date(fb.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:500 }}>
            <div className="modal-header">
              <h2>⭐ Submit Feedback</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Subject *</label>
                  <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required>
                    <option value="">Select</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Faculty *</label>
                  <select value={form.faculty} onChange={e => setForm({...form, faculty: e.target.value})} required>
                    <option value="">Select</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                    {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>

              <StarRating label="Overall Rating *"      value={form.rating}      onChange={f('rating')} />
              <StarRating label="Teaching Quality"      value={form.teaching}    onChange={f('teaching')} />
              <StarRating label="Explanation Clarity"   value={form.clarity}     onChange={f('clarity')} />
              <StarRating label="Helpfulness / Doubt Solving" value={form.helpfulness} onChange={f('helpfulness')} />

              <div className="form-group">
                <label>Comments (optional)</label>
                <textarea rows={3} placeholder="Share your experience..."
                  value={form.comment} onChange={e => setForm({...form, comment: e.target.value})}/>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <input type="checkbox" id="anon" checked={form.isAnonymous}
                  onChange={e => setForm({...form, isAnonymous: e.target.checked})}/>
                <label htmlFor="anon" style={{ fontSize:13, cursor:'pointer' }}>Submit Anonymously</label>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">⭐ Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
