import express from 'express';
import { getUsers, toggleUserActive } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/',               authorize('admin', 'faculty'), getUsers);
router.patch('/:id/toggle-active', authorize('admin'), toggleUserActive);

export default router;
