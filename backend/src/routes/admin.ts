import { Router } from 'express';
import {
  getAllConfigs,
  getPublicConfigs,
  updateConfig,
  createConfig,
  deleteConfig,
  getConfigValue,
  getAdminDashboard,
  getPaymentConfigs,
  updatePaymentConfigs,
  getSubscriptionConfigs,
  updateSubscriptionConfigs
} from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas de admin requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/configs - Obtener todas las configuraciones
router.get('/configs', getAllConfigs);

// GET /api/admin/configs/public - Obtener configuraciones públicas
router.get('/configs/public', getPublicConfigs);

// PUT /api/admin/configs/:section/:key - Actualizar configuración
router.put('/configs/:section/:key', updateConfig);

// POST /api/admin/configs - Crear nueva configuración
router.post('/configs', createConfig);

// DELETE /api/admin/configs/:section/:key - Eliminar configuración
router.delete('/configs/:section/:key', deleteConfig);

// GET /api/admin/configs/:section/:key/value - Obtener valor específico
router.get('/configs/:section/:key/value', getConfigValue);

// GET /api/admin/dashboard - Dashboard completo de administración
router.get('/dashboard', getAdminDashboard);

// GET /api/admin/payment/configs - Configuraciones de pago
router.get('/payment/configs', getPaymentConfigs);

// PUT /api/admin/payment/configs - Actualizar configuraciones de pago
router.put('/payment/configs', updatePaymentConfigs);

// GET /api/admin/subscription/configs - Configuraciones de suscripción
router.get('/subscription/configs', getSubscriptionConfigs);

// PUT /api/admin/subscription/configs - Actualizar configuraciones de suscripción
router.put('/subscription/configs', updateSubscriptionConfigs);

export default router;
