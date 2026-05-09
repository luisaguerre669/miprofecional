// Verification Controller - Sistema de verificación de identidad
// Controlador para gestionar verificaciones sin modificar endpoints existentes

const Verification = require('../models/Verification');
const User = require('../models/User');
const Professional = require('../models/Professional');
const crypto = require('crypto');

class VerificationController {
  /**
   * Iniciar verificación de email
   */
  async initiateEmailVerification(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🔐 Initiating email verification: ${userId} (${userType})`);
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
      // Actualizar usuario
      if (userType === 'user') {
        user.verification.email.verificationToken = verificationToken;
        user.verification.email.lastAttempt = new Date();
        user.verification.email.attempts += 1;
      } else if (userType === 'professional') {
        user.verification.email.verificationToken = verificationToken;
        user.verification.email.lastAttempt = new Date();
        user.verification.email.attempts += 1;
      }
      
      await user.save();
      
      // Crear registro de verificación
      const verification = new Verification({
        user: userType === 'user' ? userId : null,
        professional: userType === 'professional' ? userId : null,
        verificationType: 'email',
        verificationData: {
          email: {
            emailAddress: user.email,
            verificationToken,
            tokenExpiry
          }
        },
        status: 'pending',
        expiresAt: tokenExpiry,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          source: 'api'
        }
      });
      
      await verification.save();
      
      // Agregar al historial
      if (userType === 'user') {
        user.verification.verificationHistory.push({
          type: 'email_sent',
          timestamp: new Date(),
          metadata: { token: verificationToken.substring(0, 8) + '...' }
        });
      } else if (userType === 'professional') {
        user.verification.verificationHistory.push({
          type: 'email_sent',
          timestamp: new Date(),
          metadata: { token: verificationToken.substring(0, 8) + '...' }
        });
      }
      
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          verificationId: verification._id,
          token: verificationToken,
          expiresAt: tokenExpiry,
          emailAddress: user.email
        },
        message: 'Email verification initiated'
      });
      
    } catch (error) {
      console.error('❌ Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate email verification'
      });
    }
  }
  
  /**
   * Verificar email con token
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
      }
      
      console.log(`🔐 Verifying email: ${userId} (${userType})`);
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const storedToken = userType === 'user' 
        ? user.verification.email.verificationToken
        : user.verification.email.verificationToken;
      
      if (!storedToken || storedToken !== token) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
      }
      
      // Actualizar verificación
      const now = new Date();
      if (userType === 'user') {
        user.verification.email.isVerified = true;
        user.verification.email.verifiedAt = now;
        user.verification.email.verificationToken = null;
        user.verification.verificationHistory.push({
          type: 'email_verified',
          timestamp: now
        });
      } else if (userType === 'professional') {
        user.verification.email.isVerified = true;
        user.verification.email.verifiedAt = now;
        user.verification.email.verificationToken = null;
        user.verification.verificationHistory.push({
          type: 'email_verified',
          timestamp: now
        });
      }
      
      // Actualizar nivel de verificación y trust score
      await this.updateVerificationLevel(user, userType);
      
      await user.save();
      
      // Actualizar registro de verificación
      await Verification.findOneAndUpdate(
        { 
          user: userType === 'user' ? userId : null,
          professional: userType === 'professional' ? userId : null,
          verificationType: 'email',
          status: 'pending'
        },
        {
          status: 'approved',
          completedAt: now,
          confidenceScore: 85,
          reviewProcess: {
            reviewedAt: now,
            reviewNotes: 'Email verified automatically'
          }
        }
      );
      
      res.status(200).json({
        success: true,
        data: {
          isVerified: true,
          verifiedAt: now,
          verificationLevel: user.verification.verificationLevel,
          trustScore: user.verification.trustScore
        },
        message: 'Email verified successfully'
      });
      
    } catch (error) {
      console.error('❌ Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify email'
      });
    }
  }
  
  /**
   * Iniciar verificación de teléfono
   */
  async initiatePhoneVerification(req, res) {
    try {
      const { phoneNumber } = req.body;
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🔐 Initiating phone verification: ${userId} (${userType})`);
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Generar código de verificación (6 dígitos)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      
      // Actualizar usuario
      const targetPhone = phoneNumber || user.phone;
      if (userType === 'user') {
        user.verification.phone.verificationCode = verificationCode;
        user.verification.phone.codeExpiry = codeExpiry;
        user.verification.phone.lastAttempt = new Date();
        user.verification.phone.attempts += 1;
      } else if (userType === 'professional') {
        user.verification.phone.verificationCode = verificationCode;
        user.verification.phone.codeExpiry = codeExpiry;
        user.verification.phone.lastAttempt = new Date();
        user.verification.phone.attempts += 1;
      }
      
      await user.save();
      
      // Crear registro de verificación
      const verification = new Verification({
        user: userType === 'user' ? userId : null,
        professional: userType === 'professional' ? userId : null,
        verificationType: 'phone',
        verificationData: {
          phone: {
            phoneNumber: targetPhone,
            verificationCode,
            codeExpiry
          }
        },
        status: 'pending',
        expiresAt: codeExpiry,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          source: 'api'
        }
      });
      
      await verification.save();
      
      // Agregar al historial
      if (userType === 'user') {
        user.verification.verificationHistory.push({
          type: 'phone_sent',
          timestamp: new Date(),
          metadata: { phone: targetPhone.substring(0, 6) + '****' }
        });
      } else if (userType === 'professional') {
        user.verification.verificationHistory.push({
          type: 'phone_sent',
          timestamp: new Date(),
          metadata: { phone: targetPhone.substring(0, 6) + '****' }
        });
      }
      
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          verificationId: verification._id,
          phoneNumber: targetPhone.substring(0, 6) + '****',
          expiresAt: codeExpiry
        },
        message: 'Phone verification initiated'
      });
      
    } catch (error) {
      console.error('❌ Phone verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate phone verification'
      });
    }
  }
  
  /**
   * Verificar teléfono con código
   */
  async verifyPhone(req, res) {
    try {
      const { code } = req.body;
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Verification code is required'
        });
      }
      
      console.log(`🔐 Verifying phone: ${userId} (${userType})`);
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const storedCode = userType === 'user'
        ? user.verification.phone.verificationCode
        : user.verification.phone.verificationCode;
      
      const codeExpiry = userType === 'user'
        ? user.verification.phone.codeExpiry
        : user.verification.phone.codeExpiry;
      
      if (!storedCode || storedCode !== code || new Date() > codeExpiry) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification code'
        });
      }
      
      // Actualizar verificación
      const now = new Date();
      if (userType === 'user') {
        user.verification.phone.isVerified = true;
        user.verification.phone.verifiedAt = now;
        user.verification.phone.verificationCode = null;
        user.verification.phone.codeExpiry = null;
        user.verification.verificationHistory.push({
          type: 'phone_verified',
          timestamp: now
        });
      } else if (userType === 'professional') {
        user.verification.phone.isVerified = true;
        user.verification.phone.verifiedAt = now;
        user.verification.phone.verificationCode = null;
        user.verification.phone.codeExpiry = null;
        user.verification.verificationHistory.push({
          type: 'phone_verified',
          timestamp: now
        });
      }
      
      // Actualizar nivel de verificación y trust score
      await this.updateVerificationLevel(user, userType);
      
      await user.save();
      
      // Actualizar registro de verificación
      await Verification.findOneAndUpdate(
        {
          user: userType === 'user' ? userId : null,
          professional: userType === 'professional' ? userId : null,
          verificationType: 'phone',
          status: 'pending'
        },
        {
          status: 'approved',
          completedAt: now,
          confidenceScore: 80,
          reviewProcess: {
            reviewedAt: now,
            reviewNotes: 'Phone verified automatically'
          }
        }
      );
      
      res.status(200).json({
        success: true,
        data: {
          isVerified: true,
          verifiedAt: now,
          verificationLevel: user.verification.verificationLevel,
          trustScore: user.verification.trustScore
        },
        message: 'Phone verified successfully'
      });
      
    } catch (error) {
      console.error('❌ Phone verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify phone'
      });
    }
  }
  
  /**
   * Subir documentos para verificación de identidad
   */
  async submitIdentityVerification(req, res) {
    try {
      const {
        documentType,
        documentNumber,
        firstName,
        lastName,
        birthDate,
        gender,
        nationality
      } = req.body;
      
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🔐 Submitting identity verification: ${userId} (${userType})`);
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Crear registro de verificación
      const verification = new Verification({
        user: userType === 'user' ? userId : null,
        professional: userType === 'professional' ? userId : null,
        verificationType: 'identity',
        verificationData: {
          identity: {
            documentType,
            documentNumber,
            firstName,
            lastName,
            birthDate: new Date(birthDate),
            gender,
            nationality
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
      
      // Actualizar usuario
      const now = new Date();
      if (userType === 'user') {
        user.verification.identity.documentType = documentType;
        user.verification.identity.documentNumber = documentNumber;
        user.verification.verificationHistory.push({
          type: 'identity_submitted',
          timestamp: now,
          metadata: { documentType }
        });
      } else if (userType === 'professional') {
        user.verification.identity.documentType = documentType;
        user.verification.identity.documentNumber = documentNumber;
        user.verification.verificationHistory.push({
          type: 'identity_submitted',
          timestamp: now,
          metadata: { documentType }
        });
      }
      
      await user.save();
      
      res.status(201).json({
        success: true,
        data: {
          verificationId: verification._id,
          status: 'pending',
          submittedAt: now
        },
        message: 'Identity verification submitted successfully'
      });
      
    } catch (error) {
      console.error('❌ Identity verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit identity verification'
      });
    }
  }
  
  /**
   * Obtener estado de verificaciones del usuario
   */
  async getVerificationStatus(req, res) {
    try {
      const userId = req.usuario.id;
      const userType = req.usuario.userType || 'user';
      
      console.log(`🔐 Getting verification status: ${userId} (${userType})`);
      
      let user;
      if (userType === 'user') {
        user = await User.findById(userId);
      } else if (userType === 'professional') {
        user = await Professional.findById(userId);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Obtener verificaciones del modelo Verification
      const verifications = await Verification.find({
        user: userType === 'user' ? userId : null,
        professional: userType === 'professional' ? userId : null
      }).sort({ submittedAt: -1 }).lean();
      
      // Construir respuesta
      const verificationStatus = {
        overall: {
          isVerified: user.verification.isVerified,
          verificationLevel: user.verification.verificationLevel,
          trustScore: user.verification.trustScore,
          riskLevel: user.verification.riskAssessment.riskLevel,
          requiresVerification: user.verification.preferences.requiresVerification
        },
        verifications: {},
        history: user.verification.verificationHistory,
        recentVerifications: verifications.map(v => ({
          id: v._id,
          type: v.verificationType,
          status: v.status,
          submittedAt: v.submittedAt,
          completedAt: v.completedAt,
          confidenceScore: v.confidenceScore
        }))
      };
      
      // Agregar verificaciones específicas
      if (userType === 'user') {
        verificationStatus.verifications = {
          email: {
            isVerified: user.verification.email.isVerified,
            verifiedAt: user.verification.email.verifiedAt,
            attempts: user.verification.email.attempts
          },
          phone: {
            isVerified: user.verification.phone.isVerified,
            verifiedAt: user.verification.phone.verifiedAt,
            attempts: user.verification.phone.attempts
          },
          identity: {
            isVerified: user.verification.identity.isVerified,
            documentType: user.verification.identity.documentType,
            verifiedAt: user.verification.identity.verifiedAt,
            confidenceScore: user.verification.identity.confidenceScore
          },
          address: {
            isVerified: user.verification.address.isVerified,
            verifiedAt: user.verification.address.verifiedAt
          }
        };
      } else if (userType === 'professional') {
        verificationStatus.verifications = {
          email: {
            isVerified: user.verification.email.isVerified,
            verifiedAt: user.verification.email.verifiedAt,
            attempts: user.verification.email.attempts
          },
          phone: {
            isVerified: user.verification.phone.isVerified,
            verifiedAt: user.verification.phone.verifiedAt,
            attempts: user.verification.phone.attempts
          },
          identity: {
            isVerified: user.verification.identity.isVerified,
            documentType: user.verification.identity.documentType,
            verifiedAt: user.verification.identity.verifiedAt,
            confidenceScore: user.verification.identity.confidenceScore
          },
          address: {
            isVerified: user.verification.address.isVerified,
            verifiedAt: user.verification.address.verifiedAt
          },
          professionalLicense: {
            isVerified: user.verification.professionalLicense.isVerified,
            licenseNumber: user.verification.professionalLicense.licenseNumber,
            verifiedAt: user.verification.professionalLicense.verifiedAt,
            confidenceScore: user.verification.professionalLicense.confidenceScore
          },
          businessRegistration: {
            isVerified: user.verification.businessRegistration.isVerified,
            registrationNumber: user.verification.businessRegistration.registrationNumber,
            verifiedAt: user.verification.businessRegistration.verifiedAt
          }
        };
      }
      
      res.status(200).json({
        success: true,
        data: verificationStatus,
        message: 'Verification status retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Get verification status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get verification status'
      });
    }
  }
  
  /**
   * Obtener estadísticas de verificación (admin)
   */
  async getVerificationStats(req, res) {
    try {
      console.log('🔐 Getting verification stats');
      
      const stats = await Verification.getVerificationStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Verification stats retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Get verification stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get verification stats'
      });
    }
  }
  
  /**
   * Actualizar nivel de verificación y trust score
   */
  async updateVerificationLevel(user, userType) {
    try {
      let verificationLevel = 'none';
      let trustScore = 0;
      
      // Contar verificaciones aprobadas
      const verifications = {
        email: userType === 'user' ? user.verification.email.isVerified : user.verification.email.isVerified,
        phone: userType === 'user' ? user.verification.phone.isVerified : user.verification.phone.isVerified,
        identity: userType === 'user' ? user.verification.identity.isVerified : user.verification.identity.isVerified,
        address: userType === 'user' ? user.verification.address.isVerified : user.verification.address.isVerified
      };
      
      // Para profesionales, agregar verificaciones adicionales
      if (userType === 'professional') {
        verifications.professionalLicense = user.verification.professionalLicense.isVerified;
        verifications.businessRegistration = user.verification.businessRegistration.isVerified;
      }
      
      const verifiedCount = Object.values(verifications).filter(v => v).length;
      
      // Determinar nivel de verificación
      if (verifiedCount === 0) {
        verificationLevel = 'none';
        trustScore = 0;
      } else if (verifiedCount === 1) {
        verificationLevel = 'basic';
        trustScore = 20;
      } else if (verifiedCount === 2) {
        verificationLevel = 'standard';
        trustScore = 50;
      } else if (verifiedCount === 3) {
        verificationLevel = 'enhanced';
        trustScore = 75;
      } else {
        verificationLevel = 'premium';
        trustScore = 90;
      }
      
      // Ajustar trust score según verificaciones específicas
      if (verifications.email && verifications.phone) trustScore += 10;
      if (verifications.identity) trustScore += 15;
      if (userType === 'professional' && verifications.professionalLicense) trustScore += 10;
      if (userType === 'professional' && verifications.businessRegistration) trustScore += 5;
      
      trustScore = Math.min(trustScore, 100);
      
      // Actualizar usuario
      user.verification.isVerified = trustScore >= 50;
      user.verification.verificationLevel = verificationLevel;
      user.verification.trustScore = trustScore;
      user.verification.riskAssessment.lastAssessment = new Date();
      
      // Actualizar risk level basado en trust score
      if (trustScore >= 80) {
        user.verification.riskAssessment.riskLevel = 'low';
      } else if (trustScore >= 50) {
        user.verification.riskAssessment.riskLevel = 'medium';
      } else if (trustScore >= 20) {
        user.verification.riskAssessment.riskLevel = 'high';
      } else {
        user.verification.riskAssessment.riskLevel = 'critical';
      }
      
    } catch (error) {
      console.error('❌ Update verification level error:', error);
    }
  }
}

module.exports = new VerificationController();
