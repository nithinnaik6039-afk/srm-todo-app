import express from 'express';
import { getComments, addComment, deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/:todoId',         getComments);   // GET    /api/comments/:todoId
router.post('/:todoId',        addComment);    // POST   /api/comments/:todoId
router.delete('/:commentId',   deleteComment); // DELETE /api/comments/:commentId

export default router;
