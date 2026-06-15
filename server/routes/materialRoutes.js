import express from 'express';
import { getMaterials, uploadMaterial, deleteMaterial, trackDownload, trackDownloadFile } from '../controllers/materialController.js';
import { protect }   from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload }    from '../middleware/uploadMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/',               getMaterials);                                               // GET all
router.post('/',              authorize('admin','faculty'), upload.single('file'), uploadMaterial); // Upload (faculty/admin)
router.patch('/:id/download', trackDownload);                                              // Track download (api fallback)
router.get('/:id/download-file', trackDownloadFile);                                        // Direct download link
router.delete('/:id',         deleteMaterial);                                             // Delete

export default router;
