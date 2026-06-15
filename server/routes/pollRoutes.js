import express from 'express';
import { getPollsByTodo, createPoll, castVote, getPollResults, closePoll, deletePoll, getMyPolls } from '../controllers/pollController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/my',             getMyPolls);      // GET    /api/polls/my
router.get('/todo/:todoId',   getPollsByTodo);  // GET    /api/polls/todo/:todoId
router.post('/',              authorize('admin', 'faculty'), createPoll);      // POST   /api/polls
router.get('/:id/results',    getPollResults);  // GET    /api/polls/:id/results
router.post('/:id/vote',      castVote);        // POST   /api/polls/:id/vote
router.patch('/:id/close',    closePoll);       // PATCH  /api/polls/:id/close
router.delete('/:id',         deletePoll);      // DELETE /api/polls/:id

export default router;
