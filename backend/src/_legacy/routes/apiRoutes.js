// API Routes - Rutas adicionales para funcionalidades completas
// Rutas para chat, ratings, notificaciones, geolocalización, pagos y uploads

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const RatingController = require('../controllers/ratingController');
const NotificationController = require('../controllers/notificationController');
const GeoController = require('../controllers/geoController');
const UploadController = require('../controllers/uploadController');
const PaymentController = require('../controllers/paymentController');
const ChatService = require('../services/chatService');

// Inicializar servicio de chat
let chatService;
try {
  chatService = new ChatService();
  console.log('💬 Chat service initialized');
} catch (error) {
  console.error('❌ Error initializing chat service:', error.message);
}

// Middleware para logging de peticiones API
router.use((req, res, next) => {
  console.log(`🔗 API: ${req.method} ${req.path}`);
  console.log(`🔗 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`🔗 Timestamp: ${new Date().toISOString()}`);
  next();
});

/**
 * Rutas de Calificaciones y Reseñas
 */
// POST /api/ratings - Crear calificación
router.post('/ratings', authMiddleware, RatingController.createRating);

// GET /api/ratings/professional/:id - Obtener calificaciones de profesional
router.get('/ratings/professional/:id', RatingController.getProfessionalRatings);

// GET /api/ratings/professional/:id/mobile - Calificaciones optimizadas para móvil
router.get('/ratings/professional/:id/mobile', RatingController.getMobileRatings);

// GET /api/ratings/user - Obtener calificaciones del usuario
router.get('/ratings/user', authMiddleware, RatingController.getUserRatings);

// PUT /api/ratings/:id - Actualizar calificación
router.put('/ratings/:id', authMiddleware, RatingController.updateRating);

// DELETE /api/ratings/:id - Eliminar calificación
router.delete('/ratings/:id', authMiddleware, RatingController.deleteRating);

// GET /api/ratings/professional/:id/stats - Estadísticas de calificaciones
router.get('/ratings/professional/:id/stats', RatingController.getRatingStats);

/**
 * Rutas de Notificaciones Push
 */
// POST /api/notifications/send - Enviar notificación push
router.post('/notifications/send', authMiddleware, NotificationController.sendPushNotification);

// POST /api/notifications/professional - Enviar notificación a profesional
router.post('/notifications/professional', authMiddleware, NotificationController.sendProfessionalNotification);

// GET /api/notifications/user - Obtener notificaciones del usuario
router.get('/notifications/user', authMiddleware, NotificationController.getUserNotifications);

// POST /api/notifications/send-bulk - Notificación masiva
router.post('/notifications/send-bulk', NotificationController.sendBulkNotification);

// PUT /api/notifications/:id/read - Marcar notificación como leída
router.put('/notifications/:id/read', authMiddleware, NotificationController.markNotificationAsRead);

// GET /api/notifications/professional - Obtener notificaciones de profesional
router.get('/notifications/professional', authMiddleware, NotificationController.getProfessionalNotifications);

// GET /api/notifications/stats - Estadísticas de notificaciones
router.get('/notifications/stats', NotificationController.getNotificationStats);

// PUT /api/notifications/preferences - Configurar preferencias
router.put('/notifications/preferences', authMiddleware, NotificationController.updateNotificationPreferences);

/**
 * Rutas de Geolocalización y Mapas
 */
// POST /api/geo/location - Actualizar ubicación del usuario
router.post('/geo/location', authMiddleware, GeoController.getCurrentLocation);

// GET /api/geo/nearby - Búsqueda GPS de profesionales cercanos
router.get('/geo/nearby', GeoController.searchNearbyProfessionals);

// GET /api/geo/area - Obtener profesionales en área (bounding box)
router.get('/geo/area', GeoController.getProfessionalsInArea);

// GET /api/geo/address-suggestions - Autocompletar direcciones
router.get('/geo/address-suggestions', GeoController.getAddressSuggestions);

// POST /api/geo/geocode - Geocodificar dirección a coordenadas
router.post('/geo/geocode', GeoController.geocodeAddress);

// GET /api/geo/route - Calcular ruta entre dos puntos
router.get('/geo/route', GeoController.calculateRoute);

/**
 * Rutas de Upload de Archivos
 */
// POST /api/upload/profile - Subir imagen de perfil
router.post('/upload/profile', authMiddleware, UploadController.uploadImage.single('image'), UploadController.uploadProfileImage);

// POST /api/upload/portfolio - Subir imágenes de portafolio
router.post('/upload/portfolio', authMiddleware, UploadController.uploadImage.array('images', 5), UploadController.uploadPortfolioImages);

// POST /api/upload/verification - Subir documentos de verificación
router.post('/upload/verification', authMiddleware, UploadController.uploadDocument.array('documents', 3), UploadController.uploadVerificationDocuments);

// POST /api/upload/service - Subir imágenes de servicio
router.post('/upload/service', authMiddleware, UploadController.uploadImage.array('images', 3), UploadController.uploadServiceImages);

// DELETE /api/upload/file/:fileId - Eliminar archivo
router.delete('/upload/file/:fileId', authMiddleware, UploadController.deleteFile);

// GET /api/upload/file/:fileId - Obtener información de archivo
router.get('/upload/file/:fileId', UploadController.getFileInfo);

// GET /api/upload/files - Obtener archivos del usuario
router.get('/upload/files', authMiddleware, UploadController.getUserFiles);

// GET /api/upload/stats - Estadísticas de uploads
router.get('/upload/stats', authMiddleware, UploadController.getUploadStats);

/**
 * Rutas de Pagos (Mercado Pago)
 */
// POST /api/payments/create - Crear pago para reserva
router.post('/payments/create', authMiddleware, require('../middleware/requireVerification').requireVerification, PaymentController.createPayment);

// GET /api/payments/:id/status - Obtener estado del pago
router.get('/payments/:id/status', authMiddleware, PaymentController.getPaymentStatus);

// POST /api/payments/webhook/mercadopago - Webhook de Mercado Pago
router.post('/payments/webhook/mercadopago', PaymentController.mercadopagoWebhook);

// GET /api/payments/methods - Obtener métodos de pago disponibles
router.get('/payments/methods', PaymentController.getPaymentMethods);

// GET /api/payments/user - Obtener historial de pagos del usuario
router.get('/payments/user', authMiddleware, PaymentController.getUserPayments);

// GET /api/payments/stats - Estadísticas de pagos
router.get('/payments/stats', PaymentController.getPaymentStats);

/**
 * Rutas de Chat (Socket.IO)
 */
// Note: El chat se maneja principalmente a través de Socket.IO
// Estas rutas son para complementar funcionalidades

// GET /api/chat/stats - Obtener estadísticas del chat
router.get('/chat/stats', async (req, res) => {
  try {
    if (!chatService) {
      return res.status(503).json({
        success: false,
        error: 'Chat service not available'
      });
    }
    
    const stats = await chatService.getChatStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat stats'
    });
  }
});

/**
 * Rutas de Favoritos (extensión de mobile)
 */
// GET /api/favorites/enhanced - Obtener favoritos con detalles adicionales
router.get('/favorites/enhanced', authMiddleware, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { limit = 20, skip = 0 } = req.query;
    
    console.log(`❤️ Getting enhanced favorites: user=${userId}`);
    
    // Mock de favoritos enriquecidos (integrar con modelo real)
    const favorites = [];
    
    res.status(200).json({
      success: true,
      data: favorites,
      pagination: {
        total: favorites.length,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: false
      }
    });
  } catch (error) {
    console.error('❌ Get enhanced favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhanced favorites'
    });
  }
});

/**
 * Rutas de Dashboard del Usuario
 */
// GET /api/dashboard/user - Dashboard del usuario
router.get('/dashboard/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.usuario.id;
    
    console.log(`📊 Getting user dashboard: ${userId}`);
    
    // Obtener estadísticas del usuario
    const Booking = require('../models/Booking');
    const Rating = require('../models/Rating');
    const Payment = require('../models/Payment');
    
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      totalRatings,
      totalPayments,
      recentBookings
    ] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: { $in: ['pending', 'confirmed'] } }),
      Booking.countDocuments({ user: userId, status: 'completed' }),
      Rating.countDocuments({ user: userId }),
      Payment.countDocuments({ user: userId, status: 'approved' }),
      Booking.find({ user: userId })
        .populate('professional', 'businessName profession')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);
    
    const dashboard = {
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        totalRatings,
        totalPayments,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0'
      },
      recentBookings,
      notifications: await getUnreadNotificationsCount(userId)
    };
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('❌ Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user dashboard'
    });
  }
});

// GET /api/dashboard/professional - Dashboard del profesional
router.get('/dashboard/professional', authMiddleware, async (req, res) => {
  try {
    const professionalId = req.usuario.id;
    
    console.log(`📊 Getting professional dashboard: ${professionalId}`);
    
    const Booking = require('../models/Booking');
    const Rating = require('../models/Rating');
    const Payment = require('../models/Payment');
    
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      totalRatings,
      totalEarnings,
      recentBookings
    ] = await Promise.all([
      Booking.countDocuments({ professional: professionalId }),
      Booking.countDocuments({ professional: professionalId, status: { $in: ['pending', 'confirmed'] } }),
      Booking.countDocuments({ professional: professionalId, status: 'completed' }),
      Rating.countDocuments({ professional: professionalId }),
      Payment.aggregate([
        { $match: { professional: professionalId, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.find({ professional: professionalId })
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);
    
    const dashboard = {
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        totalRatings,
        totalEarnings: totalEarnings[0]?.total || 0,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0',
        averageRating: await getAverageRating(professionalId)
      },
      recentBookings,
      notifications: await getUnreadNotificationsCount(professionalId)
    };
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('❌ Get professional dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get professional dashboard'
    });
  }
});

/**
 * Helper functions
 */
async function getUnreadNotificationsCount(userId) {
  try {
    const Notification = require('../models/Notification');
    return await Notification.countDocuments({
      $or: [
        { user: userId },
        { professional: userId }
      ],
      status: { $in: ['sent', 'delivered'] },
      readAt: { $exists: false }
    });
  } catch (error) {
    console.error('❌ Get unread notifications count error:', error);
    return 0;
  }
}

async function getAverageRating(professionalId) {
  try {
    const Rating = require('../models/Rating');
    const result = await Rating.aggregate([
      { $match: { professional: professionalId, status: 'published' } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);
    return result[0]?.average || 0;
  } catch (error) {
    console.error('❌ Get average rating error:', error);
    return 0;
  }
}

// Middleware para manejar errores
router.use((error, req, res, next) => {
  console.error(`❌ API Error: ${error.message}`);
  console.error(`❌ Path: ${req.path}`);
  console.error(`❌ Method: ${req.method}`);
  
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
  console.log(`❌ API - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/ratings/*',
      '/notifications/*',
      '/geo/*',
      '/upload/*',
      '/payments/*',
      '/chat/*',
      '/favorites/*',
      '/dashboard/*'
    ]
  });
});

module.exports = router;
