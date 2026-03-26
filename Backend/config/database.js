const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// config/database.js
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connected successfully');

    // NEVER use alter: true in production — it accumulates duplicate indexes
    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized (alter mode)');
    } else {
      // Just verify connection — don't touch schema
      console.log('Database ready (sync skipped)');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };