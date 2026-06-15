// Role-Based Access Control
// Usage: authorize('admin') | authorize('admin', 'faculty')
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: [${roles.join(', ')}]. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};
