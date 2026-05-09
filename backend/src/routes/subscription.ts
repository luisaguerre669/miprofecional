import { Router } from 'express';
import {
  createTrialSubscription,
  getActiveSubscription,
  startPaidSubscription,
  suspendProfile,
  reactivateProfile,
  getExpiringSoon,
  getExpiredForSuspension,
  sendExpiryNotifications,
  processAutomaticSuspensions,
  getSubscriptionHistory,
  checkSubscriptionStatus,
  getSubscriptionDashboard
} from '../controllers/subscriptionController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// POST /api/subscriptions/trial - Crear suscripción de prueba
router.post('/trial', createTrialSubscription);

// GET /api/subscriptions/active/:professionalId - Obtener suscripción activa
router.get('/active/:professionalId', getActiveSubscription);

// POST /api/subscriptions/:professionalId/start-paid - Iniciar suscripción paga
router.post('/:professionalId/start-paid', startPaidSubscription);

// POST /api/subscriptions/:professionalId/suspend - Suspender perfil
router.post('/:professionalId/suspend', suspendProfile);

// POST /api/subscriptions/:professionalId/reactivate - Reactivar perfil
router.post('/:professionalId/reactivate', reactivateProfile);

// GET /api/subscriptions/expiring-soon - Obtener suscripciones que vencen pronto
router.get('/expiring-soon', getExpiringSoon);

// GET /api/subscriptions/expired-for-suspension - Obtener perfiles para suspender
router.get('/expired-for-suspension', getExpiredForSuspension);

// POST /api/subscriptions/send-expiry-notifications - Enviar notificaciones de vencimiento
router.post('/send-expiry-notifications', sendExpiryNotifications);

// POST /api/subscriptions/process-suspensions - Procesar suspensiones automáticas
router.post('/process-suspensions', processAutomaticSuspensions);

// GET /api/subscriptions/history/:professionalId - Obtener historial de suscripciones
router.get('/history/:professionalId', getSubscriptionHistory);

// GET /api/subscriptions/status/:professionalId - Verificar estado de suscripción
router.get('/status/:professionalId', checkSubscriptionStatus);

// GET /api/subscriptions/dashboard - Dashboard de suscripciones (solo admin)
router.get('/dashboard', authenticateToken, requireRole('admin'), getSubscriptionDashboard);

export default router;
