/**
 * middleware/captainAuth.js
 * Checks that the authenticated user has role 'captain' (or 'admin').
 * Also attaches the Captain profile to req.captain for convenience.
 */

const { Captain } = require('../models');

exports.isCaptain = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role !== 'captain' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. Required role: captain. Your role: ${req.user.role}` 
    });
  }

  // Allow admin even without captain profile
  if (req.user.role === 'admin') {
    req.captain = null;
    return next();
  }

  let captain = await Captain.findOne({ where: { userId: req.user.id } });

  // Auto-create if missing (safety net)
  if (!captain) {
    captain = await Captain.create({ userId: req.user.id });
    console.log(`[Auto-create] Captain profile created for user ${req.user.id}`);
  }

  req.captain = captain;
  next();
};