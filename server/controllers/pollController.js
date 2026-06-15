import Poll from '../models/Poll.js';
import Todo from '../models/Todo.js';

const buildResults = (poll, userId = null) => {
  const total = poll.options.reduce((s, o) => s + o.votes.length, 0);
  return {
    _id: poll._id, question: poll.question, totalVotes: total,
    isClosed: poll.isClosed, expiresAt: poll.expiresAt, allowMultiple: poll.allowMultiple,
    myVotes: userId
      ? poll.options.filter((o) => o.votes.some((v) => v.toString() === userId)).map((o) => o._id)
      : [],
    options: poll.options.map((o) => ({
      _id: o._id, text: o.text, voteCount: o.votes.length,
      percentage: total > 0 ? parseFloat((o.votes.length / total * 100).toFixed(1)) : 0,
      voters: poll.isAnonymous ? [] : o.votes,
    })),
  };
};

// GET /api/polls/todo/:todoId
export const getPollsByTodo = async (req, res, next) => {
  try {
    const polls = await Poll.find({ todo: req.params.todoId }).populate('createdBy', 'name role').sort({ createdAt: -1 });
    res.json({ success: true, count: polls.length, polls });
  } catch (error) { next(error); }
};

// POST /api/polls
export const createPoll = async (req, res, next) => {
  try {
    const { question, options, todoId, allowMultiple, isAnonymous, expiresAt } = req.body;
    if (!options || options.length < 2) return res.status(400).json({ message: 'At least 2 options required' });
    if (options.length > 6) return res.status(400).json({ message: 'Maximum 6 options' });
    if (todoId) { const t = await Todo.findById(todoId); if (!t) return res.status(404).json({ message: 'Todo not found' }); }

    const poll = await Poll.create({
      question, options: options.map((text) => ({ text, votes: [] })),
      todo: todoId || null, createdBy: req.user._id,
      allowMultiple: allowMultiple || false, isAnonymous: isAnonymous || false, expiresAt: expiresAt || null,
    });
    await poll.populate('createdBy', 'name role');
    req.app.get('io')?.to('global').emit('poll:created', { poll });
    res.status(201).json({ success: true, poll });
  } catch (error) { next(error); }
};

// POST /api/polls/:id/vote
export const castVote = async (req, res, next) => {
  try {
    const { optionIds } = req.body;
    if (!optionIds?.length) return res.status(400).json({ message: 'Select at least one option' });
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.isClosed) return res.status(400).json({ message: 'Poll is closed' });
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      poll.isClosed = true; await poll.save();
      return res.status(400).json({ message: 'Poll has expired' });
    }
    if (!poll.allowMultiple && optionIds.length > 1)
      return res.status(400).json({ message: 'This poll allows only one choice' });

    const uid = req.user._id.toString();
    poll.options.forEach((o) => { o.votes = o.votes.filter((v) => v.toString() !== uid); });
    for (const oid of optionIds) {
      const opt = poll.options.id(oid);
      if (!opt) return res.status(400).json({ message: `Option ${oid} not found` });
      opt.votes.push(req.user._id);
    }
    await poll.save();
    const results = buildResults(poll, uid);
    req.app.get('io')?.to('global').emit('poll:voted', { pollId: poll._id, results });
    res.json({ success: true, message: '✅ Vote cast', results });
  } catch (error) { next(error); }
};

// GET /api/polls/:id/results
export const getPollResults = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('createdBy', 'name role');
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json({ success: true, results: buildResults(poll, req.user._id.toString()) });
  } catch (error) { next(error); }
};

// PATCH /api/polls/:id/close
export const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    poll.isClosed = true;
    await poll.save();
    const results = buildResults(poll);
    req.app.get('io')?.to('global').emit('poll:closed', { pollId: poll._id, results });
    res.json({ success: true, message: '🔒 Poll closed', results });
  } catch (error) { next(error); }
};

// DELETE /api/polls/:id
export const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await poll.deleteOne();
    req.app.get('io')?.to('global').emit('poll:deleted', { pollId: req.params.id });
    res.json({ success: true, message: 'Poll deleted' });
  } catch (error) { next(error); }
};

// GET /api/polls/my
export const getMyPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find().populate('createdBy', 'name role').populate('todo', 'title').sort({ createdAt: -1 });
    res.json({ success: true, count: polls.length, polls });
  } catch (error) { next(error); }
};
