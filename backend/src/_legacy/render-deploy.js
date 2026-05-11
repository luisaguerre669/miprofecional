// Render Deployment Script - Monolith Backend
// Optimized for production deployment on Render (Fallback Service)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

console.log("🚀 Starting MiProfesional Backend for Render Deployment");
console.log("🌍 Environment:", process.env.NODE_ENV || "production");
console.log("🔌 Port:", process.env.PORT || 10000);

// Production Configuration
const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: process.env.PORT || 10000,
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  
  // CORS Configuration
  CORS_ORIGINS: [
    "https://miprofesional.onrender.com",
    "https://miprofesional-backend.onrender.com",
    "https://miprofesional-gateway.onrender.com",
    "https://miprofesional-auth.onrender.com"
  ],
  
  // Service Configuration
  SERVICE_NAME: "MiProfesional Backend",
  SERVICE_VERSION: "1.0.0",
  SERVICE_TYPE: "monolith"
};

// Validate critical environment variables
function validateConfig() {
  const errors = [];
  
  if (!CONFIG.MONGODB_URI) {
    errors.push('MONGODB_URI is required');
  }
  
  if (!CONFIG.JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  }
  
  if (!CONFIG.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is required');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Configuration validated successfully');
}

validateConfig();

// Database connection
const mongoose = require("mongoose");

class DatabaseConfig {
  async connect() {
    try {
      if (!CONFIG.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
      }

      console.log("🗄️ Connecting to MongoDB Atlas...");
      console.log(`📍 URI: ${CONFIG.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

      await mongoose.connect(CONFIG.MONGODB_URI, {
        // No deprecated options for MongoDB Atlas
      });

      console.log("✅ Connected to MongoDB Atlas successfully");
      console.log(`🗄️ Database: ${mongoose.connection.name}`);

      this.setupEventHandlers();
      return mongoose.connection;

    } catch (error) {
      console.error("❌ Error connecting to MongoDB:", error.message);
      throw error;
    }
  }

  setupEventHandlers() {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log("🗄️ MongoDB Atlas connection established");
    });

    connection.on('error', (err) => {
      console.error("❌ MongoDB Atlas connection error:", err);
    });

    connection.on('disconnected', () => {
      console.log("🔌 MongoDB Atlas disconnected");
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await connection.close();
        console.log("🔌 MongoDB Atlas connection closed");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error closing connection:", error);
        process.exit(1);
      }
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log("🔌 Disconnected from MongoDB Atlas");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  getConnectionStatus() {
    const connection = mongoose.connection;
    
    return {
      readyState: connection.readyState,
      name: connection.name,
      host: connection.host,
      port: connection.port,
      states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }
    };
  }
}

// Import existing routes and middleware
const authRoutes = require("./routes/auth");
const bookingsRoutes = require("./routes/bookings");
const professionalRoutes = require("./routes/professionals");
const authMiddleware = require("./middleware/auth");

class RenderServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.databaseConfig = new DatabaseConfig();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security
    this.app.use(require("helmet")({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));
    
    // CORS
    this.app.use(cors({
      origin: CONFIG.CORS_ORIGINS,
      credentials: true
    }));
    
    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      req.requestId = `mono_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      req.startTime = Date.now();
      
      console.log(`🚀 [${req.requestId}] ${req.method} ${req.path} - Monolith received`);
      
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        console.log(`🚀 [${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get("/health", async (req, res) => {
      try {
        const dbStatus = this.databaseConfig.getConnectionStatus();
        const User = require("./models/User");
        const Professional = require("./models/Professional");
        const Booking = require("./models/Booking");
        
        const stats = await Promise.all([
          User.countDocuments(),
          Professional.countDocuments(),
          Booking.countDocuments()
        ]);
        
        res.json({
          status: "ok",
          service: CONFIG.SERVICE_NAME,
          version: CONFIG.SERVICE_VERSION,
          type: CONFIG.SERVICE_TYPE,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: CONFIG.NODE_ENV,
          database: {
            status: dbStatus.readyState === 1 ? "connected" : "disconnected",
            name: dbStatus.name,
            stats: {
              users: stats[0],
              professionals: stats[1],
              bookings: stats[2]
            }
          },
          socketIO: {
            connected: this.io ? this.io.engine.clientsCount : 0
          }
        });
      } catch (error) {
        res.status(500).json({
          status: "error",
          service: CONFIG.SERVICE_NAME,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Service info
    this.app.get("/", (req, res) => {
      res.json({
        service: CONFIG.SERVICE_NAME,
        version: CONFIG.SERVICE_VERSION,
        type: CONFIG.SERVICE_TYPE,
        environment: CONFIG.NODE_ENV,
        description: "MiProfesional Backend - Fallback Service",
        endpoints: {
          auth: {
            "POST /api/auth/register": "User registration",
            "POST /api/auth/login": "User login",
            "POST /api/auth/refresh": "Token refresh",
            "POST /api/auth/logout": "User logout",
            "GET /api/auth/profile": "Get user profile",
            "PUT /api/auth/profile": "Update user profile"
          },
          bookings: {
            "POST /api/bookings": "Create booking",
            "GET /api/bookings": "Get user bookings",
            "GET /api/bookings/:id": "Get booking by ID",
            "PUT /api/bookings/:id": "Update booking",
            "DELETE /api/bookings/:id": "Delete booking"
          },
          professionals: {
            "GET /api/professionals/nearby": "Find nearby professionals",
            "PUT /api/professionals/location": "Update professional location",
            "GET /api/professionals/search": "Search professionals",
            "GET /api/professionals/featured": "Get featured professionals",
            "GET /api/professionals/:id": "Get professional by ID"
          }
        },
        health: "/health",
        timestamp: new Date().toISOString()
      });
    });

    // API Routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/bookings", bookingsRoutes);
    this.app.use("/api/professionals", professionalRoutes);

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        message: `Route ${req.method} ${req.path} not found`,
        service: CONFIG.SERVICE_NAME,
        availableRoutes: ["/", "/health", "/api/auth", "/api/bookings", "/api/professionals"],
        timestamp: new Date().toISOString()
      });
    });
  }

  setupSocketIO() {
    // Create HTTP server for Socket.IO
    this.server = http.createServer(this.app);
    
    // Configure Socket.IO with CORS
    this.io = new Server(this.server, {
      cors: {
        origin: CONFIG.CORS_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Make io available to the app
    this.app.set("io", this.io);

    // Setup Socket.IO events
    this.io.on("connection", (socket) => {
      console.log(`📡 Socket connected: ${socket.id}`);
      
      socket.on("update-location", (data) => {
        const { professionalId, lat, lng } = data;
        
        // Validate coordinates
        if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          socket.emit("location-update-error", {
            error: "Invalid coordinates",
            message: "Latitude must be between -90 and 90, longitude between -180 and 180"
          });
          return;
        }

        // Create GeoJSON location
        const location = {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        };

        // Broadcast location update to all clients
        socket.broadcast.emit("professional-location-updated", {
          professionalId,
          location,
          timestamp: new Date().toISOString(),
          socketId: socket.id
        });

        console.log(`📍 Location update: ${professionalId} -> [${lat}, ${lng}]`);

        // Send confirmation to sender
        socket.emit("location-update-confirmed", {
          professionalId,
          location,
          timestamp: new Date().toISOString()
        });
      });

      socket.on("disconnect", () => {
        console.log(`📡 Socket disconnected: ${socket.id}`);
      });
    });

    console.log("📡 Socket.IO configured for real-time location tracking");
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error(`❌ [${req.requestId}] Server error:`, err);
      
      res.status(500).json({
        error: "Internal server error",
        message: "An error occurred in the backend",
        service: CONFIG.SERVICE_NAME,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    });
  }

  async start() {
    try {
      console.log("🔄 Starting MiProfesional Backend...");

      // Connect to database
      await this.databaseConfig.connect();

      // Start server
      console.log(`🌐 Starting server on port ${CONFIG.PORT}...`);
      
      this.server.listen(CONFIG.PORT, () => {
        console.log("🎉 MI PROFESIONAL BACKEND STARTED SUCCESSFULLY");
        console.log(`📍 URL: https://miprofesional-backend.onrender.com`);
        console.log(`🌍 Environment: ${CONFIG.NODE_ENV}`);
        console.log(`🔗 Health Check: /health`);
        console.log(`🚀 Service: ${CONFIG.SERVICE_NAME} v${CONFIG.SERVICE_VERSION}`);
        console.log(`🏗️ Type: ${CONFIG.SERVICE_TYPE} (Fallback Service)`);
        console.log(`📡 Socket.IO ready for real-time tracking`);
        console.log(`📊 Status: ACTIVE`);
      });

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${CONFIG.PORT} is in use`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, shutting down gracefully...');
        this.shutdown();
      });

      process.on('SIGINT', () => {
        console.log('🛑 SIGINT received, shutting down gracefully...');
        this.shutdown();
      });

    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  async shutdown() {
    console.log('🔄 Shutting down...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const renderServer = new RenderServer();
  renderServer.start();
}

module.exports = RenderServer;
