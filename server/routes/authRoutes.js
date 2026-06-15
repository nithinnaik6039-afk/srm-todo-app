import express from 'express';
import { registerUser, loginUser, getMe, updateMe, changePassword, checkAdminExists, updatePreferences } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register',       registerUser);
router.post('/login',          loginUser);
router.get('/admin-exists',    checkAdminExists);
router.get('/me',              protect, getMe);
router.put('/me',              protect, updateMe);
router.put('/change-password', protect, changePassword);
router.put('/preferences',      protect, updatePreferences);

export default router;
