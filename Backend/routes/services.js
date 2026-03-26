/**
 * routes/services.js
 * Public + authenticated routes for users to browse and book captain services.
 *
 * Base: /api/services
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const s = require('../controllers/userServicesController');

// ─── Public browse ────────────────────────────────────────────
router.get('/captains', s.getCaptains);                              // Browse all captains
router.get('/captains/nearby', s.getNearbyCaptains);                 // ?latitude&longitude&maxDistance
router.get('/captains/:captainId/djs', s.getCaptainDJs);             // DJs of a specific captain
router.get('/captains/:captainId/equipment', s.getCaptainEquipment); // Equipment of a specific captain
router.get('/djs', s.getAllCaptainDJs);                              // All DJs across all captains
router.get('/equipment', s.getAllEquipment);                         // All equipment across all captains

// ─── Authenticated user booking ───────────────────────────────
router.post('/bookings', protect, s.createBooking);                  // Create booking
router.get('/bookings/my', protect, s.getMyBookings);                // My bookings
router.get('/bookings/:id', protect, s.getBookingById);              // Single booking detail
router.delete('/bookings/:id', protect, s.cancelBooking);            // Cancel booking
router.put('/bookings/:id/review', protect, s.addReview);          // Submit review

module.exports = router;