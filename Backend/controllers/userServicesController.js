const { Captain, CaptainDJ, Equipment, CaptainBooking, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// ══════════════════════════════════════════════════════
//  PUBLIC — Browse Captains, DJs, Equipment
// ══════════════════════════════════════════════════════

// GET /api/services/captains
// Browse all verified captains (public)
exports.getCaptains = async (req, res) => {
  try {
    const { city, search } = req.query;
    const where = { isActive: true, isVerified: true };
    if (city) where.locationCity = { [Op.like]: `%${city}%` };

    const captains = await Captain.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profilePicture'] }],
      order: [['businessName', 'ASC']]
    });

    res.status(200).json({ success: true, count: captains.length, data: captains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/captains/nearby?latitude=x&longitude=y&maxDistance=50
exports.getNearbyCaptains = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude required' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const captains = await Captain.findAll({
      where: { isActive: true },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'profilePicture'] }],
      attributes: {
        include: [[
          sequelize.literal(`(6371 * acos(cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLon})) + sin(radians(${userLat})) * sin(radians(latitude))))`),
          'distance'
        ]]
      },
      having: sequelize.literal(`distance <= ${maxDistance}`),
      order: sequelize.literal('distance ASC')
    });

    const result = captains.map(c => {
      const d = c.toJSON();
      d.distance = parseFloat(d.distance).toFixed(2) + ' km';
      return d;
    });

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/captains/:captainId/djs
// Browse a captain's available DJs
exports.getCaptainDJs = async (req, res) => {
  try {
    const { genre, minRate, maxRate, search } = req.query;
    let where = { captainId: req.params.captainId, isAvailable: true, isActive: true };
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate[Op.gte] = parseFloat(minRate);
      if (maxRate) where.hourlyRate[Op.lte] = parseFloat(maxRate);
    }

    let djs = await CaptainDJ.findAll({
      where,
      include: [{ model: Captain, as: 'captain', attributes: ['id', 'businessName', 'locationCity'] }],
      order: [['ratingAverage', 'DESC']]
    });

    if (genre) djs = djs.filter(d => (d.genres || []).includes(genre));

    res.status(200).json({ success: true, count: djs.length, data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/captains/:captainId/equipment
// Browse a captain's available equipment
exports.getCaptainEquipment = async (req, res) => {
  try {
    const { category } = req.query;
    const where = { captainId: req.params.captainId, isAvailable: true };
    if (category) where.category = category;

    const equipment = await Equipment.findAll({
      where,
      include: [{ model: Captain, as: 'captain', attributes: ['id', 'businessName', 'locationCity'] }],
      order: [['category', 'ASC']]
    });

    res.status(200).json({ success: true, count: equipment.length, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/equipment — all available equipment across all captains
exports.getAllEquipment = async (req, res) => {
  try {
    const { category, city, search, minRate, maxRate } = req.query;
    const where = { isAvailable: true };
    if (category) where.category = category;
    if (minRate || maxRate) {
      where.dailyRate = {};
      if (minRate) where.dailyRate[Op.gte] = parseFloat(minRate);
      if (maxRate) where.dailyRate[Op.lte] = parseFloat(maxRate);
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by captain city
    const captainWhere = { isActive: true };
    if (city) captainWhere.locationCity = { [Op.like]: `%${city}%` };

    const equipment = await Equipment.findAll({
      where,
      include: [{
        model: Captain, as: 'captain',
        where: captainWhere,
        attributes: ['id', 'businessName', 'locationCity', 'locationState']
      }],
      order: [['ratingAverage', 'DESC']]
    });

    res.status(200).json({ success: true, count: equipment.length, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/djs — all available DJs across all captains
exports.getAllCaptainDJs = async (req, res) => {
  try {
    const { genre, city, minRate, maxRate, search } = req.query;
    const where = { isAvailable: true, isActive: true };
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate[Op.gte] = parseFloat(minRate);
      if (maxRate) where.hourlyRate[Op.lte] = parseFloat(maxRate);
    }

    const captainWhere = { isActive: true };
    if (city) captainWhere.locationCity = { [Op.like]: `%${city}%` };

    let djs = await CaptainDJ.findAll({
      where,
      include: [{
        model: Captain, as: 'captain',
        where: captainWhere,
        attributes: ['id', 'businessName', 'locationCity', 'latitude', 'longitude']
      }],
      order: [['ratingAverage', 'DESC']]
    });

    if (genre) djs = djs.filter(d => (d.genres || []).includes(genre));

    res.status(200).json({ success: true, count: djs.length, data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  USER BOOKING — Create & Manage
// ══════════════════════════════════════════════════════

// POST /api/services/bookings
// User creates a booking for a captain's DJ and/or equipment
exports.createBooking = async (req, res) => {
  try {
    const {
      captainId,
      captainDJId,
      equipmentItems,   // [{ equipmentId, quantity, days }]
      eventType,
      eventDate,
      startTime,
      endTime,
      durationHours,
      guestCount,
      specialRequests,
      deliveryLocation  // { latitude, longitude, street, city, state, zipCode, country }
    } = req.body;

    if (!captainId || !eventType || !eventDate || !startTime || !endTime || !durationHours || !deliveryLocation) {
      return res.status(400).json({
        success: false,
        message: 'captainId, eventType, eventDate, startTime, endTime, durationHours, and deliveryLocation are required'
      });
    }

    if (!captainDJId && (!equipmentItems || equipmentItems.length === 0)) {
      return res.status(400).json({ success: false, message: 'Please select at least a DJ or one equipment item' });
    }

    // Validate captain exists
    const captain = await Captain.findByPk(captainId);
    if (!captain || !captain.isActive) {
      return res.status(404).json({ success: false, message: 'Captain not found or inactive' });
    }

    // Validate DJ if selected
    let djFee = 0;
    if (captainDJId) {
      const dj = await CaptainDJ.findOne({ where: { id: captainDJId, captainId, isAvailable: true } });
      if (!dj) return res.status(404).json({ success: false, message: 'DJ not found or unavailable' });
      djFee = parseFloat(dj.hourlyRate) * parseInt(durationHours);
    }

    // Validate and price equipment
    let equipmentFee = 0;
    const validatedItems = [];
    if (equipmentItems && equipmentItems.length > 0) {
      for (const item of equipmentItems) {
        const eq = await Equipment.findOne({ where: { id: item.equipmentId, captainId, isAvailable: true } });
        if (!eq) {
          return res.status(404).json({ success: false, message: `Equipment id ${item.equipmentId} not found or unavailable` });
        }
        if (item.quantity > eq.availableQuantity) {
          return res.status(400).json({ success: false, message: `Only ${eq.availableQuantity} unit(s) of "${eq.name}" available` });
        }
        const itemTotal = parseFloat(eq.dailyRate) * parseInt(item.days || 1) * parseInt(item.quantity);
        equipmentFee += itemTotal;
        validatedItems.push({ equipmentId: eq.id, name: eq.name, quantity: item.quantity, days: item.days || 1, dailyRate: eq.dailyRate, itemTotal });
      }
    }

    // Calculate delivery distance and fee
    let deliveryFee = 0;
    let deliveryDistanceKm = null;
    if (captain.latitude && captain.longitude && deliveryLocation.latitude && deliveryLocation.longitude) {
      const R = 6371;
      const dLat = (deliveryLocation.latitude - captain.latitude) * Math.PI / 180;
      const dLon = (deliveryLocation.longitude - captain.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(captain.latitude * Math.PI / 180) * Math.cos(deliveryLocation.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      deliveryDistanceKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));

      // Delivery fee based on equipment requiring delivery
      if (validatedItems.length > 0) {
        const avgDeliveryRate = 10; // fallback INR per km
        deliveryFee = deliveryDistanceKm * avgDeliveryRate;
      }
    }

    const totalAmount = djFee + equipmentFee + deliveryFee;

    // Create booking
    const booking = await CaptainBooking.create({
      captainId,
      userId: req.user.id,
      captainDJId: captainDJId || null,
      equipmentItems: validatedItems,
      eventType,
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      durationHours: parseInt(durationHours),
      guestCount: guestCount || null,
      specialRequests: specialRequests || null,
      deliveryLatitude: deliveryLocation.latitude,
      deliveryLongitude: deliveryLocation.longitude,
      deliveryStreet: deliveryLocation.street || null,
      deliveryCity: deliveryLocation.city || null,
      deliveryState: deliveryLocation.state || null,
      deliveryZipCode: deliveryLocation.zipCode || null,
      deliveryCountry: deliveryLocation.country || null,
      deliveryDistanceKm,
      djFee,
      equipmentFee,
      deliveryFee,
      totalAmount
    });

    // Reduce available equipment quantity
    for (const item of validatedItems) {
      await Equipment.decrement('availableQuantity', { by: item.quantity, where: { id: item.equipmentId } });
    }

    // Fetch full booking
    const full = await CaptainBooking.findByPk(booking.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: CaptainDJ, as: 'dj', required: false },
        { model: Captain, as: 'captain', attributes: ['id', 'businessName', 'phone', 'locationCity'] }
      ]
    });

    res.status(201).json({ success: true, message: 'Booking created successfully', data: full });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/bookings/my
// User views their own captain-service bookings
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };
    if (status) where.status = status;

    const { count, rows: bookings } = await CaptainBooking.findAndCountAll({
      where,
      include: [
        { model: Captain, as: 'captain', attributes: ['id', 'businessName', 'phone', 'locationCity', 'profilePicture'] },
        { model: CaptainDJ, as: 'dj', attributes: ['id', 'name', 'profilePicture'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await CaptainBooking.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Captain, as: 'captain', attributes: ['id', 'businessName', 'phone', 'locationCity', 'latitude', 'longitude'] },
        { model: CaptainDJ, as: 'dj', required: false },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const data = booking.toJSON();

    // Enrich equipment
    if (data.equipmentItems?.length > 0) {
      const ids = data.equipmentItems.map(i => i.equipmentId);
      const eqRecords = await Equipment.findAll({ where: { id: ids } });
      data.equipmentDetails = data.equipmentItems.map(item => ({
        ...item,
        equipment: eqRecords.find(e => e.id === item.equipmentId) || null
      }));
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/services/bookings/:id  (cancel)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await CaptainBooking.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (['Completed', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking` });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Restore equipment quantities
    if (booking.equipmentItems?.length > 0) {
      for (const item of booking.equipmentItems) {
        await Equipment.increment('availableQuantity', { by: item.quantity, where: { id: item.equipmentId } });
      }
    }

    res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/services/bookings/:id/review
exports.addReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await CaptainBooking.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }
    if (booking.rating) {
      return res.status(400).json({ success: false, message: 'Already reviewed' });
    }

    booking.rating = rating;
    booking.review = review || null;
    booking.reviewDate = new Date();
    await booking.save();

    // Update DJ rating if DJ was booked
    if (booking.captainDJId) {
      const allRated = await CaptainBooking.findAll({
        where: { captainDJId: booking.captainDJId, rating: { [Op.ne]: null } }
      });
      const avg = allRated.reduce((s, b) => s + b.rating, 0) / allRated.length;
      await CaptainDJ.update(
        { ratingAverage: avg.toFixed(1), ratingCount: allRated.length },
        { where: { id: booking.captainDJId } }
      );
    }

    res.status(200).json({ success: true, message: 'Review submitted', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};