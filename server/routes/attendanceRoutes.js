import express from 'express';
import { getMyAttendance, addSubject, logAttendance, updateAttendance, deleteSubject, getAlerts, getSummary } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/',          getMyAttendance);  // GET    /api/attendance
router.get('/alerts',    getAlerts);        // GET    /api/attendance/alerts
router.get('/summary',   getSummary);       // GET    /api/attendance/summary
router.post('/',         addSubject);       // POST   /api/attendance
router.put('/:id',       updateAttendance); // PUT    /api/attendance/:id
router.delete('/:id',    deleteSubject);    // DELETE /api/attendance/:id
router.patch('/:id/log', logAttendance);    // PATCH  /api/attendance/:id/log

export default router;
