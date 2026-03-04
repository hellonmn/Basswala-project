const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getMyBookings,
  changePassword,
  deactivateAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.get('/profile', protect, getProfile);              // GET full profile
router.put('/profile', protect, updateProfile);           // UPDATE profile
router.get('/bookings', protect, getMyBookings);          // GET booking history
router.put('/change-password', protect, changePassword);  // Change password
router.delete('/account', protect, deactivateAccount);    // Deactivate account

module.exports = router;
