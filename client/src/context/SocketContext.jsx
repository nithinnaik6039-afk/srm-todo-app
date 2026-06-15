import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { requestNotificationPermission, showNotification } from '../utils/notifications';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Ask permission once when user logs in
  useEffect(() => {
    if (user) requestNotificationPermission();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Connect to backend — uses same host as browser (works on mobile too)
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket.id);
      socket.emit('join', user._id);
      socket.emit('joinGlobal');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    // ── Push Notifications on socket events ──────────────
    socket.on('notification', (data) => {
      showNotification('📌 SRM Todo', data.message, { tag: 'notification' });
    });

    socket.on('todo:created', (data) => {
      if (data.createdBy !== user.name) {
        showNotification('📝 New Todo Added', `${data.createdBy} added a new todo`, { tag:'todo-created', url:'/todos' });
      }
    });

    socket.on('material:uploaded', (data) => {
      showNotification('📚 New Study Material', `${data.uploadedBy} uploaded "${data.material?.title}"`, { tag:'material', url:'/materials' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

