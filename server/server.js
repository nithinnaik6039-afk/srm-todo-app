import express       from 'express';
import cors          from 'cors';
import dotenv        from 'dotenv';
import helmet        from 'helmet';
import morgan        from 'morgan';
import rateLimit     from 'express-rate-limit';
import path          from 'path';
import os            from 'os';
import { fileURLToPath } from 'url';
import { createServer }  from 'http';
import { Server }        from 'socket.io';

import connectDB from './config/db.js';

// Routes
import authRoutes       from './routes/authRoutes.js';
import todoRoutes       from './routes/todoRoutes.js';
import timeRoutes       from './routes/timeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import pollRoutes       from './routes/pollRoutes.js';
import commentRoutes    from './routes/commentRoutes.js';
import iaRoutes         from './routes/iaRoutes.js';
import materialRoutes   from './routes/materialRoutes.js';
import feedbackRoutes   from './routes/feedbackRoutes.js';
import timetableRoutes  from './routes/timetableRoutes.js';
import userRoutes       from './routes/userRoutes.js';
import { startReminderCron } from './utils/reminderCron.js';

// Error Middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app        = express();
const httpServer = createServer(app); // wrap express in HTTP server

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Make io accessible in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`📡 Socket connected: ${socket.id}`);

  // User joins their personal room (for direct notifications)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // User joins a "global" room to receive broadcast updates
  socket.on('joinGlobal', () => {
    socket.join('global');
    console.log(`🌍 Socket ${socket.id} joined global room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

export { io };

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests' }));

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Static — uploaded files ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/todos',      todoRoutes);
app.use('/api/time',       timeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/polls',      pollRoutes);
app.use('/api/comments',   commentRoutes);
app.use('/api/ia',         iaRoutes);
app.use('/api/materials',  materialRoutes);
app.use('/api/feedback',   feedbackRoutes);
app.use('/api/timetable',  timetableRoutes);
app.use('/api/users',      userRoutes);

// ── Public routes (no auth) ───────────────────────────────────────────────────
import { getSharedTodo } from './controllers/todoController.js';
app.get('/api/shared/:token', getSharedTodo); // View shared todo publicly

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status:    'healthy',
    app:       'SRM Todo Backend',
    version:   '1.0.0',
    timestamp: new Date(),
  });
});

// ── Serve React Build in Production ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));

  // Any route that is NOT /api/* → serve React's index.html (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientDist, 'index.html'));
  });
}

// ── Error Handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT    = process.env.PORT || 8000;
const HOST    = process.env.HOST || '0.0.0.0';
const localIP = Object.values(os.networkInterfaces()).flat()
  .find(i => i.family === 'IPv4' && !i.internal)?.address || 'YOUR_IP';

httpServer.listen(PORT, HOST, () => {
  console.log(`\n🚀 SRM Todo Server running!`);
  console.log(`📡 Mode     : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local    : http://localhost:${PORT}/api`);
  console.log(`📱 Network  : http://${localIP}:${PORT}/api`);
  console.log(`⚡ Socket   : ws://${localIP}:${PORT}`);
  console.log(`❤️  Health   : http://localhost:${PORT}/api/health\n`);

  // Start daily email reminder cron (8:00 AM IST)
  startReminderCron();
});

// Export app for testing (supertest uses this directly)
export { app };
