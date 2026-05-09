const express = require('express');
const router = express.Router();
const professionalRegistrationController = require('../controllers/professionalRegistrationController');

// 🎯 ENDPOINT PRINCIPAL - REGISTRO DE PROFESIONAL
router.post('/register-professional', professionalRegistrationController.registerProfessional);

// 📊 OBTENER ESTADO DE REGISTRO
router.get('/registration-status/:email', professionalRegistrationController.getRegistrationStatus);

// 🔄 ACTUALIZAR ESTADO (solo admin)
router.put('/registration-status/:professional_id', professionalRegistrationController.updateRegistrationStatus);

// 📈 MÉTRICAS DE REGISTRO
router.get('/registration-metrics', professionalRegistrationController.getRegistrationMetrics);

// 📋 OBTENER ESTADOS DISPONIBLES
router.get('/registration-statuses', (req, res) => {
  try {
    const statuses = professionalRegistrationController.getRegistrationStatuses();
    return res.status(200).json({
      success: true,
      data: statuses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo estados de registro',
      error: error.message
    });
  }
});

module.exports = router;
