import { useEffect, useState } from 'react';
import api from '../api/axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pColor = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' };

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function Calendar() {
  const [todos,  setTodos]  = useState([]);
  const [year,   setYear]   = useState(new Date().getFullYear());
  const [month,  setMonth]  = useState(new Date().getMonth());
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/todos?limit=200').then(({ data }) => setTodos(data.todos || [])).catch(() => {});
  }, []);

  const todosWithDue = todos.filter(t => t.dueDate);

  const todosByDay = {};
  todosWithDue.forEach(t => {
    const d = new Date(t.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!todosByDay[key]) todosByDay[key] = [];
      todosByDay[key].push(t);
    }
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const today       = new Date();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y+1); } else setMonth(m => m+1); };

  const selectedTodos = selected ? (todosByDay[selected] || []) : [];

  return (
    <div>
      <div className="page-header">
        <h1>📅 Calendar View</h1>
        <p>All your todos by due date</p>
      </div>

      <div className="card">
        {/* Month Nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button className="btn btn-outline btn-sm" onClick={prevMonth}><ChevronLeft size={16}/></button>
          <h2 style={{ fontSize:18, fontWeight:700 }}>{MONTHS[month]} {year}</h2>
          <button className="btn btn-outline btn-sm" onClick={nextMonth}><ChevronRight size={16}/></button>
        </div>

        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:12, fontWeight:600, color:'var(--text-muted)', padding:'4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day    = i + 1;
            const isToday= today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const hasTodos= todosByDay[day]?.length > 0;
            return (
              <div key={day}
                onClick={() => setSelected(selected === day ? null : day)}
                style={{
                  minHeight: 52, borderRadius: 8, padding: '6px 4px',
                  cursor: hasTodos ? 'pointer' : 'default',
                  background: selected === day ? 'rgba(108,99,255,0.2)'
                    : isToday ? 'rgba(108,99,255,0.1)' : 'var(--bg3)',
                  border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ textAlign:'center', fontWeight: isToday ? 700 : 400, fontSize:13, color: isToday ? 'var(--primary)' : 'var(--text)' }}>
                  {day}
                </div>
                {hasTodos && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:2, justifyContent:'center', marginTop:3 }}>
                    {todosByDay[day].slice(0,3).map(t => (
                      <div key={t._id} style={{
                        width:6, height:6, borderRadius:'50%',
                        background: pColor[t.priority] || 'var(--primary)'
                      }}/>
                    ))}
                    {todosByDay[day].length > 3 && (
                      <span style={{ fontSize:9, color:'var(--text-muted)' }}>+{todosByDay[day].length-3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day todos */}
      {selected && (
        <div className="card" style={{ marginTop:16 }}>
          <h3 style={{ marginBottom:12 }}>
            📌 {MONTHS[month]} {selected} — {selectedTodos.length} todo{selectedTodos.length !== 1 ? 's' : ''}
          </h3>
          {selectedTodos.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:14 }}>No todos due on this day.</p>
          ) : (
            selectedTodos.map(t => (
              <div key={t._id} style={{
                padding:'10px 12px', marginBottom:8, borderRadius:8,
                background:'var(--bg3)', borderLeft:`3px solid ${pColor[t.priority]}`,
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <div>
                  <span style={{ fontWeight:600, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</span>
                  <span style={{ marginLeft:8, fontSize:12, color:'var(--text-muted)' }}>{t.category}</span>
                </div>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
