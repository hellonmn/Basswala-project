const { User, DJ, Booking } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');

// ════════════════════════════════════════════════════════════════
//  ADMIN — DASHBOARD
// ════════════════════════════════════════════════════════════════

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers, totalDJs, activeDJs, totalBookings,
      pendingBookings, confirmedBookings, completedBookings, cancelledBookings,
      newUsersThisWeek, newUsersThisMonth, bookingsThisMonth, bookingsLastMonth
    ] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      DJ.count(),
      DJ.count({ where: { isAvailable: true } }),
      Booking.count(),
      Booking.count({ where: { status: 'Pending' } }),
      Booking.count({ where: { status: 'Confirmed' } }),
      Booking.count({ where: { status: 'Completed' } }),
      Booking.count({ where: { status: 'Cancelled' } }),
      User.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      User.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
      Booking.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
      Booking.count({ where: { createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
    ]);

    // Monthly bookings breakdown for last 6 months
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await Booking.count({ where: { createdAt: { [Op.between]: [start, end] } } });
      monthlyStats.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        bookings: count
      });
    }

    const recentBookings = await Booking.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: DJ, as: 'dj', attributes: ['id', 'name', 'locationCity'] }
      ],
      order: [['createdAt', 'DESC']], limit: 10
    });

    const recentUsers = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']], limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers, totalDJs, activeDJs, totalBookings,
          pendingBookings, confirmedBookings, completedBookings, cancelledBookings,
          newUsersThisWeek, newUsersThisMonth,
          bookingsThisMonth, bookingsLastMonth,
          bookingGrowth: bookingsLastMonth > 0 ? (((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100).toFixed(1) : null
        },
        monthlyStats,
        recentBookings,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  ADMIN — FULL USER MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, isVerified, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = {};

    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (isVerified !== undefined) whereClause.isVerified = isVerified === 'true';
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { locationCity: { [Op.like]: `%${search}%` } }
      ];
    }

    const validSort = ['createdAt', 'firstName', 'lastName', 'email', 'lastLogin'];
    const orderField = validSort.includes(sortBy) ? sortBy : 'createdAt';

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [[orderField, sortOrder === 'ASC' ? 'ASC' : 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });

    res.status(200).json({
      success: true, count, totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page), data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// GET /api/admin/users/:id  — full profile with bookings + DJ profile
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: DJ, as: 'djProfile', required: false }]
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [bookings, bookingStats] = await Promise.all([
      Booking.findAll({
        where: { userId: req.params.id },
        include: [{ model: DJ, as: 'dj', attributes: ['id', 'name', 'locationCity', 'hourlyRate'] }],
        order: [['createdAt', 'DESC']]
      }),
      Promise.all([
        Booking.count({ where: { userId: req.params.id } }),
        Booking.count({ where: { userId: req.params.id, status: 'Completed' } }),
        Booking.count({ where: { userId: req.params.id, status: 'Pending' } }),
        Booking.count({ where: { userId: req.params.id, status: 'Cancelled' } }),
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        bookingStats: {
          total: bookingStats[0], completed: bookingStats[1],
          pending: bookingStats[2], cancelled: bookingStats[3]
        },
        bookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

// PUT /api/admin/users/:id  — update ALL user fields
exports.adminUpdateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'role',
      'isActive', 'isVerified', 'dateOfBirth', 'profilePicture', 'preferences',
      'latitude', 'longitude', 'locationStreet', 'locationCity',
      'locationState', 'locationZipCode', 'locationCountry'
    ];

    const updates = {};
    allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    // If role is changing to non-dj, unlink DJ profile
    if (req.body.role && req.body.role !== 'dj' && user.role === 'dj' && user.djProfileId) {
      await DJ.update({ userId: null }, { where: { id: user.djProfileId } });
      updates.djProfileId = null;
    }

    await user.update(updates);
    const updated = user.toJSON();
    delete updated.password;

    res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

// PUT /api/admin/users/:id/location  — update user location specifically
exports.adminUpdateUserLocation = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { latitude, longitude, locationStreet, locationCity, locationState, locationZipCode, locationCountry } = req.body;

    await user.update({
      latitude: latitude ?? user.latitude,
      longitude: longitude ?? user.longitude,
      locationStreet: locationStreet ?? user.locationStreet,
      locationCity: locationCity ?? user.locationCity,
      locationState: locationState ?? user.locationState,
      locationZipCode: locationZipCode ?? user.locationZipCode,
      locationCountry: locationCountry ?? user.locationCountry,
      locationUpdatedAt: new Date()
    });

    const updated = user.toJSON(); delete updated.password;
    res.status(200).json({ success: true, message: 'User location updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating location', error: error.message });
  }
};

// PUT /api/admin/users/:id/reset-password  — admin sets new password for user
exports.adminResetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword; // bcrypt hook will hash it
    await user.save();

    res.status(200).json({ success: true, message: 'User password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};

// PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot change admin status' });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling user status', error: error.message });
  }
};

// PUT /api/admin/users/:id/verify
exports.adminVerifyUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({ success: true, message: `User ${user.isVerified ? 'verified' : 'unverified'}`, isVerified: user.isVerified });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating verification', error: error.message });
  }
};

// GET /api/admin/users/:id/bookings  — all bookings of a specific user
exports.getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = { userId: req.params.id };
    if (status) whereClause.status = status;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [{ model: DJ, as: 'dj', attributes: ['id', 'name', 'locationCity', 'hourlyRate', 'images'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page), data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user bookings', error: error.message });
  }
};

// DELETE /api/admin/users/:id
exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });

    if (user.djProfileId) await DJ.destroy({ where: { id: user.djProfileId } });
    await Booking.destroy({ where: { userId: req.params.id } });
    await User.destroy({ where: { id: req.params.id } });

    res.status(200).json({ success: true, message: 'User and all their data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  ADMIN — FULL DJ MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET /api/admin/djs
exports.adminGetAllDJs = async (req, res) => {
  try {
    const { page = 1, limit = 20, isAvailable, city, search } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = {};

    if (isAvailable !== undefined) whereClause.isAvailable = isAvailable === 'true';
    if (city) whereClause.locationCity = { [Op.like]: `%${city}%` };
    if (search) whereClause.name = { [Op.like]: `%${search}%` };

    const { count, rows: djs } = await DJ.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'isVerified'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page), data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJs', error: error.message });
  }
};

// GET /api/admin/djs/:id  — full DJ profile with owner + all bookings
exports.adminGetDJById = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: { exclude: ['password'] } }]
    });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    const [bookings, bookingStats] = await Promise.all([
      Booking.findAll({
        where: { djId: req.params.id },
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
        order: [['createdAt', 'DESC']]
      }),
      Promise.all([
        Booking.count({ where: { djId: req.params.id } }),
        Booking.count({ where: { djId: req.params.id, status: 'Completed' } }),
        Booking.count({ where: { djId: req.params.id, status: 'Pending' } }),
        Booking.count({ where: { djId: req.params.id, status: 'Cancelled' } }),
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...dj.toJSON(),
        bookingStats: {
          total: bookingStats[0], completed: bookingStats[1],
          pending: bookingStats[2], cancelled: bookingStats[3]
        },
        bookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJ', error: error.message });
  }
};

// POST /api/admin/djs
exports.adminCreateDJ = async (req, res) => {
  try {
    const { userId, name, description, equipment, latitude, longitude, locationCity, locationState, locationCountry, hourlyRate, minimumHours, currency, genres, images, schedule } = req.body;

    if (!name || !description || !hourlyRate || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'name, description, hourlyRate, latitude and longitude are required' });
    }

    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (user.djProfileId) return res.status(400).json({ success: false, message: 'User already has a DJ profile' });
    }

    const dj = await DJ.create({
      userId: userId || null, name, description,
      equipment: equipment || {}, latitude, longitude,
      locationCity, locationState, locationCountry,
      hourlyRate, minimumHours: minimumHours || 2,
      currency: currency || 'INR',
      genres: genres || [], images: images || [], schedule: schedule || []
    });

    if (userId) {
      await User.update({ djProfileId: dj.id, role: 'dj' }, { where: { id: userId } });
    }

    res.status(201).json({ success: true, message: 'DJ created successfully', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating DJ', error: error.message });
  }
};

// PUT /api/admin/djs/:id  — update ALL DJ fields
exports.adminUpdateDJ = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id);
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    const allowedFields = [
      'name', 'description', 'equipment', 'genres', 'images', 'schedule',
      'locationCity', 'locationState', 'locationCountry', 'latitude', 'longitude',
      'hourlyRate', 'minimumHours', 'currency', 'isAvailable',
      'ratingAverage', 'ratingCount'
    ];

    allowedFields.forEach(field => { if (req.body[field] !== undefined) dj[field] = req.body[field]; });
    await dj.save();

    res.status(200).json({ success: true, message: 'DJ updated successfully', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating DJ', error: error.message });
  }
};

// PUT /api/admin/djs/:id/assign-owner  — assign or reassign DJ to a user
exports.adminAssignDJOwner = async (req, res) => {
  try {
    const { userId } = req.body;
    const dj = await DJ.findByPk(req.params.id);
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    const newOwner = await User.findByPk(userId);
    if (!newOwner) return res.status(404).json({ success: false, message: 'User not found' });

    // Unlink old owner
    if (dj.userId) await User.update({ djProfileId: null }, { where: { id: dj.userId } });

    // Link new owner
    await newOwner.update({ djProfileId: dj.id, role: 'dj' });
    await dj.update({ userId });

    res.status(200).json({ success: true, message: 'DJ owner reassigned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning owner', error: error.message });
  }
};

// PUT /api/admin/djs/:id/availability
exports.adminToggleDJAvailability = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id);
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    dj.isAvailable = !dj.isAvailable;
    await dj.save();

    res.status(200).json({ success: true, message: `DJ is now ${dj.isAvailable ? 'Available' : 'Unavailable'}`, isAvailable: dj.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling availability', error: error.message });
  }
};

// GET /api/admin/djs/:id/bookings  — all bookings for a specific DJ
exports.getDJBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = { djId: req.params.id };
    if (status) whereClause.status = status;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture'] }],
      order: [['eventDate', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page), data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJ bookings', error: error.message });
  }
};

// DELETE /api/admin/djs/:id
exports.adminDeleteDJ = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id);
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    if (dj.userId) await User.update({ djProfileId: null }, { where: { id: dj.userId } });
    await Booking.destroy({ where: { djId: req.params.id } });
    await DJ.destroy({ where: { id: req.params.id } });

    res.status(200).json({ success: true, message: 'DJ and all related bookings deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting DJ', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  ADMIN — FULL BOOKING MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, djId, userId, paymentStatus, eventType, month, year } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = {};

    if (status) whereClause.status = status;
    if (djId) whereClause.djId = djId;
    if (userId) whereClause.userId = userId;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus;
    if (eventType) whereClause.eventType = eventType;

    // Filter by month/year
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      whereClause.eventDate = { [Op.between]: [start, end] };
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1);
      const end = new Date(parseInt(year), 11, 31, 23, 59, 59);
      whereClause.eventDate = { [Op.between]: [start, end] };
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: DJ, as: 'dj', attributes: ['id', 'name', 'locationCity', 'hourlyRate'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page), data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
  }
};

// GET /api/admin/bookings/:id  — single booking full details
exports.adminGetBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: DJ, as: 'dj' }
      ]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching booking', error: error.message });
  }
};

// PUT /api/admin/bookings/:id  — update ALL booking fields
exports.adminUpdateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const allowedFields = [
      'status', 'paymentStatus', 'paymentMethod', 'transactionId',
      'eventType', 'eventDate', 'startTime', 'endTime', 'duration',
      'guestCount', 'specialRequests', 'basePrice', 'totalAmount',
      'additionalCharges', 'eventStreet', 'eventCity', 'eventState',
      'eventZipCode', 'eventCountry', 'rating', 'review'
    ];

    allowedFields.forEach(field => { if (req.body[field] !== undefined) booking[field] = req.body[field]; });
    await booking.save();

    // If completed and rating given, update DJ average
    if (booking.status === 'Completed' && booking.rating) {
      const allRatedBookings = await Booking.findAll({
        where: { djId: booking.djId, rating: { [Op.ne]: null } }
      });
      const avg = allRatedBookings.reduce((sum, b) => sum + b.rating, 0) / allRatedBookings.length;
      await DJ.update({ ratingAverage: avg.toFixed(1), ratingCount: allRatedBookings.length }, { where: { id: booking.djId } });
    }

    res.status(200).json({ success: true, message: 'Booking updated successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating booking', error: error.message });
  }
};

// PUT /api/admin/bookings/:id/status
exports.adminUpdateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: `Invalid status. Must be: ${validStatuses.join(', ')}` });

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating booking status', error: error.message });
  }
};

// PUT /api/admin/bookings/:id/payment
exports.adminUpdatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, transactionId } = req.body;
    const validPaymentStatuses = ['Pending', 'Paid', 'Refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: `Invalid payment status. Must be: ${validPaymentStatuses.join(', ')}` });
    }

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;
    await booking.save();

    res.status(200).json({ success: true, message: 'Payment status updated', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating payment', error: error.message });
  }
};

// DELETE /api/admin/bookings/:id
exports.adminDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await Booking.destroy({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting booking', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  ADMIN — MONTHLY REPORTS
// ════════════════════════════════════════════════════════════════

// GET /api/admin/reports/monthly?month=3&year=2026
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const [
      totalBookings, completedBookings, cancelledBookings, pendingBookings,
      newUsers, newDJs
    ] = await Promise.all([
      Booking.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
      Booking.count({ where: { status: 'Completed', createdAt: { [Op.between]: [start, end] } } }),
      Booking.count({ where: { status: 'Cancelled', createdAt: { [Op.between]: [start, end] } } }),
      Booking.count({ where: { status: 'Pending', createdAt: { [Op.between]: [start, end] } } }),
      User.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
      DJ.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
    ]);

    // Top DJs by bookings this month
    const topDJs = await Booking.findAll({
      where: { createdAt: { [Op.between]: [start, end] } },
      attributes: ['djId', [fn('COUNT', col('djId')), 'bookingCount']],
      include: [{ model: DJ, as: 'dj', attributes: ['id', 'name', 'locationCity', 'ratingAverage'] }],
      group: ['djId'],
      order: [[literal('bookingCount'), 'DESC']],
      limit: 5
    });

    // Top event types this month
    const topEventTypes = await Booking.findAll({
      where: { createdAt: { [Op.between]: [start, end] } },
      attributes: ['eventType', [fn('COUNT', col('eventType')), 'count']],
      group: ['eventType'],
      order: [[literal('count'), 'DESC']]
    });

    // All bookings for this month
    const bookings = await Booking.findAll({
      where: { createdAt: { [Op.between]: [start, end] } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: DJ, as: 'dj', attributes: ['id', 'name', 'locationCity'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        period: { month: parseInt(month), year: parseInt(year), from: start, to: end },
        stats: { totalBookings, completedBookings, cancelledBookings, pendingBookings, newUsers, newDJs },
        topDJs,
        topEventTypes,
        bookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating monthly report', error: error.message });
  }
};

// GET /api/admin/reports/yearly?year=2026
exports.getYearlyReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const monthlyBreakdown = [];

    for (let m = 1; m <= 12; m++) {
      const start = new Date(parseInt(year), m - 1, 1);
      const end = new Date(parseInt(year), m, 0, 23, 59, 59);

      const [total, completed, cancelled, newUsers] = await Promise.all([
        Booking.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
        Booking.count({ where: { status: 'Completed', createdAt: { [Op.between]: [start, end] } } }),
        Booking.count({ where: { status: 'Cancelled', createdAt: { [Op.between]: [start, end] } } }),
        User.count({ where: { createdAt: { [Op.between]: [start, end] } } })
      ]);

      monthlyBreakdown.push({
        month: m,
        monthName: start.toLocaleString('default', { month: 'long' }),
        totalBookings: total, completedBookings: completed,
        cancelledBookings: cancelled, newUsers
      });
    }

    res.status(200).json({ success: true, data: { year: parseInt(year), monthlyBreakdown } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating yearly report', error: error.message });
  }
};
