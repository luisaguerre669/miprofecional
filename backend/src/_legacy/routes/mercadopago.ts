import { Router } from 'express';
import { 
  createPaymentPreference,
  createRecurringSubscription,
  handleMercadoPagoWebhook,
  getSubscriptionStatus,
  cancelSubscription
} from '../controllers/mercadopagoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rutas públicas para webhooks
router.post('/webhook', handleMercadoPagoWebhook);

// Rutas protegidas
router.use(authenticateToken);

// Crear preferencia de pago
router.post('/payment/preference', createPaymentPreference);

// Crear suscripción recurrente
router.post('/subscription/recurring', createRecurringSubscription);

// Obtener estado de suscripción
router.get('/subscription/:professionalId/status', getSubscriptionStatus);

// Cancelar suscripción
router.post('/subscription/:professionalId/cancel', cancelSubscription);

export default router;
