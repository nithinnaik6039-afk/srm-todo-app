import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Shield, User, UserX, UserCheck, GraduationCap } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'MBA', 'MCA', 'OTHER'];

export default function UserDirectory() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const isAdmin = user?.role === 'admin';
  const title = isAdmin ? '👥 Organization Directory' : '👨‍🎓 Student Directory';

  const loadUsers = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterDept) params.department = filterDept;
      if (search) params.search = search;

      const { data } = await api.get('/users', { params });
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterDept, search]);

  const handleToggleActive = async (targetUser) => {
    try {
      const { data } = await api.patch(`/users/${targetUser._id}/toggle-active`);
      toast.success(data.message);
      // Update local state
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, isActive: !u.isActive } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        <p>{isAdmin ? 'Manage all faculty members and students' : 'Browse students in your department/organization'}</p>
      </div>

      {/* Filters Card */}
      <div className="card card-sm" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, email, or registration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          {/* Role Filter (Admin only) */}
          {isAdmin && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
            >
              <option value="">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          )}

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch('');
              setFilterRole('');
              setFilterDept('');
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="empty-state">
          <div className="icon">⏳</div>
          <h3>Loading directory...</h3>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No users found</h3>
          <p>Try refining your search or filter options.</p>
        </div>
      ) : (
        <div className="todo-grid">
          {users.map(u => (
            <div
              key={u._id}
              className="card"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: u.isActive ? 1 : 0.6,
                borderLeft: u.role === 'faculty' ? '4px solid var(--secondary)' : '4px solid var(--primary)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: u.role === 'faculty' ? 'rgba(255,101,132,0.15)' : 'rgba(108,99,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: u.role === 'faculty' ? 'var(--secondary)' : 'var(--primary)'
                    }}>
                      {u.role === 'faculty' ? <Shield size={16} /> : <GraduationCap size={18} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{u.name}</h3>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {u.role.toUpperCase()} · {u.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <div>📧 {u.email}</div>
                  {u.regNumber && <div style={{ marginTop: 2 }}>🆔 Reg: {u.regNumber}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span className={`badge ${u.isActive ? 'badge-low' : 'badge-high'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>

                {isAdmin && (
                  <button
                    className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => handleToggleActive(u)}
                    style={{ padding: '4px 8px', fontSize: 11 }}
                  >
                    {u.isActive ? (
                      <>
                        <UserX size={12} /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={12} /> Activate
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
