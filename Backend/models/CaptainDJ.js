const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CaptainDJ — A DJ profile managed by a Captain.
 * A captain can add multiple DJs to their roster.
 * A DJ can optionally be linked to a User account (for self-login),
 * but it's not required — captains can add DJs manually too.
 */
const CaptainDJ = sequelize.define('CaptainDJ', {
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
  // Optionally link to an existing user account
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(15), allowNull: true },
  email: { type: DataTypes.STRING(100), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  profilePicture: { type: DataTypes.STRING(255), allowNull: true },
  genres: { type: DataTypes.JSON, defaultValue: [] },
  experienceYears: { type: DataTypes.INTEGER, defaultValue: 0 },
  hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  minimumHours: { type: DataTypes.INTEGER, defaultValue: 2 },
  currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  equipment: { type: DataTypes.JSON, defaultValue: [] }, // equipment IDs they use
  specializations: {
    type: DataTypes.JSON,
    defaultValue: [] // e.g. ["Wedding", "Club", "Corporate"]
  },
  images: { type: DataTypes.JSON, defaultValue: [] },
  ratingAverage: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  ratingCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'captain_djs',
  timestamps: true
});

module.exports = CaptainDJ;