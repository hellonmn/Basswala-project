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
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    // Verify Firebase token
    let decoded;
    try {
      decoded = await getAdmin().auth().verifyIdToken(idToken);
    } catch (e) {
      const code = e.code ?? '';
      if (code === 'auth/id-token-expired')
        return res.status(401).json({ success: false, message: 'OTP session expired. Request a new code.' });
      return res.status(401).json({ success: false, message: 'Phone verification failed.' });
    }

    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'No phone number in token.' });
    }

    const localPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    console.log(`[Captain Firebase] Verified: ${phoneNumber} → ${localPhone}`);

    const { User, Captain } = require('../models');
    const { Op } = require('sequelize');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');

    // Find or create the user (with role 'captain')
    let user = await User.findOne({
      where: { [Op.or]: [{ phone: localPhone }, { phone: phoneNumber }] },
      include: [{ model: Captain, as: 'captainProfile', required: false }]
    });

    let isNewCaptain = false;

    if (!user) {
      const placeholderEmail = `captain_${localPhone}@basswala.app`;
      const emailExists = await User.findOne({ where: { email: placeholderEmail } });
      const finalEmail = emailExists ? `captain_${localPhone}_${Date.now()}@basswala.app` : placeholderEmail;

      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

      user = await User.create({
        phone: localPhone,
        firstName: 'Captain',
        lastName: localPhone.slice(-4),
        email: finalEmail,
        password: hashedPassword,
        role: 'captain',
        isActive: true,
        isVerified: true
      });

      // Auto-create captain profile
      await Captain.create({ userId: user.id });
      isNewCaptain = true;
      console.log(`[Captain Firebase] New captain created id: ${user.id}`);
    } else if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    } else if (user.role !== 'captain' && user.role !== 'admin') {
      // Upgrade existing user to captain
      await user.update({ role: 'captain' });
      if (!user.captainProfile) {
        await Captain.create({ userId: user.id });
        isNewCaptain = true;
      }
    }

    await user.update({ lastLogin: new Date() });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    // Reload with captain profile
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
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
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