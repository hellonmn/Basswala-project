/**
 * Backend/routes/firebase-auth.js
 *
 * Drop this file into your backend and mount it in server.js:
 *   app.use('/api/auth', require('./routes/firebase-auth'));
 *
 * Prerequisites:
 *   npm install firebase-admin
 *
 * One-time setup:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Generate a new private key → download JSON
 *   3. Save as Backend/firebase-service-account.json (add to .gitignore!)
 *   4. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env, OR paste the JSON inline below
 *
 * ENV vars needed:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
 *   (or) FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 */

const express = require('express');
const router  = express.Router();

// ── Firebase Admin init (lazy, once) ─────────────────────────────────────────
let adminApp = null;
function getAdmin() {
  if (adminApp) return adminApp;
  const admin = require('firebase-admin');
  if (admin.apps.length) { adminApp = admin; return adminApp; }

  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
  } else {
    throw new Error('Firebase Admin credentials not configured. See Backend/routes/firebase-auth.js for setup.');
  }

  admin.initializeApp({ credential });
  adminApp = admin;
  return adminApp;
}

// ── POST /api/auth/firebase-login ─────────────────────────────────────────────
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken, phone } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    // 1. Verify the Firebase ID token server-side
    const admin   = getAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Phone number comes from the decoded token (more trustworthy than client-sent `phone`)
    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'No phone number in Firebase token' });
    }

    // Strip leading + and country code to get 10-digit local number for DB matching
    const localPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');

    // 2. Find or create user in your MySQL DB
    const { User } = require('../models');
    const { Op }   = require('sequelize');
    const jwt      = require('jsonwebtoken');

    let user = await User.findOne({
      where: {
        [Op.or]: [
          { phone: localPhone },
          { phone: phoneNumber },
        ],
      },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      // Auto-register: create a minimal user record
      // The user can fill in their name/email later from the Profile screen
      user = await User.create({
        phone:     localPhone,
        firstName: 'Basswala',
        lastName:  'User',
        email:     `${localPhone}@basswala.app`, // placeholder — user can update
        password:  require('bcryptjs').hashSync(require('crypto').randomBytes(16).toString('hex'), 10),
        role:      'user',
        isActive:  true,
        isVerified: true, // phone is already verified by Firebase
      });
    } else if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // 3. Issue your app's JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // 4. Update last login
    await user.update({ lastLogin: new Date() });

    const userObj = user.toJSON ? user.toJSON() : user;
    delete userObj.password;

    return res.status(200).json({ success: true, token, user: userObj });

  } catch (error) {
    console.error('Firebase login error:', error);

    // Firebase token errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'OTP session expired. Please request a new code.' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ success: false, message: 'Authentication revoked. Please log in again.' });
    }
    if (error.code && error.code.startsWith('auth/')) {
      return res.status(401).json({ success: false, message: 'Phone verification failed.' });
    }

    return res.status(500).json({ success: false, message: 'Error during Firebase login', error: error.message });
  }
});

module.exports = router;