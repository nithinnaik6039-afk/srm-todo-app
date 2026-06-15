import IARecord from '../models/IARecord.js';

// GET /api/ia  — get all records for the logged-in student
export const getMyIA = async (req, res, next) => {
  try {
    const records = await IARecord.find({ student: req.user._id }).sort({ subject: 1 });
    res.json({ success: true, count: records.length, records });
  } catch (error) { next(error); }
};

// POST /api/ia  — add a subject
export const addSubject = async (req, res, next) => {
  try {
    const { subject, subjectCode, semester, ia1, ia2, ia3, maxMarks, credits, grade, gradePoint } = req.body;
    if (!subject) return res.status(400).json({ message: 'Subject name required' });

    const exists = await IARecord.findOne({ student: req.user._id, subject });
    if (exists) return res.status(400).json({ message: 'Subject already added' });

    const record = await IARecord.create({
      student: req.user._id,
      subject, subjectCode, semester: semester || '1',
      ia1: ia1 || 0, ia2: ia2 || 0, ia3: ia3 || 0,
      maxMarks: maxMarks || 30,
      credits: credits || 3,
      grade: grade || '', gradePoint: gradePoint || 0,
    });
    res.status(201).json({ success: true, record });
  } catch (error) { next(error); }
};

// PUT /api/ia/:id  — update marks/grade
export const updateRecord = async (req, res, next) => {
  try {
    const record = await IARecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.student.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const { ia1, ia2, ia3, grade, gradePoint, credits, semester } = req.body;
    if (ia1 !== undefined) record.ia1 = ia1;
    if (ia2 !== undefined) record.ia2 = ia2;
    if (ia3 !== undefined) record.ia3 = ia3;
    if (grade   !== undefined) record.grade   = grade;
    if (gradePoint !== undefined) record.gradePoint = gradePoint;
    if (credits !== undefined) record.credits = credits;
    if (semester !== undefined) record.semester = semester;
    await record.save();
    res.json({ success: true, record });
  } catch (error) { next(error); }
};

// DELETE /api/ia/:id
export const deleteRecord = async (req, res, next) => {
  try {
    const record = await IARecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.student.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await record.deleteOne();
    res.json({ success: true, message: 'Record deleted' });
  } catch (error) { next(error); }
};
