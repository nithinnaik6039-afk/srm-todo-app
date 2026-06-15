import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authorized, no token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive)
      return res.status(401).json({ message: 'Account not found or deactivated' });

    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token failed or expired' });
  }
};
