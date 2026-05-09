// Mobile Routes - Rutas específicas para la aplicación móvil
// Optimizadas para rendimiento y compatibilidad móvil

const express = require('express');
const router = express.Router();
const MobileController = require('../controllers/mobileController');
const authMiddleware = require('../middleware/auth');

// Middleware para logging de peticiones móviles
router.use((req, res, next) => {
  console.log(`📱 Mobile API: ${req.method} ${req.path}`);
  console.log(`📱 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`📱 Timestamp: ${new Date().toISOString()}`);
  next();
});

/**
 * Health check específico para móvil
 * GET /api/mobile/health
 */
router.get('/health', MobileController.mobileHealth);

/**
 * Autenticación móvil
 * POST /api/mobile/auth/login
 * POST /api/mobile/auth/register
 */
router.post('/auth/login', MobileController.login);
router.post('/auth/register', MobileController.register);

/**
 * Categorías optimizadas para móvil
 * GET /api/mobile/categories
 */
router.get('/categories', MobileController.getMobileCategories);

/**
 * Búsqueda de profesionales optimizada para móvil
 * GET /api/mobile/professionals/nearby
 */
router.get('/professionals/nearby', MobileController.searchMobileProfessionals);

/**
 * Gestión de reservas móviles
 * GET /api/mobile/bookings
 * POST /api/mobile/bookings
 * PUT /api/mobile/bookings/:id
 * DELETE /api/mobile/bookings/:id
 */
router.get('/bookings', authMiddleware, MobileController.getMobileBookings);
router.post('/bookings', authMiddleware, require('../middleware/requireVerification').requireVerification, require('../middleware/requireActiveSubscription').requireActiveSubscriptionLight, MobileController.createMobileBooking);
router.put('/bookings/:id', authMiddleware, MobileController.updateBooking);
router.delete('/bookings/:id', authMiddleware, MobileController.cancelBooking);

/**
 * Perfil de usuario móvil
 * GET /api/mobile/profile
 * PUT /api/mobile/profile
 */
router.get('/profile', authMiddleware, MobileController.getMobileProfile);
router.put('/profile', authMiddleware, MobileController.updateMobileProfile);

/**
 * Favoritos móviles
 * GET /api/mobile/favorites
 * POST /api/mobile/favorites
 * DELETE /api/mobile/favorites/:id
 */
router.get('/favorites', authMiddleware, MobileController.getMobileFavorites);
router.post('/favorites', authMiddleware, MobileController.addToMobileFavorites);

/**
 * Estadísticas del sistema para móvil
 * GET /api/mobile/stats
 */
router.get('/stats', MobileController.getMobileStats);

// Middleware para manejar errores móviles
router.use((error, req, res, next) => {
  console.error(`📱 Mobile API Error: ${error.message}`);
  console.error(`📱 Path: ${req.path}`);
  console.error(`📱 Method: ${req.method}`);
  
  // Respuesta de error optimizada para móvil
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Middleware para rutas no encontradas
router.use('*', (req, res) => {
  console.log(`📱 Mobile API - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/health',
      '/auth/login',
      '/auth/register',
      '/categories',
      '/professionals/nearby',
      '/bookings',
      '/profile',
      '/favorites',
      '/stats'
    ]
  });
});

module.exports = router;
