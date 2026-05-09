// User Flow Routes - Flujo de estados del usuario
// Rutas para manejar el flujo: REGISTER → unverified → pending → verified

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const UserFlowController = require('../controllers/userFlowController');
const AntiFraudMiddleware = require('../middleware/antiFraud');

// Middleware para logging de peticiones de flujo de usuario
router.use((req, res, next) => {
  console.log(`🧠 User Flow API: ${req.method} ${req.path}`);
  console.log(`🧠 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`🧠 Timestamp: ${new Date().toISOString()}`);
  next();
});

/**
 * Rutas de Registro y Flujo de Usuario
 */

// POST /api/user-flow/register - Registro con protección anti-fraude
router.post('/register', 
  AntiFraudMiddleware.registrationProtection(),
  UserFlowController.registerUser
);

// POST /api/user-flow/upload-photo - Subir foto de perfil (cambia a pending)
router.post('/upload-photo', 
  authMiddleware, 
  UserFlowController.uploadProfilePhoto
);

// POST /api/user-flow/verify-email - Verificar email
router.post('/verify-email', 
  authMiddleware, 
  UserFlowController.verifyEmail
);

// POST /api/user-flow/auto-verify - Auto-verificación
router.post('/auto-verify', 
  authMiddleware, 
  UserFlowController.autoVerify
);

// POST /api/user-flow/manual-verify - Verificación manual (admin)
router.post('/manual-verify', 
  authMiddleware, 
  UserFlowController.manualVerify
);

// GET /api/user-flow/status - Obtener estado actual del usuario
router.get('/status', 
  authMiddleware, 
  UserFlowController.getUserStatus
);

/**
 * Rutas de Empresas (accountType = "company")
 */

// POST /api/user-flow/register-company - Registro específico para empresas
router.post('/register-company', 
  AntiFraudMiddleware.registrationProtection(),
  async (req, res) => {
    try {
      const {
        commercialName,
        businessName,
        email,
        phone,
        password,
        location,
        coordinates,
        categoryId,
        description
      } = req.body;
      
      console.log(`🏢 Registering company: ${commercialName}`);
      
      // Validaciones específicas para empresas
      if (!commercialName || commercialName.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'El nombre comercial es requerido',
          code: 'MISSING_COMMERCIAL_NAME'
        });
      }
      
      // Crear como profesional con accountType=company
      const professionalData = {
        businessName: commercialName,
        profession: businessName || 'Servicios Empresariales',
        description: description || `Empresa: ${commercialName}`,
        contact: {
          phone,
          email: email.toLowerCase().trim()
        },
        location: {
          address: location,
          coordinates: coordinates || [0, 0],
          serviceRadius: 50
        },
        categoryId,
        verification: {
          isVerified: false,
          verificationStatus: 'unverified'
        },
        isActive: true
      };
      
      const Professional = require('../models/Professional');
      const professional = new Professional(professionalData);
      
      await professional.save();
      
      // Generar token de verificación
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      professional.verificationToken = verificationToken;
      professional.verification.email.verificationToken = verificationToken;
      professional.verification.email.lastAttempt = new Date();
      
      // Agregar al historial
      professional.verification.verificationHistory.push({
        type: 'email_sent',
        timestamp: new Date(),
        metadata: { accountType: 'company' }
      });
      
      await professional.save();
      
      res.status(201).json({
        success: true,
        data: {
          id: professional._id,
          businessName: professional.businessName,
          email: professional.contact.email,
          phone: professional.contact.phone,
          accountType: 'company',
          commercialName,
          verificationStatus: 'unverified',
          isVerified: false,
          profileImage: professional.profileImage || '',
          verificationToken,
          createdAt: professional.createdAt,
          message: 'Empresa registrada exitosamente',
          nextSteps: [
            'Verifica tu correo electrónico',
            'Sube el logo de tu empresa',
            'Completa información comercial'
          ],
          companyFeatures: {
            allowsLogo: true,
            noSelfieRequired: true,
            manualVerification: true
          }
        },
        message: 'Empresa registrada exitosamente. Verifica tu email.'
      });
      
    } catch (error) {
      console.error('❌ Register company error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al registrar empresa',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

// POST /api/user-flow/upload-logo - Subir logo de empresa
router.post('/upload-logo', 
  authMiddleware, 
  async (req, res) => {
    try {
      const userId = req.usuario.id;
      
      console.log(`🏢 Uploading company logo: ${userId}`);
      
      const Professional = require('../models/Professional');
      const professional = await Professional.findById(userId);
      
      if (!professional) {
        return res.status(404).json({
          success: false,
          error: 'Empresa no encontrada'
        });
      }
      
      // Validar que sea empresa
      if (professional.verificationStatus !== 'unverified') {
        return res.status(400).json({
          success: false,
          error: 'La empresa ya ha subido un logo o está verificada',
          currentStatus: professional.verificationStatus
        });
      }
      
      // Simular upload de logo
      const logoUrl = `/uploads/company-logos/logo-${userId}-${Date.now()}.png`;
      
      // Actualizar estado
      professional.verificationStatus = 'pending';
      professional.profileImage = logoUrl;
      
      // Agregar al historial
      professional.verification.verificationHistory.push({
        type: 'logo_uploaded',
        timestamp: new Date(),
        metadata: { logoUrl }
      });
      
      await professional.save();
      
      res.status(200).json({
        success: true,
        data: {
          profileImage: logoUrl,
          verificationStatus: 'pending',
          isVerified: false,
          uploadedAt: new Date(),
          companyFeatures: {
            logoUploaded: true,
            pendingManualVerification: true
          }
        },
        message: 'Logo subido exitosamente. Tu empresa está en revisión manual.'
      });
      
    } catch (error) {
      console.error('❌ Upload company logo error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir logo de empresa'
      });
    }
  }
);

/**
 * Rutas de Validación y Testing
 */

// GET /api/user-flow/flow-status - Obtener estado del flujo completo
router.get('/flow-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const userType = req.usuario.userType || 'user';
    
    let user;
    if (userType === 'user') {
      user = await User.findById(userId);
    } else if (userType === 'professional') {
      user = await Professional.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const flowStatus = {
      currentStep: user.verificationStatus,
      isVerified: user.isVerified,
      accountType: user.accountType || 'person',
      progress: {
        emailVerified: user.verification?.email?.isVerified || false,
        photoUploaded: user.profileImage && user.profileImage !== '',
        basicInfoComplete: true, // Siempre true al llegar aquí
        phoneVerified: user.verification?.phone?.isVerified || false
      },
      nextAction: UserFlowController.getNextStep(user, userType),
      requirements: {
        forPerson: {
          email: true,
          photo: true,
          basicInfo: true,
          phone: false
        },
        forCompany: {
          email: true,
          logo: true,
          commercialName: true,
          basicInfo: true,
          phone: false,
          selfie: false
        }
      },
      verificationHistory: user.verification?.verificationHistory || [],
      trustScore: user.verification?.trustScore || 0,
      riskLevel: user.verification?.riskAssessment?.riskLevel || 'medium'
    };
    
    res.status(200).json({
      success: true,
      data: flowStatus,
      message: 'Estado del flujo obtenido'
    });
    
  } catch (error) {
    console.error('❌ Get flow status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado del flujo'
    });
  }
});

// GET /api/user-flow/requirements - Obtener requisitos por tipo de cuenta
router.get('/requirements', (req, res) => {
  try {
    const { accountType = 'person' } = req.query;
    
    const requirements = {
      person: {
        name: 'required',
        email: 'required',
        phone: 'required',
        password: 'required',
        location: 'required',
        photo: 'required',
        selfie: 'optional',
        verification: 'automatic'
      },
      company: {
        commercialName: 'required',
        businessName: 'required',
        email: 'required',
        phone: 'required',
        password: 'required',
        location: 'required',
        logo: 'required',
        selfie: 'not_required',
        verification: 'manual'
      }
    };
    
    const flow = {
      register: {
        endpoint: '/api/user-flow/register',
        method: 'POST',
        protection: 'anti_fraud',
        rateLimit: '3 attempts per 15 min'
      },
      upload: {
        endpoint: accountType === 'company' ? '/api/user-flow/upload-logo' : '/api/user-flow/upload-photo',
        method: 'POST',
        requiresAuth: true,
        formats: ['jpg', 'png', 'webp']
      },
      verify: {
        email: {
          endpoint: '/api/user-flow/verify-email',
          method: 'POST',
          requiresAuth: true
        },
        auto: {
          endpoint: '/api/user-flow/auto-verify',
          method: 'POST',
          requiresAuth: true,
          criteria: ['email_verified', 'photo_uploaded', 'basic_info']
        },
        manual: {
          endpoint: '/api/user-flow/manual-verify',
          method: 'POST',
          requiresAuth: true,
          adminOnly: true
        }
      }
    };
    
    res.status(200).json({
      success: true,
      data: {
        requirements: requirements[accountType],
        flow,
        accountType
      },
      message: 'Requisitos obtenidos'
    });
    
  } catch (error) {
    console.error('❌ Get requirements error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener requisitos'
    });
  }
});

/**
 * Rutas de Administración
 */

// GET /api/user-flow/admin/pending - Obtener usuarios pendientes (admin)
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    // Verificar si es admin
    const User = require('../models/User');
    const adminUser = await User.findById(req.usuario.id);
    
    if (!adminUser || adminUser.email !== 'admin@miprofesional.com') {
      return res.status(403).json({
        success: false,
        error: 'Acceso administrador requerido'
      });
    }
    
    const User = require('../models/User');
    const Professional = require('../models/Professional');
    
    // Obtener usuarios pendientes
    const pendingUsers = await User.find({ verificationStatus: 'pending' })
      .select('name email verificationStatus createdAt profileImage')
      .sort({ createdAt: 1 })
      .lean();
    
    // Obtener profesionales pendientes
    const pendingProfessionals = await Professional.find({ 'verification.verificationStatus': 'pending' })
      .select('businessName contact.email verification.verificationStatus createdAt profileImage')
      .sort({ createdAt: 1 })
      .lean();
    
    const pending = [
      ...pendingUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        type: 'user',
        verificationStatus: u.verificationStatus,
        profileImage: u.profileImage,
        createdAt: u.createdAt
      })),
      ...pendingProfessionals.map(p => ({
        id: p._id,
        name: p.businessName,
        email: p.contact.email,
        type: 'professional',
        verificationStatus: p.verification.verificationStatus,
        profileImage: p.profileImage,
        createdAt: p.createdAt
      }))
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.status(200).json({
      success: true,
      data: pending,
      total: pending.length,
      message: 'Usuarios pendientes obtenidos'
    });
    
  } catch (error) {
    console.error('❌ Get pending users error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios pendientes'
    });
  }
});

// GET /api/user-flow/admin/stats - Estadísticas del flujo (admin)
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    // Verificar si es admin
    const User = require('../models/User');
    const adminUser = await User.findById(req.usuario.id);
    
    if (!adminUser || adminUser.email !== 'admin@miprofesional.com') {
      return res.status(403).json({
        success: false,
        error: 'Acceso administrador requerido'
      });
    }
    
    const User = require('../models/User');
    const Professional = require('../models/Professional');
    
    // Estadísticas de usuarios
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Estadísticas de profesionales
    const professionalStats = await Professional.aggregate([
      {
        $group: {
          _id: '$verification.verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Combinar estadísticas
    const stats = {
      users: {
        unverified: userStats.find(s => s._id === 'unverified')?.count || 0,
        pending: userStats.find(s => s._id === 'pending')?.count || 0,
        verified: userStats.find(s => s._id === 'verified')?.count || 0,
        rejected: userStats.find(s => s._id === 'rejected')?.count || 0,
        total: userStats.reduce((sum, s) => sum + s.count, 0)
      },
      professionals: {
        unverified: professionalStats.find(s => s._id === 'unverified')?.count || 0,
        pending: professionalStats.find(s => s._id === 'pending')?.count || 0,
        verified: professionalStats.find(s => s._id === 'verified')?.count || 0,
        rejected: professionalStats.find(s => s._id === 'rejected')?.count || 0,
        total: professionalStats.reduce((sum, s) => sum + s.count, 0)
      },
      total: {
        unverified: (userStats.find(s => s._id === 'unverified')?.count || 0) + (professionalStats.find(s => s._id === 'unverified')?.count || 0),
        pending: (userStats.find(s => s._id === 'pending')?.count || 0) + (professionalStats.find(s => s._id === 'pending')?.count || 0),
        verified: (userStats.find(s => s._id === 'verified')?.count || 0) + (professionalStats.find(s => s._id === 'verified')?.count || 0),
        rejected: (userStats.find(s => s._id === 'rejected')?.count || 0) + (professionalStats.find(s => s._id === 'rejected')?.count || 0),
        total: userStats.reduce((sum, s) => sum + s.count, 0) + professionalStats.reduce((sum, s) => sum + s.count, 0)
      }
    };
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas del flujo obtenidas'
    });
    
  } catch (error) {
    console.error('❌ Get flow stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

/**
 * Middleware para manejar errores
 */
router.use((error, req, res, next) => {
  console.error(`❌ User Flow API Error: ${error.message}`);
  console.error(`❌ Path: ${req.path}`);
  console.error(`❌ Method: ${req.method}`);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

/**
 * Middleware para rutas no encontradas
 */
router.use('*', (req, res) => {
  console.log(`❌ User Flow API - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/register',
      '/register-company',
      '/upload-photo',
      '/upload-logo',
      '/verify-email',
      '/auto-verify',
      '/manual-verify',
      '/status',
      '/flow-status',
      '/requirements',
      '/admin/pending',
      '/admin/stats'
    ]
  });
});

module.exports = router;
