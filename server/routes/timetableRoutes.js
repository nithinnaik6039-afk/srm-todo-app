import express from 'express';
import { getTimetable, addSlot, deleteSlot, setSemester } from '../controllers/timetableController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getTimetable);  // GET /api/timetable
router.post('/slot', addSlot);       // POST /api/timetable/slot
router.delete('/slot/:slotId', deleteSlot);    // DELETE /api/timetable/slot/:id
router.put('/semester', setSemester);   // PUT /api/timetable/semester

export default router;
