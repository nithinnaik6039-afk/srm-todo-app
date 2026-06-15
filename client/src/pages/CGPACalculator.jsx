import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const GRADES = ['O','A+','A','B+','B','C','F'];
const GRADE_POINTS = { O:10, 'A+':9, A:8, 'B+':7, B:6, C:5, F:0 };
const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const gradeColor = { O:'var(--primary)', 'A+':'var(--success)', A:'var(--success)', 'B+':'var(--warning)', B:'var(--warning)', C:'var(--danger)', F:'var(--danger)' };

const emptyRow = { subject:'', credits:3, grade:'O' };

export default function CGPACalculator() {
  const [rows,     setRows]     = useState([{ ...emptyRow }]);
  const [semester, setSemester] = useState('');

  const update = (i, key, val) => {
    const next = [...rows];
    next[i] = { ...next[i], [key]: val };
    setRows(next);
  };
  const addRow    = () => setRows(r => [...r, { ...emptyRow }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));

  const validRows  = rows.filter(r => r.subject && r.grade);
  const totalCred  = validRows.reduce((s, r) => s + Number(r.credits), 0);
  const weightedGP = validRows.reduce((s, r) => s + GRADE_POINTS[r.grade] * Number(r.credits), 0);
  const gpa        = totalCred > 0 ? (weightedGP / totalCred).toFixed(2) : '—';

  const gpaNum = parseFloat(gpa);
  const gpaColor = gpaNum >= 9 ? 'var(--primary)' : gpaNum >= 7 ? 'var(--success)' : gpaNum >= 5 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>🎓 CGPA Calculator</h1>
            <p>Calculate your semester GPA instantly</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <select
              value={semester} onChange={e => setSemester(e.target.value)}
              style={{ padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 }}
            >
              <option value="">Select Semester</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <button className="btn btn-primary" onClick={addRow}><Plus size={16}/> Add Subject</button>
          </div>
        </div>
      </div>

      {/* GPA Display */}
      <div className="card" style={{
        textAlign:'center', padding:32, marginBottom:20,
        background: `linear-gradient(135deg, var(--card), rgba(108,99,255,0.1))`,
        border:'1px solid var(--border)'
      }}>
        <div style={{ fontSize:64, fontWeight:800, color: gpaColor, lineHeight:1 }}>{gpa}</div>
        <div style={{ fontSize:18, color:'var(--text-muted)', marginTop:8 }}>
          {semester ? `Semester ${semester} GPA` : 'GPA'} · {totalCred} Credits
        </div>
        {gpaNum >= 9 && <div style={{ marginTop:8, color:'var(--primary)', fontWeight:600 }}>🏆 Outstanding!</div>}
        {gpaNum >= 8 && gpaNum < 9 && <div style={{ marginTop:8, color:'var(--success)', fontWeight:600 }}>⭐ Excellent!</div>}
        {gpaNum >= 7 && gpaNum < 8 && <div style={{ marginTop:8, color:'var(--warning)', fontWeight:600 }}>👍 Good job!</div>}
      </div>

      {/* Subject Rows */}
      <div className="card" style={{ padding:0, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['Subject','Credits','Grade','Grade Points','Weighted GP',''].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const gp = GRADE_POINTS[row.grade] || 0;
              const wgp = (gp * Number(row.credits)).toFixed(1);
              return (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 16px' }}>
                    <input
                      placeholder="Subject name"
                      value={row.subject}
                      onChange={e => update(i, 'subject', e.target.value)}
                      style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 10px', color:'var(--text)', fontSize:13, outline:'none', width:'100%' }}
                    />
                  </td>
                  <td style={{ padding:'10px 16px' }}>
                    <input
                      type="number" min={1} max={5}
                      value={row.credits}
                      onChange={e => update(i, 'credits', e.target.value)}
                      style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 10px', color:'var(--text)', fontSize:13, outline:'none', width:70 }}
                    />
                  </td>
                  <td style={{ padding:'10px 16px' }}>
                    <select
                      value={row.grade}
                      onChange={e => update(i, 'grade', e.target.value)}
                      style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 10px', color:'var(--text)', fontSize:13, outline:'none' }}
                    >
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:'10px 16px', fontWeight:700, color: gradeColor[row.grade] }}>{gp}</td>
                  <td style={{ padding:'10px 16px', fontWeight:600, color:'var(--primary)' }}>{wgp}</td>
                  <td style={{ padding:'10px 16px' }}>
                    {rows.length > 1 && (
                      <button className="btn btn-sm btn-danger" onClick={() => removeRow(i)}><Trash2 size={12}/></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop:'2px solid var(--border)', background:'rgba(108,99,255,0.05)' }}>
              <td style={{ padding:'12px 16px', fontWeight:700 }}>Total ({rows.length} subjects)</td>
              <td style={{ padding:'12px 16px', fontWeight:700 }}>{totalCred}</td>
              <td/>
              <td/>
              <td style={{ padding:'12px 16px', fontWeight:800, fontSize:18, color: gpaColor }}>{gpa}</td>
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>

      <button className="btn btn-outline" style={{ marginTop:12 }} onClick={addRow}>
        <Plus size={14}/> Add Another Subject
      </button>

      {/* Grade Legend */}
      <div className="card" style={{ marginTop:20 }}>
        <h3 style={{ marginBottom:12, fontSize:14 }}>Grade Scale (SRM University)</h3>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {GRADES.map(g => (
            <div key={g} style={{
              padding:'6px 12px', borderRadius:8, fontSize:13, fontWeight:600,
              background:'var(--bg3)', border:`2px solid ${gradeColor[g]}`,
              color: gradeColor[g]
            }}>
              {g} = {GRADE_POINTS[g]} GP
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
