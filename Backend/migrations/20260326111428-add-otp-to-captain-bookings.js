'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('captain_bookings', 'otp', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn('captain_bookings', 'otpExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('captain_bookings', 'otp');
    await queryInterface.removeColumn('captain_bookings', 'otpExpiresAt');
  }
};