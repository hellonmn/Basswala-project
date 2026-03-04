const { User, Booking, DJ } = require('../models');

// @desc    Get logged-in user's full profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: DJ,
          as: 'djProfile',
          required: false
        }
      ]
    });

    // Booking summary stats
    const [totalBookings, completedBookings, pendingBookings, cancelledBookings] = await Promise.all([
      Booking.count({ where: { userId: req.user.id } }),
      Booking.count({ where: { userId: req.user.id, status: 'Completed' } }),
      Booking.count({ where: { userId: req.user.id, status: 'Pending' } }),
      Booking.count({ where: { userId: req.user.id, status: 'Cancelled' } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        bookingStats: { totalBookings, completedBookings, pendingBookings, cancelledBookings }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'profilePicture', 'preferences'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByPk(req.user.id);
    await user.update(updates);

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

// @desc    Get user's booking history
// @route   GET /api/users/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DJ,
          as: 'dj',
          attributes: ['id', 'name', 'images', 'locationCity', 'hourlyRate', 'ratingAverage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

// @desc    Deactivate account
// @route   DELETE /api/users/account
// @access  Private
exports.deactivateAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    await user.update({ isActive: false });

    res.status(200).json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deactivating account', error: error.message });
  }
};
