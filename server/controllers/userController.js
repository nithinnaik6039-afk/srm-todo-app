import User from '../models/User.js';

// @route  GET /api/users
export const getUsers = async (req, res, next) => {
  try {
    const { role, department, search } = req.query;
    const query = {};

    // Faculty can only access student lists
    if (req.user.role === 'faculty') {
      query.role = 'student';
      // Restrict faculty to their own department if desired, or allow all students.
      // We will allow viewing all students in the organization but filterable.
    } else if (req.user.role === 'admin') {
      // Admin can see students and faculty
      if (role) {
        query.role = role;
      } else {
        query.role = { $ne: 'admin' }; // exclude self
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { regNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ name: 1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) { next(error); }
};

// @route  PATCH /api/users/:id/toggle-active
export const toggleUserActive = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only Admin can perform this action' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot deactivate admin' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Account of ${user.name} is now ${user.isActive ? 'active' : 'inactive'}`,
      user
    });
  } catch (error) { next(error); }
};
