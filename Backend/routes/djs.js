const express = require('express');
const router = express.Router();
const {
  getDJs, getNearbyDJs, getDJ, getDJEquipment, searchDJs,
  createDJProfile, getMyDJProfile, updateDJProfile,
  toggleAvailability, deleteDJProfile
} = require('../controllers/djController');
const { protect } = require('../middleware/auth');
const { isDJ } = require('../middleware/roleAuth');

// ─── Public ───────────────────────────────────────────────────
router.get('/', getDJs);
router.get('/search', searchDJs);
router.get('/nearby', protect, getNearbyDJs);
router.get('/:id/equipment', getDJEquipment);
router.get('/:id', getDJ);

// ─── DJ Role Only ─────────────────────────────────────────────
router.post('/create-profile', protect, isDJ, createDJProfile);
router.get('/my-profile', protect, isDJ, getMyDJProfile);
router.put('/my-profile', protect, isDJ, updateDJProfile);
router.put('/my-profile/availability', protect, isDJ, toggleAvailability);
router.delete('/my-profile', protect, isDJ, deleteDJProfile);

module.exports = router;
