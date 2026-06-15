import Material from '../models/Material.js';

// GET /api/materials?subject=&semester=
export const getMaterials = async (req, res, next) => {
  try {
    const { subject, semester } = req.query;
    const query = {};
    if (subject)  query.subject  = { $regex: subject,  $options: 'i' };
    if (semester) query.semester = semester;

    const materials = await Material.find(query)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, materials });
  } catch (error) { next(error); }
};

// POST /api/materials  (faculty / admin only)
export const uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { title, description, subject, semester } = req.body;
    if (!title || !subject) return res.status(400).json({ message: 'Title and subject required' });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const material = await Material.create({
      title, description, subject,
      semester: semester || '1',
      fileUrl, filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });
    await material.populate('uploadedBy', 'name role');

    req.app.get('io')?.to('global').emit('material:uploaded', {
      material, uploadedBy: req.user.name,
    });

    res.status(201).json({ success: true, material });
  } catch (error) { next(error); }
};

// DELETE /api/materials/:id (uploader or admin)
export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    if (
      material.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) return res.status(403).json({ message: 'Not authorized' });

    await material.deleteOne();
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) { next(error); }
};

// PATCH /api/materials/:id/download — increment download count
export const trackDownload = async (req, res, next) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!material) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, fileUrl: material.fileUrl });
  } catch (error) { next(error); }
};
