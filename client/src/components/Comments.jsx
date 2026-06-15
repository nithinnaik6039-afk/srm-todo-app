import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { Send, Trash2, MessageCircle } from 'lucide-react';

export default function Comments({ todoId, todoTitle }) {
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const socketRef = useSocket();

  const load = async () => {
    try {
      const { data } = await api.get(`/comments/${todoId}`);
      setComments(data.comments);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [todoId]);

  // Real-time comment updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const onAdded = (d) => { if (d.todoId === todoId) setComments(c => [...c, d.comment]); };
    const onDeleted = (d) => { if (d.todoId === todoId) setComments(c => c.filter(x => x._id !== d.commentId)); };
    socket.on('comment:added',   onAdded);
    socket.on('comment:deleted', onDeleted);
    return () => { socket.off('comment:added', onAdded); socket.off('comment:deleted', onDeleted); };
  }, [todoId, socketRef?.current]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/comments/${todoId}`, { text });
      setText('');
    } catch (err) { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const handleDelete = async (commentId) => {
    try { await api.delete(`/comments/${commentId}`); }
    catch { toast.error('Failed to delete'); }
  };

  const roleColor = { admin:'var(--danger)', faculty:'var(--warning)', student:'var(--primary)' };

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
        <MessageCircle size={14} style={{ color:'var(--primary)' }} />
        <span style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)' }}>
          Comments ({comments.length})
        </span>
      </div>

      {loading ? (
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Loading...</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>No comments yet. Be the first!</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {comments.map(c => (
            <div key={c._id} style={{
              background:'var(--bg3)', borderRadius:8, padding:'8px 10px',
              display:'flex', gap:8, alignItems:'flex-start'
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%', flexShrink:0,
                background: roleColor[c.author?.role] || 'var(--primary)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700, color:'#fff'
              }}>
                {c.author?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{c.author?.name}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                    {new Date(c.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize:13, marginTop:2, wordBreak:'break-word' }}>{c.text}</p>
              </div>
              <button onClick={() => handleDelete(c._id)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:2 }}>
                <Trash2 size={12}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} style={{ display:'flex', gap:8 }}>
        <input
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          style={{
            flex:1, padding:'8px 12px', background:'var(--bg3)',
            border:'1px solid var(--border)', borderRadius:8,
            color:'var(--text)', fontSize:13, outline:'none'
          }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !text.trim()}>
          <Send size={13}/>
        </button>
      </form>
    </div>
  );
}
