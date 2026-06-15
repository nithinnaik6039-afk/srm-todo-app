import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Play, Square, RotateCcw, Clock } from 'lucide-react';

export default function TimeTracker() {
  const [todos,      setTodos]      = useState([]);
  const [selected,   setSelected]   = useState('');
  const [entry,      setEntry]      = useState(null);
  const [stats,      setStats]      = useState(null);
  const [elapsed,    setElapsed]    = useState(0);
  const [loading,    setLoading]    = useState(false);
  const intervalRef = useRef(null);

  const loadTodos = async () => {
    const { data } = await api.get('/todos?completed=false&limit=50');
    setTodos(data.todos);
  };

  const loadEntry = async (todoId) => {
    if (!todoId) return;
    const { data } = await api.get(`/time/${todoId}`);
    setEntry(data.entry);
    if (data.entry?.isRunning) startLocalTimer(data.entry);
    else { clearInterval(intervalRef.current); setElapsed(0); }
  };

  const loadStats = async () => {
    const { data } = await api.get('/time/stats');
    setStats(data);
  };

  useEffect(() => { loadTodos(); loadStats(); return () => clearInterval(intervalRef.current); }, []);
  useEffect(() => { loadEntry(selected); }, [selected]);

  const startLocalTimer = (e) => {
    clearInterval(intervalRef.current);
    const lastSession = [...(e?.sessions || [])].reverse().find(s => !s.endTime);
    if (!lastSession) return;
    const startMs = new Date(lastSession.startTime).getTime();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
  };

  const handleStart = async () => {
    if (!selected) return toast.error('Select a todo first');
    setLoading(true);
    try {
      await api.post(`/time/${selected}/start`);
      toast.success('⏱️ Timer started!');
      await loadEntry(selected);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    clearInterval(intervalRef.current);
    try {
      const { data } = await api.patch(`/time/${selected}/stop`);
      toast.success(`⏹️ Stopped — ${data.sessionDuration}`);
      setElapsed(0);
      await loadEntry(selected);
      loadStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!confirm('Reset all time for this todo?')) return;
    clearInterval(intervalRef.current);
    setElapsed(0);
    await api.delete(`/time/${selected}/reset`);
    toast.success('Timer reset');
    setEntry(null);
    loadStats();
  };

  const fmt = (s) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const isRunning = entry?.isRunning;

  return (
    <div>
      <div className="page-header">
        <h1>⏱️ Time Tracker</h1>
        <p>Track study time for each task</p>
      </div>

      <div className="grid-2" style={{ gap:24, alignItems:'start' }}>
        {/* Timer Card */}
        <div className="card" style={{ textAlign:'center' }}>
          <h2 className="section-title">Timer</h2>

          <div className="form-group">
            <label>Select a Todo</label>
            <select id="time-todo-select" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">-- Choose a todo --</option>
              {todos.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </div>

          {/* Clock Display */}
          <div className="timer-display">
            {isRunning ? fmt(elapsed) : entry ? fmt(entry.totalDuration) : '00:00:00'}
          </div>
          <p className="text-muted" style={{ marginBottom:24 }}>
            {isRunning ? '🔴 Timer running...' : entry ? `Total: ${entry.totalDuration}s tracked` : 'Not started'}
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            {!isRunning ? (
              <button id="timer-start" className="btn btn-success" onClick={handleStart} disabled={loading||!selected}>
                <Play size={16}/> Start
              </button>
            ) : (
              <button id="timer-stop" className="btn btn-danger" onClick={handleStop} disabled={loading}>
                <Square size={16}/> Stop
              </button>
            )}
            {entry && (
              <button className="btn btn-outline" onClick={handleReset} disabled={loading}>
                <RotateCcw size={16}/> Reset
              </button>
            )}
          </div>

          {/* Sessions */}
          {entry?.sessions?.length > 0 && (
            <div style={{ marginTop:24, textAlign:'left' }}>
              <h3 className="section-title">Sessions</h3>
              {[...entry.sessions].reverse().slice(0,5).map((s,i) => (
                <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span className="text-muted">{new Date(s.startTime).toLocaleTimeString()}</span>
                  <span className="fw-600" style={{ color:'var(--primary)' }}>
                    {s.duration ? `${Math.floor(s.duration/60)}m ${s.duration%60}s` : '🔴 Running'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="card">
          <div className="flex-between mb-4">
            <h2 className="section-title" style={{ marginBottom:0 }}>Study Summary</h2>
            <Clock size={18} color="var(--primary)"/>
          </div>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div className="timer-display" style={{ fontSize:32 }}>{stats?.grandTotal || '0h 0m 0s'}</div>
            <p className="text-muted">Total time tracked</p>
          </div>
          {!stats?.breakdown?.length ? (
            <p className="text-muted">Start tracking to see your summary here.</p>
          ) : stats.breakdown.map((b,i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div className="flex-between">
                <div>
                  <div className="fw-600 text-sm">{b.todo}</div>
                  <div className="text-muted text-sm">{b.category} · {b.sessions} session(s)</div>
                </div>
                <span className="fw-600" style={{ color:'var(--primary)' }}>{b.totalFormatted}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
