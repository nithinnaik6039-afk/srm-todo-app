import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#6c63ff','#ff6584','#10b981','#f59e0b','#3b82f6','#ec4899'];

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/todos/analytics'),
      api.get('/todos/stats'),
    ]).then(([a, s]) => {
      setData(a.data.analytics);
      setStats(s.data.stats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><h3>Loading Analytics...</h3></div>;

  const categoryData = data?.byCategory?.map(c => ({
    name: c._id, total: c.total, done: c.done,
  })) || [];

  const priorityData = data?.byPriority?.map(p => ({
    name: p._id, value: p.count,
  })) || [];

  return (
    <div>
      <div className="page-header">
        <h1>📊 Analytics</h1>
        <p>Track your productivity trends</p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total',        value: stats.total,       color: 'var(--primary)',   icon: '📝' },
            { label: 'Completed',    value: stats.completed,   color: 'var(--success)',   icon: '✅' },
            { label: 'Pending',      value: stats.pending,     color: 'var(--warning)',   icon: '⏳' },
            { label: 'Overdue',      value: stats.overdue,     color: 'var(--danger)',    icon: '🔴' },
            { label: 'High Priority',value: stats.highPriority,color: 'var(--secondary)', icon: '🚨' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Daily Completions — Line Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📈 Completed This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e1e3a', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="completed" stroke="#6c63ff" strokeWidth={2}
                dot={{ fill: '#6c63ff', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Pie */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🎯 By Priority</h3>
          {priorityData.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) =>
                    `${name} ${(percent*100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(108,99,255,0.2)', borderRadius:8 }}/>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Bar */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: 16 }}>🏷️ By Category (Total vs Completed)</h3>
          {categoryData.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:40 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize:12, fill:'#94a3b8' }} />
                <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(108,99,255,0.2)', borderRadius:8 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="total" fill="#6c63ff" name="Total" radius={[4,4,0,0]} />
                <Bar dataKey="done"  fill="#10b981" name="Done"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
