import TimeEntry from '../models/TimeEntry.js';
import Todo      from '../models/Todo.js';

const fmt = (s) => `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`;

// GET /api/time/stats
export const getTimeStats = async (req, res, next) => {
  try {
    const entries = await TimeEntry.find({ user: req.user._id }).populate('todo', 'title category');
    const summary = entries.map((e) => ({
      todo: e.todo?.title || 'Deleted', category: e.todo?.category || '-',
      totalFormatted: fmt(e.totalDuration), sessions: e.sessions.length,
    }));
    const grand = entries.reduce((s, e) => s + e.totalDuration, 0);
    res.json({ success: true, grandTotal: fmt(grand), breakdown: summary });
  } catch (error) { next(error); }
};

// GET /api/time/:todoId
export const getTimeEntry = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOne({ todo: req.params.todoId, user: req.user._id });
    if (!entry) return res.json({ success: true, message: 'No time tracked yet', entry: null });
    res.json({ success: true, entry: { ...entry.toObject(), totalFormatted: fmt(entry.totalDuration) } });
  } catch (error) { next(error); }
};

// POST /api/time/:todoId/start
export const startTimer = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.todoId);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    let entry = await TimeEntry.findOne({ todo: req.params.todoId, user: req.user._id });
    if (entry?.isRunning) return res.status(400).json({ message: 'Timer already running' });

    if (!entry) entry = await TimeEntry.create({ todo: req.params.todoId, user: req.user._id, sessions: [] });
    entry.sessions.push({ startTime: new Date(), note: req.body.note || '' });
    entry.isRunning = true;
    await entry.save();

    res.json({ success: true, message: '⏱️ Timer started', entry });
  } catch (error) { next(error); }
};

// PATCH /api/time/:todoId/stop
export const stopTimer = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findOne({ todo: req.params.todoId, user: req.user._id });
    if (!entry?.isRunning) return res.status(400).json({ message: 'No active timer found' });

    const active = [...entry.sessions].reverse().find((s) => !s.endTime);
    if (!active) return res.status(400).json({ message: 'No active session' });

    const elapsed    = Math.floor((new Date() - new Date(active.startTime)) / 1000);
    active.endTime   = new Date();
    active.duration  = elapsed;
    entry.totalDuration += elapsed;
    entry.isRunning  = false;
    await entry.save();

    res.json({ success: true, message: '⏹️ Timer stopped', sessionDuration: fmt(elapsed), totalDuration: fmt(entry.totalDuration), entry });
  } catch (error) { next(error); }
};

// DELETE /api/time/:todoId/reset
export const resetTimer = async (req, res, next) => {
  try {
    await TimeEntry.findOneAndDelete({ todo: req.params.todoId, user: req.user._id });
    res.json({ success: true, message: '🔄 Timer reset' });
  } catch (error) { next(error); }
};
