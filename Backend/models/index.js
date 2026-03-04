const User = require('./User');
const DJ = require('./DJ');
const Booking = require('./Booking');

// Define associations

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

module.exports = {
  User,
  DJ,
  Booking
};