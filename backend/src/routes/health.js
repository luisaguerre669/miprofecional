const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.json({
    success: true,
    message: 'Health check - OK',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      connected: dbState === 1,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
