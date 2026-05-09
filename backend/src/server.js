const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const socketHandler = require('./socket/socketHandler');

// � Logging y monitoreo
const logger = require('./config/logger');
const morgan = require('morgan');

// 🔐 Seguridad y optimización
const { 
  securityMiddleware, 
  rateLimiter, 
  authRateLimiter, 
  registrationRateLimiter,
  compressionMiddleware,
  corsMiddleware,
  sanitizeInput 
} = require('./middleware/security');

// � Cargar .env correctamente (IMPORTANTE si estás en /src)
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();

// 📊 Request logging
app.use(morgan('combined', { 
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 🔐 Seguridad y optimización
app.use(securityMiddleware);
app.use(compressionMiddleware);
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(sanitizeInput);

// 🚦 Rate limiting global
app.use(rateLimiter);

// 📦 Body parser con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🏥 Health checks y monitoreo
const healthRoutes = require("./routes/health");

// RUTAS
const authRoutes = require("./routes/auth.routes");
const professionalsRoutes = require("./routes/professionals.routes");
const { router: bookingsRoutes, setSocketIO } = require("./routes/bookings.routes");
const verificationRoutes = require("./routes/verification.routes");
const professionalRegistrationRoutes = require("./routes/professionalRegistrationRoutes");
const registerRoutes = require("./routes/registerRoutes");

// 🏥 Health checks (sin rate limiting)
app.use("/health", healthRoutes);

// 🔐 Rutas con rate limiting específico
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/register", registrationRateLimiter, registerRoutes);
app.use("/api/professionals", professionalsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/professional-registration", professionalRegistrationRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("MiProfesional API funcionando 🚀");
});

// 🔌 Mongo URI (solo UNA variable, sin duplicados)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ ERROR: No se encontró MONGODB_URI en .env");
  process.exit(1);
}

// 🚀 ARRANQUE SEGURO CON LOGGING DE PRODUCCIÓN
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB conectado correctamente', { 
      database: mongoose.connection.name,
      host: mongoose.connection.host 
    });

    const PORT = process.env.PORT || 3000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    // Create HTTP server with Socket.IO
    const server = http.createServer(app);
    const io = require('socket.io')(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    // Initialize Socket.IO handlers
    socketHandler(io);

    // Set Socket.IO instance in routes
    setSocketIO(io);

    server.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      logger.info(`🔌 Socket.IO habilitado para notificaciones en tiempo real`);
      console.log(`📊 Metrics: http://localhost:${PORT}/health/metrics`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`🛑 Recibida señal ${signal}, iniciando graceful shutdown`);
      
      server.close(() => {
        logger.info('📡 Servidor HTTP cerrado');
        
        mongoose.connection.close(false, () => {
          logger.info('🗄️ Conexión MongoDB cerrada');
          process.exit(0);
        });
      });

      // Forzar shutdown después de 10 segundos
      setTimeout(() => {
        logger.error('⚠️ Forzando shutdown después de timeout');
        process.exit(1);
      }, 10000);
    };

    // Capturar señales de shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection:', { reason, promise });
      process.exit(1);
    });

    return server;

  } catch (error) {
    logger.error('❌ Error iniciando servidor:', error);
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();