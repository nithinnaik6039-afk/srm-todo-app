import Timetable from '../models/Timetable.js';

// GET /api/timetable
export const getTimetable = async (req, res, next) => {
  try {
    const tt = await Timetable.findOne({ user: req.user._id }) || { slots: [] };
    res.json({ success: true, timetable: tt });
  } catch (error) { next(error); }
};

// POST /api/timetable/slot — add a slot
export const addSlot = async (req, res, next) => {
  try {
    const { day, time, endTime, subject, faculty, room, type, color } = req.body;
    if (!day || !time || !subject)
      return res.status(400).json({ message: 'Day, time and subject are required' });

    let tt = await Timetable.findOne({ user: req.user._id });
    if (!tt) tt = await Timetable.create({ user: req.user._id, slots: [] });

    tt.slots.push({ day, time, endTime: endTime||'', subject, faculty: faculty||'', room: room||'', type: type||'lecture', color: color||'#6c63ff' });
    await tt.save();
    res.status(201).json({ success: true, timetable: tt });
  } catch (error) { next(error); }
};

// DELETE /api/timetable/slot/:slotId
export const deleteSlot = async (req, res, next) => {
  try {
    const tt = await Timetable.findOne({ user: req.user._id });
    if (!tt) return res.status(404).json({ message: 'Timetable not found' });
    tt.slots.pull({ _id: req.params.slotId });
    await tt.save();
    res.json({ success: true, timetable: tt });
  } catch (error) { next(error); }
};

// PUT /api/timetable/semester — update semester
export const setSemester = async (req, res, next) => {
  try {
    const { semester } = req.body;
    let tt = await Timetable.findOne({ user: req.user._id });
    if (!tt) tt = await Timetable.create({ user: req.user._id, slots: [] });
    tt.semester = semester;
    await tt.save();
    res.json({ success: true, timetable: tt });
  } catch (error) { next(error); }
};
