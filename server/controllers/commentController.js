import Comment from '../models/Comment.js';
import Todo    from '../models/Todo.js';

// GET /api/comments/:todoId
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ todo: req.params.todoId })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });
    res.json({ success: true, count: comments.length, comments });
  } catch (error) { next(error); }
};

// POST /api/comments/:todoId
export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const todo = await Todo.findById(req.params.todoId);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    const comment = await Comment.create({
      todo:   req.params.todoId,
      author: req.user._id,
      text:   text.trim(),
    });
    await comment.populate('author', 'name role');

    // Real-time broadcast
    req.app.get('io')?.to('global').emit('comment:added', {
      todoId: req.params.todoId,
      comment,
    });

    res.status(201).json({ success: true, comment });
  } catch (error) { next(error); }
};

// DELETE /api/comments/:commentId
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) return res.status(403).json({ message: 'Not authorized' });

    await comment.deleteOne();
    req.app.get('io')?.to('global').emit('comment:deleted', {
      todoId:    comment.todo,
      commentId: req.params.commentId,
    });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) { next(error); }
};
