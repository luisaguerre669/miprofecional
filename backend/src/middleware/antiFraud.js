// Anti-Fraud Middleware - Prevención de cuentas falsas
// Middleware para email único, teléfono único, rate limiting y bloqueo por IP

const User = require('../models/User');
const Professional = require('../models/Professional');

// Almacenamiento en memoria para rate limiting (en producción usar Redis)
const rateLimitStore = new Map();
const ipBlockStore = new Map();

class AntiFraudMiddleware {
  /**
   * Verificar email único
   */
  static async checkUniqueEmail(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return next();
      }
      
      console.log(`🚫 Checking unique email: ${email}`);
      
      // Verificar en usuarios
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'El email ya está registrado',
          code: 'EMAIL_EXISTS',
          field: 'email'
        });
      }
      
      // Verificar en profesionales
      const existingProfessional = await Professional.findOne({ email: email.toLowerCase().trim() });
      if (existingProfessional) {
        return res.status(409).json({
          success: false,
          error: 'El email ya está registrado',
          code: 'EMAIL_EXISTS',
          field: 'email'
        });
      }
      
      next();
      
    } catch (error) {
      console.error('❌ Check unique email error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar email',
        code: 'VALIDATION_ERROR'
      });
    }
  }
  
  /**
   * Verificar teléfono único
   */
  static async checkUniquePhone(req, res, next) {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return next();
      }
      
      console.log(`🚫 Checking unique phone: ${phone}`);
      
      // Normalizar teléfono (quitar espacios, guiones, paréntesis)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      // Verificar en usuarios
      const existingUser = await User.findOne({ 
        $or: [
          { phone: phone },
          { phone: normalizedPhone }
        ]
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'El teléfono ya está registrado',
          code: 'PHONE_EXISTS',
          field: 'phone'
        });
      }
      
      // Verificar en profesionales
      const existingProfessional = await Professional.findOne({ 
        $or: [
          { 'contact.phone': phone },
          { 'contact.phone': normalizedPhone }
        ]
      });
      if (existingProfessional) {
        return res.status(409).json({
          success: false,
          error: 'El teléfono ya está registrado',
          code: 'PHONE_EXISTS',
          field: 'phone'
        });
      }
      
      next();
      
    } catch (error) {
      console.error('❌ Check unique phone error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar teléfono',
        code: 'VALIDATION_ERROR'
      });
    }
  }
  
  /**
   * Rate limiting en registro
   */
  static rateLimitRegistration(maxAttempts = 3, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
      try {
        const clientIp = req.ip || req.connection.remoteAddress;
        const key = `register_${clientIp}`;
        
        console.log(`🚫 Rate limiting registration: ${clientIp}`);
        
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Obtener intentos previos
        let attempts = rateLimitStore.get(key) || [];
        
        // Limpiar intentos fuera de la ventana
        attempts = attempts.filter(timestamp => timestamp > windowStart);
        
        // Verificar si excede el límite
        if (attempts.length >= maxAttempts) {
          const oldestAttempt = Math.min(...attempts);
          const resetTime = oldestAttempt + windowMs;
          const remainingTime = Math.ceil((resetTime - now) / 1000 / 60);
          
          return res.status(429).json({
            success: false,
            error: 'Demasiados intentos de registro',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: remainingTime,
            message: `Por favor espera ${remainingTime} minutos antes de intentar nuevamente`
          });
        }
        
        // Agregar intento actual
        attempts.push(now);
        rateLimitStore.set(key, attempts);
        
        // Limpiar entradas antiguas
        setTimeout(() => {
          const currentAttempts = rateLimitStore.get(key) || [];
          const validAttempts = currentAttempts.filter(timestamp => timestamp > windowStart);
          if (validAttempts.length === 0) {
            rateLimitStore.delete(key);
          } else {
            rateLimitStore.set(key, validAttempts);
          }
        }, windowMs);
        
        next();
        
      } catch (error) {
        console.error('❌ Rate limiting error:', error);
        next(); // No bloquear si hay error en rate limiting
      }
    };
  }
  
  /**
   * Bloquear registros repetidos por IP
   */
  static blockRepeatedRegistrations(maxRegistrations = 2, windowMs = 60 * 60 * 1000) {
    return (req, res, next) => {
      try {
        const clientIp = req.ip || req.connection.remoteAddress;
        const key = `block_${clientIp}`;
        
        console.log(`🚫 Checking repeated registrations: ${clientIp}`);
        
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Verificar si IP está bloqueada
        const blockInfo = ipBlockStore.get(key);
        if (blockInfo && blockInfo.blockedUntil > now) {
          const remainingTime = Math.ceil((blockInfo.blockedUntil - now) / 1000 / 60);
          
          return res.status(429).json({
            success: false,
            error: 'IP temporalmente bloqueada',
            code: 'IP_BLOCKED',
            retryAfter: remainingTime,
            message: `IP bloqueada por ${remainingTime} minutos debido a actividad sospechosa`
          });
        }
        
        // Obtener registros previos
        let registrations = rateLimitStore.get(`registrations_${clientIp}`) || [];
        registrations = registrations.filter(timestamp => timestamp > windowStart);
        
        // Si hay demasiados registros, bloquear IP
        if (registrations.length >= maxRegistrations) {
          const blockDuration = 2 * 60 * 60 * 1000; // 2 horas
          ipBlockStore.set(key, {
            blocked: true,
            blockedUntil: now + blockDuration,
            reason: 'Too many registrations',
            registrationCount: registrations.length
          });
          
          return res.status(429).json({
            success: false,
            error: 'IP bloqueada temporalmente',
            code: 'IP_BLOCKED',
            retryAfter: 120,
            message: 'IP bloqueada por 2 horas debido a actividad sospechosa'
          });
        }
        
        // Agregar registro actual
        registrations.push(now);
        rateLimitStore.set(`registrations_${clientIp}`, registrations);
        
        next();
        
      } catch (error) {
        console.error('❌ Block repeated registrations error:', error);
        next(); // No bloquear si hay error
      }
    };
  }
  
  /**
   * Validar datos de registro
   */
  static validateRegistrationData(req, res, next) {
    try {
      const { name, email, phone, password, accountType, commercialName } = req.body;
      
      console.log(`🚫 Validating registration data for accountType: ${accountType}`);
      
      const errors = [];
      
      // Validaciones básicas
      if (!name || name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      
      if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push('El email no es válido');
      }
      
      if (!phone || !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
        errors.push('El teléfono no es válido');
      }
      
      if (!password || password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
      }
      
      // Validaciones específicas para empresas
      if (accountType === 'company') {
        if (!commercialName || commercialName.length < 2) {
          errors.push('El nombre comercial es requerido para empresas');
        }
        
        // Validar que no parezca datos falsos
        const suspiciousPatterns = [
          /test/i,
          /demo/i,
          /fake/i,
          /temp/i,
          /123/i,
          /abc/i
        ];
        
        if (suspiciousPatterns.some(pattern => pattern.test(commercialName))) {
          errors.push('El nombre comercial parece sospechoso');
        }
      }
      
      // Validación de patrones sospechosos
      const suspiciousEmailPatterns = [
        /tempmail/i,
        /10minutemail/i,
        /guerrillamail/i,
        /mailinator/i
      ];
      
      if (suspiciousEmailPatterns.some(pattern => pattern.test(email))) {
        errors.push('El email parece temporal o sospechoso');
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Datos de registro inválidos',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }
      
      next();
      
    } catch (error) {
      console.error('❌ Validate registration data error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al validar datos de registro',
        code: 'VALIDATION_ERROR'
      });
    }
  }
  
  /**
   * Middleware combinado para registro
   */
  static registrationProtection() {
    return [
      this.validateRegistrationData,
      this.rateLimitRegistration(3, 15 * 60 * 1000), // 3 intentos en 15 min
      this.blockRepeatedRegistrations(2, 60 * 60 * 1000), // 2 registros en 1 hora
      this.checkUniqueEmail,
      this.checkUniquePhone
    ];
  }
  
  /**
   * Obtener estadísticas de anti-fraude
   */
  static async getAntiFraudStats(req, res) {
    try {
      // Verificar si es admin
      const userId = req.usuario.id;
      const user = await User.findById(userId);
      
      if (!user || user.email !== 'admin@miprofesional.com') {
        return res.status(403).json({
          success: false,
          error: 'Acceso administrador requerido'
        });
      }
      
      const stats = {
        rateLimitEntries: rateLimitStore.size,
        blockedIPs: ipBlockStore.size,
        activeRateLimits: 0,
        activeBlocks: 0
      };
      
      // Contar límites activos
      for (const [key, value] of rateLimitStore.entries()) {
        if (Array.isArray(value) && value.length > 0) {
          stats.activeRateLimits++;
        }
      }
      
      // Contar bloqueos activos
      const now = Date.now();
      for (const [key, value] of ipBlockStore.entries()) {
        if (value.blockedUntil > now) {
          stats.activeBlocks++;
        }
      }
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Estadísticas de anti-fraude'
      });
      
    } catch (error) {
      console.error('❌ Get anti-fraud stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  }
  
  /**
   * Limpiar datos antiguos
   */
  static cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    // Limpiar rate limit store
    for (const [key, value] of rateLimitStore.entries()) {
      if (Array.isArray(value)) {
        const validEntries = value.filter(timestamp => now - timestamp < maxAge);
        if (validEntries.length === 0) {
          rateLimitStore.delete(key);
        } else {
          rateLimitStore.set(key, validEntries);
        }
      }
    }
    
    // Limpiar IP blocks
    for (const [key, value] of ipBlockStore.entries()) {
      if (value.blockedUntil <= now) {
        ipBlockStore.delete(key);
      }
    }
    
    console.log(`🚫 Anti-fraud cleanup completed. Rate limits: ${rateLimitStore.size}, Blocked IPs: ${ipBlockStore.size}`);
  }
}

// Limpiar datos antiguos cada hora
setInterval(() => {
  AntiFraudMiddleware.cleanup();
}, 60 * 60 * 1000);

module.exports = AntiFraudMiddleware;
