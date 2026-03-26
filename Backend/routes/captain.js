/**
 * routes/captain.js
 * All routes for the Captain role (manage DJs, equipment, and their bookings).
 *
 * Base: /api/captain
 */

const express = require('express');
const router = express.Router();

// Correct imports
const { protect } = require('../middleware/auth');
const { isCaptain } = require('../middleware/captainAuth');
const captainController = require('../controllers/captainController');   // ← Fixed import

// Apply middleware to ALL routes
router.use(protect, isCaptain);

// ─── Profile ──────────────────────────────────────────────────
router.get('/profile', captainController.getMyProfile);
router.put('/profile', captainController.updateMyProfile);
router.get('/dashboard', captainController.getDashboard);

// ─── DJ Management ────────────────────────────────────────────
router.get('/djs', captainController.getMyDJs);
router.post('/djs', captainController.addDJ);
router.get('/djs/:id', captainController.getDJById);
router.put('/djs/:id', captainController.updateDJ);
router.put('/djs/:id/availability', captainController.toggleDJAvailability);
router.delete('/djs/:id', captainController.removeDJ);

// ─── Equipment Management ─────────────────────────────────────
router.get('/equipment', captainController.getMyEquipment);
router.post('/equipment', captainController.addEquipment);
router.get('/equipment/:id', captainController.getEquipmentById);
router.put('/equipment/:id', captainController.updateEquipment);
router.put('/equipment/:id/availability', captainController.toggleEquipmentAvailability);
router.delete('/equipment/:id', captainController.removeEquipment);

// ─── Booking Management ───────────────────────────────────────
router.get('/bookings/map', captainController.getBookingsMap);
router.get('/bookings', captainController.getMyBookings);
router.get('/bookings/:id', captainController.getBookingById);
router.put('/bookings/:id/status', captainController.updateBookingStatus);
router.put('/bookings/:id/payment', captainController.updatePaymentStatus);

// ─── OTP Verification Routes ──────────────────────────────────
router.post('/bookings/:id/generate-otp', captainController.generateOtp);
router.post('/bookings/:id/verify-otp', captainController.verifyOtp);

module.exports = router;