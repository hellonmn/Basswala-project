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
    return res.status(403).json({ success: false, message: 'Captain access required' });
  }

  // Attach captain profile
  const captain = await Captain.findOne({ where: { userId: req.user.id } });
  if (!captain && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'No captain profile found. Complete registration first.' });
  }

  req.captain = captain;
  next();
};