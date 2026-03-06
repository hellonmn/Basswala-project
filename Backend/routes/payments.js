const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  createBookingWithPayment,
  handleWebhook,
  getPaymentHistory,
  initiateRefund,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');

// Create Razorpay order
router.post('/create-order', protect, createOrder);

// Verify payment
router.post('/verify-payment', protect, verifyPayment);

// Get payment status
router.get('/status/:orderId', protect, getPaymentStatus);

// Create booking with verified payment
router.post('/create-booking', protect, createBookingWithPayment);

// Get payment history
router.get('/history', protect, getPaymentHistory);

// Webhook (no auth - verified by signature)
router.post('/webhook', handleWebhook);

// Refund payment (Admin only)
router.post('/refund/:paymentId', protect, isAdmin, initiateRefund);

module.exports = router;