import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  CheckSquare, Clock, AlertTriangle, Trophy, Lightbulb,
  Users, MessageSquare, BarChart2, Settings, Shield,
  GraduationCap, ArrowRight, BookOpen
} from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];

const parseHours = (str) => {
  if (!str) return 0;
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  const s = str.match(/(\d+)s/);
  const hrs = h ? parseInt(h[1]) : 0;
  const mins = m ? parseInt(m[1]) : 0;
  const secs = s ? parseInt(s[1]) : 0;
  return hrs + (mins / 60) + (secs / 3600);
};

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Student states
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentTodos, setRecentTodos] = useState([]);
  const [timeStats, setTimeStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Preference form states
  const [prefHours, setPrefHours] = useState(user?.preferences?.studyGoalHours || 4);
  const [prefCGPA, setPrefCGPA] = useState(user?.preferences?.targetCGPA || 8.5);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Admin / Faculty states
  const [usersList, setUsersList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [pollsList, setPollsList] = useState([]);

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    try {
      if (isAdmin || isFaculty) {
        const [uRes, fRes, pRes] = await Promise.all([
          api.get('/users'),
          api.get('/feedback'),
          api.get('/polls/my'),
        ]);
        setUsersList(uRes.data.users || []);
        setFeedbacks(fRes.data.feedbacks || []);
        setPollsList(pRes.data.polls || []);
      } else {
        const [s, a, t, ts, lb, sg] = await Promise.all([
          api.get('/todos/stats'),
          api.get('/attendance/alerts'),
          api.get('/todos?limit=5&sort=newest'),
          api.get('/time/stats'),
          api.get('/todos/leaderboard'),
          api.get('/todos/suggestions'),
        ]);
        setStats(s.data.stats);
        setAlerts(a.data.alerts);
        setRecentTodos(t.data.todos);
        setTimeStats(ts.data);
        setLeaderboard(lb.data.leaderboard || []);
        setSuggestions(sg.data.suggestions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const { data } = await api.put('/auth/preferences', {
        studyGoalHours: Number(prefHours),
        targetCGPA: Number(prefCGPA),
      });
      updateUser(data.user);
      toast.success('Study preferences saved! 🎯');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) return (
    <div className="empty-state"><div className="icon">⏳</div><h3>Loading dashboard...</h3></div>
  );

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (isAdmin) {
    const totalFaculty = usersList.filter(u => u.role === 'faculty').length;
    const totalStudents = usersList.filter(u => u.role === 'student').length;
    const activeUsers = usersList.filter(u => u.isActive).length;
    const inactiveUsers = usersList.filter(u => !u.isActive).length;

    return (
      <div>
        <div className="page-header">
          <h1>🛡️ Admin Dashboard</h1>
          <p>{user?.department} Department · Organization Management</p>
        </div>

        {/* Admin stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,101,132,0.2)' }}>
              <Shield size={22} color="var(--secondary)" />
            </div>
            <div className="stat-info">
              <h3 style={{ color: 'var(--secondary)' }}>{totalFaculty}</h3>
              <p>Total Faculty</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.2)' }}>
              <GraduationCap size={22} color="var(--primary)" />
            </div>
            <div className="stat-info">
              <h3 style={{ color: 'var(--primary)' }}>{totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <Users size={22} color="var(--success)" />
            </div>
            <div className="stat-info">
              <h3 style={{ color: 'var(--success)' }}>{activeUsers}</h3>
              <p>Active Accounts</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.2)' }}>
              <Users size={22} color="var(--danger)" />
            </div>
            <div className="stat-info">
              <h3 style={{ color: 'var(--danger)' }}>{inactiveUsers}</h3>
              <p>Inactive Accounts</p>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 24, marginTop: 24 }}>
          {/* Quick links */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Management Quick Links</h2>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/users')}>
              <Users size={16} /> Manage User Accounts
            </button>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/feedback')}>
              <MessageSquare size={16} /> View Student Feedback
            </button>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/polls')}>
              <BarChart2 size={16} /> Manage Activity Polls
            </button>
          </div>

          {/* Active Polls */}
          <div className="card">
            <h2 className="section-title">🗳️ Active Polls</h2>
            {pollsList.length === 0 ? (
              <p className="text-muted">No active polls found.</p>
            ) : (
              pollsList.slice(0, 4).map(poll => (
                <div key={poll._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{poll.question}</span>
                  <span className={`badge ${poll.closed ? 'badge-high' : 'badge-low'}`}>
                    {poll.closed ? 'Closed' : 'Active'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Recent Feedback */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h2 className="section-title">💬 Recent Feedback Submissions</h2>
            {feedbacks.length === 0 ? (
              <p className="text-muted">No student feedback submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedbacks.slice(0, 5).map(fb => (
                  <div key={fb._id} style={{ padding: 12, background: 'var(--bg3)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>👤 {fb.student?.name} ({fb.student?.department})</span>
                      <span>📅 {new Date(fb.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{fb.subject}</div>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{fb.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FACULTY VIEW ───────────────────────────────────────────────────────────
  if (isFaculty) {
    const totalStudents = usersList.filter(u => u.role === 'student').length;

    return (
      <div>
        <div className="page-header">
          <h1>👩‍🏫 Faculty Dashboard</h1>
          <p>{user?.department} Department · Student Academic Coordinator</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.2)' }}>
              <GraduationCap size={22} color="var(--primary)" />
            </div>
            <div className="stat-info">
              <h3 style={{ color: 'var(--primary)' }}>{totalStudents}</h3>
              <p>Registered Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,101,132,0.2)' }}>
              <BookOpen size={22} color="var(--secondary)" />
            </div>
            <div className="stat-info">
              <h3 style={{ color: 'var(--secondary)' }}>{pollsList.length}</h3>
              <p>My Activity Polls</p>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/materials')}>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <Users size={22} color="var(--success)" />
            </div>
            <div className="stat-info">
              <h3>Upload</h3>
              <p>Study Materials</p>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 24, marginTop: 24 }}>
          {/* Quick links */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Faculty Actions</h2>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/users')}>
              <Users size={16} /> View Students List
            </button>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/materials')}>
              <GraduationCap size={16} /> Manage Course Materials
            </button>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/polls')}>
              <BarChart2 size={16} /> Create Activity Poll
            </button>
          </div>

          {/* Department Feedback */}
          <div className="card">
            <h2 className="section-title">💬 Student Feedback (My Dept)</h2>
            {feedbacks.length === 0 ? (
              <p className="text-muted">No student feedback found.</p>
            ) : (
              feedbacks.slice(0, 4).map(fb => (
                <div key={fb._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{fb.student?.name}</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{fb.subject}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STUDENT VIEW (DEFAULT) ──────────────────────────────────────────────────
  const trackedHours = parseHours(timeStats?.grandTotal);
  const goalHours = user?.preferences?.studyGoalHours || 4;
  const progressPercent = Math.min(Math.round((trackedHours / goalHours) * 100), 100);

  const statCards = [
    { icon: '📝', label: 'Total Todos', value: stats?.total || 0, bg: 'rgba(108,99,255,0.2)', color: '#6c63ff' },
    { icon: '✅', label: 'Completed', value: stats?.completed || 0, bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
    { icon: '⏳', label: 'Pending', value: stats?.pending || 0, bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    { icon: '🔴', label: 'Overdue', value: stats?.overdue || 0, bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
    { icon: '🔥', label: 'High Priority', value: stats?.highPriority || 0, bg: 'rgba(255,101,132,0.2)', color: '#ff6584' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>👋 Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p>{user?.department || 'SRM IST'} · {user?.regNumber || user?.role}</p>
      </div>

      {/* Attendance alerts */}
      {alerts.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--danger)', marginBottom: 24 }}>
          <div className="flex gap-2" style={{ alignItems: 'center', marginBottom: 12 }}>
            <AlertTriangle size={20} color="var(--danger)" />
            <strong style={{ color: 'var(--danger)' }}>⚠️ Attendance Danger Alert</strong>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="alert-banner alert-danger" style={{ marginBottom: 8 }}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <span>{s.icon}</span>
            </div>
            <div className="stat-info">
              <h3 style={{ color: s.color }}>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24, marginTop: 24 }}>
        {/* Recent Todos */}
        <div className="card">
          <div className="flex-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Todos</h2>
            <CheckSquare size={18} color="var(--primary)" />
          </div>
          {recentTodos.length === 0 ? (
            <p className="text-muted">No todos yet. Create your first one!</p>
          ) : recentTodos.map((todo) => (
            <div key={todo._id} style={{
              padding: '12px 0', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div className="fw-600" style={{ fontSize: 14, textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.title}</div>
                <div className="text-muted mt-1">{todo.category}</div>
              </div>
              <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
            </div>
          ))}
        </div>

        {/* Time Summary & Daily Goal progress */}
        <div className="card">
          <div className="flex-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Time Tracked</h2>
            <Clock size={18} color="var(--primary)" />
          </div>
          {!timeStats?.breakdown?.length ? (
            <p className="text-muted">No time tracked yet.</p>
          ) : (
            <>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div className="timer-display" style={{ fontSize: 28 }}>{timeStats.grandTotal}</div>
                <p className="text-muted" style={{ marginBottom: 8 }}>Total study time</p>
                {/* Goal progress indicator */}
                <div style={{ padding: '0 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Target Goal: {goalHours} hrs</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{progressPercent}% Complete</span>
                  </div>
                  <div className="attendance-bar-bg" style={{ height: 6 }}>
                    <div className="attendance-bar-fill safe" style={{ width: `${progressPercent}%`, height: '100%' }}></div>
                  </div>
                </div>
              </div>
              {timeStats.breakdown.slice(0, 4).map((b, i) => (
                <div key={i} style={{
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <span className="text-sm">{b.todo}</span>
                  <span className="text-sm fw-600" style={{ color: 'var(--primary)' }}>{b.totalFormatted}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Study Preferences settings form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>🎯 Set My Study Preferences</h2>
            <Settings size={18} color="var(--primary)" />
          </div>
          <form onSubmit={handleSavePreferences} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Daily Study Goal (Hours)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={prefHours}
                  onChange={(e) => setPrefHours(e.target.value)}
                  style={{ flex: 1, padding: 0 }}
                />
                <span style={{ minWidth: 40, fontWeight: 700, textAlign: 'right' }}>{prefHours}h</span>
              </div>
            </div>

            <div className="form-group">
              <label>Target CGPA</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="number"
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  value={prefCGPA}
                  onChange={(e) => setPrefCGPA(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={savingPrefs}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* 🏆 Leaderboard */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex-between mb-4">
            <h2 className="section-title" style={{ marginBottom: 0 }}>🏆 Weekly Leaderboard</h2>
            <Trophy size={18} color="var(--warning)" />
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-muted">No completions this week yet. Complete todos to appear here!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaderboard.map((entry, i) => (
                <div key={entry._id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px', borderRadius: 10,
                  background: i === 0 ? 'rgba(245,158,11,0.1)' : i === 1 ? 'rgba(148,163,184,0.08)' : i === 2 ? 'rgba(180,120,60,0.08)' : 'var(--bg3)',
                  border: i < 3 ? `1px solid ${i === 0 ? 'rgba(245,158,11,0.3)' : i === 1 ? 'rgba(148,163,184,0.2)' : 'rgba(180,120,60,0.2)'}` : '1px solid transparent',
                }}>
                  <span style={{ fontSize: i < 3 ? 22 : 14, minWidth: 28, textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {MEDALS[i] || `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.department} · {entry.role}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-muted)' : 'var(--primary)' }}>
                    {entry.count}
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>done</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🤖 AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="flex-between mb-4">
              <h2 className="section-title" style={{ marginBottom: 0 }}>🤖 AI Suggestions</h2>
              <Lightbulb size={18} color="var(--warning)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {suggestions.map((s, i) => {
                const bg = { urgent: 'rgba(239,68,68,0.08)', warning: 'rgba(245,158,11,0.08)', info: 'rgba(59,130,246,0.08)', tip: 'rgba(108,99,255,0.08)', success: 'rgba(16,185,129,0.08)' };
                const border = { urgent: 'var(--danger)', warning: 'var(--warning)', info: '#3b82f6', tip: 'var(--primary)', success: 'var(--success)' };
                return (
                  <div key={i} style={{
                    padding: 14, borderRadius: 10, background: bg[s.type] || 'var(--bg3)',
                    borderLeft: `3px solid ${border[s.type] || 'var(--primary)'}`,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>{s.message}</p>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate(s.link)}
                      style={{ fontSize: 12 }}>
                      {s.action} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
