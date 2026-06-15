import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Globe, Building2, Lock } from 'lucide-react';

const pColor = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' };
const visInfo = {
  public:     { icon:<Globe size={12}/>,     label:'Public',      color:'var(--success)' },
  department: { icon:<Building2 size={12}/>, label:'Department',  color:'var(--primary)' },
  private:    { icon:<Lock size={12}/>,      label:'Private',     color:'var(--text-muted)' },
};

export default function GroupTodos() {
  const { user }    = useAuth();
  const [todos,     setTodos]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [filter,    setFilter]   = useState('department'); // 'department' | 'public'

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/todos/department');
      setTodos(data.todos || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'public'
    ? todos.filter(t => t.visibility === 'public')
    : todos;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👥 Group Todos</h1>
          <p>Department & public todos shared by everyone — {user?.department}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {[
          { val:'department', label:`🏢 ${user?.department || 'Department'}` },
          { val:'public',     label:'🌐 Public' },
        ].map(tab => (
          <button key={tab.val}
            className={`btn btn-sm ${filter===tab.val ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(tab.val)}>
            {tab.label}
          </button>
        ))}
        <button className="btn btn-sm btn-outline" style={{ marginLeft:'auto' }} onClick={load}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No shared todos found</h3>
          <p>Create a todo with "Department" or "Public" visibility to share it here!</p>
        </div>
      ) : (
        <div className="todo-grid">
          {filtered.map(todo => {
            const vis = visInfo[todo.visibility] || visInfo.public;
            return (
              <div key={todo._id} className="todo-card card" style={{
                borderLeft: `3px solid ${pColor[todo.priority]}`,
                padding: 16, position:'relative',
              }}>
                {/* Visibility badge */}
                <div style={{
                  position:'absolute', top:10, right:10,
                  display:'flex', alignItems:'center', gap:4,
                  fontSize:11, color: vis.color,
                  background:`${vis.color}22`, padding:'2px 7px', borderRadius:6,
                }}>
                  {vis.icon} {vis.label}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize:15, fontWeight:700, marginBottom:4,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? 'var(--text-muted)' : 'var(--text)',
                  paddingRight:60,
                }}>
                  {todo.title}
                  {todo.completed && <span style={{ marginLeft:8, fontSize:12, color:'var(--success)' }}>✅</span>}
                </h3>

                {/* Description */}
                {todo.description && (
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>{todo.description}</p>
                )}

                {/* Meta */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
                  <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
                  <span style={{ fontSize:12, background:'var(--bg3)', padding:'2px 8px', borderRadius:6, color:'var(--text-muted)' }}>
                    {todo.category}
                  </span>
                  {todo.dueDate && (
                    <span style={{ fontSize:12, color: new Date(todo.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-muted)' }}>
                      📅 {new Date(todo.dueDate).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Creator info */}
                <div style={{ display:'flex', alignItems:'center', gap:6, borderTop:'1px solid var(--border)', paddingTop:8 }}>
                  <div style={{
                    width:26, height:26, borderRadius:'50%', background:'rgba(108,99,255,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--primary)'
                  }}>
                    {todo.createdBy?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{todo.createdBy?.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{todo.createdBy?.department} · {todo.createdBy?.role}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tip card */}
      <div className="card" style={{ marginTop:20, background:'rgba(108,99,255,0.05)', border:'1px solid rgba(108,99,255,0.2)' }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>💡</span>
          <div>
            <div style={{ fontWeight:600, marginBottom:4 }}>How to share your todos?</div>
            <p style={{ fontSize:13, color:'var(--text-muted)', margin:0 }}>
              Go to <strong>My Todos</strong> → Create a new todo → Set Visibility to <strong>"Department"</strong> or <strong>"Public"</strong>. It will appear here for others to see!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
