const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  // Razorpay fields
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    // unique: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    // unique: true
  },
  razorpaySignature: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Payment details
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.ENUM('created', 'pending', 'success', 'failed', 'refunded'),
    defaultValue: 'created'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true // upi, card, netbanking, wallet, cod
  },
  
  // Additional info
  receipt: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  
  // Timestamps
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Error tracking
  errorCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  errorDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;