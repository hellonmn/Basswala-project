const express = require('express');
const router = express.Router();
const {
  getDashboard,
  // Users
  getAllUsers, getUserById, adminUpdateUser, adminUpdateUserLocation,
  adminResetUserPassword, toggleUserStatus, adminVerifyUser,
  getUserBookings, adminDeleteUser,
  // DJs
  adminGetAllDJs, adminGetDJById, adminCreateDJ, adminUpdateDJ,
  adminAssignDJOwner, adminToggleDJAvailability, getDJBookings, adminDeleteDJ,
  // Bookings
  getAllBookings, adminGetBookingById, adminUpdateBooking,
  adminUpdateBookingStatus, adminUpdatePaymentStatus, adminDeleteBooking,
  // Reports
  getMonthlyReport, getYearlyReport
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');

// All routes require auth + admin role
router.use(protect, isAdmin);

// ─── Dashboard ────────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ─── Reports ──────────────────────────────────────────────────
router.get('/reports/monthly', getMonthlyReport);       // ?month=3&year=2026
router.get('/reports/yearly', getYearlyReport);         // ?year=2026

// ─── User Management ──────────────────────────────────────────
router.get('/users', getAllUsers);                                  // ?search=&role=&isActive=&page=&limit=
router.get('/users/:id', getUserById);                             // Full profile + bookings
router.put('/users/:id', adminUpdateUser);                         // Update all user fields
router.put('/users/:id/location', adminUpdateUserLocation);        // Update location only
router.put('/users/:id/reset-password', adminResetUserPassword);   // Reset user password
router.put('/users/:id/toggle-status', toggleUserStatus);          // Ban / Unban
router.put('/users/:id/verify', adminVerifyUser);                  // Verify / Unverify
router.get('/users/:id/bookings', getUserBookings);                // All bookings of a user
router.delete('/users/:id', adminDeleteUser);                      // Delete user + all data

// ─── DJ Management ────────────────────────────────────────────
router.get('/djs', adminGetAllDJs);                                // ?isAvailable=&city=&search=
router.get('/djs/:id', adminGetDJById);                            // Full DJ profile + bookings
router.post('/djs', adminCreateDJ);                                // Create new DJ
router.put('/djs/:id', adminUpdateDJ);                             // Update all DJ fields
router.put('/djs/:id/assign-owner', adminAssignDJOwner);           // Reassign DJ to a user
router.put('/djs/:id/availability', adminToggleDJAvailability);    // Toggle availability
router.get('/djs/:id/bookings', getDJBookings);                    // All bookings of a DJ
router.delete('/djs/:id', adminDeleteDJ);                          // Delete DJ + bookings

// ─── Booking Management ───────────────────────────────────────
router.get('/bookings', getAllBookings);                            // ?status=&djId=&userId=&month=&year=
router.get('/bookings/:id', adminGetBookingById);                  // Full booking details
router.put('/bookings/:id', adminUpdateBooking);                   // Update all booking fields
router.put('/bookings/:id/status', adminUpdateBookingStatus);      // Update status only
router.put('/bookings/:id/payment', adminUpdatePaymentStatus);     // Update payment status
router.delete('/bookings/:id', adminDeleteBooking);                // Delete booking

module.exports = router;
