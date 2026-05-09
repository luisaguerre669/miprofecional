const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Configuración de helmet para seguridad
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.n8n.cloud"]
    },
  },
  crossOriginEmbedderPolicy: false
});

// Rate limiting para prevenir ataques
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de 100 requests por ventana
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para endpoints sensibles
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

// Rate limiting para registro de profesionales
const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 registros por hora
  message: {
    error: 'Too many registration attempts, please try again later.',
    retryAfter: '1 hour'
  }
});

// Middleware de compresión gzip
const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// CORS configuration
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173',  // Frontend dev server
    'http://localhost:4175',  // Frontend preview/production
    'https://miprofesional.com',
    'https://www.miprofesional.com'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Middleware para sanitizar inputs básicos
const sanitizeInput = (req, res, next) => {
  // Eliminar espacios en blanco de strings
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  }
  
  // Validar que no haya scripts maliciosos básicos
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
  
  const checkObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(obj[key])) {
            return false;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!checkObject(obj[key])) {
          return false;
        }
      }
    }
    return true;
  };
  
  if (req.body && !checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }
  
  next();
};

module.exports = {
  securityMiddleware,
  rateLimiter,
  authRateLimiter,
  registrationRateLimiter,
  compressionMiddleware,
  corsMiddleware,
  sanitizeInput
};
