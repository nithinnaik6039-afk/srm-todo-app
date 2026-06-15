/**
 * Test App — exports Express app WITHOUT starting the HTTP server
 * This is used exclusively by the test suite.
 */
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import mongoose from 'mongoose';
import dotenv  from 'dotenv';
dotenv.config();

import authRoutes       from '../routes/authRoutes.js';
import todoRoutes       from '../routes/todoRoutes.js';
import timeRoutes       from '../routes/timeRoutes.js';
import attendanceRoutes from '../routes/attendanceRoutes.js';
import pollRoutes       from '../routes/pollRoutes.js';
import commentRoutes    from '../routes/commentRoutes.js';
import iaRoutes         from '../routes/iaRoutes.js';
import materialRoutes   from '../routes/materialRoutes.js';
import feedbackRoutes   from '../routes/feedbackRoutes.js';
import timetableRoutes  from '../routes/timetableRoutes.js';
import userRoutes       from '../routes/userRoutes.js';
import { getSharedTodo } from '../controllers/todoController.js';
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';

// ── Create app ────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('silent')); // suppress logs during tests

// ── Connect to MongoDB once ───────────────────────────────────────────────────
if (mongoose.connection.readyState === 0) {
  await mongoose.connect(process.env.MONGO_URI);
}

// ── Routes ────────────────────────────────────────────────────────────────────
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
app.get('/api/shared/:token', getSharedTodo);
app.get('/api/health', (_, res) => res.json({ status: 'healthy' }));

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
