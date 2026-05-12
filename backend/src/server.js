const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const socketHandler = require('./socket/socketHandler');

// Importar configuración de base de datos mejorada
const database = require('./config/database');

// Logging y monitoreo
const logger = require('./config/logger');
const morgan = require('morgan');

// Seguridad y optimización
const { 
  securityMiddleware, 
  rateLimiter, 
  authRateLimiter, 
  registrationRateLimiter,
  compressionMiddleware,
  sanitizeInput 
} = require('./middleware/security');

// Cargar .env correctamente (IMPORTANTE si estás en /src)
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

const app = express();
app.set("trust proxy", 1);

// Variables requeridas
const REQUIRED_ENV_VARS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "NODE_ENV"];

function validateProductionEnvironment() {
  // Support both MONGODB_URI and MONGO_URI for compatibility
  const currentMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (!currentMongoUri) {
    missing.push("MONGODB_URI or MONGO_URI");
  }

  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGINS && !process.env.FRONTEND_URL) {
    missing.push("CORS_ORIGINS");
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    logger.error(message);
    console.error("\n❌ " + message);
    console.error("\n📋 Asegúrate de crear un archivo .env en: " + envPath);
    console.error("📋 Basado en: " + path.join(__dirname, "../.env.example"));
    console.error("\n🔧 O ejecuta: node scripts/mongodb-atlas-setup.js");
    process.exit(1);
  }

  logger.info("Environment validation passed", {
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: Boolean(currentMongoUri),
    hasCorsOrigins: Boolean(process.env.CORS_ORIGINS || process.env.FRONTEND_URL),
    port: process.env.PORT || 3000
  });
}

validateProductionEnvironment();

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith(".vercel.app") || hostname === "miprofesional.com" || hostname === "www.miprofesional.com") {
        return callback(null, true);
      }
    } catch {
      return callback(new Error(`Invalid CORS origin: ${origin}`));
    }
    if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
};

// Request logging
app.use(morgan('combined', { 
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Seguridad y optimización
app.use(securityMiddleware);
app.use(compressionMiddleware);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(sanitizeInput);

// Rate limiting global
app.use(rateLimiter);

// Body parser con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health checks y monitoreo
const healthRoutes = require("./routes/health");

// RUTAS
const authRoutes = require("./routes/auth.routes");
const professionalsRoutes = require("./routes/professionals.routes");
const { router: bookingsRoutes, setSocketIO } = require("./routes/bookings.routes");
const verificationRoutes = require("./routes/verification.routes");
const professionalRegistrationRoutes = require("./routes/professionalRegistrationRoutes");
const registerRoutes = require("./routes/registerRoutes");
const subscriptionRoutes = require("./routes/subscription.routes");
// const paymentRoutes = require("./routes/payments.routes"); // I'll create this one too for general payments if needed
const reviewRoutes = require("./routes/reviews.routes");
const profileRoutes = require("./routes/profile.routes");
const adminRoutes = require("./routes/admin.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const checkExpiredSubscriptions = require("./jobs/subscriptionCheck");

// Health checks (sin rate limiting)
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// Rutas con rate limiting específico
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/auth", authRateLimiter, authRoutes);
app.use("/api/register", registrationRateLimiter, registerRoutes);
app.use("/api/professionals", professionalsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/professional-registration", professionalRegistrationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/crashes", analyticsRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("MiProfesional API funcionando 🚀");
});

// ARRANQUE SEGURO CON LOGGING DE PRODUCCIÓN
const startServer = async () => {
  try {
    // Conectar a MongoDB usando la configuración mejorada
    await database.connect();

    const PORT = process.env.PORT || 3000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    // Create HTTP server with Socket.IO
    const server = http.createServer(app);
    const socketOrigins = allowedOrigins.length > 0
      ? allowedOrigins
      : [/^https:\/\/.*\.vercel\.app$/, "https://miprofesional.com", "https://www.miprofesional.com"];
    const io = require('socket.io')(server, {
      cors: {
        origin: process.env.NODE_ENV === "production" ? socketOrigins : [...socketOrigins, /^http:\/\/localhost:\d+$/],
        methods: ["GET", "POST"]
      }
    });

    // Initialize Socket.IO handlers
    socketHandler(io);

    // Set Socket.IO instance in routes
    setSocketIO(io);

    server.listen(PORT, () => {
      logger.info('MiProfesional backend listening', {
        port: PORT,
        nodeEnv: NODE_ENV,
        health: '/health',
        authBasePath: '/api/auth',
        rootDirectory: process.cwd()
      });
      console.log(`🚀 MiProfesional backend listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);

      // Run subscription check every 24 hours
      setInterval(checkExpiredSubscriptions, 24 * 60 * 60 * 1000);
      // Run once at startup
      checkExpiredSubscriptions();
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
    // El error ya fue manejado por database.connect()
    // Solo necesitamos salir del proceso
    process.exit(1);
  }
};

// Iniciar servidor
startServer();
