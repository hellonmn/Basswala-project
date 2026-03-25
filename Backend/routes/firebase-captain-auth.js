/**
 * routes/firebase-captain-auth.js
 *
 * Firebase phone OTP login for Captains.
 * After phone verification, creates/finds user + captain profile.
 *
 * Mount in server.js:
 *   app.use('/api/captain/auth', require('./routes/firebase-captain-auth'));
 */

const express = require('express');
const router = express.Router();

// ── Firebase Admin (reuse existing init pattern) ──────────────────────────────
let adminApp = null;

function getAdmin() {
  if (adminApp) return adminApp;
  const admin = require('firebase-admin');
  if (admin.apps.length) { adminApp = admin; return adminApp; }

  const path = require('path');
  const fs = require('fs');
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!saPath) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH not set in .env');

  const resolved = path.resolve(__dirname, '..', saPath.replace(/^\.\//, ''));
  if (!fs.existsSync(resolved)) throw new Error(`Service account not found: ${resolved}`);

  admin.initializeApp({ credential: admin.credential.cert(require(resolved)) });
  adminApp = admin;
  console.log('[Firebase] Captain SDK initialized');
  return adminApp;
}

// ── POST /api/captain/auth/firebase-login ─────────────────────────────────────
// routes/firebase-captain-auth.js

router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    const admin = getAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decoded.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'No phone number in token.' });
    }

    const localPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');

    const { User, Captain } = require('../models');
    const jwt = require('jsonwebtoken');

    let user = await User.findOne({
      where: { phone: localPhone },
      include: [{ model: Captain, as: 'captainProfile', required: false }]
    });

    let isNewCaptain = false;

    if (!user) {
      // Create new captain
      const placeholderEmail = `captain_${localPhone}@basswala.app`;
      const hashedPassword = await require('bcryptjs').hash(require('crypto').randomBytes(16).toString('hex'), 10);

      user = await User.create({
        phone: localPhone,
        firstName: 'Captain',
        lastName: localPhone.slice(-4),
        email: placeholderEmail,
        password: hashedPassword,
        role: 'captain',
        isActive: true,
        isVerified: true
      });

      await Captain.create({ userId: user.id });
      isNewCaptain = true;

    } else {
      // Existing user → upgrade to captain if needed
      if (user.role !== 'captain' && user.role !== 'admin') {
        await user.update({ role: 'captain' });
      }

      // CRITICAL: Create captain profile if it doesn't exist
      if (!user.captainProfile) {
        await Captain.create({ userId: user.id });
        isNewCaptain = true;
        console.log(`[Captain] Created missing captain profile for user ${user.id}`);
      }
    }

    await user.update({ lastLogin: new Date() });

    // Sign token with role
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Fetch fresh user with captainProfile
    const fullUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Captain, as: 'captainProfile', required: false }]
    });

    return res.status(200).json({
      success: true,
      token,
      user: fullUser,
      isNewCaptain,
      message: isNewCaptain ? 'Welcome! Complete your captain profile.' : 'Welcome back, Captain!'
    });

  } catch (error) {
    console.error('[Captain Firebase Login] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ── POST /api/captain/auth/complete-profile ────────────────────────────────────
// After OTP login, captain fills in their business details
router.post('/complete-profile', require('../middleware/auth').protect, async (req, res) => {
  try {
    const { Captain } = require('../models');
    const { authorize } = require('../middleware/roleAuth');

    const {
      businessName, phone, description, profilePicture,
      latitude, longitude, locationCity, locationState, locationCountry, serviceRadiusKm
    } = req.body;

    let captain = await Captain.findOne({ where: { userId: req.user.id } });
    if (!captain) captain = await Captain.create({ userId: req.user.id });

    await captain.update({
      businessName: businessName || captain.businessName,
      phone: phone || captain.phone,
      description: description || captain.description,
      profilePicture: profilePicture || captain.profilePicture,
      latitude: latitude || captain.latitude,
      longitude: longitude || captain.longitude,
      locationCity: locationCity || captain.locationCity,
      locationState: locationState || captain.locationState,
      locationCountry: locationCountry || captain.locationCountry,
      serviceRadiusKm: serviceRadiusKm || captain.serviceRadiusKm
    });

    return res.status(200).json({ success: true, message: 'Profile updated', data: captain });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;