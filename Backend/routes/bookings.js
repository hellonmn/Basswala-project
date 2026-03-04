const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBooking,
  updateBookingStatus,
  addReview,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize, isAdmin } = require('../middleware/roleAuth');

// User routes - create and manage their own bookings
router.post('/', protect, authorize('user'), createBooking);
router.get('/my-bookings', protect, authorize('user'), getMyBookings);
router.get('/:id', protect, authorize('user'), getBooking);
router.put('/:id/status', protect, authorize('user'), updateBookingStatus);
router.put('/:id/review', protect, authorize('user'), addReview);
router.delete('/:id', protect, authorize('user'), cancelBooking);

// Admin routes - manage all bookings
router.get('/admin/all', protect, isAdmin, async (req, res) => {
  res.json({ message: 'Admin: Get all bookings' });
});

module.exports = router;