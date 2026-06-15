import express from 'express';
import {
  getTodos, getTodoById, createTodo, updateTodo, deleteTodo,
  toggleComplete, searchTodos, getTodoStats, getAssignedTodos, getAllTodos,
  addSubTask, toggleSubTask, deleteSubTask,
  uploadAttachment, deleteAttachment,
  bulkComplete, bulkDelete,
  getAnalytics, getLeaderboard,
  getSharedTodo, getDepartmentTodos, getAISuggestions,
} from '../controllers/todoController.js';
import { protect }   from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload }    from '../middleware/uploadMiddleware.js';

const router = express.Router();
router.use(protect);

// Special routes (must come BEFORE /:id)
router.get('/stats',       getTodoStats);
router.get('/search',      searchTodos);
router.get('/assigned',    getAssignedTodos);
router.get('/analytics',   getAnalytics);
router.get('/leaderboard', getLeaderboard);
router.get('/department',  getDepartmentTodos);
router.get('/suggestions', getAISuggestions);
router.get('/all',         authorize('admin', 'faculty'), getAllTodos);

// Bulk operations
router.patch('/bulk/complete', bulkComplete);
router.delete('/bulk/delete',  bulkDelete);

// Standard CRUD
router.route('/').get(getTodos).post(createTodo);
router.route('/:id').get(getTodoById).put(updateTodo).delete(deleteTodo);
router.patch('/:id/complete', toggleComplete);

// Sub-tasks
router.post('/:id/subtasks',                 addSubTask);
router.patch('/:id/subtasks/:subId/toggle',  toggleSubTask);
router.delete('/:id/subtasks/:subId',        deleteSubTask);

// Attachments
router.post('/:id/attachments',              upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachId',  deleteAttachment);

export default router;
