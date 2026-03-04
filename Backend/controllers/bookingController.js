const { Booking, DJ, User } = require('../models');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const {
      djId,
      eventDetails,
      eventLocation,
      pricing
    } = req.body;

    // Validate DJ exists and is available
    const dj = await DJ.findByPk(djId);

    if (!dj) {
      return res.status(404).json({
        success: false,
        message: 'DJ not found'
      });
    }

    if (!dj.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'DJ is not available for booking'
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
      eventLatitude: eventLocation.coordinates[1],
      eventLongitude: eventLocation.coordinates[0],
      eventStreet: eventLocation.address?.street,
      eventCity: eventLocation.address?.city,
      eventState: eventLocation.address?.state,
      eventZipCode: eventLocation.address?.zipCode,
      eventCountry: eventLocation.address?.country,
      basePrice: pricing.basePrice,
      additionalCharges: pricing.additionalCharges || [],
      totalAmount: pricing.totalAmount
    });

    // Fetch complete booking with associations
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: DJ, as: 'dj' },
        { 
          model: User, 
          as: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// @desc    Get all bookings for logged in user
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [{ model: DJ, as: 'dj' }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: DJ, as: 'dj' },
        { 
          model: User, 
          as: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.userId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.userId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// @desc    Add rating and review to booking
// @route   PUT /api/bookings/:id/review
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.userId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to review this booking'
      });
    }

    // Make sure booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    booking.rating = rating;
    booking.review = review;
    booking.reviewDate = new Date();
    await booking.save();

    // Update DJ's average rating
    const dj = await DJ.findByPk(booking.djId);
    const bookings = await Booking.findAll({
      where: { 
        djId: booking.djId,
        rating: { [require('sequelize').Op.ne]: null }
      }
    });

    const totalRating = bookings.reduce((sum, b) => sum + b.rating, 0);
    dj.ratingAverage = totalRating / bookings.length;
    dj.ratingCount = bookings.length;
    await dj.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Make sure user is booking owner
    if (booking.userId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

