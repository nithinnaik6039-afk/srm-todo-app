import Feedback from '../models/Feedback.js';

// GET /api/feedback — admin/faculty see all, students see their own
export const getFeedback = async (req, res, next) => {
  try {
    const query = req.user.role === 'student'
      ? { student: req.user._id }
      : {};
    const feedbacks = await Feedback.find(query)
      .populate('student', 'name regNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: feedbacks.length, feedbacks });
  } catch (error) { next(error); }
};

// POST /api/feedback
export const submitFeedback = async (req, res, next) => {
  try {
    const { subject, faculty, semester, rating, teaching, clarity, helpfulness, comment, isAnonymous } = req.body;
    if (!subject || !faculty || !rating)
      return res.status(400).json({ message: 'Subject, faculty and rating are required' });

    const fb = await Feedback.create({
      student: req.user._id, subject, faculty,
      semester: semester || '1', rating, teaching: teaching || rating,
      clarity: clarity || rating, helpfulness: helpfulness || rating,
      comment: comment || '', isAnonymous: !!isAnonymous,
    });
    res.status(201).json({ success: true, feedback: fb });
  } catch (error) { next(error); }
};

// GET /api/feedback/summary — faculty analytics summary
export const getFeedbackSummary = async (req, res, next) => {
  try {
    const summary = await Feedback.aggregate([
      {
        $group: {
          _id: '$faculty',
          avgRating:      { $avg: '$rating' },
          avgTeaching:    { $avg: '$teaching' },
          avgClarity:     { $avg: '$clarity' },
          avgHelpfulness: { $avg: '$helpfulness' },
          totalResponses: { $sum: 1 },
          subjects:       { $addToSet: '$subject' },
        }
      },
      { $sort: { avgRating: -1 } },
    ]);
    res.json({ success: true, summary });
  } catch (error) { next(error); }
};

// DELETE /api/feedback/:id (student own or admin)
export const deleteFeedback = async (req, res, next) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: 'Not found' });
    if (fb.student.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await fb.deleteOne();
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (error) { next(error); }
};
