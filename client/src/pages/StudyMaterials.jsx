import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Upload, Download, Trash2, X, FileText, Image, File, Plus } from 'lucide-react';

const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const SUBJECTS  = ['Mathematics','Physics','Chemistry','DBMS','Networks','OS','DSA','Software Engineering','Other'];

const FILE_ICONS = {
  'application/pdf':  { icon: <FileText size={20}/>,  color: '#ef4444', label: 'PDF' },
  'image/jpeg':       { icon: <Image size={20}/>,      color: '#3b82f6', label: 'IMG' },
  'image/png':        { icon: <Image size={20}/>,      color: '#3b82f6', label: 'IMG' },
  'application/msword': { icon: <File size={20}/>,    color: '#2563eb', label: 'DOC' },
};

const getFileIcon = (type) => FILE_ICONS[type] || { icon: <File size={20}/>, color: '#6c63ff', label: 'FILE' };
const formatSize  = (bytes) => bytes > 1024*1024 ? `${(bytes/1024/1024).toFixed(1)} MB` : `${Math.round(bytes/1024)} KB`;

const emptyForm = { title:'', description:'', subject:'', semester:'1' };

export default function StudyMaterials() {
  const { user }  = useAuth();
  const socketRef = useSocket();

  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterSem, setFilterSem] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const fileRef = useRef();

  const canUpload = ['admin','faculty'].includes(user?.role);

  const load = async () => {
    try {
      const params = {};
      if (filterSem) params.semester = filterSem;
      if (filterSub) params.subject  = filterSub;
      const { data } = await api.get('/materials', { params });
      setMaterials(data.materials || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterSem, filterSub]);

  // Socket — new material uploaded
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const onUpload = (d) => {
      setMaterials(m => [d.material, ...m]);
      toast(`📚 ${d.uploadedBy} uploaded "${d.material.title}"`, { icon: '📤' });
    };
    socket.on('material:uploaded', onUpload);
    return () => socket.off('material:uploaded', onUpload);
  }, [socketRef?.current]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!form.title || !form.subject) return toast.error('Title and subject are required');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await api.post('/materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Material uploaded! 📚');
      setShowModal(false);
      setForm(emptyForm);
      setFile(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDownload = (mat) => {
    try {
      const token = localStorage.getItem('token');
      // Construct endpoint with auth token in query string
      const downloadUrl = `/api/materials/${mat._id}/download-file?token=${token}`;
      
      // Trigger a clean native download in a new tab to bypass pop-up blockers
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh list to update download count UI
      setTimeout(load, 1500);
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials(m => m.filter(x => x._id !== id));
      toast.success('Removed');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>📚 Study Materials</h1>
            <p>{materials.length} materials available</p>
          </div>
          {canUpload && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Upload size={16}/> Upload Material
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card card-sm" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <select
            style={{ padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 }}
            value={filterSem} onChange={e => setFilterSem(e.target.value)}>
            <option value="">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          <select
            style={{ padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 }}
            value={filterSub} onChange={e => setFilterSub(e.target.value)}>
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => { setFilterSem(''); setFilterSub(''); }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No materials found</h3>
          {canUpload && <p>Upload the first study material for your students!</p>}
        </div>
      ) : (
        <div className="todo-grid">
          {materials.map(mat => {
            const fi = getFileIcon(mat.fileType);
            return (
              <div key={mat._id} className="card" style={{ padding:16 }}>
                {/* File icon + title */}
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{
                    width:44, height:44, borderRadius:10, flexShrink:0,
                    background: `${fi.color}22`, display:'flex', alignItems:'center', justifyContent:'center',
                    color: fi.color, border:`1px solid ${fi.color}44`
                  }}>
                    {fi.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:2, wordBreak:'break-word' }}>{mat.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {mat.subject} · Sem {mat.semester} · {fi.label}
                    </div>
                  </div>
                </div>

                {mat.description && (
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>{mat.description}</p>
                )}

                {/* Meta */}
                <div style={{ display:'flex', gap:8, fontSize:12, color:'var(--text-muted)', marginBottom:12, flexWrap:'wrap' }}>
                  <span>👤 {mat.uploadedBy?.name}</span>
                  <span>•</span>
                  <span>📅 {new Date(mat.createdAt).toLocaleDateString('en-IN')}</span>
                  {mat.fileSize > 0 && <><span>•</span><span>💾 {formatSize(mat.fileSize)}</span></>}
                  <span>•</span>
                  <span>⬇️ {mat.downloads} downloads</span>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => handleDownload(mat)}>
                    <Download size={13}/> Download
                  </button>
                  {(canUpload || mat.uploadedBy?._id === user?._id) && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(mat._id)}>
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
            <div className="modal-header">
              <h2>📤 Upload Study Material</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X/></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Title *</label>
                <input placeholder="e.g., DBMS Unit 3 Notes"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} required/>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} placeholder="Brief description..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Subject *</label>
                  <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required>
                    <option value="">Select subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                    {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>

              {/* File Drop Zone */}
              <div className="form-group">
                <label>File * (PDF, DOC, images — max 5MB)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border:`2px dashed ${file ? 'var(--success)' : 'var(--border)'}`,
                    borderRadius:10, padding:20, textAlign:'center',
                    cursor:'pointer', transition:'all 0.2s',
                    background: file ? 'rgba(16,185,129,0.05)' : 'var(--bg3)'
                  }}>
                  {file ? (
                    <div>
                      <div style={{ fontSize:28 }}>✅</div>
                      <div style={{ fontWeight:600, color:'var(--success)' }}>{file.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{formatSize(file.size)}</div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} style={{ color:'var(--text-muted)', margin:'0 auto 8px' }}/>
                      <div style={{ fontWeight:600 }}>Click to select file</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>PDF, DOC, DOCX, images, Excel</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.jpg,.jpeg,.png"
                  style={{ display:'none' }} onChange={e => setFile(e.target.files[0])}/>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={uploading}>
                  {uploading ? 'Uploading...' : '📤 Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
