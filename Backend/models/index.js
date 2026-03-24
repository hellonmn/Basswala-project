const User = require('./User');
const DJ = require('./DJ');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Captain = require('./Captain');
const CaptainDJ = require('./CaptainDJ');
const Equipment = require('./Equipment');
const CaptainBooking = require('./CaptainBooking');

// ═══════════════════════════════════════════════════════════════
//  ORIGINAL MODEL ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

DJ.hasMany(Booking, { foreignKey: 'djId', as: 'bookings' });
Booking.belongsTo(DJ, { foreignKey: 'djId', as: 'dj' });

User.hasOne(DJ, { foreignKey: 'userId', as: 'djProfile' });
DJ.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Booking.hasOne(Payment, { foreignKey: 'bookingId', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// ═══════════════════════════════════════════════════════════════
//  CAPTAIN ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════

// User ↔ Captain (one-to-one: a user can become a captain)
User.hasOne(Captain, { foreignKey: 'userId', as: 'captainProfile' });
Captain.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Captain ↔ CaptainDJ (one captain has many DJs)
Captain.hasMany(CaptainDJ, { foreignKey: 'captainId', as: 'djs' });
CaptainDJ.belongsTo(Captain, { foreignKey: 'captainId', as: 'captain' });

// User ↔ CaptainDJ (optional link — DJ might have a user account)
User.hasMany(CaptainDJ, { foreignKey: 'userId', as: 'captainDJProfiles' });
CaptainDJ.belongsTo(User, { foreignKey: 'userId', as: 'userAccount' });

// Captain ↔ Equipment
Captain.hasMany(Equipment, { foreignKey: 'captainId', as: 'equipment' });
Equipment.belongsTo(Captain, { foreignKey: 'captainId', as: 'captain' });

// Captain ↔ CaptainBooking
Captain.hasMany(CaptainBooking, { foreignKey: 'captainId', as: 'captainBookings' });
CaptainBooking.belongsTo(Captain, { foreignKey: 'captainId', as: 'captain' });

// User ↔ CaptainBooking
User.hasMany(CaptainBooking, { foreignKey: 'userId', as: 'captainBookings' });
CaptainBooking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// CaptainDJ ↔ CaptainBooking
CaptainDJ.hasMany(CaptainBooking, { foreignKey: 'captainDJId', as: 'bookings' });
CaptainBooking.belongsTo(CaptainDJ, { foreignKey: 'captainDJId', as: 'dj' });

// Equipment ↔ CaptainBooking (through JSON equipmentItems — no join table needed)
// We resolve equipment details at query time via equipmentItems JSON field

module.exports = {
  User, DJ, Booking, Payment,
  Captain, CaptainDJ, Equipment, CaptainBooking
};