const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DJ = sequelize.define('DJ', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  equipment: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  locationCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationCountry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  minimumHours: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  schedule: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  ratingAverage: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  genres: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'djs',
  timestamps: true
});

module.exports = DJ;