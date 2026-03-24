/**
 * Backend/routes/firebase-auth.js
 *
 * Mount in server.js:
 *   app.use('/api/auth', require('./routes/firebase-auth'));
 *
 * Prerequisites:
 *   npm install firebase-admin
 *
 * ENV vars needed:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
 */

const express = require('express');
const router  = express.Router();

// ── Firebase Admin init (lazy, once) ─────────────────────────────────────────
let adminApp = null;

function getAdmin() {
  if (adminApp) return adminApp;

  const admin = require('firebase-admin');
  if (admin.apps.length) {
    adminApp = admin;
    return adminApp;
  }

  let credential;

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (saPath) {
    const path = require('path');
    const fs   = require('fs');

    // Resolve relative to Backend/ folder
    const resolved = path.resolve(__dirname, '..', saPath.replace(/^\.\//, ''));

    console.log('[Firebase] Loading service account from:', resolved);

    if (!fs.existsSync(resolved)) {
      throw new Error(
        `Firebase service account file not found at: ${resolved}\n` +
        `Check FIREBASE_SERVICE_ACCOUNT_PATH in your .env file.`
      );
    }

    const serviceAccount = require(resolved);
    credential = admin.credential.cert(serviceAccount);

  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
  } else {
    throw new Error(
      'Firebase Admin credentials not configured.\n' +
      'Set FIREBASE_SERVICE_ACCOUNT_PATH in your .env file.'
    );
  }

  admin.initializeApp({ credential });
  adminApp = admin;
  console.log('[Firebase] Admin SDK initialized successfully');
  return adminApp;
}

// ── POST /api/auth/firebase-login ─────────────────────────────────────────────
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken, phone } = req.body;

    // ── Validate request ──────────────────────────────────────────────────────
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'idToken is required',
      });
    }

    // ── Verify Firebase ID token ──────────────────────────────────────────────
    let decoded;
    try {
      const admin = getAdmin();
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseErr) {
      console.error('[Firebase] Token verification failed:', firebaseErr.message);

      // Map Firebase error codes to friendly messages
      const code = firebaseErr.code ?? '';
      if (code === 'auth/id-token-expired') {
        return res.status(401).json({ success: false, message: 'OTP session expired. Request a new code.' });
      }
      if (code === 'auth/id-token-revoked') {
        return res.status(401).json({ success: false, message: 'Session revoked. Please log in again.' });
      }
      if (code === 'auth/argument-error' || code === 'auth/invalid-id-token') {
        return res.status(401).json({ success: false, message: 'Invalid token. Please try again.' });
      }
      return res.status(401).json({ success: false, message: 'Phone verification failed.' });
    }

    // ── Extract phone number ──────────────────────────────────────────────────
    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number in Firebase token. Ensure Phone Auth is used.',
      });
    }

    // Strip country code → 10-digit local number for DB
    const localPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    console.log(`[Firebase] Verified phone: ${phoneNumber} → local: ${localPhone}`);

    // ── Find or create user ───────────────────────────────────────────────────
    const { User }   = require('../models');
    const { Op }     = require('sequelize');
    const jwt        = require('jsonwebtoken');
    const bcrypt     = require('bcryptjs');
    const crypto     = require('crypto');

    let user = await User.findOne({
      where: {
        [Op.or]: [
          { phone: localPhone },
          { phone: phoneNumber },
        ],
      },
      attributes: { exclude: [] }, // include all fields
    });

    if (!user) {
      console.log(`[Firebase] Creating new user for phone: ${localPhone}`);

      // Generate a placeholder email so the NOT NULL constraint is satisfied
      const placeholderEmail = `${localPhone}@basswala.app`;

      // Check if placeholder email already exists (edge case)
      const emailExists = await User.findOne({ where: { email: placeholderEmail } });
      const finalEmail  = emailExists
        ? `${localPhone}_${Date.now()}@basswala.app`
        : placeholderEmail;

      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        phone:      localPhone,
        firstName:  'Basswala',
        lastName:   'User',
        email:      finalEmail,
        password:   hashedPassword,  // random, user will never use this
        role:       'user',
        isActive:   true,
        isVerified: true,  // phone verified by Firebase
      });

      console.log(`[Firebase] New user created with id: ${user.id}`);
    } else if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact support.',
      });
    } else {
      console.log(`[Firebase] Existing user found with id: ${user.id}`);
    }

    // ── Issue app JWT ─────────────────────────────────────────────────────────
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set in environment variables.');
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Remove sensitive fields from response
    const userObj = user.toJSON ? user.toJSON() : { ...user.dataValues };
    delete userObj.password;

    return res.status(200).json({
      success: true,
      token,
      user: userObj,
    });

  } catch (error) {
    // This catches unexpected errors (DB issues, missing env vars, etc.)
    console.error('[Firebase Login] Unexpected error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error during Firebase login.',
      // Only expose error detail in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

module.exports = router;