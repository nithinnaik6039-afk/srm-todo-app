import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GlobalSearch from './GlobalSearch';
import {
  LayoutDashboard, CheckSquare, BookOpen,
  Timer, BarChart2, LogOut, GraduationCap,
  Sun, Moon, Calendar, TrendingUp, Calculator,
  ClipboardList, BookMarked, MessageSquare,
  CalendarDays, Users, Menu, X, MoreHorizontal
} from 'lucide-react';

const navItems = [
  // ── Main ──────────────────────────────────────────────
  { to:'/dashboard',   label:'Dashboard',       icon:<LayoutDashboard size={20}/>, mobileIcon:<LayoutDashboard size={22}/>, group:'Main',     showInTab:true,  roles:['student', 'faculty', 'admin']  },
  { to:'/users',       label:'User Directory',  icon:<Users size={20}/>,           mobileIcon:<Users size={22}/>,           group:'Main',     showInTab:false, roles:['admin', 'faculty'] },
  { to:'/todos',       label:'My Todos',        icon:<CheckSquare size={20}/>,     mobileIcon:<CheckSquare size={22}/>,     group:'Main',     showInTab:true,  roles:['student']  },
  { to:'/group-todos', label:'Group Todos',     icon:<Users size={20}/>,           mobileIcon:<Users size={22}/>,           group:'Main',     showInTab:false, roles:['student'] },
  { to:'/calendar',    label:'Calendar',        icon:<Calendar size={20}/>,        mobileIcon:<Calendar size={22}/>,        group:'Main',     showInTab:true,  roles:['student']  },
  { to:'/timetable',   label:'Timetable',       icon:<CalendarDays size={20}/>,    mobileIcon:<CalendarDays size={22}/>,    group:'Main',     showInTab:false, roles:['student'] },
  // ── Academics ─────────────────────────────────────────
  { to:'/attendance',  label:'Attendance',      icon:<BookOpen size={20}/>,        mobileIcon:<BookOpen size={22}/>,        group:'Academics',showInTab:true,  roles:['student']  },
  { to:'/ia-tracker',  label:'IA Tracker',      icon:<ClipboardList size={20}/>,   mobileIcon:<ClipboardList size={22}/>,   group:'Academics',showInTab:false, roles:['student'] },
  { to:'/cgpa',        label:'CGPA Calc',       icon:<Calculator size={20}/>,      mobileIcon:<Calculator size={22}/>,      group:'Academics',showInTab:false, roles:['student'] },
  { to:'/materials',   label:'Study Materials', icon:<BookMarked size={20}/>,      mobileIcon:<BookMarked size={22}/>,      group:'Academics',showInTab:false, roles:['student', 'faculty', 'admin'] },
  { to:'/feedback',    label:'Feedback',        icon:<MessageSquare size={20}/>,   mobileIcon:<MessageSquare size={22}/>,   group:'Academics',showInTab:false, roles:['student', 'faculty', 'admin'] },
  // ── Tools ─────────────────────────────────────────────
  { to:'/time',        label:'Time Tracker',    icon:<Timer size={20}/>,           mobileIcon:<Timer size={22}/>,           group:'Tools',    showInTab:false, roles:['student'] },
  { to:'/analytics',   label:'Analytics',       icon:<TrendingUp size={20}/>,      mobileIcon:<TrendingUp size={22}/>,      group:'Tools',    showInTab:false, roles:['student'] },
  { to:'/polls',       label:'Polls',           icon:<BarChart2 size={20}/>,       mobileIcon:<BarChart2 size={22}/>,       group:'Tools',    showInTab:false, roles:['student', 'faculty', 'admin'] },
];

const GROUPS = ['Main', 'Academics', 'Tools'];

export default function Layout() {
  const { user, logout }   = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = user?.role || 'student';
  const allowedNavItems = navItems.filter(item => item.roles.includes(userRole));
  const TAB_ITEMS = allowedNavItems.filter(n => n.showInTab);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      {/* ── Backdrop (mobile sidebar overlay) ── */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>

        {/* Logo row */}
        <div className="sidebar-logo" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <GraduationCap size={22} color="var(--primary)" />
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>SRM Todo</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{user?.department} · {user?.role}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button className="theme-toggle" onClick={toggle} title="Toggle theme" style={{ padding:'6px 10px' }}>
              {isDark ? <Sun size={14}/> : <Moon size={14}/>}
            </button>
            {/* Mobile close button */}
            <button onClick={() => setSidebarOpen(false)}
              style={{ display:'flex', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}
              className="mobile-close-btn">
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* Search */}
        <GlobalSearch />

        {/* Nav */}
        <nav className="sidebar-nav" style={{ marginTop:8, flex:1, overflowY:'auto', minHeight:0 }}>
          {GROUPS.map(group => {
            const groupItems = allowedNavItems.filter(n => n.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                <div style={{
                  fontSize:10, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.08em', color:'var(--text-muted)',
                  padding:'10px 20px 4px',
                }}>
                  {group}
                </div>
                {groupItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{ borderTop:'1px solid var(--border)', padding:'12px 8px 8px' }}>
          <div style={{ padding:'0 12px 10px', fontSize:13 }}>
            <div style={{ fontWeight:600 }}>{user?.name}</div>
            <div style={{ color:'var(--text-muted)', fontSize:11, wordBreak:'break-all' }}>{user?.email}</div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color:'var(--danger)' }}>
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{
          display:'none', // hidden on desktop, shown via CSS on mobile
          alignItems:'center', justifyContent:'space-between',
          padding:'12px 4px 16px', marginBottom:4,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text)', padding:4, display:'flex', alignItems:'center' }}
            aria-label="Open menu">
            <Menu size={24}/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <GraduationCap size={18} color="var(--primary)"/>
            <span style={{ fontWeight:700, fontSize:15 }}>SRM Todo</span>
          </div>
          <button className="theme-toggle" onClick={toggle} style={{ padding:'5px 9px' }}>
            {isDark ? <Sun size={14}/> : <Moon size={14}/>}
          </button>
        </div>

        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="mobile-tab-bar">
        {TAB_ITEMS.map(item => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`mobile-tab-item${isActive ? ' active' : ''}`}
            >
              {item.mobileIcon}
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
        {/* More button — opens sidebar */}
        <button
          className={`mobile-tab-item`}
          onClick={() => setSidebarOpen(true)}
          style={{ position:'relative' }}
        >
          <MoreHorizontal size={22}/>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
