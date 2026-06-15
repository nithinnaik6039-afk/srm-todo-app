import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Lock, X, Check } from 'lucide-react';

export default function Polls() {
  const { user } = useAuth();
  const [myPolls, setMyPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question:'', options:['',''], allowMultiple:false, isAnonymous:false, expiresAt:'' });
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({});
  const socketRef = useSocket();

  const canCreate = ['admin', 'faculty'].includes(user?.role);

  const load = async () => {
    try {
      const { data } = await api.get('/polls/my');
      setMyPolls(data.polls);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Real-time socket listeners ──
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    // New poll created by anyone
    const onCreated = () => { load(); toast('🗳️ New poll created!', { icon: '✨' }); };
    // Someone voted — update live results
    const onVoted   = ({ pollId, results: r }) => {
      setResults(prev => ({ ...prev, [pollId]: r }));
    };
    // Poll closed
    const onClosed  = ({ pollId, results: r }) => {
      setResults(prev => ({ ...prev, [pollId]: r }));
      load();
      toast('🔒 A poll was closed');
    };
    // Poll deleted
    const onDeleted = () => { load(); };

    socket.on('poll:created', onCreated);
    socket.on('poll:voted',   onVoted);
    socket.on('poll:closed',  onClosed);
    socket.on('poll:deleted', onDeleted);

    return () => {
      socket.off('poll:created', onCreated);
      socket.off('poll:voted',   onVoted);
      socket.off('poll:closed',  onClosed);
      socket.off('poll:deleted', onDeleted);
    };
  }, [socketRef?.current]);

  const addOption  = () => setForm(f => ({ ...f, options: [...f.options, ''] }));
  const setOption  = (i, v) => setForm(f => { const o=[...f.options]; o[i]=v; return {...f,options:o}; });
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_,idx)=>idx!==i) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const opts = form.options.filter(o => o.trim());
    if (opts.length < 2) return toast.error('At least 2 options required');
    try {
      await api.post('/polls', { ...form, options: opts });
      toast.success('Poll created! 🗳️');
      setShowCreate(false);
      setForm({ question:'', options:['',''], allowMultiple:false, isAnonymous:false, expiresAt:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      const { data } = await api.post(`/polls/${pollId}/vote`, { optionIds: [optionId] });
      toast.success('Vote cast! ✅');
      setResults(r => ({ ...r, [pollId]: data.results }));
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleClose = async (pollId) => {
    try {
      await api.patch(`/polls/${pollId}/close`);
      toast.success('Poll closed 🔒');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (pollId) => {
    if (!confirm('Delete this poll?')) return;
    try { await api.delete(`/polls/${pollId}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const getResults = async (pollId) => {
    const { data } = await api.get(`/polls/${pollId}/results`);
    setResults(r => ({ ...r, [pollId]: data.results }));
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div><h1>🗳️ Polls</h1><p>Create polls and gather responses from your team</p></div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16}/> Create Poll
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : myPolls.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🗳️</div>
          <h3>No polls yet</h3>
          <p>Create your first poll to gather responses</p>
        </div>
      ) : (
        <div style={{ display:'grid', gap:20 }}>
          {myPolls.map((poll) => {
            const res = results[poll._id];
            const total = res?.totalVotes || poll.options?.reduce((s,o)=>s+o.votes?.length,0) || 0;
            return (
              <div key={poll._id} className="card">
                <div className="flex-between mb-4">
                  <div>
                    <div className="fw-600" style={{ fontSize:17 }}>{poll.question}</div>
                    <div className="text-muted text-sm mt-1">
                      {total} vote(s) · {poll.isClosed ? '🔒 Closed' : '🟢 Open'}
                      {poll.allowMultiple ? ' · Multi-choice' : ''}
                      {poll.isAnonymous  ? ' · Anonymous'   : ''}
                      {poll.expiresAt ? ` · Expires ${new Date(poll.expiresAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  {(user?.role === 'admin' || poll.createdBy?._id === user?._id || poll.createdBy === user?._id) && (
                    <div style={{ display:'flex', gap:8 }}>
                      {!poll.isClosed && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleClose(poll._id)}>
                          <Lock size={13}/> Close
                        </button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(poll._id)}>
                        <X size={13}/>
                      </button>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div style={{ marginBottom:12 }}>
                  {(res?.options || poll.options)?.map((opt, i) => {
                    const pct = res ? opt.percentage : (total ? Math.round(opt.votes?.length/total*100) : 0);
                    const isMyVote = res?.myVotes?.includes(opt._id);
                    return (
                      <div key={opt._id||i} className={`poll-option${isMyVote?' selected':''}`}
                        onClick={() => !poll.isClosed && handleVote(poll._id, opt._id)}>
                        <div className="poll-bar" style={{ width:`${pct}%` }}/>
                        <div className="poll-option-content">
                          <span>{isMyVote && <Check size={13} style={{ marginRight:6, color:'var(--primary)' }}/>}{opt.text}</span>
                          <span className="fw-600" style={{ color:'var(--primary)' }}>{pct}% ({opt.votes?.length||opt.voteCount||0})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!res && (
                  <button className="btn btn-sm btn-outline" onClick={() => getResults(poll._id)}>
                    View Live Results
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Poll</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Question *</label>
                <input id="poll-question" placeholder="e.g., Did you complete the lab record?"
                  value={form.question} onChange={e=>setForm({...form,question:e.target.value})} required/>
              </div>

              <label style={{ fontSize:13, fontWeight:500, color:'var(--text-muted)', marginBottom:8, display:'block' }}>Options (2–6)</label>
              {form.options.map((opt,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <input placeholder={`Option ${i+1}`} value={opt} onChange={e=>setOption(i,e.target.value)}
                    style={{ flex:1, padding:'9px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none' }}/>
                  {form.options.length > 2 && (
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeOption(i)}><X size={12}/></button>
                  )}
                </div>
              ))}
              {form.options.length < 6 && (
                <button type="button" className="btn btn-sm btn-outline mb-4" onClick={addOption} style={{ marginBottom:16 }}>
                  <Plus size={13}/> Add Option
                </button>
              )}

              <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.allowMultiple} onChange={e=>setForm({...form,allowMultiple:e.target.checked})}/>
                  Allow multiple votes
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.isAnonymous} onChange={e=>setForm({...form,isAnonymous:e.target.checked})}/>
                  Anonymous
                </label>
              </div>

              <div className="form-group">
                <label>Expiry Date (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})}/>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">🗳️ Create Poll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
