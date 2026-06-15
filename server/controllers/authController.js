import User          from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @route  POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, regNumber } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    // Restrict to only one admin account
    if (role === 'admin' && process.env.NODE_ENV !== 'test') {
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(400).json({ message: 'An admin account already exists. Only one admin is allowed.' });
      }
    }

    const user = await User.create({ name, email, password, role, department, regNumber });
    res.status(201).json({
      success: true,
      _id: user._id, name: user.name, email: user.email,
      role: user.role, department: user.department, regNumber: user.regNumber,
      token: generateToken(user._id, user.role),
    });
  } catch (error) { next(error); }
};

// @route  POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive)
      return res.status(401).json({ message: 'Account deactivated. Contact admin.' });

    res.status(200).json({
      success: true,
      _id: user._id, name: user.name, email: user.email,
      role: user.role, department: user.department, regNumber: user.regNumber,
      token: generateToken(user._id, user.role),
    });
  } catch (error) { next(error); }
};

// @route  GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) { next(error); }
};

// @route  PUT /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { name, department, regNumber, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, department, regNumber, avatar },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, user });
  } catch (error) { next(error); }
};

// @route  PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) { next(error); }
};

// @route  GET /api/auth/admin-exists
export const checkAdminExists = async (req, res, next) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    res.json({ exists: !!admin });
  } catch (error) { next(error); }
};

// @route  PUT /api/auth/preferences
export const updatePreferences = async (req, res, next) => {
  try {
    const { studyGoalHours, targetCGPA } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.preferences = {
      studyGoalHours: studyGoalHours !== undefined ? Number(studyGoalHours) : user.preferences?.studyGoalHours,
      targetCGPA: targetCGPA !== undefined ? Number(targetCGPA) : user.preferences?.targetCGPA,
    };

    await user.save();
    res.json({ success: true, user });
  } catch (error) { next(error); }
};
