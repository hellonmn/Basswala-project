const { DJ, User, Booking } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// ════════════════════════════════════════
//  PUBLIC ROUTES
// ════════════════════════════════════════

// @desc    Get all DJs (with owner details)
// @route   GET /api/djs
exports.getDJs = async (req, res) => {
  try {
    const djs = await DJ.findAll({
      where: { isAvailable: true },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture', 'locationCity', 'locationState'] }],
      order: [['ratingAverage', 'DESC']]
    });
    res.status(200).json({ success: true, count: djs.length, data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJs', error: error.message });
  }
};

// @desc    Get single DJ with owner + reviews
// @route   GET /api/djs/:id
exports.getDJ = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture', 'locationCity', 'locationState', 'locationCountry'] }]
    });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    const reviews = await Booking.findAll({
      where: { djId: dj.id, rating: { [Op.ne]: null } },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profilePicture'] }],
      attributes: ['id', 'rating', 'review', 'reviewDate', 'eventType'],
      order: [['reviewDate', 'DESC']],
      limit: 10
    });

    const djData = dj.toJSON();
    djData.reviews = reviews;
    res.status(200).json({ success: true, data: djData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJ', error: error.message });
  }
};

// @desc    Get DJ equipment/products
// @route   GET /api/djs/:id/equipment
exports.getDJEquipment = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id, {
      attributes: ['id', 'name', 'equipment', 'genres', 'images', 'hourlyRate', 'minimumHours', 'currency']
    });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    res.status(200).json({
      success: true,
      data: {
        djId: dj.id, djName: dj.name, genres: dj.genres, images: dj.images,
        pricing: { hourlyRate: dj.hourlyRate, minimumHours: dj.minimumHours, currency: dj.currency },
        equipment: dj.equipment
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching equipment', error: error.message });
  }
};

// @desc    Search DJs
// @route   GET /api/djs/search
exports.searchDJs = async (req, res) => {
  try {
    const { genre, minRate, maxRate, city, minRating } = req.query;
    let whereClause = { isAvailable: true };

    if (city) whereClause.locationCity = { [Op.like]: `%${city}%` };
    if (minRate || maxRate) {
      whereClause.hourlyRate = {};
      if (minRate) whereClause.hourlyRate[Op.gte] = parseFloat(minRate);
      if (maxRate) whereClause.hourlyRate[Op.lte] = parseFloat(maxRate);
    }
    if (minRating) whereClause.ratingAverage = { [Op.gte]: parseFloat(minRating) };

    let djs = await DJ.findAll({
      where: whereClause,
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'profilePicture'] }],
      order: [['ratingAverage', 'DESC']]
    });
    if (genre) djs = djs.filter(dj => (dj.genres || []).includes(genre));

    res.status(200).json({ success: true, count: djs.length, data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching DJs', error: error.message });
  }
};

// @desc    Get nearby DJs
// @route   GET /api/djs/nearby
exports.getNearbyDJs = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Please provide latitude and longitude' });

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const djs = await DJ.findAll({
      where: { isAvailable: true },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'profilePicture'] }],
      attributes: {
        include: [[
          sequelize.literal(`(6371 * acos(cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLon})) + sin(radians(${userLat})) * sin(radians(latitude))))`),
          'distance'
        ]]
      },
      having: sequelize.literal(`distance <= ${maxDistance}`),
      order: sequelize.literal('distance ASC')
    });

    const result = djs.map(dj => { const d = dj.toJSON(); d.distance = parseFloat(d.distance).toFixed(2) + ' km'; return d; });
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching nearby DJs', error: error.message });
  }
};

// ════════════════════════════════════════
//  DJ ROLE — OWN PROFILE MANAGEMENT
// ════════════════════════════════════════

// @desc    Create DJ profile
// @route   POST /api/djs/create-profile
exports.createDJProfile = async (req, res) => {
  try {
    if (req.user.djProfileId) return res.status(400).json({ success: false, message: 'DJ profile already exists. Use update instead.' });

    const { name, description, equipment, latitude, longitude, locationCity, locationState, locationCountry, hourlyRate, minimumHours, currency, genres, images, schedule } = req.body;

    if (!description || !hourlyRate || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'description, hourlyRate, latitude and longitude are required' });
    }

    const djProfile = await DJ.create({
      userId: req.user.id,
      name: name || `${req.user.firstName} ${req.user.lastName}`,
      description, equipment: equipment || {},
      latitude, longitude, locationCity, locationState, locationCountry,
      hourlyRate, minimumHours: minimumHours || 2,
      currency: currency || 'INR',
      genres: genres || [], images: images || [], schedule: schedule || []
    });

    await req.user.update({ djProfileId: djProfile.id });
    res.status(201).json({ success: true, message: 'DJ profile created successfully', data: djProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating DJ profile', error: error.message });
  }
};

// @desc    Get my DJ profile + stats
// @route   GET /api/djs/my-profile
exports.getMyDJProfile = async (req, res) => {
  try {
    if (!req.user.djProfileId) return res.status(404).json({ success: false, message: 'No DJ profile found. Create one first.' });

    const dj = await DJ.findByPk(req.user.djProfileId);
    const [totalBookings, completedBookings, pendingBookings, confirmedBookings] = await Promise.all([
      Booking.count({ where: { djId: dj.id } }),
      Booking.count({ where: { djId: dj.id, status: 'Completed' } }),
      Booking.count({ where: { djId: dj.id, status: 'Pending' } }),
      Booking.count({ where: { djId: dj.id, status: 'Confirmed' } })
    ]);

    const recentBookings = await Booking.findAll({
      where: { djId: dj.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'profilePicture'] }],
      order: [['createdAt', 'DESC']], limit: 5
    });

    res.status(200).json({ success: true, data: { profile: dj, stats: { totalBookings, completedBookings, pendingBookings, confirmedBookings }, recentBookings } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJ profile', error: error.message });
  }
};

// @desc    Update my DJ profile
// @route   PUT /api/djs/my-profile
exports.updateDJProfile = async (req, res) => {
  try {
    if (!req.user.djProfileId) return res.status(404).json({ success: false, message: 'No DJ profile found. Create one first.' });

    const dj = await DJ.findByPk(req.user.djProfileId);
    const fields = ['name', 'description', 'equipment', 'locationCity', 'locationState', 'locationCountry', 'latitude', 'longitude', 'hourlyRate', 'minimumHours', 'currency', 'isAvailable', 'genres', 'images', 'schedule'];
    fields.forEach(field => { if (req.body[field] !== undefined) dj[field] = req.body[field]; });
    await dj.save();

    res.status(200).json({ success: true, message: 'DJ profile updated successfully', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating DJ profile', error: error.message });
  }
};

// @desc    Toggle DJ availability on/off
// @route   PUT /api/djs/my-profile/availability
exports.toggleAvailability = async (req, res) => {
  try {
    if (!req.user.djProfileId) return res.status(404).json({ success: false, message: 'No DJ profile found.' });

    const dj = await DJ.findByPk(req.user.djProfileId);
    dj.isAvailable = !dj.isAvailable;
    await dj.save();

    res.status(200).json({ success: true, message: `You are now ${dj.isAvailable ? 'Available' : 'Unavailable'}`, isAvailable: dj.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling availability', error: error.message });
  }
};

// @desc    Delete my own DJ profile
// @route   DELETE /api/djs/my-profile
exports.deleteDJProfile = async (req, res) => {
  try {
    if (!req.user.djProfileId) return res.status(404).json({ success: false, message: 'No DJ profile found.' });

    const activeBookings = await Booking.count({
      where: { djId: req.user.djProfileId, status: ['Pending', 'Confirmed', 'In Progress'] }
    });
    if (activeBookings > 0) return res.status(400).json({ success: false, message: `Cannot delete profile. You have ${activeBookings} active booking(s).` });

    await DJ.destroy({ where: { id: req.user.djProfileId } });
    await req.user.update({ djProfileId: null });

    res.status(200).json({ success: true, message: 'DJ profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting DJ profile', error: error.message });
  }
};

// ════════════════════════════════════════
//  ADMIN — FULL DJ MANAGEMENT
// ════════════════════════════════════════

// @desc    Admin: Get ALL DJs (available + unavailable)
// @route   GET /api/admin/djs
exports.adminGetAllDJs = async (req, res) => {
  try {
    const { page = 1, limit = 20, isAvailable, city } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = {};
    if (isAvailable !== undefined) whereClause.isAvailable = isAvailable === 'true';
    if (city) whereClause.locationCity = { [Op.like]: `%${city}%` };

    const { count, rows: djs } = await DJ.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'isActive'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: parseInt(offset)
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page), data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching DJs', error: error.message });
  }
};

// @desc    Admin: Create a new DJ (assign to a user)
// @route   POST /api/admin/djs
exports.adminCreateDJ = async (req, res) => {
  try {
    const { userId, name, description, equipment, latitude, longitude, locationCity, locationState, locationCountry, hourlyRate, minimumHours, currency, genres, images, schedule } = req.body;

    if (!name || !description || !hourlyRate || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'name, description, hourlyRate, latitude and longitude are required' });
    }

    // If userId provided, validate the user exists and has dj role
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (user.role !== 'dj') return res.status(400).json({ success: false, message: 'User must have DJ role' });
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

    // Link to user if userId provided
    if (userId) await User.update({ djProfileId: dj.id }, { where: { id: userId } });

    res.status(201).json({ success: true, message: 'DJ created successfully', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating DJ', error: error.message });
  }
};

// @desc    Admin: Update any DJ
// @route   PUT /api/admin/djs/:id
exports.adminUpdateDJ = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id);
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    const fields = ['name', 'description', 'equipment', 'locationCity', 'locationState', 'locationCountry', 'latitude', 'longitude', 'hourlyRate', 'minimumHours', 'currency', 'isAvailable', 'genres', 'images', 'schedule', 'ratingAverage', 'ratingCount'];
    fields.forEach(field => { if (req.body[field] !== undefined) dj[field] = req.body[field]; });
    await dj.save();

    res.status(200).json({ success: true, message: 'DJ updated successfully', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating DJ', error: error.message });
  }
};

// @desc    Admin: Delete any DJ
// @route   DELETE /api/admin/djs/:id
exports.adminDeleteDJ = async (req, res) => {
  try {
    const dj = await DJ.findByPk(req.params.id);
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    // Unlink from user if linked
    if (dj.userId) await User.update({ djProfileId: null }, { where: { id: dj.userId } });

    await DJ.destroy({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'DJ deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting DJ', error: error.message });
  }
};

// @desc    Admin: Toggle DJ availability
// @route   PUT /api/admin/djs/:id/availability
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
