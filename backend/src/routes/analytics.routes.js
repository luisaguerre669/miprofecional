const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route   POST /api/analytics/event
 * @desc    Recibir evento de analytics
 * @access  Public
 */
router.post('/event', async (req, res) => {
  try {
    const { event_name, properties } = req.body;
    
    if (!event_name) {
      return res.status(400).json({ error: 'Event name required' });
    }
    
    // Log del evento
    logger.info('Analytics Event', {
      event: event_name,
      userId: properties?.user_id,
      sessionId: properties?.session_id,
      platform: properties?.platform,
      timestamp: properties?.timestamp
    });
    
    // Aquí se puede integrar con:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Base de datos propia
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

/**
 * @route   POST /api/crashes/report
 * @desc    Recibir reporte de crash
 * @access  Public
 */
router.post('/report', async (req, res) => {
  try {
    const crashReport = req.body;
    
    // Log crítico del crash
    logger.error('CRASH REPORT', {
      message: crashReport.error?.message,
      name: crashReport.error?.name,
      stack: crashReport.error?.stack,
      device: crashReport.device,
      app: crashReport.app,
      timestamp: crashReport.timestamp
    });
    
    // Aquí se puede integrar con:
    // - Sentry
    // - Crashlytics
    // - Bugsnag
    // - Slack/Discord webhooks para alertas
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Crash report error:', error);
    res.status(500).json({ error: 'Failed to process crash report' });
  }
});

/**
 * @route   GET /api/analytics/health
 * @desc    Health check de analytics
 * @access  Private/Admin
 */
router.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
