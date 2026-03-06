const User = require('./User');
const DJ = require('./DJ');
const Booking = require('./Booking');
const Payment = require('./Payment');

// ═══════════════════════════════════════════════════════════════
//  MODEL ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════

// User and Booking relationship
User.hasMany(Booking, {
  foreignKey: 'userId',
  as: 'bookings'
});
Booking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// DJ and Booking relationship
DJ.hasMany(Booking, {
  foreignKey: 'djId',
  as: 'bookings'
});
Booking.belongsTo(DJ, {
  foreignKey: 'djId',
  as: 'dj'
});

// DJ owner relationship (User who owns/is the DJ)
User.hasOne(DJ, {
  foreignKey: 'userId',
  as: 'djProfile'
});
DJ.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

// ═══════════════════════════════════════════════════════════════
//  PAYMENT ASSOCIATIONS
// ═══════════════════════════════════════════════════════════════

// User and Payment relationship
User.hasMany(Payment, {
  foreignKey: 'userId',
  as: 'payments'
});
Payment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Booking and Payment relationship (one-to-one)
Booking.hasOne(Payment, {
  foreignKey: 'bookingId',
  as: 'payment'
});
Payment.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

module.exports = {
  User,
  DJ,
  Booking,
  Payment
};