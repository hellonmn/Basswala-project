const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CaptainBooking — A booking made to a captain's service.
 * Can include a DJ, equipment items, or both.
 * Tracks delivery location for equipment.
 */
const CaptainBooking = sequelize.define('CaptainBooking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  captainId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'captains', key: 'id' }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  // Optional DJ
  captainDJId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'captain_djs', key: 'id' }
  },
  // Equipment items as JSON: [{ equipmentId, quantity, dailyRate, days }]
  equipmentItems: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  // Event details
  eventType: {
    type: DataTypes.ENUM(
      'Wedding', 'Birthday', 'Corporate', 'Club',
      'Private Party', 'Festival', 'School Event', 'Other'
    ),
    allowNull: false
  },
  eventDate: { type: DataTypes.DATE, allowNull: false },
  startTime: { type: DataTypes.STRING(10), allowNull: false },
  endTime: { type: DataTypes.STRING(10), allowNull: false },
  durationHours: { type: DataTypes.INTEGER, allowNull: false },
  guestCount: { type: DataTypes.INTEGER, allowNull: true },
  specialRequests: { type: DataTypes.TEXT, allowNull: true },

  // Delivery / Event location
  deliveryLatitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  deliveryLongitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  deliveryStreet: { type: DataTypes.STRING(255), allowNull: true },
  deliveryCity: { type: DataTypes.STRING(100), allowNull: true },
  deliveryState: { type: DataTypes.STRING(100), allowNull: true },
  deliveryZipCode: { type: DataTypes.STRING(20), allowNull: true },
  deliveryCountry: { type: DataTypes.STRING(100), allowNull: true },
  deliveryDistanceKm: { type: DataTypes.DECIMAL(8, 2), allowNull: true },

  // Pricing breakdown
  djFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  equipmentFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  deliveryFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

  // Status
  status: {
    type: DataTypes.ENUM(
      'Pending', 'Confirmed', 'Equipment Dispatched',
      'In Progress', 'Completed', 'Cancelled'
    ),
    defaultValue: 'Pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Partially Paid', 'Refunded'),
    defaultValue: 'Pending'
  },
  paymentMethod: { type: DataTypes.STRING(50), allowNull: true },
  transactionId: { type: DataTypes.STRING(100), allowNull: true },

  // Captain notes (internal)
  captainNotes: { type: DataTypes.TEXT, allowNull: true },

  // Review
  rating: { type: DataTypes.INTEGER, allowNull: true },
  review: { type: DataTypes.TEXT, allowNull: true },
  reviewDate: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'captain_bookings',
  timestamps: true
});

module.exports = CaptainBooking;