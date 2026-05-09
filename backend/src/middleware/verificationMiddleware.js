// Verification Middleware - Sistema de verificación de identidad opcional
// Middleware para verificar nivel de confianza y requerimientos de verificación

const Verification = require('../models/Verification');
const User = require('../models/User');
const Professional = require('../models/Professional');

class VerificationMiddleware {
  /**
   * Middleware para verificar nivel mínimo de confianza
   * @param {string} minLevel - Nivel mínimo requerido ('none', 'basic', 'standard', 'enhanced', 'premium')
   * @param {boolean} optional - Si es opcional (no bloquea si no cumple)
   */
  static requireTrustLevel(minLevel = 'basic', optional = false) {
    return async (req, res, next) => {
      try {
        const userId = req.usuario?.id;
        const userType = req.usuario?.userType || 'user';
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }
        
        let user, trustScore, verificationLevel;
        
        if (userType === 'user') {
          user = await User.findById(userId);
          trustScore = user?.verification?.trustScore || 0;
          verificationLevel = user?.verification?.verificationLevel || 'none';
        } else if (userType === 'professional') {
          user = await Professional.findById(userId);
          trustScore = user?.verification?.trustScore || 0;
          verificationLevel = user?.verification?.verificationLevel || 'none';
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid user type'
          });
        }
        
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }
        
        // Niveles de confianza
        const levels = {
          'none': 0,
          'basic': 20,
          'standard': 50,
          'enhanced': 75,
          'premium': 90
        };
        
        const requiredScore = levels[minLevel] || 0;
        const currentScore = trustScore;
        
        if (currentScore < requiredScore) {
          if (optional) {
            // Agregar información de verificación al request pero no bloquear
            req.verificationInfo = {
              meetsRequirement: false,
              currentScore,
              requiredScore,
              currentLevel: verificationLevel,
              requiredLevel: minLevel,
              user
            };
            return next();
          } else {
            return res.status(403).json({
              success: false,
              error: `Insufficient verification level. Required: ${minLevel}, Current: ${verificationLevel}`,
              verification: {
                current: {
                  level: verificationLevel,
                  score: currentScore
                },
                required: {
                  level: minLevel,
                  score: requiredScore
                }
              }
            });
          }
        }
        
        // Agregar información de verificación al request
        req.verificationInfo = {
          meetsRequirement: true,
          currentScore,
          requiredScore,
          currentLevel: verificationLevel,
          requiredLevel: minLevel,
          user
        };
        
        next();
        
      } catch (error) {
        console.error('❌ Verification middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Verification check failed'
        });
      }
    };
  }
  
  /**
   * Middleware para verificar verificaciones específicas
   * @param {Array} requiredVerifications - Array de verificaciones requeridas
   * @param {boolean} optional - Si es opcional
   */
  static requireVerifications(requiredVerifications = [], optional = false) {
    return async (req, res, next) => {
      try {
        const userId = req.usuario?.id;
        const userType = req.usuario?.userType || 'user';
        
        if (!userId || !requiredVerifications.length) {
          return next();
        }
        
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
        
        const verificationStatus = {};
        let allVerified = true;
        
        for (const verification of requiredVerifications) {
          let isVerified = false;
          
          if (userType === 'user') {
            switch (verification) {
              case 'email':
                isVerified = user.verification?.email?.isVerified || false;
                break;
              case 'phone':
                isVerified = user.verification?.phone?.isVerified || false;
                break;
              case 'identity':
                isVerified = user.verification?.identity?.isVerified || false;
                break;
              case 'address':
                isVerified = user.verification?.address?.isVerified || false;
                break;
            }
          } else if (userType === 'professional') {
            switch (verification) {
              case 'email':
                isVerified = user.verification?.email?.isVerified || false;
                break;
              case 'phone':
                isVerified = user.verification?.phone?.isVerified || false;
                break;
              case 'identity':
                isVerified = user.verification?.identity?.isVerified || false;
                break;
              case 'address':
                isVerified = user.verification?.address?.isVerified || false;
                break;
              case 'professional_license':
                isVerified = user.verification?.professionalLicense?.isVerified || false;
                break;
              case 'business_registration':
                isVerified = user.verification?.businessRegistration?.isVerified || false;
                break;
            }
          }
          
          verificationStatus[verification] = isVerified;
          if (!isVerified) allVerified = false;
        }
        
        if (!allVerified && !optional) {
          const missingVerifications = requiredVerifications.filter(v => !verificationStatus[v]);
          
          return res.status(403).json({
            success: false,
            error: 'Required verifications missing',
            missingVerifications,
            verificationStatus
          });
        }
        
        // Agregar información de verificación al request
        req.verificationInfo = {
          allVerified,
          verificationStatus,
          missingVerifications: allVerified ? [] : requiredVerifications.filter(v => !verificationStatus[v]),
          user
        };
        
        next();
        
      } catch (error) {
        console.error('❌ Specific verification middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Verification check failed'
        });
      }
    };
  }
  
  /**
   * Middleware para evaluación de riesgo
   * @param {string} maxRiskLevel - N máximo de riesgo permitido ('low', 'medium', 'high', 'critical')
   * @param {boolean} optional - Si es opcional
   */
  static requireRiskLevel(maxRiskLevel = 'medium', optional = false) {
    return async (req, res, next) => {
      try {
        const userId = req.usuario?.id;
        const userType = req.usuario?.userType || 'user';
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }
        
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
        
        const riskLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        const currentRiskLevel = user?.verification?.riskAssessment?.riskLevel || 'medium';
        const currentRiskScore = riskLevels[currentRiskLevel] || 2;
        const maxRiskScore = riskLevels[maxRiskLevel] || 2;
        
        if (currentRiskScore > maxRiskScore) {
          if (optional) {
            req.riskInfo = {
              exceedsRiskLevel: true,
              currentRiskLevel,
              maxRiskLevel,
              currentRiskScore,
              maxRiskScore,
              riskFactors: user?.verification?.riskAssessment?.riskFactors || [],
              flags: user?.verification?.riskAssessment?.flags || [],
              user
            };
            return next();
          } else {
            return res.status(403).json({
              success: false,
              error: `Risk level too high. Current: ${currentRiskLevel}, Maximum allowed: ${maxRiskLevel}`,
              riskInfo: {
                current: {
                  level: currentRiskLevel,
                  score: currentRiskScore,
                  factors: user?.verification?.riskAssessment?.riskFactors || [],
                  flags: user?.verification?.riskAssessment?.flags || []
                },
                maximum: {
                  level: maxRiskLevel,
                  score: maxRiskScore
                }
              }
            });
          }
        }
        
        // Agregar información de riesgo al request
        req.riskInfo = {
          exceedsRiskLevel: false,
          currentRiskLevel,
          maxRiskLevel,
          currentRiskScore,
          maxRiskScore,
          riskFactors: user?.verification?.riskAssessment?.riskFactors || [],
          flags: user?.verification?.riskAssessment?.flags || [],
          user
        };
        
        next();
        
      } catch (error) {
        console.error('❌ Risk assessment middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Risk assessment failed'
        });
      }
    };
  }
  
  /**
   * Middleware para verificar si el usuario requiere verificación
   * @param {boolean} blockIfRequired - Si bloquea cuando se requiere verificación
   */
  static checkVerificationRequired(blockIfRequired = true) {
    return async (req, res, next) => {
      try {
        const userId = req.usuario?.id;
        const userType = req.usuario?.userType || 'user';
        
        if (!userId) {
          return next();
        }
        
        let user;
        
        if (userType === 'user') {
          user = await User.findById(userId);
        } else if (userType === 'professional') {
          user = await Professional.findById(userId);
        }
        
        if (!user) {
          return next();
        }
        
        const requiresVerification = user?.verification?.preferences?.requiresVerification || false;
        const isVerified = user?.verification?.isVerified || false;
        
        if (requiresVerification && !isVerified && blockIfRequired) {
          return res.status(403).json({
            success: false,
            error: 'Verification required to access this resource',
            verificationRequired: true,
            currentStatus: {
              requiresVerification,
              isVerified,
              verificationLevel: user?.verification?.verificationLevel || 'none'
            }
          });
        }
        
        // Agregar información de requerimiento al request
        req.verificationRequired = {
          requiresVerification,
          isVerified,
          needsVerification: requiresVerification && !isVerified,
          user
        };
        
        next();
        
      } catch (error) {
        console.error('❌ Verification required middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Verification requirement check failed'
        });
      }
    };
  }
  
  /**
   * Middleware para agregar información de verificación sin bloquear
   */
  static addVerificationInfo() {
    return async (req, res, next) => {
      try {
        const userId = req.usuario?.id;
        const userType = req.usuario?.userType || 'user';
        
        if (!userId) {
          return next();
        }
        
        let user;
        
        if (userType === 'user') {
          user = await User.findById(userId);
        } else if (userType === 'professional') {
          user = await Professional.findById(userId);
        }
        
        if (!user) {
          return next();
        }
        
        // Calcular información de verificación
        const verificationInfo = {
          isVerified: user?.verification?.isVerified || false,
          verificationLevel: user?.verification?.verificationLevel || 'none',
          trustScore: user?.verification?.trustScore || 0,
          riskLevel: user?.verification?.riskAssessment?.riskLevel || 'medium',
          requiresVerification: user?.verification?.preferences?.requiresVerification || false,
          lastUpdated: user?.verification?.riskAssessment?.lastAssessment || user?.updatedAt
        };
        
        // Agregar verificaciones específicas
        if (userType === 'user') {
          verificationInfo.verifications = {
            email: user?.verification?.email?.isVerified || false,
            phone: user?.verification?.phone?.isVerified || false,
            identity: user?.verification?.identity?.isVerified || false,
            address: user?.verification?.address?.isVerified || false
          };
        } else if (userType === 'professional') {
          verificationInfo.verifications = {
            email: user?.verification?.email?.isVerified || false,
            phone: user?.verification?.phone?.isVerified || false,
            identity: user?.verification?.identity?.isVerified || false,
            address: user?.verification?.address?.isVerified || false,
            professionalLicense: user?.verification?.professionalLicense?.isVerified || false,
            businessRegistration: user?.verification?.businessRegistration?.isVerified || false
          };
        }
        
        req.verificationInfo = verificationInfo;
        next();
        
      } catch (error) {
        console.error('❌ Add verification info middleware error:', error);
        next(); // No bloquear si hay error
      }
    };
  }
  
  /**
   * Middleware para profesionales que requieren licencia
   */
  static requireProfessionalLicense(optional = false) {
    return VerificationMiddleware.requireVerifications(['professional_license'], optional);
  }
  
  /**
   * Middleware para verificación básica (email + phone)
   */
  static requireBasicVerification(optional = false) {
    return VerificationMiddleware.requireVerifications(['email', 'phone'], optional);
  }
  
  /**
   * Middleware para verificación estándar (email + phone + identity)
   */
  static requireStandardVerification(optional = false) {
    return VerificationMiddleware.requireVerifications(['email', 'phone', 'identity'], optional);
  }
}

module.exports = VerificationMiddleware;
