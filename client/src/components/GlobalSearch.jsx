import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search } from 'lucide-react';

export default function GlobalSearch() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const ref      = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      try {
        const [todos, attendance] = await Promise.all([
          api.get(`/todos?search=${query}&limit=5`),
          api.get('/attendance'),
        ]);

        const todoResults = (todos.data.todos || []).map(t => ({
          type: 'todo', icon: t.completed ? '✅' : '📝',
          label: t.title, sub: t.priority,
          action: () => navigate('/todos'),
        }));

        const attResults = (attendance.data.attendance || [])
          .filter(a => a.subject.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map(a => ({
            type: 'attendance', icon: '📈',
            label: a.subject, sub: `${a.percentage}%`,
            action: () => navigate('/attendance'),
          }));

        setResults([...todoResults, ...attResults]);
        setOpen(true);
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="global-search-wrap" ref={ref}>
      <Search size={14} className="global-search-icon" />
      <input
        className="global-search-input"
        placeholder="Search todos, subjects..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((r, i) => (
            <div key={i} className="search-result-item"
              onClick={() => { r.action(); setQuery(''); setOpen(false); }}>
              <span className="search-result-type">{r.type}</span>
              <span>{r.icon} {r.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>{r.sub}</span>
            </div>
          ))}
        </div>
      )}
      {open && results.length === 0 && query && (
        <div className="search-results-dropdown">
          <div className="search-result-item" style={{ color: 'var(--text-muted)' }}>
            No results for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
