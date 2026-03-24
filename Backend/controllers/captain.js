/**
 * routes/captain.js
 * All routes for the Captain role (manage DJs, equipment, and their bookings).
 *
 * Base: /api/captain
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isCaptain } = require('../middleware/captainAuth');
const c = require('../controllers/captainController');

// All routes: must be authenticated + captain role
router.use(protect, isCaptain);

// ─── Profile ──────────────────────────────────────────────────
router.get('/profile', c.getMyProfile);
router.put('/profile', c.updateMyProfile);
router.get('/dashboard', c.getDashboard);

// ─── DJ Management ────────────────────────────────────────────
router.get('/djs', c.getMyDJs);                           // GET all my DJs
router.post('/djs', c.addDJ);                             // POST add a new DJ
router.get('/djs/:id', c.getDJById);                      // GET single DJ + recent bookings
router.put('/djs/:id', c.updateDJ);                       // PUT update DJ
router.put('/djs/:id/availability', c.toggleDJAvailability); // PUT toggle availability
router.delete('/djs/:id', c.removeDJ);                    // DELETE remove DJ

// ─── Equipment Management ─────────────────────────────────────
router.get('/equipment', c.getMyEquipment);               // GET all equipment
router.post('/equipment', c.addEquipment);                // POST add equipment
router.get('/equipment/:id', c.getEquipmentById);         // GET single equipment
router.put('/equipment/:id', c.updateEquipment);          // PUT update equipment
router.put('/equipment/:id/availability', c.toggleEquipmentAvailability); // PUT toggle
router.delete('/equipment/:id', c.removeEquipment);       // DELETE remove equipment

// ─── Booking Management ───────────────────────────────────────
router.get('/bookings', c.getMyBookings);                 // GET all bookings with delivery locations
router.get('/bookings/map', c.getBookingsMap);            // GET bookings for map view
router.get('/bookings/:id', c.getBookingById);            // GET single booking
router.put('/bookings/:id/status', c.updateBookingStatus);  // PUT update status
router.put('/bookings/:id/payment', c.updatePaymentStatus); // PUT update payment

module.exports = router;