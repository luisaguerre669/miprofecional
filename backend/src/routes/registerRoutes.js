const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

// 🚀 ENDPOINT PRINCIPAL - REGISTRO DE PROFESIONAL
router.post('/register-professional', registerController.registerProfessional);

// 📊 OBTENER ESTADO DE REGISTRO
router.get('/status/:email', registerController.getRegistrationStatus);

// 🔄 ACTUALIZAR ESTADO (solo admin)
router.put('/status/:id', registerController.updateStatus);

// 📋 OBTENER LISTA DE PROFESIONALES (admin)
router.get('/list', async (req, res) => {
  try {
    const { estado, categoria, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (estado) query.estado = estado;
    if (categoria) query.categoria = categoria.toLowerCase();
    
    const Professional = require('../models/Professional');
    const professionals = await Professional.find(query)
      .sort({ fecha_registro: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v -user_agent -ip_address');
    
    const total = await Professional.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: {
        professionals,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: total > (parseInt(offset) + parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo lista:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 📈 MÉTRICAS DE REGISTRO
router.get('/metrics', async (req, res) => {
  try {
    const Professional = require('../models/Professional');
    
    // Estadísticas básicas
    const total = await Professional.countDocuments();
    const aprobados = await Professional.countDocuments({ estado: 'aprobado' });
    const pendientes = await Professional.countDocuments({ estado: 'pendiente' });
    const rechazados = await Professional.countDocuments({ estado: 'rechazado' });
    const requiere_correccion = await Professional.countDocuments({ estado: 'requiere_correccion' });
    
    // Score promedio
    const avgScore = await Professional.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score_calidad' } } }
    ]);
    
    // Por categoría
    const byCategory = await Professional.aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 }, avgScore: { $avg: '$score_calidad' } } },
      { $sort: { count: -1 } }
    ]);
    
    // Últimos 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await Professional.countDocuments({
      fecha_registro: { $gte: sevenDaysAgo }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        total,
        aprobados,
        pendientes,
        rechazados,
        requiere_correccion,
        approval_rate: total > 0 ? ((aprobados / total) * 100).toFixed(2) : 0,
        avg_score: avgScore.length > 0 ? avgScore[0].avgScore.toFixed(2) : 0,
        last_7_days: last7Days,
        by_category: byCategory,
        updated_at: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo métricas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
