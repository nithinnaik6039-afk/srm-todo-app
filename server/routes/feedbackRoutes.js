import express from 'express';
import { getFeedback, submitFeedback, getFeedbackSummary, deleteFeedback } from '../controllers/feedbackController.js';
import { protect }   from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/',          getFeedback);                              // GET (role-filtered)
router.post('/',         authorize('student'), submitFeedback);    // Only students submit
router.get('/summary',   authorize('admin','faculty'), getFeedbackSummary); // Faculty analytics
router.delete('/:id',    deleteFeedback);                          // Delete own or admin

export default router;
