const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  djId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  eventType: {
    type: DataTypes.ENUM('Wedding', 'Birthday', 'Corporate', 'Club', 'Private Party', 'Festival', 'Other'),
    allowNull: false
  },
  eventDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  startTime: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  endTime: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  guestCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  eventLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  eventLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  eventStreet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  eventCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  eventState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  eventZipCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  eventCountry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  additionalCharges: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Refunded'),
    defaultValue: 'Pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

module.exports = Booking;