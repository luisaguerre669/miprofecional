const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { 
  createPaymentPreference,
  createRecurringSubscription,
  handleMercadoPagoWebhook,
  getSubscriptionStatus,
  cancelSubscription
} = require('../controllers/mercadopagoController');
const { requireAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// RUTA WEBHOOK - PÚBLICA (sin autenticación)
// Mercado Pago envía notificaciones aquí
// ═══════════════════════════════════════════════════════════
router.post('/webhook', async (req, res) => {
  // Responder inmediatamente con 200 OK
  // Esto es CRÍTICO para que Mercado Pago no reintente
  res.status(200).json({ received: true });
  
  // Procesar el webhook en background
  try {
    logger.info('Webhook Mercado Pago recibido', {
      type: req.body.type,
      action: req.body.action,
      id: req.body.data?.id
    });
    
    // Llamar al handler para procesar el evento
    await handleMercadoPagoWebhook(req, res);
    
  } catch (error) {
    logger.error('Error procesando webhook MP:', error);
    // El error ya se logueó, no hacemos nada más
    // porque ya respondimos 200
  }
});

// ═══════════════════════════════════════════════════════════
// RUTAS PROTEGIDAS (requieren autenticación)
// ═══════════════════════════════════════════════════════════

// Crear preferencia de pago
router.post('/payment/preference', requireAuth, createPaymentPreference);

// Crear suscripción recurrente
router.post('/subscription/recurring', requireAuth, createRecurringSubscription);

// Obtener estado de suscripción
router.get('/subscription/:professionalId/status', requireAuth, getSubscriptionStatus);

// Cancelar suscripción
router.post('/subscription/:professionalId/cancel', requireAuth, cancelSubscription);

module.exports = router;
