// Basic Anti-Fraud Middleware - Prevención básica de fraude
// Implementa validaciones simples pero efectivas

const User = require('../models/User');
const Professional = require('../models/Professional');

// Cache simple para rate limiting
const registrationAttempts = new Map();
const ipRegistrations = new Map();

// Limpiar cache viejo (cada hora)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const [key, data] of registrationAttempts.entries()) {
    if (data.timestamp < oneHourAgo) {
      registrationAttempts.delete(key);
    }
  }
  
  for (const [key, data] of ipRegistrations.entries()) {
    if (data.timestamp < oneHourAgo) {
      ipRegistrations.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Validar email único
const validateUniqueEmail = async (email) => {
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    const existingProfessional = await Professional.findOne({ 'contact.email': email.toLowerCase().trim() });
    
    if (existingUser || existingProfessional) {
      return {
        isValid: false,
        message: 'Email ya registrado en la plataforma'
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('❌ Email validation error:', error);
    return { isValid: false, message: 'Error validando email' };
  }
};

// Validar teléfono único
const validateUniquePhone = async (phone) => {
  try {
    // Normalizar teléfono
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    const existingUser = await User.findOne({ phone: normalizedPhone });
    const existingProfessional = await Professional.findOne({ 'contact.phone': normalizedPhone });
    
    if (existingUser || existingProfessional) {
      return {
        isValid: false,
        message: 'Teléfono ya registrado en la plataforma'
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('❌ Phone validation error:', error);
    return { isValid: false, message: 'Error validando teléfono' };
  }
};

// Rate limiting por email/IP
const validateRateLimit = (email, ip) => {
  const now = Date.now();
  const fifteenMinutesAgo = now - (15 * 60 * 1000);
  
  // Rate limiting por email (3 intentos en 15 minutos)
  const emailKey = `email:${email}`;
  const emailAttempts = registrationAttempts.get(emailKey) || { count: 0, timestamp: now };
  
  if (emailAttempts.timestamp < fifteenMinutesAgo) {
    emailAttempts.count = 0;
    emailAttempts.timestamp = now;
  }
  
  if (emailAttempts.count >= 3) {
    return {
      isValid: false,
      message: 'Demasiados intentos de registro. Por favor espera 15 minutos.'
    };
  }
  
  emailAttempts.count++;
  registrationAttempts.set(emailKey, emailAttempts);
  
  // Rate limiting por IP (2 registros en 1 hora)
  const ipKey = `ip:${ip}`;
  const ipReg = ipRegistrations.get(ipKey) || { count: 0, timestamp: now };
  
  if (ipReg.count >= 2) {
    return {
      isValid: false,
      message: 'Límite de registros por IP excedido. Por favor espera 1 hora.'
    };
  }
  
  ipReg.count++;
  ipRegistrations.set(ipKey, ipReg);
  
  return { isValid: true };
};

// Validar campos mínimos
const validateRequiredFields = (userData) => {
  const errors = [];
  
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Nombre debe tener al menos 2 caracteres');
  }
  
  if (!userData.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
    errors.push('Email inválido');
  }
  
  if (!userData.phone || userData.phone.replace(/[\s\-\(\)]/g, '').length < 8) {
    errors.push('Teléfono inválido');
  }
  
  if (!userData.password || userData.password.length < 6) {
    errors.push('Contraseña debe tener al menos 6 caracteres');
  }
  
  // Validación específica para empresas
  if (userData.accountType === 'company' && (!userData.commercialName || userData.commercialName.trim().length < 2)) {
    errors.push('Nombre comercial requerido para empresas');
  }
  
  return errors;
};

// Middleware principal de anti-fraude
const basicAntiFraud = async (req, res, next) => {
  try {
    const { email, phone, accountType, commercialName } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    // Validar campos mínimos
    const fieldErrors = validateRequiredFields(req.body);
    if (fieldErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: fieldErrors
      });
    }
    
    // Validar email único
    const emailValidation = await validateUniqueEmail(email);
    if (!emailValidation.isValid) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_EXISTS',
        message: emailValidation.message
      });
    }
    
    // Validar teléfono único
    const phoneValidation = await validateUniquePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_EXISTS',
        message: phoneValidation.message
      });
    }
    
    // Validar rate limiting
    const rateLimitValidation = validateRateLimit(email, clientIP);
    if (!rateLimitValidation.isValid) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitValidation.message
      });
    }
    
    // Todas las validaciones pasaron
    next();
    
  } catch (error) {
    console.error('❌ Basic anti-fraud middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en validación anti-fraude'
    });
  }
};

module.exports = { 
  basicAntiFraud,
  validateUniqueEmail,
  validateUniquePhone,
  validateRateLimit,
  validateRequiredFields
};
