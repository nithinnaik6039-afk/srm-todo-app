import express from 'express';
import { getTimeEntry, startTimer, stopTimer, resetTimer, getTimeStats } from '../controllers/timeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/stats',          getTimeStats);   // GET  /api/time/stats
router.get('/:todoId',        getTimeEntry);   // GET  /api/time/:todoId
router.post('/:todoId/start', startTimer);     // POST /api/time/:todoId/start
router.patch('/:todoId/stop', stopTimer);      // PATCH /api/time/:todoId/stop
router.delete('/:todoId/reset', resetTimer);   // DELETE /api/time/:todoId/reset

export default router;
