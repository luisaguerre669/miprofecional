// Verification Routes - Sistema de verificación de identidad
// Rutas nuevas para verificación sin modificar endpoints existentes

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const VerificationController = require('../controllers/verificationController');
const VerificationMiddleware = require('../middleware/verificationMiddleware');

// Middleware para logging de peticiones de verificación
router.use((req, res, next) => {
  console.log(`🔐 Verification API: ${req.method} ${req.path}`);
  console.log(`🔐 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`🔐 Timestamp: ${new Date().toISOString()}`);
  next();
});

/**
 * Rutas de Verificación de Email
 */

// POST /api/verification/email/initiate - Iniciar verificación de email
router.post('/email/initiate', authMiddleware, VerificationController.initiateEmailVerification);

// POST /api/verification/email/verify - Verificar email con token
router.post('/email/verify', authMiddleware, VerificationController.verifyEmail);

/**
 * Rutas de Verificación de Teléfono
 */

// POST /api/verification/phone/initiate - Iniciar verificación de teléfono
router.post('/phone/initiate', authMiddleware, VerificationController.initiatePhoneVerification);

// POST /api/verification/phone/verify - Verificar teléfono con código
router.post('/phone/verify', authMiddleware, VerificationController.verifyPhone);

/**
 * Rutas de Verificación de Identidad
 */

// POST /api/verification/identity/submit - Enviar documentos de identidad
router.post('/identity/submit', authMiddleware, VerificationController.submitIdentityVerification);

/**
 * Rutas de Estado y Consultas
 */

// GET /api/verification/status - Obtener estado de verificaciones del usuario
router.get('/status', authMiddleware, VerificationController.getVerificationStatus);

// GET /api/verification/stats - Obtener estadísticas de verificación (admin)
router.get('/stats', authMiddleware, VerificationController.getVerificationStats);

/**
 * Rutas de Verificación para Profesionales (extendidas)
 */

// POST /api/verification/professional/license/submit - Enviar licencia profesional
router.post('/professional/license/submit', authMiddleware, async (req, res) => {
  try {
    const {
      licenseNumber,
      issuingAuthority,
      issueDate,
      expiryDate,
      profession,
      specialization
    } = req.body;
    
    const userId = req.usuario.id;
    
    console.log(`🔐 Submitting professional license: ${userId}`);
    
    const professional = await Professional.findById(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }
    
    // Crear registro de verificación
    const Verification = require('../models/Verification');
    const verification = new Verification({
      professional: userId,
      verificationType: 'professional_license',
      verificationData: {
        professionalLicense: {
          licenseNumber,
          issuingAuthority,
          issueDate: new Date(issueDate),
          expiryDate: new Date(expiryDate),
          profession,
          specialization
        }
      },
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'api'
      }
    });
    
    await verification.save();
    
    // Actualizar profesional
    const now = new Date();
    professional.verification.professionalLicense.licenseNumber = licenseNumber;
    professional.verification.professionalLicense.issuingAuthority = issuingAuthority;
    professional.verification.professionalLicense.issueDate = new Date(issueDate);
    professional.verification.professionalLicense.expiryDate = new Date(expiryDate);
    professional.verification.verificationHistory.push({
      type: 'license_submitted',
      timestamp: now,
      metadata: { licenseNumber: licenseNumber.substring(0, 8) + '...' }
    });
    
    await professional.save();
    
    res.status(201).json({
      success: true,
      data: {
        verificationId: verification._id,
        status: 'pending',
        submittedAt: now
      },
      message: 'Professional license submitted successfully'
    });
    
  } catch (error) {
    console.error('❌ Professional license submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit professional license'
    });
  }
});

// POST /api/verification/professional/business/submit - Enviar registro de empresa
router.post('/professional/business/submit', authMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      registrationNumber,
      taxId,
      legalForm,
      registrationDate,
      registeredAddress
    } = req.body;
    
    const userId = req.usuario.id;
    
    console.log(`🔐 Submitting business registration: ${userId}`);
    
    const professional = await Professional.findById(userId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found'
      });
    }
    
    // Crear registro de verificación
    const Verification = require('../models/Verification');
    const verification = new Verification({
      professional: userId,
      verificationType: 'business_registration',
      verificationData: {
        businessRegistration: {
          companyName,
          registrationNumber,
          taxId,
          legalForm,
          registrationDate: new Date(registrationDate),
          registeredAddress
        }
      },
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'api'
      }
    });
    
    await verification.save();
    
    // Actualizar profesional
    const now = new Date();
    professional.verification.businessRegistration.companyName = companyName;
    professional.verification.businessRegistration.registrationNumber = registrationNumber;
    professional.verification.businessRegistration.taxId = taxId;
    professional.verification.businessRegistration.legalForm = legalForm;
    professional.verification.businessRegistration.registrationDate = new Date(registrationDate);
    professional.verification.verificationHistory.push({
      type: 'business_submitted',
      timestamp: now,
      metadata: { companyName }
    });
    
    await professional.save();
    
    res.status(201).json({
      success: true,
      data: {
        verificationId: verification._id,
        status: 'pending',
        submittedAt: now
      },
      message: 'Business registration submitted successfully'
    });
    
  } catch (error) {
    console.error('❌ Business registration submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit business registration'
    });
  }
});

/**
 * Rutas de Scoring y Confianza
 */

// GET /api/verification/trust-score - Obtener trust score del usuario
router.get('/trust-score', authMiddleware, VerificationMiddleware.addVerificationInfo(), (req, res) => {
  try {
    const verificationInfo = req.verificationInfo;
    
    res.status(200).json({
      success: true,
      data: {
        trustScore: verificationInfo.trustScore,
        verificationLevel: verificationInfo.verificationLevel,
        riskLevel: verificationInfo.riskLevel,
        isVerified: verificationInfo.isVerified,
        verifications: verificationInfo.verifications,
        lastUpdated: verificationInfo.lastUpdated
      },
      message: 'Trust score retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Trust score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trust score'
    });
  }
});

// GET /api/verification/confidence-breakdown - Desglose de confianza
router.get('/confidence-breakdown', authMiddleware, VerificationMiddleware.addVerificationInfo(), (req, res) => {
  try {
    const verificationInfo = req.verificationInfo;
    
    // Calcular desglose de confianza
    const breakdown = {
      overall: verificationInfo.trustScore,
      components: {
        email: verificationInfo.verifications.email ? 20 : 0,
        phone: verificationInfo.verifications.phone ? 15 : 0,
        identity: verificationInfo.verifications.identity ? 35 : 0,
        address: verificationInfo.verifications.address ? 10 : 0,
        professionalLicense: verificationInfo.verifications.professionalLicense ? 15 : 0,
        businessRegistration: verificationInfo.verifications.businessRegistration ? 5 : 0
      },
      riskFactors: [],
      recommendations: []
    };
    
    // Agregar factores de riesgo
    if (verificationInfo.riskLevel === 'high') {
      breakdown.riskFactors.push('High risk level detected');
      breakdown.recommendations.push('Complete additional verifications');
    }
    
    if (verificationInfo.trustScore < 50) {
      breakdown.riskFactors.push('Low trust score');
      breakdown.recommendations.push('Verify email and phone');
    }
    
    if (!verificationInfo.verifications.email) {
      breakdown.recommendations.push('Verify your email address');
    }
    
    if (!verificationInfo.verifications.phone) {
      breakdown.recommendations.push('Verify your phone number');
    }
    
    res.status(200).json({
      success: true,
      data: breakdown,
      message: 'Confidence breakdown retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Confidence breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get confidence breakdown'
    });
  }
});

/**
 * Rutas de Validación (ejemplos con middleware)
 */

// GET /api/verification/protected-example - Ejemplo de ruta protegida con verificación
router.get('/protected-example', 
  authMiddleware, 
  VerificationMiddleware.requireTrustLevel('basic', false), // opcional
  VerificationMiddleware.addVerificationInfo(),
  (req, res) => {
    try {
      const verificationInfo = req.verificationInfo;
      
      res.status(200).json({
        success: true,
        data: {
          message: 'This is a protected route example',
          verificationInfo,
          meetsRequirement: verificationInfo.meetsRequirement || false
        },
        message: 'Protected route accessed successfully'
      });
      
    } catch (error) {
      console.error('❌ Protected route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to access protected route'
      });
    }
  }
);

// GET /api/verification/professional-protected - Ejemplo para profesionales
router.get('/professional-protected',
  authMiddleware,
  VerificationMiddleware.requireProfessionalLicense(false), // opcional
  VerificationMiddleware.addVerificationInfo(),
  (req, res) => {
    try {
      const verificationInfo = req.verificationInfo;
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Professional protected route example',
          verificationInfo,
          hasLicense: verificationInfo.verifications?.professionalLicense || false
        },
        message: 'Professional protected route accessed successfully'
      });
      
    } catch (error) {
      console.error('❌ Professional protected route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to access professional protected route'
      });
    }
  }
);

/**
 * Rutas de Administración (requieren rol admin)
 */

// GET /api/verification/admin/pending - Obtener verificaciones pendientes
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    // Verificar si es admin (simplificado)
    const userId = req.usuario.id;
    const user = await User.findById(userId);
    
    if (!user || user.email !== 'admin@miprofesional.com') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const Verification = require('../models/Verification');
    const pendingVerifications = await Verification.getPendingVerifications();
    
    res.status(200).json({
      success: true,
      data: pendingVerifications,
      message: 'Pending verifications retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending verifications'
    });
  }
});

// GET /api/verification/admin/high-risk - Obtener verificaciones de alto riesgo
router.get('/admin/high-risk', authMiddleware, async (req, res) => {
  try {
    // Verificar si es admin
    const userId = req.usuario.id;
    const user = await User.findById(userId);
    
    if (!user || user.email !== 'admin@miprofesional.com') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const Verification = require('../models/Verification');
    const highRiskVerifications = await Verification.getHighRiskVerifications();
    
    res.status(200).json({
      success: true,
      data: highRiskVerifications,
      message: 'High risk verifications retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get high risk verifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get high risk verifications'
    });
  }
});

/**
 * Middleware para manejar errores
 */
router.use((error, req, res, next) => {
  console.error(`❌ Verification API Error: ${error.message}`);
  console.error(`❌ Path: ${req.path}`);
  console.error(`❌ Method: ${req.method}`);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

/**
 * Middleware para rutas no encontradas
 */
router.use('*', (req, res) => {
  console.log(`❌ Verification API - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/email/initiate',
      '/email/verify',
      '/phone/initiate',
      '/phone/verify',
      '/identity/submit',
      '/status',
      '/stats',
      '/trust-score',
      '/confidence-breakdown',
      '/professional/license/submit',
      '/professional/business/submit',
      '/protected-example',
      '/professional-protected',
      '/admin/pending',
      '/admin/high-risk'
    ]
  });
});

module.exports = router;
