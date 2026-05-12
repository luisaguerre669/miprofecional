const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route   POST /api/feedback
 * @desc    Recibir feedback de usuarios
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { type, message, rating, platform, url } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message required' });
    }
    
    // Log del feedback
    logger.info('User Feedback Received', {
      type,
      message: message.substring(0, 200), // Truncar para logs
      rating,
      platform,
      url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Aquí se puede:
    // 1. Guardar en base de datos
    // 2. Enviar notificación a Slack/Discord
    // 3. Crear ticket en sistema de soporte
    // 4. Enviar email al equipo
    
    res.status(200).json({ 
      success: true, 
      message: 'Feedback received successfully' 
    });
    
  } catch (error) {
    logger.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

/**
 * @route   GET /api/feedback/stats
 * @desc    Obtener estadísticas de feedback (admin)
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
  try {
    // Aquí se consultaría la base de datos
    const stats = {
      total: 0,
      byType: {
        suggestion: 0,
        bug: 0,
        complaint: 0
      },
      averageRating: 0,
      last7Days: 0
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Feedback stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
