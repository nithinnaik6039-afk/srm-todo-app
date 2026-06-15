import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Clock } from 'lucide-react';

const DAYS     = ['Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday' };
const SEMESTERS= ['1','2','3','4','5','6','7','8'];
const TYPES    = ['lecture','lab','tutorial','break'];
const COLORS   = ['#6c63ff','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6'];

const SLOT_COLORS = {
  lecture:  '#6c63ff',
  lab:      '#10b981',
  tutorial: '#f59e0b',
  break:    '#94a3b8',
};

// Build 1-hour time slots from 08:00 to 18:00
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => {
  const h = i + 8;
  return `${String(h).padStart(2,'0')}:00`;
});

const emptyForm = { day:'Mon', time:'09:00', endTime:'10:00', subject:'', faculty:'', room:'', type:'lecture', color:'' };

export default function Timetable() {
  const [timetable, setTimetable] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [semester,  setSemester]  = useState('1');

  const load = async () => {
    try {
      const { data } = await api.get('/timetable');
      setTimetable(data.timetable);
      if (data.timetable?.semester) setSemester(data.timetable.semester);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const color = form.color || SLOT_COLORS[form.type] || '#6c63ff';
      const { data } = await api.post('/timetable/slot', { ...form, color });
      setTimetable(data.timetable);
      setShowModal(false);
      setForm(emptyForm);
      toast.success('Class added! 📚');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const { data } = await api.delete(`/timetable/slot/${slotId}`);
      setTimetable(data.timetable);
    } catch { toast.error('Failed to remove'); }
  };

  const handleSemesterChange = async (sem) => {
    setSemester(sem);
    try { await api.put('/timetable/semester', { semester: sem }); } catch {}
  };

  // Group slots by day
  const slotsByDay = {};
  (timetable?.slots || []).forEach(slot => {
    if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
    slotsByDay[slot.day].push(slot);
  });

  // Sort slots by time within each day
  DAYS.forEach(day => {
    if (slotsByDay[day]) slotsByDay[day].sort((a,b) => a.time.localeCompare(b.time));
  });

  const today = DAYS[new Date().getDay() - 1]; // Mon=0

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>📋 Timetable</h1>
            <p>Semester {semester} · {(timetable?.slots||[]).length} classes scheduled</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <select value={semester} onChange={e => handleSemesterChange(e.target.value)}
              style={{ padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 }}>
              {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16}/> Add Class
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : (
        <div>
          {/* Legend */}
          <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            {TYPES.map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                <div style={{ width:12, height:12, borderRadius:3, background:SLOT_COLORS[t] }}/>
                <span style={{ color:'var(--text-muted)', textTransform:'capitalize' }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Weekly Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'80px repeat(6,1fr)', gap:4, overflowX:'auto' }}>
            {/* Header row */}
            <div style={{ padding:'8px 4px', fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Time</div>
            {DAYS.map(day => (
              <div key={day} style={{
                padding:'8px', textAlign:'center', fontWeight:700, fontSize:13, borderRadius:8,
                background: day === today ? 'rgba(108,99,255,0.15)' : 'var(--bg3)',
                color: day === today ? 'var(--primary)' : 'var(--text)',
                border: day === today ? '1px solid var(--primary)' : '1px solid var(--border)',
              }}>
                {day}
                {day === today && <div style={{ fontSize:9, color:'var(--primary)' }}>TODAY</div>}
              </div>
            ))}

            {/* Time slots */}
            {TIME_SLOTS.map(time => (
              <>
                <div key={`t-${time}`} style={{ padding:'6px 4px', fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'flex-start', paddingTop:10 }}>
                  <Clock size={10} style={{ marginRight:3, marginTop:1 }}/>{time}
                </div>
                {DAYS.map(day => {
                  const slot = slotsByDay[day]?.find(s => s.time === time);
                  return (
                    <div key={`${day}-${time}`} style={{
                      minHeight: 52, borderRadius:8, padding:4,
                      background: slot ? `${slot.color}22` : 'var(--bg3)',
                      border: slot ? `1px solid ${slot.color}66` : '1px solid var(--border)',
                      position:'relative', transition:'all 0.15s',
                    }}>
                      {slot && (
                        <div style={{ height:'100%' }}>
                          <div style={{ fontSize:11, fontWeight:700, color: slot.color, lineHeight:1.2 }}>
                            {slot.subject}
                          </div>
                          {slot.faculty && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{slot.faculty}</div>}
                          {slot.room    && <div style={{ fontSize:10, color:'var(--text-muted)' }}>🏫 {slot.room}</div>}
                          <button
                            onClick={() => handleDeleteSlot(slot._id)}
                            style={{ position:'absolute', top:2, right:2, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:10, padding:2, opacity:0.6 }}>
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          {/* Today's Schedule */}
          {today && slotsByDay[today]?.length > 0 && (
            <div className="card" style={{ marginTop:20 }}>
              <h3 style={{ marginBottom:12 }}>📅 Today's Schedule ({DAY_FULL[today]})</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {slotsByDay[today].map(slot => (
                  <div key={slot._id} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                    borderRadius:8, background:'var(--bg3)',
                    borderLeft:`4px solid ${slot.color}`,
                  }}>
                    <div style={{ fontWeight:700, color:'var(--text-muted)', fontSize:13, minWidth:50 }}>{slot.time}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{slot.subject}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{slot.faculty} {slot.room && `· ${slot.room}`}</div>
                    </div>
                    <span style={{ fontSize:11, background:`${slot.color}22`, color:slot.color, padding:'3px 8px', borderRadius:6, textTransform:'capitalize' }}>
                      {slot.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Slot Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:460 }}>
            <div className="modal-header">
              <h2>📚 Add Class</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X/></button>
            </div>
            <form onSubmit={handleAddSlot}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Day *</label>
                  <select value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                    {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value, color: SLOT_COLORS[e.target.value] || ''})}>
                    {TYPES.map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}/>
                </div>
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input placeholder="e.g., DBMS" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required/>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Faculty</label>
                  <input placeholder="e.g., Dr. Rajesh" value={form.faculty} onChange={e => setForm({...form, faculty: e.target.value})}/>
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input placeholder="e.g., AB1-301" value={form.room} onChange={e => setForm({...form, room: e.target.value})}/>
                </div>
              </div>
              {/* Color */}
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker-row">
                  {COLORS.map(c => (
                    <div key={c} className={`color-swatch${form.color===c?' active':''}`}
                      style={{ background:c }} onClick={() => setForm({...form, color:c})}/>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">📚 Add Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
