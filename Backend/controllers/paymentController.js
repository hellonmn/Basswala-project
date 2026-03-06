const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Booking, User } = require('../models');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay order
 * @route   POST /api/payments/create-order
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save order to database
    const payment = await Payment.create({
      userId: req.user.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: razorpayOrder.currency,
      status: 'created',
      receipt: razorpayOrder.receipt,
      notes: razorpayOrder.notes,
    });

    res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Send key for frontend
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/payments/verify-payment
 * @access  Private
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details',
      });
    }

    // Generate signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      // Update payment status to failed
      await Payment.update(
        { 
          status: 'failed',
          errorDescription: 'Signature verification failed',
        },
        { where: { razorpayOrderId: razorpay_order_id } }
      );

      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment verification failed',
      });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment in database
    const payment = await Payment.findOne({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    await payment.update({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: razorpayPayment.status === 'captured' ? 'success' : razorpayPayment.status,
      paymentMethod: razorpayPayment.method,
      paidAt: new Date(razorpayPayment.created_at * 1000),
    });

    res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      status: payment.status,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Get payment status
 * @route   GET /api/payments/status/:orderId
 * @access  Private
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({
      where: { razorpayOrderId: orderId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Booking,
          as: 'booking',
          required: false
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if user has access
    if (payment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment',
      });
    }

    res.status(200).json({
      success: true,
      payment: payment,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message,
    });
  }
};

/**
 * @desc    Create booking with payment
 * @route   POST /api/payments/create-booking
 * @access  Private
 */
exports.createBookingWithPayment = async (req, res) => {
  try {
    const {
      djId,
      razorpay_order_id,
      razorpay_payment_id,
      eventDetails,
      eventLocation,
    } = req.body;

    // Find and verify payment
    const payment = await Payment.findOne({
      where: { 
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: 'success',
        userId: req.user.id
      }
    });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment not found',
      });
    }

    // Check if payment already used
    if (payment.bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Payment already used for another booking',
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      djId: djId,
      eventType: eventDetails.eventType,
      eventDate: eventDetails.eventDate,
      startTime: eventDetails.startTime,
      endTime: eventDetails.endTime,
      duration: eventDetails.duration,
      guestCount: eventDetails.guestCount,
      specialRequests: eventDetails.specialRequests,
      eventLatitude: eventLocation.latitude,
      eventLongitude: eventLocation.longitude,
      eventStreet: eventLocation.street,
      eventCity: eventLocation.city,
      eventState: eventLocation.state,
      eventZipCode: eventLocation.zipCode,
      eventCountry: eventLocation.country,
      basePrice: eventDetails.basePrice,
      additionalCharges: eventDetails.additionalCharges || [],
      totalAmount: payment.amount,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      paymentMethod: payment.paymentMethod,
      transactionId: razorpay_payment_id,
    });

    // Link payment to booking
    await payment.update({ bookingId: booking.id });

    // Fetch complete booking
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: require('../models/DJ'), as: 'dj' },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: completeBooking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Handle Razorpay webhook
 * @route   POST /api/payments/webhook
 * @access  Public (verified by signature)
 */
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log('Webhook event:', event);

    // Handle different events
    switch (event) {
      case 'payment.captured':
        await Payment.update(
          {
            status: 'success',
            razorpayPaymentId: payload.id,
            paymentMethod: payload.method,
            paidAt: new Date(payload.created_at * 1000),
          },
          { where: { razorpayOrderId: payload.order_id } }
        );
        break;

      case 'payment.failed':
        await Payment.update(
          {
            status: 'failed',
            errorCode: payload.error_code,
            errorDescription: payload.error_description,
          },
          { where: { razorpayOrderId: payload.order_id } }
        );
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const payments = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Booking,
          as: 'booking',
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: payments.count,
      totalPages: Math.ceil(payments.count / parseInt(limit)),
      currentPage: parseInt(page),
      payments: payments.rows,
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message,
    });
  }
};

/**
 * @desc    Initiate refund
 * @route   POST /api/payments/refund/:paymentId
 * @access  Private (Admin)
 */
exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findOne({
      where: { razorpayPaymentId: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Only successful payments can be refunded',
      });
    }

    // Create refund in Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : Math.round(payment.amount * 100),
      notes: {
        reason: reason || 'Refund requested',
      },
    });

    // Update payment status
    await payment.update({
      status: 'refunded',
      refundedAt: new Date(),
      notes: {
        ...payment.notes,
        refundId: refund.id,
        refundReason: reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate refund',
      error: error.message,
    });
  }
};