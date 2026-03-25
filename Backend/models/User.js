const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  // Role field - NEW!
  role: {
    type: DataTypes.ENUM('user', 'dj','captain', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  
  // Location Information
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  locationStreet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  locationCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationZipCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  locationCountry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Profile Information
  profilePicture: {
    type: DataTypes.STRING(255),
    defaultValue: 'default-avatar.png'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  
  // Account Status
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // DJ-specific fields (only used when role = 'dj')
  djProfileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'djs',
      key: 'id'
    }
  },
  
  // Preferences stored as JSON
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      musicGenres: [],
      notificationsEnabled: true,
      locationSharingEnabled: true
    }
  },

  // Timestamps
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.updateLocation = function(longitude, latitude, address = {}) {
  this.latitude = latitude;
  this.longitude = longitude;
  this.locationStreet = address.street || this.locationStreet;
  this.locationCity = address.city || this.locationCity;
  this.locationState = address.state || this.locationState;
  this.locationZipCode = address.zipCode || this.locationZipCode;
  this.locationCountry = address.country || this.locationCountry;
  this.locationUpdatedAt = new Date();
};

module.exports = User;