// Server - Modular Architecture Preparation
// This is the NEW modular server that will eventually replace the old one
// For now, both servers can coexist during migration

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Import modular configuration
const { moduleRegistry, moduleLoader } = require('./config/modules');
const realtimeService = require('./modules/realtime/realtime.service');

console.log("🚀 Iniciando servidor MiProfesional (Arquitectura Modular)...");
console.log("📦 Variables de entorno cargadas");
console.log("🔧 NODE_ENV:", process.env.NODE_ENV || "development");
console.log("🔌 PORT:", process.env.PORT || 10000);
console.log("🗄️ MONGODB_URI:", process.env.MONGODB_URI ? "✅ Configurada" : "❌ NO CONFIGURADA");
console.log("🔐 JWT_SECRET:", process.env.JWT_SECRET ? "✅ Configurada" : "❌ NO CONFIGURADA");

// Database connection
let connectDB;
try {
  connectDB = require("./config/db");
  console.log("✅ Configuración de DB cargada");
} catch (error) {
  console.error("❌ Error cargando configuración de DB:", error.message);
}

class ModularServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 10000;

    // Create HTTP server for Socket.IO
    this.server = http.createServer(this.app);
    
    // Configure Socket.IO with CORS
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://miprofesional-backend.onrender.com", "https://miprofesional.onrender.com"]
          : ["http://localhost:3000", "http://localhost:8081", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Make io available to the app and services
    this.app.set("io", this.io);
    realtimeService.setIO(this.io);

    this.middlewares();
    this.routes();
    this.setupSocketEvents();
    this.setupErrorHandling();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`📋 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  routes() {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        ok: true,
        message: "Servidor saludable (Modular)",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        architecture: "modular"
      });
    });

    // Module health check
    this.app.get("/health/modules", async (req, res) => {
      try {
        const moduleHealth = await moduleRegistry.healthCheck();
        const moduleStats = moduleRegistry.getModuleStats();
        
        res.json({
          ok: true,
          message: "Module health check completed",
          timestamp: new Date().toISOString(),
          data: {
            health: moduleHealth,
            stats: moduleStats
          }
        });
      } catch (error) {
        res.status(500).json({
          ok: false,
          message: "Module health check failed",
          error: error.message
        });
      }
    });

    // Load and register module routes
    this.loadModuleRoutes();

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        ok: true,
        message: "MiProfesional API (Modular Architecture)",
        version: "2.0.0",
        architecture: "modular",
        modules: moduleRegistry.getAllModules().map(m => ({
          name: m.name,
          version: m.version,
          endpoints: m.endpoints?.length || 0
        })),
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        ok: false,
        message: "Ruta no encontrada",
        path: req.originalUrl,
        available: ["/", "/health", "/health/modules", "/api/auth", "/api/bookings", "/api/professionals", "/api/geolocation", "/api/realtime"]
      });
    });

    console.log("✅ Rutas modulares configuradas");
  }

  // Load and register all module routes
  loadModuleRoutes() {
    const modules = moduleRegistry.getAllModules();
    
    modules.forEach(module => {
      try {
        const routes = moduleRegistry.getModuleRoutes(module.id);
        const basePath = this.getModuleBasePath(module.id);
        
        this.app.use(basePath, routes);
        console.log(`✅ Rutas de módulo ${module.name} configuradas en ${basePath}`);
      } catch (error) {
        console.error(`❌ Error configurando rutas del módulo ${module.name}:`, error.message);
      }
    });
  }

  // Get base path for module
  getModuleBasePath(moduleId) {
    const pathMap = {
      'auth': '/api/auth',
      'bookings': '/api/bookings',
      'professionals': '/api/professionals',
      'geolocation': '/api/geolocation',
      'realtime': '/api/realtime'
    };
    
    return pathMap[moduleId] || `/api/${moduleId}`;
  }

  setupSocketEvents() {
    // Use modular real-time service
    this.io.on("connection", (socket) => {
      realtimeService.handleConnection(socket);
    });

    console.log("📡 Eventos de Socket.IO configurados (Servicio Modular)");
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error("Error:", err);

      res.status(500).json({
        ok: false,
        message: "Error interno del servidor",
        architecture: "modular",
        timestamp: new Date().toISOString()
      });
    });
  }

  async start() {
    try {
      console.log("🔄 Iniciando servidor modular...");

      // Verify critical environment variables
      if (!process.env.MONGODB_URI) {
        console.error("❌ ERROR CRÍTICO: MONGODB_URI no está configurada");
        console.error("   Por favor, configura MONGODB_URI en las variables de entorno de Render");
        process.exit(1);
      }

      if (!process.env.JWT_SECRET) {
        console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurada");
        console.error("   Por favor, configura JWT_SECRET en las variables de entorno de Render");
        process.exit(1);
      }

      // Connect to database
      console.log("🗄️ Conectando a MongoDB...");
      await connectDB();
      console.log("✅ MongoDB conectado exitosamente");

      // Initialize modules
      console.log("🔧 Inicializando módulos...");
      await moduleRegistry.initializeModules();
      console.log("✅ Módulos inicializados exitosamente");

      // Start server
      console.log(`🌐 Iniciando servidor modular en puerto ${this.port}...`);
      this.server.listen(this.port, () => {
        console.log("🎉 SERVIDOR MODULAR INICIADO EXITOSAMENTE");
        console.log(`📍 URL: http://localhost:${this.port}`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health Check: http://localhost:${this.port}/health`);
        console.log(`🔗 Module Health: http://localhost:${this.port}/health/modules`);
        console.log(`📚 API Base: http://localhost:${this.port}/api`);
        console.log(`📡 Socket.IO listo para tracking en tiempo real`);
        console.log(`🏗️ Arquitectura: Modular Monolith (Preparado para Microservicios)`);
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Puerto ${this.port} está en uso`);
        } else {
          console.error('❌ Error del servidor:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      console.error("❌ ERROR FATAL al iniciar el servidor modular:");
      console.error("   Mensaje:", error.message);
      console.error("   Stack:", error.stack);
      process.exit(1);
    }
  }
}

// Start modular server if this file is run directly
if (require.main === module) {
  const modularServer = new ModularServer();
  modularServer.start();
}

module.exports = ModularServer;
