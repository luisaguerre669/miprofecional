// Auth Consumer - Independent Event Consumer
// Procesa eventos de autenticación de forma distribuida y async

console.log("🔐 Auth Consumer - Independent Event Consumer");

const { AUTH_EVENTS, BOOKING_EVENTS, PROFESSIONAL_EVENTS, SYSTEM_EVENTS } = require('../eventTypes');

class AuthConsumer {
  constructor(config = {}) {
    this.name = 'auth-consumer';
    this.isRunning = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.retryCount = 0;
    this.startTime = Date.now();
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Event handlers
    this.handlers = new Map();
    this.setupEventHandlers();
    
    this.setupGracefulShutdown();
  }

  setupEventHandlers() {
    // Auth events
    this.handlers.set(AUTH_EVENTS.USER_REGISTERED, this.handleUserRegistered.bind(this));
    this.handlers.set(AUTH_EVENTS.USER_LOGGED_IN, this.handleUserLoggedIn.bind(this));
    this.handlers.set(AUTH_EVENTS.USER_LOGGED_OUT, this.handleUserLoggedOut.bind(this));
    this.handlers.set(AUTH_EVENTS.TOKEN_REFRESHED, this.handleTokenRefreshed.bind(this));
    this.handlers.set(AUTH_EVENTS.LOGIN_FAILED, this.handleLoginFailed.bind(this));
    this.handlers.set(AUTH_EVENTS.REGISTRATION_FAILED, this.handleRegistrationFailed.bind(this));
  }

  async start() {
    try {
      console.log(`🔐 [${this.name}] Starting auth consumer...`);
      
      this.isRunning = true;
      
      console.log(`🔐 [${this.name}] Started successfully`);
      console.log(`🔐 [${this.name}] Registered handlers: ${Array.from(this.handlers.keys()).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error(`🔐 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async stop() {
    try {
      console.log(`🔐 [${this.name}] Stopping auth consumer...`);
      
      this.isRunning = false;
      
      console.log(`🔐 [${this.name}] Stopped successfully`);
    } catch (error) {
      console.error(`🔐 [${this.name}] Error during stop:`, error.message);
    }
  }

  async handleEvent(eventName, payload, metadata) {
    const startTime = Date.now();
    
    try {
      const handler = this.handlers.get(eventName);
      
      if (!handler) {
        console.warn(`🔐 [${this.name}] No handler for event: ${eventName}`);
        return { success: false, error: 'No handler found' };
      }
      
      console.log(`🔐 [${this.name}] Processing event: ${eventName}`);
      
      // Ejecutar handler con retry
      const result = await this.executeWithRetry(handler, payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] Event processed: ${eventName} (${duration}ms)`);
      
      return {
        success: true,
        eventName,
        duration,
        processedCount: this.processedCount
      };
      
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;
      
      console.error(`🔐 [${this.name}] Event processing failed: ${eventName} - ${error.message}`);
      
      return {
        success: false,
        eventName,
        error: error.message,
        duration,
        errorCount: this.errorCount
      };
    }
  }

  async executeWithRetry(handler, payload, metadata) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await handler(payload, metadata);
        
        if (attempt > 0) {
          console.log(`🔐 [${this.name}] Retry success on attempt ${attempt + 1}`);
          this.retryCount++;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          console.error(`🔐 [${this.name}] Max retries reached (${this.maxRetries})`);
          break;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.warn(`🔐 [${this.name}] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Event Handlers
  async handleUserRegistered(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] USER_REGISTERED: Processing new user registration`);
      
      // Analytics processing
      await this.processRegistrationAnalytics(payload, metadata);
      
      // Notification processing
      await this.processRegistrationNotifications(payload, metadata);
      
      // Security processing
      await this.processRegistrationSecurity(payload, metadata);
      
      // Business logic processing
      await this.processRegistrationBusinessLogic(payload, metadata);
      
      // External integrations
      await this.processRegistrationIntegrations(payload, metadata);
      
      console.log(`🔐 [${this.name}] USER_REGISTERED: Processing completed`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] USER_REGISTERED processing error:`, error.message);
      throw error;
    }
  }

  async handleUserLoggedIn(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] USER_LOGGED_IN: Processing user login`);
      
      // Analytics processing
      await this.processLoginAnalytics(payload, metadata);
      
      // Security processing
      await this.processLoginSecurity(payload, metadata);
      
      // Session management
      await this.processSessionManagement(payload, metadata);
      
      // Business logic processing
      await this.processLoginBusinessLogic(payload, metadata);
      
      console.log(`🔐 [${this.name}] USER_LOGGED_IN: Processing completed`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] USER_LOGGED_IN processing error:`, error.message);
      throw error;
    }
  }

  async handleUserLoggedOut(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] USER_LOGGED_OUT: Processing user logout`);
      
      // Analytics processing
      await this.processLogoutAnalytics(payload, metadata);
      
      // Session cleanup
      await this.processSessionCleanup(payload, metadata);
      
      // Security processing
      await this.processLogoutSecurity(payload, metadata);
      
      console.log(`🔐 [${this.name}] USER_LOGGED_OUT: Processing completed`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] USER_LOGGED_OUT processing error:`, error.message);
      throw error;
    }
  }

  async handleTokenRefreshed(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] TOKEN_REFRESHED: Processing token refresh`);
      
      // Security processing
      await this.processTokenRefreshSecurity(payload, metadata);
      
      // Session management
      await this.processTokenRefreshSession(payload, metadata);
      
      // Analytics processing
      await this.processTokenRefreshAnalytics(payload, metadata);
      
      console.log(`🔐 [${this.name}] TOKEN_REFRESHED: Processing completed`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] TOKEN_REFRESHED processing error:`, error.message);
      throw error;
    }
  }

  async handleLoginFailed(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] LOGIN_FAILED: Processing login failure`);
      
      // Security processing
      await this.processLoginFailedSecurity(payload, metadata);
      
      // Analytics processing
      await this.processLoginFailedAnalytics(payload, metadata);
      
      // Rate limiting
      await this.processLoginFailedRateLimiting(payload, metadata);
      
      // Alert processing
      await this.processLoginFailedAlerts(payload, metadata);
      
      console.log(`🔐 [${this.name}] LOGIN_FAILED: Processing completed`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] LOGIN_FAILED processing error:`, error.message);
      throw error;
    }
  }

  async handleRegistrationFailed(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] REGISTRATION_FAILED: Processing registration failure`);
      
      // Security processing
      await this.processRegistrationFailedSecurity(payload, metadata);
      
      // Analytics processing
      await this.processRegistrationFailedAnalytics(payload, metadata);
      
      // Rate limiting
      await this.processRegistrationFailedRateLimiting(payload, metadata);
      
      // Alert processing
      await this.processRegistrationFailedAlerts(payload, metadata);
      
      console.log(`🔐 [${this.name}] REGISTRATION_FAILED: Processing completed`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] REGISTRATION_FAILED processing error:`, error.message);
      throw error;
    }
  }

  // Processing methods
  async processRegistrationAnalytics(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Analytics: Processing user registration`);
      
      const analyticsData = {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        location: payload.location,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'consumer',
        ip: metadata.ip,
        userAgent: metadata.userAgent
      };
      
      // En implementación real, esto enviaría a servicio de analytics
      console.log(`🔐 [${this.name}] Would send registration analytics:`, analyticsData);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Analytics processing error:`, error.message);
    }
  }

  async processRegistrationNotifications(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Notifications: Processing registration notifications`);
      
      // Welcome email
      const welcomeNotification = {
        type: 'welcome_email',
        recipient: payload.email,
        userId: payload.userId,
        data: {
          name: payload.name,
          location: payload.location,
          registrationDate: new Date().toISOString()
        }
      };
      
      // Verification email (si aplica)
      const verificationNotification = {
        type: 'verification_email',
        recipient: payload.email,
        userId: payload.userId,
        data: {
          verificationToken: 'generated-token', // En implementación real se generaría un token
          expiry: '24h'
        }
      };
      
      console.log(`🔐 [${this.name}] Would queue notifications:`, [welcomeNotification, verificationNotification]);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Notification processing error:`, error.message);
    }
  }

  async processRegistrationSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing registration security`);
      
      // Verificar patrones sospechosos
      const suspiciousPatterns = this.checkSuspiciousRegistration(payload, metadata);
      
      if (suspiciousPatterns.length > 0) {
        console.log(`🔐 [${this.name}] Suspicious registration patterns detected:`, suspiciousPatterns);
        
        // En implementación real, esto podría:
        // - Marcar cuenta para revisión manual
        // - Requerir verificación adicional
        // - Bloquear temporalmente
        console.log(`🔐 [${this.name}] Would flag user ${payload.userId} for security review`);
      }
      
      // Verificar lista negra
      await this.checkBlacklist(payload, metadata);
      
      // Verificar geolocalización sospechosa
      await this.checkGeolocationRisk(payload, metadata);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Security processing error:`, error.message);
    }
  }

  async processRegistrationBusinessLogic(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Business: Processing registration business logic`);
      
      // Actualizar estadísticas de usuarios
      await this.updateUserRegistrationStats(payload);
      
      // Verificar programas de referidos
      await this.checkReferralPrograms(payload);
      
      // Inicializar preferencias de usuario
      await this.initializeUserPreferences(payload);
      
      // Actualizar métricas del sistema
      await this.updateSystemMetrics('user_registered');
      
      console.log(`🔐 [${this.name}] Business logic processed`);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 120));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Business logic processing error:`, error.message);
    }
  }

  async processRegistrationIntegrations(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Integrations: Processing external integrations`);
      
      // Integración con CRM
      await this.syncWithCRM(payload);
      
      // Integración con email marketing
      await this.addToEmailMarketing(payload);
      
      // Integración con sistema de analítica
      await this.updateAnalyticsSystem(payload);
      
      console.log(`🔐 [${this.name}] External integrations processed`);
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Integration processing error:`, error.message);
    }
  }

  // Helper methods (stubs para implementación real)
  checkSuspiciousRegistration(payload, metadata) {
    const patterns = [];
    
    // Verificar email temporal
    if (this.isDisposableEmail(payload.email)) {
      patterns.push('disposable_email');
    }
    
    // Verificar IP sospechosa
    if (this.isSuspiciousIP(metadata.ip)) {
      patterns.push('suspicious_ip');
    }
    
    // Verificar user agent sospechoso
    if (this.isSuspiciousUserAgent(metadata.userAgent)) {
      patterns.push('suspicious_user_agent');
    }
    
    // Verificar velocidad de registro
    if (this.isRapidRegistration(metadata)) {
      patterns.push('rapid_registration');
    }
    
    return patterns;
  }

  isDisposableEmail(email) {
    const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  isSuspiciousIP(ip) {
    // En implementación real, verificar contra listas de IPs sospechosas
    return false; // Stub
  }

  isSuspiciousUserAgent(userAgent) {
    // En implementación real, verificar patrones de bot/user agent sospechoso
    return false; // Stub
  }

  isRapidRegistration(metadata) {
    // En implementación real, verificar si hay múltiples registros desde la misma IP
    return false; // Stub
  }

  async checkBlacklist(payload, metadata) {
    console.log(`🔐 [${this.name}] Would check ${payload.email} against blacklist`);
  }

  async checkGeolocationRisk(payload, metadata) {
    console.log(`🔐 [${this.name}] Would check geolocation risk for IP: ${metadata.ip}`);
  }

  async updateUserRegistrationStats(payload) {
    console.log(`🔐 [${this.name}] Would update registration stats for user: ${payload.userId}`);
  }

  async checkReferralPrograms(payload) {
    console.log(`🔐 [${this.name}] Would check referral programs for user: ${payload.userId}`);
  }

  async initializeUserPreferences(payload) {
    console.log(`🔐 [${this.name}] Would initialize preferences for user: ${payload.userId}`);
  }

  async updateSystemMetrics(metric) {
    console.log(`🔐 [${this.name}] Would update system metric: ${metric}`);
  }

  async syncWithCRM(payload) {
    console.log(`🔐 [${this.name}] Would sync user ${payload.userId} with CRM`);
  }

  async addToEmailMarketing(payload) {
    console.log(`🔐 [${this.name}] Would add user ${payload.userId} to email marketing`);
  }

  async updateAnalyticsSystem(payload) {
    console.log(`🔐 [${this.name}] Would update analytics system for user: ${payload.userId}`);
  }

  // Otros métodos de procesamiento (stubs)
  async processLoginAnalytics(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process login analytics for user: ${payload.userId}`);
  }

  async processLoginSecurity(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process login security for user: ${payload.userId}`);
  }

  async processSessionManagement(payload, metadata) {
    console.log(`🔐 [${this.name}] Would manage session for user: ${payload.userId}`);
  }

  async processLoginBusinessLogic(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process login business logic for user: ${payload.userId}`);
  }

  async processLogoutAnalytics(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process logout analytics for user: ${payload.userId}`);
  }

  async processSessionCleanup(payload, metadata) {
    console.log(`🔐 [${this.name}] Would cleanup session for user: ${payload.userId}`);
  }

  async processLogoutSecurity(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process logout security for user: ${payload.userId}`);
  }

  async processTokenRefreshSecurity(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process token refresh security for user: ${payload.userId}`);
  }

  async processTokenRefreshSession(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process token refresh session for user: ${payload.userId}`);
  }

  async processTokenRefreshAnalytics(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process token refresh analytics for user: ${payload.userId}`);
  }

  async processLoginFailedSecurity(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process login failed security for email: ${payload.email}`);
  }

  async processLoginFailedAnalytics(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process login failed analytics for email: ${payload.email}`);
  }

  async processLoginFailedRateLimiting(payload, metadata) {
    console.log(`🔐 [${this.name}] Would apply rate limiting for IP: ${metadata.ip}`);
  }

  async processLoginFailedAlerts(payload, metadata) {
    console.log(`🔐 [${this.name}] Would send alerts for login failure: ${payload.email}`);
  }

  async processRegistrationFailedSecurity(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process registration failed security for email: ${payload.email}`);
  }

  async processRegistrationFailedAnalytics(payload, metadata) {
    console.log(`🔐 [${this.name}] Would process registration failed analytics for email: ${payload.email}`);
  }

  async processRegistrationFailedRateLimiting(payload, metadata) {
    console.log(`🔐 [${this.name}] Would apply rate limiting for IP: ${metadata.ip}`);
  }

  async processRegistrationFailedAlerts(payload, metadata) {
    console.log(`🔐 [${this.name}] Would send alerts for registration failure: ${payload.email}`);
  }

  // Get consumer statistics
  getStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      name: this.name,
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      retryCount: this.retryCount,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      errorRate: this.processedCount > 0 ? 
        (this.errorCount / this.processedCount * 100).toFixed(2) + '%' : '0%',
      retryRate: this.processedCount > 0 ? 
        (this.retryCount / this.processedCount * 100).toFixed(2) + '%' : '0%',
      handlersCount: this.handlers.size,
      startTime: new Date(this.startTime).toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`🔐 [${this.name}] ${signal} received, shutting down gracefully...`);
      
      this.isRunning = false;
      
      // Wait for current processing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`🔐 [${this.name}] Final stats:`, this.getStats());
      console.log(`🔐 [${this.name}] Shutdown completed`);
      
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Create and start consumer if this file is run directly
if (require.main === module) {
  const authConsumer = new AuthConsumer();
  
  authConsumer.start().then(success => {
    if (success) {
      console.log('🔐 Auth consumer started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('🔐 Auth Consumer Stats:', authConsumer.getStats());
      }, 60000); // Every minute
    } else {
      console.error('🔐 Failed to start auth consumer');
      process.exit(1);
    }
  });
}

module.exports = {
  AuthConsumer
};
