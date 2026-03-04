const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateLocation,
  updateProfile,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize, isAdmin, isDJ, isUser } = require('../middleware/roleAuth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (all authenticated users)
router.get('/me', protect, getMe);
router.put('/location', protect, updateLocation);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

// Admin only routes
router.get('/admin/users', protect, isAdmin, (req, res) => {
  res.json({ message: 'Admin: Get all users' });
});

// DJ only routes
router.get('/dj/profile', protect, isDJ, (req, res) => {
  res.json({ message: 'DJ: Get DJ profile' });
});

// User only routes
router.get('/user/bookings', protect, isUser, (req, res) => {
  res.json({ message: 'User: Get my bookings' });
});

// Multiple roles allowed
router.get('/dashboard', protect, authorize('admin', 'dj'), (req, res) => {
  res.json({ message: 'Dashboard for admin and DJ' });
});

module.exports = router;