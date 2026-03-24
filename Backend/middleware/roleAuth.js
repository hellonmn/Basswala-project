// middleware/roleAuth.js — updated with captain role

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

exports.isDJ = (req, res, next) => {
  if (req.user.role !== 'dj') {
    return res.status(403).json({ success: false, message: 'DJ access required' });
  }
  next();
};

exports.isCaptain = (req, res, next) => {
  if (req.user.role !== 'captain' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Captain access required' });
  }
  next();
};

exports.isUser = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ success: false, message: 'User access required' });
  }
  next();
};