import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import { exportTodosPDF } from '../utils/exportPDF';
import { Plus, Trash2, CheckCircle, Circle, X, Search, MessageCircle, Download, Share2, Copy, Globe, Lock, Building2 } from 'lucide-react';

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['academic', 'event', 'personal', 'admin', 'other'];

const LABEL_COLORS = [
  '#6c63ff','#ff6584','#10b981','#f59e0b',
  '#3b82f6','#ec4899','#14b8a6','#f97316',
];

const emptyForm = {
  title:'', description:'', priority:'medium',
  category:'academic', dueDate:'', labelColor:'',
};

// ── Due date badge helper ────────────────────────────────
function DueBadge({ dueDate }) {
  if (!dueDate) return null;
  const now   = new Date(); now.setHours(0,0,0,0);
  const due   = new Date(dueDate); due.setHours(0,0,0,0);
  const diffD = Math.round((due - now) / 86400000);
  if (diffD < 0)  return <span className="due-badge due-overdue">🔴 Overdue {Math.abs(diffD)}d ago</span>;
  if (diffD === 0) return <span className="due-badge due-today">🟡 Due Today!</span>;
  if (diffD === 1) return <span className="due-badge due-tomorrow">🟢 Due Tomorrow</span>;
  return <span className="due-badge due-upcoming">📅 Due in {diffD}d</span>;
}

// ── Subtask progress bar ─────────────────────────────────
function ProgressBar({ subTasks = [] }) {
  if (!subTasks.length) return null;
  const done = subTasks.filter(s => s.completed).length;
  const pct  = Math.round((done / subTasks.length) * 100);
  return (
    <div className="todo-progress">
      <div className="todo-progress-label">
        <span>Subtasks</span>
        <span>{done}/{subTasks.length} ({pct}%)</span>
      </div>
      <div className="todo-progress-track">
        <div className="todo-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Todos() {
  const [todos,     setTodos]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [submitting,setSubmitting]= useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState({ priority:'', category:'', completed:'' });
  const [pinned,    setPinned]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('pinnedTodos') || '[]'); } catch { return []; }
  });
  const [openComments,  setOpenComments]  = useState(null);
  const [shareModal,    setShareModal]    = useState(null); // todo object

  const { user } = useAuth();
  const socketRef = useSocket();

  const fetchTodos = async () => {
    try {
      const params = {};
      if (filter.priority)  params.priority  = filter.priority;
      if (filter.category)  params.category  = filter.category;
      if (filter.completed) params.completed = filter.completed;
      const { data } = await api.get('/todos', { params });
      setTodos(data.todos || []);
    } catch { toast.error('Failed to load todos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTodos(); }, [filter]);

  // ── Socket listeners ──
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const onCreated = () => { fetchTodos(); toast('📝 New todo!', { icon: '✨' }); };
    const onUpdated = () => fetchTodos();
    const onDeleted = () => fetchTodos();
    const onNotif   = (d) => toast(d.message, { icon: '📌', duration: 6000 });
    socket.on('todo:created', onCreated);
    socket.on('todo:updated', onUpdated);
    socket.on('todo:deleted', onDeleted);
    socket.on('notification', onNotif);
    return () => {
      socket.off('todo:created', onCreated);
      socket.off('todo:updated', onUpdated);
      socket.off('todo:deleted', onDeleted);
      socket.off('notification', onNotif);
    };
  }, [socketRef?.current]);

  // ── Handlers ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/todos', form);
      toast.success('Todo created! ✅');
      setShowModal(false);
      setForm(emptyForm);
      fetchTodos();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const toggleComplete = async (id) => {
    try { await api.patch(`/todos/${id}/complete`); fetchTodos(); }
    catch { toast.error('Failed to update'); }
  };

  const deleteTodo = async (id) => {
    if (!confirm('Delete this todo?')) return;
    try { await api.delete(`/todos/${id}`); toast.success('Deleted'); fetchTodos(); }
    catch { toast.error('Failed to delete'); }
  };

  const togglePin = (id) => {
    const next = pinned.includes(id)
      ? pinned.filter(p => p !== id)
      : [...pinned, id];
    setPinned(next);
    localStorage.setItem('pinnedTodos', JSON.stringify(next));
  };

  // ── Filtered + sorted (pinned first) ──
  const filtered = todos
    .filter(t =>
      (!search || t.title.toLowerCase().includes(search.toLowerCase()) ||
       t.description?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const ap = pinned.includes(a._id) ? 0 : 1;
      const bp = pinned.includes(b._id) ? 0 : 1;
      return ap - bp;
    });

  const priorityColor = {
    high:'var(--danger)', medium:'var(--warning)', low:'var(--success)'
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>📝 My Todos</h1>
            <p>{todos.length} tasks · {todos.filter(t => !t.completed).length} pending</p>
          </div>
          <button id="create-todo-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16}/> New Todo
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => exportTodosPDF(filtered, user?.name)}
            title="Export as PDF">
            <Download size={15}/> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-sm" style={{ marginBottom: 20 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:160 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input
              style={{ paddingLeft:32, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 8px 8px 32px', color:'var(--text)', width:'100%', fontSize:13, outline:'none' }}
              placeholder="Search todos..." value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {[
            { val: filter.priority, key:'priority', opts: PRIORITIES, label:'All Priorities' },
            { val: filter.category, key:'category', opts: CATEGORIES, label:'All Categories' },
          ].map(({ val, key, opts, label }) => (
            <select key={key}
              style={{ padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 }}
              value={val} onChange={e => setFilter({...filter, [key]: e.target.value})}>
              <option value="">{label}</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <select
            style={{ padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 }}
            value={filter.completed} onChange={e => setFilter({...filter, completed: e.target.value})}>
            <option value="">All Status</option>
            <option value="false">Pending</option>
            <option value="true">Completed</option>
          </select>
        </div>
      </div>

      {/* Todo Grid */}
      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No todos found</h3>
          <p>Create your first todo to get started!</p>
        </div>
      ) : (
        <div className="todo-grid">
          {filtered.map((todo) => {
            const isPinned  = pinned.includes(todo._id);
            const borderCol = todo.labelColor || priorityColor[todo.priority];
            return (
              <div key={todo._id}
                className={`todo-card${todo.completed ? ' completed' : ''}${isPinned ? ' pinned' : ''}`}
                style={{ borderLeftColor: borderCol }}>

                {/* Header */}
                <div className="todo-card-header">
                  <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0 }}>
                    {todo.labelColor && (
                      <div style={{ width:10, height:10, borderRadius:'50%', background:todo.labelColor, flexShrink:0 }}/>
                    )}
                    <span className={`todo-title${todo.completed ? ' done' : ''}`}>{todo.title}</span>
                    {isPinned && <span className="pin-badge">📌 Pinned</span>}
                  </div>
                  <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
                </div>

                {/* Description */}
                {todo.description && <p className="todo-desc">{todo.description}</p>}

                {/* Progress bar (subtasks) */}
                <ProgressBar subTasks={todo.subTasks} />

                {/* Meta */}
                <div className="todo-meta" style={{ flexWrap:'wrap', gap:6 }}>
                  <span className="badge badge-pending">{todo.category}</span>
                  <DueBadge dueDate={todo.dueDate} />
                  {todo.subTasks?.length > 0 && (
                    <span className="text-muted text-sm">
                      ☑️ {todo.subTasks.filter(s => s.completed).length}/{todo.subTasks.length}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="todo-actions">
                  <button className={`btn btn-sm ${todo.completed ? 'btn-outline' : 'btn-success'}`}
                    onClick={() => toggleComplete(todo._id)}>
                    {todo.completed ? <Circle size={14}/> : <CheckCircle size={14}/>}
                    {todo.completed ? 'Undo' : 'Done'}
                  </button>
                  <button className={`btn btn-sm btn-pin${isPinned ? ' pinned' : ''}`}
                    onClick={() => togglePin(todo._id)} title={isPinned ? 'Unpin' : 'Pin'}>
                    📌
                  </button>
                  <button className="btn btn-sm btn-outline"
                    onClick={() => setOpenComments(openComments === todo._id ? null : todo._id)}
                    title="Comments">
                    <MessageCircle size={13}/>
                  </button>
                  <button className="btn btn-sm btn-outline"
                    onClick={() => setShareModal(todo)}
                    title="Share">
                    <Share2 size={13}/>
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTodo(todo._id)}>
                    <Trash2 size={14}/>
                  </button>
                </div>

                {/* Comments Section */}
                {openComments === todo._id && (
                  <Comments todoId={todo._id} todoTitle={todo.title} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {shareModal && <ShareModal todo={shareModal} onClose={() => setShareModal(null)} />}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✨ Create New Todo</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title *</label>
                <input id="todo-title" placeholder="e.g., Submit DBMS assignment"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea id="todo-desc" rows={3} placeholder="Add details..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select id="todo-priority" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select id="todo-category" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input id="todo-due" type="date" value={form.dueDate}
                  onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
              {/* 🎨 Color Label Picker */}
              <div className="form-group">
                <label>Color Label</label>
                <div className="color-picker-row">
                  <div className={`color-swatch${!form.labelColor ? ' active' : ''}`}
                    style={{ background:'var(--border)', border:'2px dashed var(--text-muted)' }}
                    onClick={() => setForm({...form, labelColor:''})}
                    title="No color"
                  />
                  {LABEL_COLORS.map(c => (
                    <div key={c} className={`color-swatch${form.labelColor === c ? ' active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({...form, labelColor: c})}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select id="todo-visibility" value={form.visibility || 'private'} onChange={e => setForm({...form, visibility: e.target.value})}>
                  <option value="private">🔒 Private (only me)</option>
                  <option value="department">🏢 Department (my dept)</option>
                  <option value="public">🌐 Public (everyone)</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="todo-submit" type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                  {submitting ? 'Creating...' : '✅ Create Todo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Share Modal (rendered outside main component to avoid state issues) ────
function ShareModal({ todo, onClose }) {
  const shareUrl = `${window.location.origin}/shared/${todo.shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! 🔗');
  };

  const visIcon  = { private:'🔒', department:'🏢', public:'🌐' };
  const visLabel = { private:'Private', department:'Department', public:'Public' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:420 }}>
        <div className="modal-header">
          <h2>🔗 Share Todo</h2>
          <button className="modal-close" onClick={onClose}><X/></button>
        </div>
        <div style={{ padding:'4px 0 16px' }}>
          <div style={{ fontWeight:600, marginBottom:4 }}>{todo.title}</div>
          <span style={{ fontSize:12, background:'var(--bg3)', padding:'3px 8px', borderRadius:6, color:'var(--text-muted)' }}>
            {visIcon[todo.visibility]} {visLabel[todo.visibility]}
          </span>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <input readOnly value={shareUrl} style={{
            flex:1, padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)',
            borderRadius:8, color:'var(--text)', fontSize:12, fontFamily:'monospace', outline:'none'
          }}/>
          <button className="btn btn-primary" onClick={handleCopy}><Copy size={14}/> Copy</button>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>
          Anyone with this link can view this todo without logging in.
        </p>
      </div>
    </div>
  );
}
