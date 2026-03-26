const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const WebSocket = require('ws');   // ← Now installed

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 10000, // 10 minutes
  max: 10000
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/djs', require('./routes/djs'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/auth', require('./routes/firebase-auth'));

app.use('/api/captain/auth', require('./routes/firebase-captain-auth'));
app.use('/api/captain', require('./routes/captain'));
app.use('/api/services', require('./routes/services'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DJ Rental API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Basswala DJ Rental API',
    version: '1.0.0'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Initialize WebSocket
const { initWebSocket } = require('./utils/websocket');
initWebSocket(server);

console.log('✅ WebSocket server ready for real-time booking updates');

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { 
  app,
  server 
};