const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
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
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(
      'Speaker', 'Mixer', 'Turntable', 'Microphone',
      'Lighting', 'Fog Machine', 'Laser', 'LED Panel',
      'Amplifier', 'Subwoofer', 'DJ Controller', 'Projector',
      'LED Screen', 'Karaoke System', 'CO2 Cannon', 'Other'
    ),
    allowNull: false
  },
  brand: { type: DataTypes.STRING(100), allowNull: true },
  model: { type: DataTypes.STRING(100), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  availableQuantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  images: { type: DataTypes.JSON, defaultValue: [] },
  specifications: { type: DataTypes.JSON, defaultValue: {} },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  requiresDelivery: { type: DataTypes.BOOLEAN, defaultValue: true },
  deliveryChargePerKm: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0
  },
  condition: {
    type: DataTypes.ENUM('Excellent', 'Good', 'Fair'),
    defaultValue: 'Good'
  },
  ratingAverage: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  ratingCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'equipment',
  timestamps: true
});

module.exports = Equipment;