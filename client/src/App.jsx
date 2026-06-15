import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider }   from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider }  from './context/ThemeContext';
import ProtectedRoute     from './components/ProtectedRoute';

import Login           from './pages/Login';
import Register        from './pages/Register';
import Dashboard       from './pages/Dashboard';
import Todos           from './pages/Todos';
import Attendance      from './pages/Attendance';
import TimeTracker     from './pages/TimeTracker';
import Polls           from './pages/Polls';
import Calendar        from './pages/Calendar';
import Analytics       from './pages/Analytics';
import IATracker       from './pages/IATracker';
import CGPACalculator  from './pages/CGPACalculator';
import StudyMaterials  from './pages/StudyMaterials';
import FacultyFeedback from './pages/FacultyFeedback';
import Timetable       from './pages/Timetable';
import GroupTodos      from './pages/GroupTodos';
import UserDirectory   from './pages/UserDirectory';
import Layout          from './components/Layout';

import './index.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1e1e3a',
                  color: '#e2e8f0',
                  border: '1px solid rgba(108,99,255,0.2)',
                },
                duration: 4000,
              }}
            />
            <Routes>
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index               element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"    element={<Dashboard />} />
                <Route path="users"        element={<UserDirectory />} />
                <Route path="todos"        element={<Todos />} />
                <Route path="group-todos"  element={<GroupTodos />} />
                <Route path="calendar"     element={<Calendar />} />
                <Route path="timetable"    element={<Timetable />} />
                <Route path="attendance"   element={<Attendance />} />
                <Route path="ia-tracker"   element={<IATracker />} />
                <Route path="cgpa"         element={<CGPACalculator />} />
                <Route path="materials"    element={<StudyMaterials />} />
                <Route path="feedback"     element={<FacultyFeedback />} />
                <Route path="time"         element={<TimeTracker />} />
                <Route path="analytics"    element={<Analytics />} />
                <Route path="polls"        element={<Polls />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
