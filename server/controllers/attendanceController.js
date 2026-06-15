import Attendance from '../models/Attendance.js';

const classesNeeded = (attended, total, target) => {
  const x = Math.ceil((target * total - 100 * attended) / (100 - target));
  return x > 0 ? x : 0;
};

const canSkip = (attended, total, target) => {
  if (attended / total * 100 <= target) return 0;
  return Math.floor((attended - (target / 100) * total) / (target / 100));
};

// GET /api/attendance
export const getMyAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).sort({ subject: 1 });
    const enriched = records.map((r) => {
      const obj    = r.toObject();
      const needed = classesNeeded(r.attendedClasses, r.totalClasses, r.minimumRequired);
      const skip   = canSkip(r.attendedClasses, r.totalClasses, r.minimumRequired);
      return {
        ...obj,
        insights: {
          status: obj.status,
          classesNeeded: needed,
          classesCanSkip: skip,
          alertMessage:
            obj.status === 'danger'
              ? `🔴 Attend ${needed} more class(es) in ${r.subject} to reach ${r.minimumRequired}%`
              : obj.status === 'warning'
              ? `🟡 Low attendance in ${r.subject}. Can skip ${skip} class(es).`
              : `🟢 Safe — Can skip up to ${skip} class(es) in ${r.subject}`,
        },
      };
    });
    res.json({ success: true, count: records.length, dangerCount: enriched.filter(r => r.insights.status === 'danger').length, attendance: enriched });
  } catch (error) { next(error); }
};

// POST /api/attendance
export const addSubject = async (req, res, next) => {
  try {
    const { subject, subjectCode, faculty, totalClasses, attendedClasses, minimumRequired } = req.body;
    if (await Attendance.findOne({ student: req.user._id, subject }))
      return res.status(400).json({ message: `"${subject}" already exists` });
    const record = await Attendance.create({ student: req.user._id, subject, subjectCode, faculty, totalClasses: totalClasses || 0, attendedClasses: attendedClasses || 0, minimumRequired: minimumRequired || 75 });
    res.status(201).json({ success: true, record });
  } catch (error) { next(error); }
};

// PATCH /api/attendance/:id/log
export const logAttendance = async (req, res, next) => {
  try {
    const { status, note, date } = req.body;
    const record = await Attendance.findOne({ _id: req.params.id, student: req.user._id });
    if (!record) return res.status(404).json({ message: 'Subject record not found' });
    record.records.push({ date: date || new Date(), status: status || 'present', note: note || '' });
    record.totalClasses += 1;
    if (status === 'present' || status === 'od') record.attendedClasses += 1;
    await record.save();
    res.json({ success: true, message: `Marked as ${status}`, percentage: record.percentage, status: record.status, record });
  } catch (error) { next(error); }
};

// PUT /api/attendance/:id
export const updateAttendance = async (req, res, next) => {
  try {
    const { totalClasses, attendedClasses, faculty, minimumRequired } = req.body;
    const record = await Attendance.findOne({ _id: req.params.id, student: req.user._id });
    if (!record) return res.status(404).json({ message: 'Subject not found' });
    if (totalClasses    !== undefined) record.totalClasses    = totalClasses;
    if (attendedClasses !== undefined) record.attendedClasses = attendedClasses;
    if (faculty         !== undefined) record.faculty         = faculty;
    if (minimumRequired !== undefined) record.minimumRequired = minimumRequired;
    await record.save();
    res.json({ success: true, percentage: record.percentage, record });
  } catch (error) { next(error); }
};

// DELETE /api/attendance/:id
export const deleteSubject = async (req, res, next) => {
  try {
    const record = await Attendance.findOneAndDelete({ _id: req.params.id, student: req.user._id });
    if (!record) return res.status(404).json({ message: 'Subject not found' });
    res.json({ success: true, message: `"${record.subject}" removed` });
  } catch (error) { next(error); }
};

// GET /api/attendance/alerts
export const getAlerts = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.user._id });
    const alerts  = records
      .filter((r) => r.percentage < r.minimumRequired)
      .map((r) => ({
        subject: r.subject, subjectCode: r.subjectCode,
        percentage: r.percentage, minimumRequired: r.minimumRequired,
        classesNeeded: classesNeeded(r.attendedClasses, r.totalClasses, r.minimumRequired),
        message: `⚠️ Need ${classesNeeded(r.attendedClasses, r.totalClasses, r.minimumRequired)} more class(es) in ${r.subject}`,
      }));
    res.json({ success: true, alertCount: alerts.length, alerts });
  } catch (error) { next(error); }
};

// GET /api/attendance/summary
export const getSummary = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.user._id });
    if (!records.length) return res.json({ success: true, summary: null });
    const totals = records.reduce((acc, r) => { acc.t += r.totalClasses; acc.a += r.attendedClasses; return acc; }, { t: 0, a: 0 });
    res.json({
      success: true,
      summary: {
        subjects: records.length,
        overallPercentage: totals.t > 0 ? parseFloat((totals.a / totals.t * 100).toFixed(2)) : 0,
        totalClasses: totals.t, attendedClasses: totals.a,
        safeSubjects:    records.filter((r) => r.percentage >= 85).length,
        warningSubjects: records.filter((r) => r.percentage >= 75 && r.percentage < 85).length,
        dangerSubjects:  records.filter((r) => r.percentage < 75).length,
      },
    });
  } catch (error) { next(error); }
};
