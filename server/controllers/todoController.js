import Todo         from '../models/Todo.js';
import Notification  from '../models/Notification.js';

// ── GET /api/todos ─────────────────────────────────────────────────────────────
export const getTodos = async (req, res, next) => {
  try {
    const { completed, priority, category, page = 1, limit = 10, sort } = req.query;
    const query = { createdBy: req.user._id };
    if (completed !== undefined) query.completed = completed === 'true';
    if (priority)  query.priority = priority;
    if (category)  query.category = category;

    const sortMap = {
      newest:   { createdAt: -1 },
      oldest:   { createdAt: 1 },
      dueDate:  { dueDate: 1 },
      priority: { priority: -1 },
    };
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Todo.countDocuments(query);
    const todos = await Todo.find(query)
      .populate('assignedTo', 'name email')
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), todos });
  } catch (error) { next(error); }
};

// ── GET /api/todos/:id ─────────────────────────────────────────────────────────
export const getTodoById = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id).populate('assignedTo', 'name email');
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    res.json({ success: true, todo });
  } catch (error) { next(error); }
};

// ── POST /api/todos ────────────────────────────────────────────────────────────
export const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority, category, dueDate, tags, assignedTo, isRecurring, recurringPattern, labelColor, visibility } = req.body;
    const todo = await Todo.create({
      title, description, priority, category, dueDate, tags,
      assignedTo: assignedTo || null, isRecurring, recurringPattern,
      labelColor: labelColor || '',
      visibility: visibility || 'private',
      department: req.user.department || '',
      createdBy: req.user._id,
    });

    const io = req.app.get('io');

    if (assignedTo && assignedTo !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedTo, sender: req.user._id,
        type: 'todo_assigned',
        message: `${req.user.name} assigned you a task: "${title}"`,
        relatedTo: todo._id,
      });
      // Notify the assigned user directly
      io?.to(assignedTo).emit('notification', {
        message: `📌 ${req.user.name} assigned you: "${title}"`,
        type: 'todo_assigned',
        todo,
      });
    }

    // Broadcast new todo to everyone in global room
    io?.to('global').emit('todo:created', { todo, createdBy: req.user.name });

    res.status(201).json({ success: true, todo });
  } catch (error) { next(error); }
};

// ── PUT /api/todos/:id ─────────────────────────────────────────────────────────
export const updateTodo = async (req, res, next) => {
  try {
    let todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const { title, description, priority, category, dueDate, tags, assignedTo } = req.body;
    todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { title, description, priority, category, dueDate, tags, assignedTo },
      { new: true, runValidators: true }
    );

    req.app.get('io')?.to('global').emit('todo:updated', { todo });
    res.json({ success: true, todo });
  } catch (error) { next(error); }
};

// ── DELETE /api/todos/:id ──────────────────────────────────────────────────────
export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await todo.deleteOne();
    req.app.get('io')?.to('global').emit('todo:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) { next(error); }
};

// ── PATCH /api/todos/:id/complete ─────────────────────────────────────────────
export const toggleComplete = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    todo.completed = !todo.completed;
    await todo.save();
    req.app.get('io')?.to('global').emit('todo:updated', { todo });
    res.json({ success: true, todo });
  } catch (error) { next(error); }
};

// ── GET /api/todos/search?q= ───────────────────────────────────────────────────
export const searchTodos = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query is required' });
    const todos = await Todo.find({
      createdBy: req.user._id,
      $or: [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags:        { $in: [new RegExp(q, 'i')] } },
      ],
    });
    res.json({ success: true, count: todos.length, todos });
  } catch (error) { next(error); }
};

// ── GET /api/todos/stats ───────────────────────────────────────────────────────
export const getTodoStats = async (req, res, next) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const [total, completed, pending, overdue, highPriority] = await Promise.all([
      Todo.countDocuments({ createdBy: uid }),
      Todo.countDocuments({ createdBy: uid, completed: true }),
      Todo.countDocuments({ createdBy: uid, completed: false }),
      Todo.countDocuments({ createdBy: uid, completed: false, dueDate: { $lt: now } }),
      Todo.countDocuments({ createdBy: uid, priority: 'high', completed: false }),
    ]);
    res.json({ success: true, stats: { total, completed, pending, overdue, highPriority } });
  } catch (error) { next(error); }
};

// ── GET /api/todos/assigned ────────────────────────────────────────────────────
export const getAssignedTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find({ assignedTo: req.user._id })
      .populate('createdBy', 'name email role');
    res.json({ success: true, count: todos.length, todos });
  } catch (error) { next(error); }
};

// ── GET /api/todos/all  (Admin/Faculty) ────────────────────────────────────────
export const getAllTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find({})
      .populate('createdBy',  'name email role department')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: todos.length, todos });
  } catch (error) { next(error); }
};

// ── Sub-tasks ──────────────────────────────────────────────────────────────────
export const addSubTask = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    todo.subTasks.push({ title: req.body.title });
    await todo.save();
    res.status(201).json({ success: true, subTasks: todo.subTasks });
  } catch (error) { next(error); }
};

export const toggleSubTask = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    const sub = todo.subTasks.id(req.params.subId);
    if (!sub) return res.status(404).json({ message: 'Sub-task not found' });
    sub.completed = !sub.completed;
    await todo.save();
    res.json({ success: true, subTasks: todo.subTasks });
  } catch (error) { next(error); }
};

export const deleteSubTask = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    todo.subTasks.pull({ _id: req.params.subId });
    await todo.save();
    res.json({ success: true, subTasks: todo.subTasks });
  } catch (error) { next(error); }
};

// ── File Attachments ───────────────────────────────────────────────────────────
export const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    todo.attachments.push({ filename: req.file.originalname, url: fileUrl });
    await todo.save();
    res.status(201).json({ success: true, attachments: todo.attachments });
  } catch (error) { next(error); }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    todo.attachments = todo.attachments.filter(
      (a) => a._id.toString() !== req.params.attachId
    );
    await todo.save();
    res.json({ success: true, attachments: todo.attachments });
  } catch (error) { next(error); }
};

// ── Bulk Operations ────────────────────────────────────────────────────────────
export const bulkComplete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });
    const result = await Todo.updateMany(
      { _id: { $in: ids }, createdBy: req.user._id },
      { completed: true }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
};

export const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });
    const result = await Todo.deleteMany({ _id: { $in: ids }, createdBy: req.user._id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) { next(error); }
};

// ── GET /api/todos/analytics ────────────────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const uid = req.user._id;
    // Last 7 days completion data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const daily = await Todo.aggregate([
      { $match: { createdBy: uid, completed: true, updatedAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Build full 7-day array with zeroes for missing days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = daily.find(x => x._id === key);
      days.push({
        date: key,
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        completed: found?.count || 0,
      });
    }

    // Category breakdown
    const byCategory = await Todo.aggregate([
      { $match: { createdBy: uid } },
      { $group: { _id: '$category', total: { $sum: 1 }, done: { $sum: { $cond: ['$completed', 1, 0] } } } },
    ]);

    // Priority breakdown
    const byPriority = await Todo.aggregate([
      { $match: { createdBy: uid } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, analytics: { daily: days, byCategory, byPriority } });
  } catch (error) { next(error); }
};

// ── GET /api/todos/leaderboard ──────────────────────────────────────────────────
export const getLeaderboard = async (req, res, next) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const board = await Todo.aggregate([
      { $match: { completed: true, updatedAt: { $gte: startOfWeek } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, name: '$user.name', role: '$user.role', department: '$user.department' } },
    ]);

    res.json({ success: true, leaderboard: board });
  } catch (error) { next(error); }
};

// ── GET /api/todos/shared/:token  (PUBLIC — no auth) ──────────────────────────
export const getSharedTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ shareToken: req.params.token })
      .select('-shareToken')
      .populate('createdBy', 'name department');
    if (!todo) return res.status(404).json({ message: 'Todo not found or link expired' });
    res.json({ success: true, todo });
  } catch (error) { next(error); }
};

// ── GET /api/todos/department  — todos visible to same department ──────────────
export const getDepartmentTodos = async (req, res, next) => {
  try {
    const dept = req.user.department;
    const todos = await Todo.find({
      $or: [
        { visibility: 'public' },
        { visibility: 'department', department: dept },
      ],
    })
      .populate('createdBy', 'name role department')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: todos.length, todos });
  } catch (error) { next(error); }
};

// ── GET /api/todos/suggestions — AI (rule-based) task suggestions ──────────────
export const getAISuggestions = async (req, res, next) => {
  try {
    const uid = req.user._id;

    const [todos, totalTodos] = await Promise.all([
      Todo.find({ createdBy: uid, completed: false })
        .sort({ dueDate: 1 })
        .limit(20),
      Todo.countDocuments({ createdBy: uid }),
    ]);

    const suggestions = [];
    const now = new Date();

    // Rule 1: Overdue todos
    const overdue = todos.filter(t => t.dueDate && new Date(t.dueDate) < now);
    if (overdue.length > 0) {
      suggestions.push({
        type:    'urgent',
        icon:    '🔴',
        title:   `${overdue.length} overdue todo${overdue.length > 1 ? 's' : ''}!`,
        message: `You have ${overdue.length} task${overdue.length > 1 ? 's' : ''} past their due date. Complete them first!`,
        action:  'View Overdue',
        link:    '/todos',
      });
    }

    // Rule 2: High-priority pending
    const highPri = todos.filter(t => t.priority === 'high');
    if (highPri.length > 0) {
      suggestions.push({
        type:    'warning',
        icon:    '🔥',
        title:   `${highPri.length} high-priority task${highPri.length > 1 ? 's' : ''} pending`,
        message: `Focus on "${highPri[0].title}" — it's high priority!`,
        action:  'Go to Todos',
        link:    '/todos',
      });
    }

    // Rule 3: Due today
    const dueToday = todos.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      const n = new Date(now);       n.setHours(0,0,0,0);
      return d.getTime() === n.getTime();
    });
    if (dueToday.length > 0) {
      suggestions.push({
        type:    'info',
        icon:    '📅',
        title:   `${dueToday.length} todo${dueToday.length > 1 ? 's' : ''} due today`,
        message: `Today's tasks: ${dueToday.map(t => `"${t.title}"`).slice(0,2).join(', ')}`,
        action:  'View Today',
        link:    '/calendar',
      });
    }

    // Rule 4: No todos in academic category
    const academic = todos.filter(t => t.category === 'academic');
    if (academic.length === 0 && totalTodos > 0) {
      suggestions.push({
        type:    'tip',
        icon:    '📚',
        title:   'Add academic tasks',
        message: 'You have no pending academic todos. Track assignments and study goals!',
        action:  'Add Todo',
        link:    '/todos',
      });
    }

    // Rule 5: Good job if all clear
    if (suggestions.length === 0) {
      suggestions.push({
        type:    'success',
        icon:    '🎉',
        title:   'You\'re all caught up!',
        message: 'No urgent tasks. Keep it up! Maybe check your Analytics or add study materials.',
        action:  'View Analytics',
        link:    '/analytics',
      });
    }

    res.json({ success: true, suggestions });
  } catch (error) { next(error); }
};


