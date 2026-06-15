import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { GraduationCap, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'student', department: 'CSE', regNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data } = await api.get('/auth/admin-exists');
        setAdminExists(data.exists);
      } catch {}
    };
    checkAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <GraduationCap size={40} color="#6c63ff" />
          <h1>SRM Todo</h1>
          <p>Create your organization account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <input id="reg-name" placeholder="Nithin Naik" value={form.name}
                onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Reg. Number</label>
              <input id="reg-regnumber" placeholder="RA2011003..." value={form.regNumber}
                onChange={(e) => set('regNumber', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input id="reg-email" type="email" placeholder="name@srmist.edu.in" value={form.email}
              onChange={(e) => set('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input id="reg-password" type="password" placeholder="Min 6 characters" value={form.password}
              onChange={(e) => set('password', e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Role</label>
              <select id="reg-role" value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                {!adminExists && <option value="admin">Admin</option>}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select id="reg-dept" value={form.department} onChange={(e) => set('department', e.target.value)}>
                {['CSE','ECE','MECH','CIVIL','MBA','MCA','OTHER'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            <UserPlus size={16} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
