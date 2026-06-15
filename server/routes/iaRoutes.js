import express from 'express';
import { getMyIA, addSubject, updateRecord, deleteRecord } from '../controllers/iaController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/',       getMyIA);       // GET    /api/ia
router.post('/',      addSubject);    // POST   /api/ia
router.put('/:id',    updateRecord);  // PUT    /api/ia/:id
router.delete('/:id', deleteRecord);  // DELETE /api/ia/:id

export default router;
