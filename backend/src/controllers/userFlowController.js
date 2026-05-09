// User Flow Controller - Flujo de estados del usuario
// Controlador para manejar el flujo: REGISTER → unverified → pending → verified

const User = require('../models/User');
const Professional = require('../models/Professional');
const crypto = require('crypto');

class UserFlowController {
  /**
   * Registrar nuevo usuario con flujo de verificación
   */
  async registerUser(req, res) {
    try {
      const {
        name,
        email,
        phone,
        password,
        location,
        coordinates,
        accountType = 'person',
        commercialName = '',
        categoryId = null
      } = req.body;
      
      console.log(`🧠 Registering user: ${email} (${accountType})`);
      
      // Crear nuevo usuario
      const userData = {
        name,
        email: email.toLowerCase().trim(),
        phone,
        password, // Será hasheado en el pre-save middleware
        location,
        coordinates: coordinates || [0, 0],
        accountType,
        verificationStatus: 'unverified',
        isVerified: false,
        profileImage: '',
        lastLogin: new Date(),
        isActive: true
      };
      
      // Agregar commercialName solo para empresas
      if (accountType === 'company') {
        userData.commercialName = commercialName;
      }
      
      let user;
      
      if (accountType === 'person') {
        user = new User(userData);
      } else {
        // Para empresas, crear como profesional
        const professionalData = {
          userId: null, // Se asignará después de crear el usuario base
          categoryId: categoryId || null,
          businessName: commercialName || name,
          profession: 'Servicios Generales',
          description: `Empresa: ${commercialName || name}`,
          contact: {
            phone,
            email: email.toLowerCase().trim()
          },
          location: {
            address: location,
            coordinates: coordinates || [0, 0],
            serviceRadius: 50
          },
          verification: {
            isVerified: false,
            verificationStatus: 'unverified'
          },
          isActive: true
        };
        
        const professional = new Professional(professionalData);
        user = professional;
      }
      
      await user.save();
      
      // Generar token de verificación de email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Actualizar usuario con token
      if (accountType === 'person') {
        user.verificationToken = verificationToken;
        user.verification.email.verificationToken = verificationToken;
        user.verification.email.lastAttempt = new Date();
      } else {
        user.verificationToken = verificationToken;
        user.verification.email.verificationToken = verificationToken;
        user.verification.email.lastAttempt = new Date();
      }
      
      await user.save();
      
      // Agregar al historial de verificación
      user.verification.verificationHistory.push({
        type: 'email_sent',
        timestamp: new Date(),
        metadata: { accountType }
      });
      await user.save();
      
      // Preparar respuesta sin datos sensibles
      const response = {
        id: user._id,
        name: accountType === 'person' ? user.name : user.businessName,
        email: user.email,
        phone: accountType === 'person' ? user.phone : user.contact.phone,
        accountType,
        commercialName: accountType === 'company' ? user.commercialName || user.businessName : null,
        verificationStatus: 'unverified',
        isVerified: false,
        profileImage: user.profileImage || '',
        verificationToken: verificationToken,
        createdAt: user.createdAt,
        message: 'Usuario registrado exitosamente. Por favor verifica tu email.',
        nextSteps: [
          'Verifica tu correo electrónico',
          'Sube tu foto de perfil',
          'Completa tu información personal'
        ]
      };
      
      res.status(201).json({
        success: true,
        data: response,
        message: 'Registro exitoso. Verifica tu email para continuar.'
      });
      
    } catch (error) {
      console.error('❌ Register user error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al registrar usuario',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
  
  /**
   * Subir foto de perfil - Cambia estado a pending
   */
  async uploadProfilePhoto(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🧠 Uploading profile photo: ${userId} (${userType})`);
      
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
      
      // Validar que el usuario esté en estado unverified
      if (user.verificationStatus !== 'unverified') {
        return res.status(400).json({
          success: false,
          error: 'El usuario ya ha subido una foto o está verificado',
          currentStatus: user.verificationStatus
        });
      }
      
      // Simular upload de foto (integrar con sistema real de upload)
      const photoUrl = `/uploads/profile-images/profile-${userId}-${Date.now()}.jpg`;
      
      // Actualizar estado a pending
      user.verificationStatus = 'pending';
      user.profileImage = photoUrl;
      
      // Agregar al historial
      user.verification.verificationHistory.push({
        type: 'photo_uploaded',
        timestamp: new Date(),
        metadata: { photoUrl }
      });
      
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          profileImage: photoUrl,
          verificationStatus: 'pending',
          isVerified: false,
          uploadedAt: new Date()
        },
        message: 'Foto subida exitosamente. Tu cuenta está en revisión.'
      });
      
    } catch (error) {
      console.error('❌ Upload profile photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir foto de perfil'
      });
    }
  }
  
  /**
   * Verificar email - Cambia estado a pending si tiene foto
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🧠 Verifying email: ${userId} (${userType})`);
      
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
      
      // Validar token
      const storedToken = user.verificationToken || user.verification.email.verificationToken;
      if (!storedToken || storedToken !== token) {
        return res.status(400).json({
          success: false,
          error: 'Token de verificación inválido o expirado'
        });
      }
      
      // Actualizar verificación de email
      user.verification.email.isVerified = true;
      user.verification.email.verifiedAt = new Date();
      user.verification.email.verificationToken = null;
      user.verificationToken = null;
      
      // Agregar al historial
      user.verification.verificationHistory.push({
        type: 'email_verified',
        timestamp: new Date()
      });
      
      // Si ya tiene foto, cambiar a pending
      if (user.profileImage && user.profileImage !== '') {
        user.verificationStatus = 'pending';
      }
      
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          emailVerified: true,
          verificationStatus: user.verificationStatus,
          isVerified: false,
          verifiedAt: new Date()
        },
        message: 'Email verificado exitosamente.'
      });
      
    } catch (error) {
      console.error('❌ Verify email error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar email'
      });
    }
  }
  
  /**
   * Verificación automática (basada en criterios)
   */
  async autoVerify(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🧠 Auto-verifying user: ${userId} (${userType})`);
      
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
      
      // Verificar si cumple criterios para auto-verificación
      const criteria = this.checkVerificationCriteria(user, userType);
      
      if (!criteria.meetsCriteria) {
        return res.status(400).json({
          success: false,
          error: 'El usuario no cumple los criterios para auto-verificación',
          missingCriteria: criteria.missing,
          currentStatus: user.verificationStatus
        });
      }
      
      // Cambiar a verified
      user.verificationStatus = 'verified';
      user.isVerified = true;
      user.verification.verificationLevel = 'basic';
      user.verification.trustScore = 50;
      user.verification.riskAssessment.riskLevel = 'low';
      user.verification.riskAssessment.lastAssessment = new Date();
      
      // Agregar al historial
      user.verification.verificationHistory.push({
        type: 'auto_verified',
        timestamp: new Date(),
        metadata: { criteria: criteria.met }
      });
      
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          verificationStatus: 'verified',
          isVerified: true,
          verificationLevel: 'basic',
          trustScore: 50,
          verifiedAt: new Date()
        },
        message: 'Usuario verificado automáticamente.'
      });
      
    } catch (error) {
      console.error('❌ Auto verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Error en auto-verificación'
      });
    }
  }
  
  /**
   * Verificación manual (admin)
   */
  async manualVerify(req, res) {
    try {
      const { userId, decision, notes } = req.body;
      
      console.log(`🧠 Manual verification: ${userId} → ${decision}`);
      
      // Verificar si es admin
      const adminUser = await User.findById(req.usuario.id);
      if (!adminUser || adminUser.email !== 'admin@miprofesional.com') {
        return res.status(403).json({
          success: false,
          error: 'Acceso administrador requerido'
        });
      }
      
      // Buscar usuario (puede ser User o Professional)
      let user = await User.findById(userId);
      let userType = 'user';
      
      if (!user) {
        user = await Professional.findById(userId);
        userType = 'professional';
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      // Actualizar estado según decisión
      if (decision === 'approve') {
        user.verificationStatus = 'verified';
        user.isVerified = true;
        user.verification.verificationLevel = 'standard';
        user.verification.trustScore = 75;
        user.verification.riskAssessment.riskLevel = 'low';
        
        user.verification.verificationHistory.push({
          type: 'manual_verified',
          timestamp: new Date(),
          metadata: { 
            adminId: req.usuario.id,
            notes 
          }
        });
        
      } else if (decision === 'reject') {
        user.verificationStatus = 'rejected';
        user.isVerified = false;
        user.verification.trustScore = 0;
        user.verification.riskAssessment.riskLevel = 'high';
        
        user.verification.verificationHistory.push({
          type: 'manual_rejected',
          timestamp: new Date(),
          metadata: { 
            adminId: req.usuario.id,
            notes 
          }
        });
      }
      
      user.verification.riskAssessment.lastAssessment = new Date();
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          userId,
          verificationStatus: user.verificationStatus,
          isVerified: user.isVerified,
          decision,
          processedAt: new Date()
        },
        message: `Usuario ${decision === 'approve' ? 'aprobado' : 'rechazado'} exitosamente.`
      });
      
    } catch (error) {
      console.error('❌ Manual verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Error en verificación manual'
      });
    }
  }
  
  /**
   * Obtener estado actual del usuario
   */
  async getUserStatus(req, res) {
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
      
      // Determinar siguiente paso
      const nextStep = this.getNextStep(user, userType);
      
      const status = {
        id: user._id,
        name: userType === 'user' ? user.name : user.businessName,
        email: userType === 'user' ? user.email : user.contact.email,
        accountType: user.accountType || 'person',
        commercialName: user.commercialName || user.businessName,
        verificationStatus: user.verificationStatus,
        isVerified: user.isVerified,
        profileImage: user.profileImage || '',
        verificationLevel: user.verification?.verificationLevel || 'none',
        trustScore: user.verification?.trustScore || 0,
        riskLevel: user.verification?.riskAssessment?.riskLevel || 'medium',
        nextStep,
        verificationHistory: user.verification?.verificationHistory || [],
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      
      res.status(200).json({
        success: true,
        data: status,
        message: 'Estado del usuario obtenido exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Get user status error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estado del usuario'
      });
    }
  }
  
  /**
   * Verificar criterios de auto-verificación
   */
  checkVerificationCriteria(user, userType) {
    const criteria = {
      meetsCriteria: false,
      met: [],
      missing: []
    };
    
    // Criterio 1: Email verificado
    if (user.verification?.email?.isVerified) {
      criteria.met.push('email_verified');
    } else {
      criteria.missing.push('email_verified');
    }
    
    // Criterio 2: Foto de perfil
    if (user.profileImage && user.profileImage !== '') {
      criteria.met.push('profile_image');
    } else {
      criteria.missing.push('profile_image');
    }
    
    // Criterio 3: Información básica completa
    if (userType === 'user') {
      if (user.name && user.name.length >= 2) {
        criteria.met.push('basic_info');
      } else {
        criteria.missing.push('basic_info');
      }
    } else {
      if (user.businessName && user.businessName.length >= 2) {
        criteria.met.push('basic_info');
      } else {
        criteria.missing.push('basic_info');
      }
    }
    
    // Criterio 4: Teléfono (opcional para auto-verificación)
    if (user.phone || user.contact?.phone) {
      criteria.met.push('phone');
    }
    
    // Para auto-verificación, se requiere email + foto + info básica
    const requiredCriteria = ['email_verified', 'profile_image', 'basic_info'];
    criteria.meetsCriteria = requiredCriteria.every(criterion => criteria.met.includes(criterion));
    
    return criteria;
  }
  
  /**
   * Determinar siguiente paso en el flujo
   */
  getNextStep(user, userType) {
    const status = user.verificationStatus;
    
    switch (status) {
      case 'unverified':
        if (!user.verification?.email?.isVerified) {
          return {
            action: 'verify_email',
            description: 'Verifica tu correo electrónico',
            priority: 'high'
          };
        } else if (!user.profileImage || user.profileImage === '') {
          return {
            action: 'upload_photo',
            description: 'Sube tu foto de perfil',
            priority: 'high'
          };
        } else {
          return {
            action: 'pending_review',
            description: 'Tu cuenta está en revisión',
            priority: 'normal'
          };
        }
        
      case 'pending':
        return {
          action: 'under_review',
          description: 'Tu cuenta está siendo revisada',
          priority: 'normal'
        };
        
      case 'verified':
        return {
          action: 'complete',
          description: 'Cuenta verificada - Acceso total',
          priority: 'low'
        };
        
      case 'rejected':
        return {
          action: 'contact_support',
          description: 'Contacta soporte para ayuda',
          priority: 'high'
        };
        
      default:
        return {
          action: 'unknown',
          description: 'Estado desconocido',
          priority: 'high'
        };
    }
  }
}

module.exports = new UserFlowController();
