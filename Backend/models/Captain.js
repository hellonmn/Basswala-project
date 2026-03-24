const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Captain = sequelize.define('Captain', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' }
  },
  businessName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  // Service area / base location
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  locationCity: { type: DataTypes.STRING(100), allowNull: true },
  locationState: { type: DataTypes.STRING(100), allowNull: true },
  locationCountry: { type: DataTypes.STRING(100), allowNull: true },
  serviceRadiusKm: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'captains',
  timestamps: true
});

module.exports = Captain;