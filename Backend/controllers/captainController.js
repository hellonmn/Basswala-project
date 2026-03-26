const { Captain, CaptainDJ, Equipment, CaptainBooking, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { broadcastBookingUpdate } = require('../utils/websocket');

// ══════════════════════════════════════════════════════
//  CAPTAIN PROFILE
// ══════════════════════════════════════════════════════

// GET /api/captain/profile
exports.getMyProfile = async (req, res) => {
  try {
    const captain = await Captain.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }]
    });
    if (!captain) return res.status(404).json({ success: false, message: 'Captain profile not found' });

    const [totalDJs, totalEquipment, totalBookings, pendingBookings, completedBookings] = await Promise.all([
      CaptainDJ.count({ where: { captainId: captain.id } }),
      Equipment.count({ where: { captainId: captain.id } }),
      CaptainBooking.count({ where: { captainId: captain.id } }),
      CaptainBooking.count({ where: { captainId: captain.id, status: 'Pending' } }),
      CaptainBooking.count({ where: { captainId: captain.id, status: 'Completed' } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...captain.toJSON(),
        stats: { totalDJs, totalEquipment, totalBookings, pendingBookings, completedBookings }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/captain/profile
exports.updateMyProfile = async (req, res) => {
  try {
    const captain = req.captain;
    const fields = [
      'businessName', 'phone', 'description', 'profilePicture',
      'latitude', 'longitude', 'locationCity', 'locationState',
      'locationCountry', 'serviceRadiusKm'
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) captain[f] = req.body[f]; });
    await captain.save();
    res.status(200).json({ success: true, message: 'Profile updated', data: captain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  CAPTAIN DJ MANAGEMENT
// ══════════════════════════════════════════════════════

// GET /api/captain/djs
exports.getMyDJs = async (req, res) => {
  try {
    const { isAvailable, search } = req.query;
    const where = { captainId: req.captain.id };
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (search) where.name = { [Op.like]: `%${search}%` };

    const djs = await CaptainDJ.findAll({
      where,
      include: [{ model: User, as: 'userAccount', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, count: djs.length, data: djs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/captain/djs/:id
exports.getDJById = async (req, res) => {
  try {
    const dj = await CaptainDJ.findOne({
      where: { id: req.params.id, captainId: req.captain.id },
      include: [{ model: User, as: 'userAccount', attributes: { exclude: ['password'] }, required: false }]
    });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    // Recent bookings for this DJ
    const recentBookings = await CaptainBooking.findAll({
      where: { captainDJId: dj.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({ success: true, data: { ...dj.toJSON(), recentBookings } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/captain/djs
exports.addDJ = async (req, res) => {
  try {
    const {
      name, phone, email, bio, profilePicture, genres,
      experienceYears, hourlyRate, minimumHours, currency,
      specializations, images, userId
    } = req.body;

    if (!name || !hourlyRate) {
      return res.status(400).json({ success: false, message: 'name and hourlyRate are required' });
    }

    // If linking to existing user, validate
    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dj = await CaptainDJ.create({
      captainId: req.captain.id,
      userId: userId || null,
      name, phone, email, bio, profilePicture,
      genres: genres || [],
      experienceYears: experienceYears || 0,
      hourlyRate,
      minimumHours: minimumHours || 2,
      currency: currency || 'INR',
      specializations: specializations || [],
      images: images || []
    });

    res.status(201).json({ success: true, message: 'DJ added successfully', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/captain/djs/:id
exports.updateDJ = async (req, res) => {
  try {
    const dj = await CaptainDJ.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    const fields = [
      'name', 'phone', 'email', 'bio', 'profilePicture', 'genres',
      'experienceYears', 'hourlyRate', 'minimumHours', 'currency',
      'isAvailable', 'isActive', 'specializations', 'images', 'equipment'
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) dj[f] = req.body[f]; });
    await dj.save();

    res.status(200).json({ success: true, message: 'DJ updated', data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/captain/djs/:id/availability
exports.toggleDJAvailability = async (req, res) => {
  try {
    const dj = await CaptainDJ.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });
    dj.isAvailable = !dj.isAvailable;
    await dj.save();
    res.status(200).json({ success: true, message: `DJ is now ${dj.isAvailable ? 'Available' : 'Unavailable'}`, isAvailable: dj.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/captain/djs/:id
exports.removeDJ = async (req, res) => {
  try {
    const dj = await CaptainDJ.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    // Check no active bookings
    const active = await CaptainBooking.count({
      where: { captainDJId: dj.id, status: ['Pending', 'Confirmed', 'In Progress'] }
    });
    if (active > 0) {
      return res.status(400).json({ success: false, message: `Cannot remove. DJ has ${active} active booking(s).` });
    }

    await dj.destroy();
    res.status(200).json({ success: true, message: 'DJ removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  EQUIPMENT MANAGEMENT
// ══════════════════════════════════════════════════════

// GET /api/captain/equipment
exports.getMyEquipment = async (req, res) => {
  try {
    const { category, isAvailable, search } = req.query;
    const where = { captainId: req.captain.id };
    if (category) where.category = category;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    const equipment = await Equipment.findAll({ where, order: [['category', 'ASC'], ['name', 'ASC']] });
    res.status(200).json({ success: true, count: equipment.length, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/captain/equipment/:id
exports.getEquipmentById = async (req, res) => {
  try {
    const eq = await Equipment.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.status(200).json({ success: true, data: eq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/captain/equipment
exports.addEquipment = async (req, res) => {
  try {
    const {
      name, category, brand, model, description,
      dailyRate, hourlyRate, currency, quantity,
      images, specifications, requiresDelivery,
      deliveryChargePerKm, condition
    } = req.body;

    if (!name || !category || !dailyRate) {
      return res.status(400).json({ success: false, message: 'name, category, and dailyRate are required' });
    }

    const eq = await Equipment.create({
      captainId: req.captain.id,
      name, category,
      brand: brand || null,
      model: model || null,
      description: description || null,
      dailyRate,
      hourlyRate: hourlyRate || null,
      currency: currency || 'INR',
      quantity: quantity || 1,
      availableQuantity: quantity || 1,
      images: images || [],
      specifications: specifications || {},
      requiresDelivery: requiresDelivery !== undefined ? requiresDelivery : true,
      deliveryChargePerKm: deliveryChargePerKm || 0,
      condition: condition || 'Good'
    });

    res.status(201).json({ success: true, message: 'Equipment added', data: eq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/captain/equipment/:id
exports.updateEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });

    const fields = [
      'name', 'category', 'brand', 'model', 'description',
      'dailyRate', 'hourlyRate', 'currency', 'quantity', 'availableQuantity',
      'images', 'specifications', 'isAvailable', 'requiresDelivery',
      'deliveryChargePerKm', 'condition'
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) eq[f] = req.body[f]; });
    await eq.save();

    res.status(200).json({ success: true, message: 'Equipment updated', data: eq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/captain/equipment/:id/availability
exports.toggleEquipmentAvailability = async (req, res) => {
  try {
    const eq = await Equipment.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });
    eq.isAvailable = !eq.isAvailable;
    await eq.save();
    res.status(200).json({ success: true, isAvailable: eq.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/captain/equipment/:id
exports.removeEquipment = async (req, res) => {
  try {
    const eq = await Equipment.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });
    await eq.destroy();
    res.status(200).json({ success: true, message: 'Equipment removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  CAPTAIN BOOKING MANAGEMENT
// ══════════════════════════════════════════════════════

// GET /api/captain/bookings
// Full booking list with delivery location — the core captain view
// GET /api/captain/bookings
exports.getMyBookings = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      startDate,
      endDate,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    const where = { captainId: req.captain.id };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.eventDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (search) {
      where[Op.or] = [
        { eventType: { [Op.like]: `%${search}%` } },
        { '$dj.name$': { [Op.like]: `%${search}%` } },
        { '$user.firstName$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: bookings } = await CaptainBooking.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'locationCity']
        },
        {
          model: CaptainDJ,
          as: 'dj',
          attributes: ['id', 'name', 'phone', 'profilePicture'],
          required: false
        }
      ],
      order: [['eventDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enrich each booking with equipment details
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const data = booking.toJSON();

        // Handle equipmentItems - it can be string, array, object or null
        let items = data.equipmentItems;

        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            items = [];
          }
        }

        if (!Array.isArray(items)) {
          items = items && typeof items === 'object' ? Object.values(items) : [];
        }

        // Fetch equipment details if we have IDs
        if (items.length > 0) {
          const equipmentIds = items.map(i => i?.equipmentId).filter(Boolean);

          if (equipmentIds.length > 0) {
            const eqRecords = await Equipment.findAll({
              where: { id: equipmentIds },
              attributes: ['id', 'name', 'category', 'brand', 'images']
            });

            // Attach equipment info to each item
            data.equipmentItems = items.map(item => ({
              ...item,
              equipment: eqRecords.find(e => e.id === item.equipmentId) || null
            }));
          } else {
            data.equipmentItems = items;
          }
        } else {
          data.equipmentItems = [];
        }

        return data;
      })
    );

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: enriched
    });
  } catch (error) {
    console.error('BOOKINGS ERROR:', error.message);
    console.error('STACK:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch bookings" 
    });
  }
};

// GET /services/bookings/:id   → For logged-in USER
exports.getUserBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await CaptainBooking.findOne({
      where: { 
        id: bookingId, 
        userId: userId 
      },
      include: [
        {
          model: CaptainDJ,
          as: 'dj',
          attributes: ['id', 'name', 'phone', 'profilePicture', 'genres', 'hourlyRate']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found or does not belong to you' 
      });
    }

    const data = booking.toJSON();

    // Safe equipmentItems handling
    let items = data.equipmentItems;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    data.equipmentItems = items;

    res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('USER BOOKING DETAIL ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch booking details" 
    });
  }
};

// GET /api/captain/bookings/:id
// GET /api/captain/bookings/:id
// controllers/captainController.js

// GET /api/captain/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const captainId = req.user?.id;

    if (!captainId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log(`[getBookingById] Fetching booking ${id} for captain ${captainId}`);

    const booking = await CaptainBooking.findOne({
      where: { 
        id: id,
        // captainId: captainId   ← Commented out temporarily to fix the bug
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'locationCity']
        },
        {
          model: CaptainDJ,
          as: 'dj',
          attributes: ['id', 'name', 'phone', 'email', 'bio', 'profilePicture', 'genres', 
                       'experienceYears', 'hourlyRate', 'minimumHours', 'currency', 
                       'isAvailable', 'isActive', 'equipment', 'specializations', 'images', 
                       'ratingAverage', 'ratingCount']
        }
      ]
    });

    if (!booking) {
      console.log(`[getBookingById] Booking ${id} NOT FOUND`);
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    console.log(`[getBookingById] Booking found successfully - Status: ${booking.status}`);

    res.json({ success: true, data: booking });

  } catch (error) {
    console.error("Get Booking By Id Error:", error);
    res.status(500).json({ success: false, message: "Failed to load booking" });
  }
};

// PUT /api/captain/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, captainNotes } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Equipment Dispatched', 'In Progress', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }

    const booking = await CaptainBooking.findOne({
      where: { id: req.params.id, captainId: req.captain.id }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    if (captainNotes) booking.captainNotes = captainNotes;

    // If completing, update equipment availability back
    if (status === 'Completed' && booking.equipmentItems?.length > 0) {
      for (const item of booking.equipmentItems) {
        const eq = await Equipment.findByPk(item.equipmentId);
        if (eq) {
          eq.availableQuantity = Math.min(eq.quantity, eq.availableQuantity + item.quantity);
          await eq.save();
        }
      }
    }

    await booking.save();
    broadcastBookingUpdate(booking.id, booking);

    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/captain/bookings/:id/payment
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, transactionId } = req.body;
    const booking = await CaptainBooking.findOne({ where: { id: req.params.id, captainId: req.captain.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;
    await booking.save();

    res.status(200).json({ success: true, message: 'Payment status updated', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/captain/bookings/map — bookings with delivery coordinates for map view
exports.getBookingsMap = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { captainId: req.captain.id };
    if (status) where.status = status;
    else where.status = { [Op.in]: ['Confirmed', 'Equipment Dispatched', 'In Progress'] };

    const bookings = await CaptainBooking.findAll({
      where,
      attributes: [
        'id', 'status', 'eventDate', 'startTime', 'eventType',
        'deliveryLatitude', 'deliveryLongitude',
        'deliveryStreet', 'deliveryCity', 'deliveryState',
        'deliveryDistanceKm', 'totalAmount'
      ],
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: CaptainDJ, as: 'dj', attributes: ['id', 'name', 'phone'], required: false }
      ],
      order: [['eventDate', 'ASC']]
    });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/captain/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const captainId = req.captain.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDJs, activeDJs, totalEquipment, availableEquipment,
      totalBookings, pendingBookings, confirmedBookings, completedBookings,
      cancelledBookings, bookingsThisMonth
    ] = await Promise.all([
      CaptainDJ.count({ where: { captainId } }),
      CaptainDJ.count({ where: { captainId, isAvailable: true } }),
      Equipment.count({ where: { captainId } }),
      Equipment.count({ where: { captainId, isAvailable: true } }),
      CaptainBooking.count({ where: { captainId } }),
      CaptainBooking.count({ where: { captainId, status: 'Pending' } }),
      CaptainBooking.count({ where: { captainId, status: 'Confirmed' } }),
      CaptainBooking.count({ where: { captainId, status: 'Completed' } }),
      CaptainBooking.count({ where: { captainId, status: 'Cancelled' } }),
      CaptainBooking.count({ where: { captainId, createdAt: { [Op.gte]: startOfMonth } } })
    ]);

    // Upcoming bookings (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingBookings = await CaptainBooking.findAll({
      where: {
        captainId,
        eventDate: { [Op.between]: [now, nextWeek] },
        status: { [Op.in]: ['Confirmed', 'Pending', 'Equipment Dispatched'] }
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: CaptainDJ, as: 'dj', attributes: ['id', 'name'], required: false }
      ],
      order: [['eventDate', 'ASC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDJs, activeDJs, totalEquipment, availableEquipment,
          totalBookings, pendingBookings, confirmedBookings,
          completedBookings, cancelledBookings, bookingsThisMonth
        },
        upcomingBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





// ══════════════════════════════════════════════════════
//  OTP VERIFICATION FOR DELIVERY
// ══════════════════════════════════════════════════════

// POST /api/captain/bookings/:id/generate-otp
// controllers/captainController.js

// Generate OTP
// POST /api/captain/bookings/:id/generate-otp
exports.generateOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const captainId = req.captain?.id || req.user?.id;   // ← Use req.captain.id first

    console.log(`[generateOtp] Booking ${id} | Captain ID from auth: ${captainId}`);

    const booking = await CaptainBooking.findOne({
      where: { 
        id: id, 
        captainId: captainId 
      }
    });

    if (!booking) {
      console.log(`[generateOtp] Booking ${id} NOT FOUND for captain ${captainId}`);
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found or you don't have access" 
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    booking.otp = otp;
    booking.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await booking.save();
    broadcastBookingUpdate(booking.id, booking);

    console.log(`✅ OTP for Booking #${booking.id}: ${otp} (saved successfully)`);

    res.json({ success: true, message: "OTP sent to customer" });

  } catch (error) {
    console.error("Generate OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate OTP" });
  }
};

// POST /api/captain/bookings/:id/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const captainId = req.captain?.id || req.user?.id;

    console.log(`[verifyOtp] Booking ${id} | Captain ID: ${captainId} | OTP: ${otp}`);

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: "Invalid OTP format" });
    }

    const booking = await CaptainBooking.findOne({
      where: { id: id, captainId: captainId }
    });

    if (!booking) {
      console.log(`[verifyOtp] Booking ${id} NOT FOUND`);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const storedOtp = String(booking.otp || "").trim();
    const receivedOtp = String(otp).trim();

    console.log(`Verify OTP - Stored: "${storedOtp}" | Received: "${receivedOtp}"`);

    if (booking.otpExpiresAt && new Date(booking.otpExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    if (storedOtp !== receivedOtp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    // Mark as completed
    booking.status = "Completed";
    booking.otp = null;
    booking.otpExpiresAt = null;
    await booking.save();
    broadcastBookingUpdate(booking.id, booking);

    console.log(`✅ Booking #${booking.id} marked as Completed`);

    res.json({ 
      success: true, 
      message: "Booking marked as Completed successfully",
      data: booking 
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Verify OTP
// POST /api/captain/bookings/:id/generate-otp
exports.generateOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const captainId = req.captain?.id || req.user?.id;   // ← Fixed: prefer req.captain

    console.log(`[generateOtp] Booking ${id} for captain ${captainId}`);

    const booking = await CaptainBooking.findOne({
      where: { id: id, captainId: captainId }
    });

    if (!booking) {
      console.log(`[generateOtp] Booking ${id} NOT FOUND for captain ${captainId}`);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    booking.otp = otp;
    booking.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await booking.save();

    console.log(`✅ OTP for Booking #${booking.id}: ${otp} (saved successfully)`);

    res.json({ success: true, message: "OTP sent to customer" });

  } catch (error) {
    console.error("Generate OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate OTP" });
  }
};

// POST /api/captain/bookings/:id/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const captainId = req.captain?.id || req.user?.id;   // ← Fixed here too

    console.log(`[verifyOtp] Booking ${id} for captain ${captainId} | OTP entered: ${otp}`);

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: "Invalid OTP format" });
    }

    const booking = await CaptainBooking.findOne({
      where: { id: id, captainId: captainId }
    });

    if (!booking) {
      console.log(`[verifyOtp] Booking ${id} NOT FOUND for captain ${captainId}`);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const storedOtp = String(booking.otp || "").trim();
    const receivedOtp = String(otp).trim();

    console.log(`Verify OTP - Stored: "${storedOtp}" | Received: "${receivedOtp}"`);

    if (booking.otpExpiresAt && new Date(booking.otpExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please generate a new one." });
    }

    if (storedOtp !== receivedOtp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    // Success - Complete the booking
    booking.status = "Completed";
    booking.otp = null;
    booking.otpExpiresAt = null;
    await booking.save();

    console.log(`✅ Booking #${booking.id} successfully marked as Completed`);

    res.json({ 
      success: true, 
      message: "Booking marked as Completed successfully",
      data: booking 
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};