// Production-ready Server for MiProfesional Backend

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import routes
const authSimpleRoutes = require('./routes/auth-simple');
const categoryRoutes = require('./routes/categories');
const professionalRoutes = require('./routes/professionals');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const healthRoutes = require('./routes/health');
const mercadopagoRoutes = require('./routes/mercadopago');

class ProductionServer {
  constructor() {
    this.app = express();
    // Cloud deployment uses dynamic port from environment
    this.port = process.env.PORT || 3001;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration for cloud deployment
    const corsOptions = {
      origin: function (origin, callback) {
        // Production origins from environment variable
        const allowedOrigins = process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(',')
          : [
              'https://miprofesional.com',
              'https://www.miprofesional.com',
              'https://app.miprofesional.com',
              'capacitor://localhost',
              'ionic://localhost'
            ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    this.app.use(cors(corsOptions));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Rate limiting for auth routes
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        message: 'Rate limit exceeded'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // General rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        message: 'Rate limit exceeded'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/v1/auth-simple', authLimiter);
    this.app.use(limiter);
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/v1/auth-simple', authSimpleRoutes);
    this.app.use('/api/v1/categories', categoryRoutes);
    this.app.use('/api/v1/professionals', professionalRoutes);
    this.app.use('/api/v1/bookings', bookingRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/upload', uploadRoutes);
    this.app.use('/api/v1/health', healthRoutes);
    this.app.use('/api/v1/mercadopago', mercadopagoRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'MiProfesional Backend API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/api/v1/auth-simple',
          categories: '/api/v1/categories',
          professionals: '/api/v1/professionals',
          bookings: '/api/v1/bookings',
          users: '/api/v1/users',
          upload: '/api/v1/upload',
          health: '/api/v1/health',
          mercadopago: '/api/v1/mercadopago'
        }
      });
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
    });
  }

  setupErrorHandling() {
    // Handle 404 errors
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Global error handler:', err);

      // Handle CORS errors
      if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
          success: false,
          error: 'CORS error',
          message: 'Origin not allowed',
          timestamp: new Date().toISOString()
        });
      }

      // Handle validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: err.message,
          timestamp: new Date().toISOString()
        });
      }

      // Handle JWT errors
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Authentication failed',
          timestamp: new Date().toISOString()
        });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Authentication expired',
          timestamp: new Date().toISOString()
        });
      }

      // Default error
      res.status(err.status || 500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async start() {
    try {
      // Start server for cloud deployment
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 MiProfesional API Server running on port ${this.port}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base: /api/v1`);
        console.log(`❤️  Health Check: /health`);
        console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
        console.log(`🌐 CORS Origins: ${process.env.CORS_ORIGIN || 'Production defaults'}`);
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    try {
      console.log('Starting graceful shutdown...');
      
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
      
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new ProductionServer();
  server.start();
}

module.exports = ProductionServer;
