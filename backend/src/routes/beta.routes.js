const express = require('express');
const router = express.Router();
const BetaInvitation = require('../models/BetaInvitation');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   POST /api/beta/validate
 * @desc    Validar código de invitación beta
 * @access  Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Código requerido' 
      });
    }
    
    const result = await BetaInvitation.validateCode(code);
    
    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        message: 'Código inválido o expirado'
      });
    }
    
    res.json({
      valid: true,
      type: result.invitation.type,
      email: result.invitation.email
    });
    
  } catch (error) {
    logger.error('Error validando código beta:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Error validando código' 
    });
  }
});

/**
 * @route   POST /api/beta/invite
 * @desc    Crear nueva invitación beta (admin only)
 * @access  Private/Admin
 */
router.post('/invite', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, type = 'professional', metadata = {} } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email requerido' 
      });
    }
    
    // Verificar si ya existe invitación para este email
    const existing = await BetaInvitation.findOne({ email: email.toLowerCase() });
    if (existing && ['pending', 'sent'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una invitación activa para este email',
        code: existing.code
      });
    }
    
    // Crear nueva invitación
    const code = BetaInvitation.generateCode();
    const invitation = new BetaInvitation({
      email: email.toLowerCase(),
      code,
      type,
      invitedBy: req.userId,
      metadata
    });
    
    await invitation.save();
    
    logger.info('Nueva invitación beta creada', {
      email,
      code,
      type,
      invitedBy: req.userId
    });
    
    res.json({
      success: true,
      invitation: {
        code: invitation.code,
        email: invitation.email,
        type: invitation.type,
        expiresAt: invitation.expiresAt
      }
    });
    
  } catch (error) {
    logger.error('Error creando invitación beta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creando invitación' 
    });
  }
});

/**
 * @route   GET /api/beta/invitations
 * @desc    Listar todas las invitaciones (admin only)
 * @access  Private/Admin
 */
router.get('/invitations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const invitations = await BetaInvitation.find(query)
      .populate('invitedBy', 'name email')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await BetaInvitation.countDocuments(query);
    
    res.json({
      success: true,
      invitations,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    logger.error('Error listando invitaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error listando invitaciones' 
    });
  }
});

/**
 * @route   GET /api/beta/stats
 * @desc    Estadísticas de beta (admin only)
 * @access  Private/Admin
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await BetaInvitation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const byType = await BetaInvitation.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await BetaInvitation.countDocuments();
    const used = await BetaInvitation.countDocuments({ status: 'used' });
    const conversionRate = total > 0 ? ((used / total) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      stats: {
        total,
        byStatus: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        conversionRate: parseFloat(conversionRate)
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo stats beta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo estadísticas' 
    });
  }
});

/**
 * @route   POST /api/beta/bulk-invite
 * @desc    Crear múltiples invitaciones (admin only)
 * @access  Private/Admin
 */
router.post('/bulk-invite', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { emails, type = 'professional' } = req.body;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array de emails requerido'
      });
    }
    
    const results = {
      created: [],
      existing: [],
      errors: []
    };
    
    for (const email of emails) {
      try {
        const existing = await BetaInvitation.findOne({ 
          email: email.toLowerCase(),
          status: { $in: ['pending', 'sent'] }
        });
        
        if (existing) {
          results.existing.push({ email, code: existing.code });
          continue;
        }
        
        const code = BetaInvitation.generateCode();
        const invitation = new BetaInvitation({
          email: email.toLowerCase(),
          code,
          type,
          invitedBy: req.userId
        });
        
        await invitation.save();
        results.created.push({ email, code });
        
      } catch (error) {
        results.errors.push({ email, error: error.message });
      }
    }
    
    logger.info('Invitaciones bulk creadas', {
      created: results.created.length,
      existing: results.existing.length,
      errors: results.errors.length,
      invitedBy: req.userId
    });
    
    res.json({
      success: true,
      results
    });
    
  } catch (error) {
    logger.error('Error en bulk invite:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando invitaciones'
    });
  }
});

module.exports = router;
