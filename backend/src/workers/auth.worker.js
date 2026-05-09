// Auth Worker - Distributed Redis Streams Consumer
// Procesa eventos de autenticación con consumer groups y retry automático

console.log("🔐 Auth Worker - Distributed Redis Streams Consumer");

const { redisClient } = require('../config/redis.client');
const { distributedEventBus } = require('../events/distributedEventBus');
const { AUTH_EVENTS } = require('../events/eventTypes');

class AuthWorker {
  constructor() {
    this.name = 'auth-worker';
    this.groupName = 'auth-group'; // Updated to match distributed event bus
    this.consumerName = `auth-worker-${process.pid}`;
    this.isRunning = false;
    this.processedCount = 0;
    this.errorCount = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.startTime = Date.now();
    
    this.setupGracefulShutdown();
  }

  async start() {
    try {
      console.log(`🔐 [${this.name}] Starting distributed auth worker...`);
      console.log(`🔐 [${this.name}] Consumer: ${this.consumerName}`);
      console.log(`🔐 [${this.name}] Consumer Group: ${this.groupName}`);
      
      // Check Redis availability
      const redisHealth = await redisClient.healthCheck();
      if (redisHealth.status !== 'healthy') {
        console.error(`🔐 [${this.name}] Redis not healthy: ${redisHealth.error}`);
        return false;
      }
      
      // Subscribe to auth events with distributed event bus
      await this.subscribeToAuthEvents();
      
      this.isRunning = true;
      console.log(`🔐 [${this.name}] Started successfully`);
      
      return true;
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Failed to start:`, error.message);
      return false;
    }
  }

  async subscribeToAuthEvents() {
    try {
      // Subscribe to user registered events
      await distributedEventBus.subscribe(
        AUTH_EVENTS.USER_REGISTERED,
        this.handleUserRegistered.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to user logged in events
      await distributedEventBus.subscribe(
        AUTH_EVENTS.USER_LOGGED_IN,
        this.handleUserLoggedIn.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to user logged out events
      await distributedEventBus.subscribe(
        AUTH_EVENTS.USER_LOGGED_OUT,
        this.handleUserLoggedOut.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to token refreshed events
      await distributedEventBus.subscribe(
        AUTH_EVENTS.TOKEN_REFRESHED,
        this.handleTokenRefreshed.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to login failed events
      await distributedEventBus.subscribe(
        AUTH_EVENTS.LOGIN_FAILED,
        this.handleLoginFailed.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      // Subscribe to registration failed events
      await distributedEventBus.subscribe(
        AUTH_EVENTS.REGISTRATION_FAILED,
        this.handleRegistrationFailed.bind(this),
        {
          consumerName: this.consumerName,
          maxRetries: this.maxRetries
        }
      );
      
      console.log(`🔐 [${this.name}] Subscribed to all auth events with consumer group: ${this.groupName}`);
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Error subscribing to events:`, error.message);
      throw error;
    }
  }

  async handleUserRegistered(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 [${this.name}] Processing USER_REGISTERED:`, {
        userId: payload.userId,
        email: payload.email ? payload.email.substring(0, 3) + '***' : 'N/A',
        name: payload.name || 'N/A',
        timestamp: new Date().toISOString()
      });
      
      // Analytics processing
      await this.processRegistrationAnalytics(payload, metadata);
      
      // Notification processing
      await this.processRegistrationNotifications(payload, metadata);
      
      // Business logic processing
      await this.processRegistrationBusinessLogic(payload, metadata);
      
      // Security processing
      await this.processRegistrationSecurity(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] USER_REGISTERED processed (${duration}ms):`, {
        userId: payload.userId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🔐 [${this.name}] Error processing USER_REGISTERED:`, error.message);
      
      console.error(`🔐 [${this.name}] Error details:`, {
        userId: payload.userId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleUserLoggedIn(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 [${this.name}] Processing USER_LOGGED_IN:`, {
        userId: payload.userId,
        email: payload.email ? payload.email.substring(0, 3) + '***' : 'N/A',
        rememberMe: payload.rememberMe || false,
        timestamp: new Date().toISOString()
      });
      
      // Analytics processing
      await this.processLoginAnalytics(payload, metadata);
      
      // Security processing
      await this.processLoginSecurity(payload, metadata);
      
      // Business logic processing
      await this.processLoginBusinessLogic(payload, metadata);
      
      // Session management
      await this.processSessionManagement(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] USER_LOGGED_IN processed (${duration}ms):`, {
        userId: payload.userId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🔐 [${this.name}] Error processing USER_LOGGED_IN:`, error.message);
      
      console.error(`🔐 [${this.name}] Error details:`, {
        userId: payload.userId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleUserLoggedOut(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 [${this.name}] Processing USER_LOGGED_OUT:`, {
        userId: payload.userId,
        timestamp: new Date().toISOString()
      });
      
      // Analytics processing
      await this.processLogoutAnalytics(payload, metadata);
      
      // Session cleanup
      await this.processSessionCleanup(payload, metadata);
      
      // Security processing
      await this.processLogoutSecurity(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] USER_LOGGED_OUT processed (${duration}ms):`, {
        userId: payload.userId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🔐 [${this.name}] Error processing USER_LOGGED_OUT:`, error.message);
      
      console.error(`🔐 [${this.name}] Error details:`, {
        userId: payload.userId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleTokenRefreshed(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 [${this.name}] Processing TOKEN_REFRESHED:`, {
        userId: payload.userId,
        timestamp: new Date().toISOString()
      });
      
      // Security processing
      await this.processTokenRefreshSecurity(payload, metadata);
      
      // Session management
      await this.processTokenRefreshSession(payload, metadata);
      
      // Analytics processing
      await this.processTokenRefreshAnalytics(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] TOKEN_REFRESHED processed (${duration}ms):`, {
        userId: payload.userId,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🔐 [${this.name}] Error processing TOKEN_REFRESHED:`, error.message);
      
      console.error(`🔐 [${this.name}] Error details:`, {
        userId: payload.userId,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleLoginFailed(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 [${this.name}] Processing LOGIN_FAILED:`, {
        email: payload.email ? payload.email.substring(0, 3) + '***' : 'N/A',
        reason: payload.reason || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      // Security processing
      await this.processLoginFailedSecurity(payload, metadata);
      
      // Analytics processing
      await this.processLoginFailedAnalytics(payload, metadata);
      
      // Rate limiting
      await this.processLoginFailedRateLimiting(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] LOGIN_FAILED processed (${duration}ms):`, {
        email: payload.email ? payload.email.substring(0, 3) + '***' : 'N/A',
        reason: payload.reason,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🔐 [${this.name}] Error processing LOGIN_FAILED:`, error.message);
      
      console.error(`🔐 [${this.name}] Error details:`, {
        email: payload.email,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  async handleRegistrationFailed(payload, metadata) {
    const startTime = Date.now();
    
    try {
      console.log(`🔐 [${this.name}] Processing REGISTRATION_FAILED:`, {
        email: payload.email ? payload.email.substring(0, 3) + '***' : 'N/A',
        reason: payload.reason || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      // Security processing
      await this.processRegistrationFailedSecurity(payload, metadata);
      
      // Analytics processing
      await this.processRegistrationFailedAnalytics(payload, metadata);
      
      // Rate limiting
      await this.processRegistrationFailedRateLimiting(payload, metadata);
      
      this.processedCount++;
      const duration = Date.now() - startTime;
      
      console.log(`🔐 [${this.name}] REGISTRATION_FAILED processed (${duration}ms):`, {
        email: payload.email ? payload.email.substring(0, 3) + '***' : 'N/A',
        reason: payload.reason,
        processedCount: this.processedCount
      });
      
    } catch (error) {
      this.errorCount++;
      console.error(`🔐 [${this.name}] Error processing REGISTRATION_FAILED:`, error.message);
      
      console.error(`🔐 [${this.name}] Error details:`, {
        email: payload.email,
        error: error.message,
        stack: error.stack,
        metadata
      });
    }
  }

  // Analytics processing methods
  async processRegistrationAnalytics(payload, metadata) {
    try {
      const registrationMetrics = {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        location: payload.location,
        source: metadata.source || 'api',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 [${this.name}] Analytics: User registered - Source: ${metadata.source}`);
      
      // In real implementation, this would send to analytics service
      console.log(`🔐 [${this.name}] Would send registration analytics:`, registrationMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Registration analytics error:`, error.message);
    }
  }

  async processLoginAnalytics(payload, metadata) {
    try {
      const loginMetrics = {
        userId: payload.userId,
        email: payload.email,
        rememberMe: payload.rememberMe,
        source: metadata.source || 'api',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 [${this.name}] Analytics: User logged in - Remember me: ${payload.rememberMe}`);
      
      // In real implementation, this would send to analytics service
      console.log(`🔐 [${this.name}] Would send login analytics:`, loginMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Login analytics error:`, error.message);
    }
  }

  async processLogoutAnalytics(payload, metadata) {
    try {
      const logoutMetrics = {
        userId: payload.userId,
        source: metadata.source || 'api',
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 [${this.name}] Analytics: User logged out`);
      
      // In real implementation, this would send to analytics service
      console.log(`🔐 [${this.name}] Would send logout analytics:`, logoutMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 20));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Logout analytics error:`, error.message);
    }
  }

  async processTokenRefreshAnalytics(payload, metadata) {
    try {
      const tokenRefreshMetrics = {
        userId: payload.userId,
        source: metadata.source || 'api',
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 [${this.name}] Analytics: Token refreshed`);
      
      // In real implementation, this would send to analytics service
      console.log(`🔐 [${this.name}] Would send token refresh analytics:`, tokenRefreshMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 20));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Token refresh analytics error:`, error.message);
    }
  }

  async processLoginFailedAnalytics(payload, metadata) {
    try {
      const loginFailedMetrics = {
        email: payload.email,
        reason: payload.reason,
        source: metadata.source || 'api',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 [${this.name}] Analytics: Login failed - Reason: ${payload.reason}`);
      
      // In real implementation, this would send to analytics service
      console.log(`🔐 [${this.name}] Would send login failed analytics:`, loginFailedMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Login failed analytics error:`, error.message);
    }
  }

  async processRegistrationFailedAnalytics(payload, metadata) {
    try {
      const registrationFailedMetrics = {
        email: payload.email,
        reason: payload.reason,
        source: metadata.source || 'api',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 [${this.name}] Analytics: Registration failed - Reason: ${payload.reason}`);
      
      // In real implementation, this would send to analytics service
      console.log(`🔐 [${this.name}] Would send registration failed analytics:`, registrationFailedMetrics);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Registration failed analytics error:`, error.message);
    }
  }

  // Notification processing methods
  async processRegistrationNotifications(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Notifications: Welcome email for user ${payload.userId}`);
      
      // In real implementation, this would queue welcome email
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
      
      console.log(`🔐 [${this.name}] Would queue welcome notification:`, welcomeNotification);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Registration notification error:`, error.message);
    }
  }

  async processLoginNotifications(payload, metadata) {
    try {
      // Only send notifications for suspicious logins
      if (this.isSuspiciousLogin(payload, metadata)) {
        console.log(`🔐 [${this.name}] Notifications: Suspicious login detected for user ${payload.userId}`);
        
        const securityNotification = {
          type: 'security_alert',
          recipient: payload.email,
          userId: payload.userId,
          data: {
            loginTime: new Date().toISOString(),
            suspiciousReason: this.getSuspiciousReason(payload, metadata)
          }
        };
        
        console.log(`🔐 [${this.name}] Would queue security notification:`, securityNotification);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Login notification error:`, error.message);
    }
  }

  // Security processing methods
  async processRegistrationSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing registration security checks`);
      
      // Check for suspicious registration patterns
      const suspiciousPatterns = this.checkSuspiciousRegistration(payload, metadata);
      
      if (suspiciousPatterns.length > 0) {
        console.log(`🔐 [${this.name}] Security: Suspicious registration patterns detected:`, suspiciousPatterns);
        
        // In real implementation, this would flag the account for review
        console.log(`🔐 [${this.name}] Would flag user ${payload.userId} for security review`);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Registration security error:`, error.message);
    }
  }

  async processLoginSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing login security checks`);
      
      // Check for suspicious login patterns
      const suspiciousPatterns = this.checkSuspiciousLogin(payload, metadata);
      
      if (suspiciousPatterns.length > 0) {
        console.log(`🔐 [${this.name}] Security: Suspicious login patterns detected:`, suspiciousPatterns);
        
        // In real implementation, this might trigger additional security measures
        console.log(`🔐 [${this.name}] Would apply additional security measures for user ${payload.userId}`);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Login security error:`, error.message);
    }
  }

  async processLogoutSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing logout security`);
      
      // In real implementation, this would invalidate tokens and sessions
      console.log(`🔐 [${this.name}] Would invalidate all tokens for user ${payload.userId}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Logout security error:`, error.message);
    }
  }

  async processTokenRefreshSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing token refresh security`);
      
      // In real implementation, this would validate refresh token and update session
      console.log(`🔐 [${this.name}] Would validate refresh token for user ${payload.userId}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Token refresh security error:`, error.message);
    }
  }

  async processLoginFailedSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing login failed security`);
      
      // Check for potential brute force attacks
      const isBruteForce = this.checkBruteForceAttack(payload, metadata);
      
      if (isBruteForce) {
        console.log(`🔐 [${this.name}] Security: Potential brute force attack detected from IP ${metadata.ip}`);
        
        // In real implementation, this might block the IP or add rate limiting
        console.log(`🔐 [${this.name}] Would apply rate limiting to IP ${metadata.ip}`);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 70));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Login failed security error:`, error.message);
    }
  }

  async processRegistrationFailedSecurity(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Security: Processing registration failed security`);
      
      // Check for potential spam registrations
      const isSpam = this.checkSpamRegistration(payload, metadata);
      
      if (isSpam) {
        console.log(`🔐 [${this.name}] Security: Potential spam registration detected from IP ${metadata.ip}`);
        
        // In real implementation, this might block the IP or add CAPTCHA
        console.log(`🔐 [${this.name}] Would apply additional security measures to IP ${metadata.ip}`);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Registration failed security error:`, error.message);
    }
  }

  // Business logic processing methods
  async processRegistrationBusinessLogic(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Business: Processing registration business logic`);
      
      // Update user statistics
      console.log(`🔐 [${this.name}] Business: Updating user registration statistics`);
      
      // Check for referral programs
      console.log(`🔐 [${this.name}] Business: Checking referral programs`);
      
      // In real implementation, this would update database records
      console.log(`🔐 [${this.name}] Would update business logic for user registration:`, payload.userId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 120));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Registration business logic error:`, error.message);
    }
  }

  async processLoginBusinessLogic(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Business: Processing login business logic`);
      
      // Update user activity
      console.log(`🔐 [${this.name}] Business: Updating user last login`);
      
      // Check for user preferences
      console.log(`🔐 [${this.name}] Business: Loading user preferences`);
      
      // In real implementation, this would update database records
      console.log(`🔐 [${this.name}] Would update business logic for user login:`, payload.userId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 80));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Login business logic error:`, error.message);
    }
  }

  async processSessionManagement(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Session: Managing user session`);
      
      // Create session record
      console.log(`🔐 [${this.name}] Session: Creating session record for user ${payload.userId}`);
      
      // Update session statistics
      console.log(`🔐 [${this.name}] Session: Updating session statistics`);
      
      // In real implementation, this would create session in database
      console.log(`🔐 [${this.name}] Would create session for user:`, payload.userId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 60));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Session management error:`, error.message);
    }
  }

  async processSessionCleanup(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Session: Cleaning up user session`);
      
      // Remove session record
      console.log(`🔐 [${this.name}] Session: Removing session record for user ${payload.userId}`);
      
      // Update session statistics
      console.log(`🔐 [${this.name}] Session: Updating session statistics`);
      
      // In real implementation, this would remove session from database
      console.log(`🔐 [${this.name}] Would remove session for user:`, payload.userId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 40));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Session cleanup error:`, error.message);
    }
  }

  async processTokenRefreshSession(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Session: Processing token refresh`);
      
      // Update session with new tokens
      console.log(`🔐 [${this.name}] Session: Updating session with new tokens for user ${payload.userId}`);
      
      // In real implementation, this would update session in database
      console.log(`🔐 [${this.name}] Would update session for token refresh:`, payload.userId);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Token refresh session error:`, error.message);
    }
  }

  // Helper methods
  isSuspiciousLogin(payload, metadata) {
    const { rememberMe } = payload;
    const { ip, userAgent } = metadata;
    
    return !rememberMe && (ip !== 'known' || userAgent !== 'known');
  }

  getSuspiciousReason(payload, metadata) {
    const reasons = [];
    
    if (!payload.rememberMe) {
      reasons.push('no_remember_me');
    }
    
    if (metadata.ip !== 'known') {
      reasons.push('new_ip');
    }
    
    if (metadata.userAgent !== 'known') {
      reasons.push('new_device');
    }
    
    return reasons.join(', ') || 'unknown';
  }

  checkSuspiciousRegistration(payload, metadata) {
    const patterns = [];
    
    // Check for suspicious patterns
    if (metadata.ip !== 'known') {
      patterns.push('new_ip');
    }
    
    if (payload.email && this.isDisposableEmail(payload.email)) {
      patterns.push('disposable_email');
    }
    
    return patterns;
  }

  checkSuspiciousLogin(payload, metadata) {
    const patterns = [];
    
    if (metadata.ip !== 'known') {
      patterns.push('new_ip');
    }
    
    if (metadata.userAgent !== 'known') {
      patterns.push('new_device');
    }
    
    if (!payload.rememberMe) {
      patterns.push('no_remember_me');
    }
    
    return patterns;
  }

  checkBruteForceAttack(payload, metadata) {
    // In real implementation, this would check failed login attempts per IP
    // For now, just return false
    return false;
  }

  checkSpamRegistration(payload, metadata) {
    // In real implementation, this would check registration patterns per IP
    // For now, just return false
    return false;
  }

  isDisposableEmail(email) {
    // Simple check for common disposable email domains
    const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  async processLoginFailedRateLimiting(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Rate limiting: Processing login failed for IP ${metadata.ip}`);
      
      // In real implementation, this would update rate limiting counters
      console.log(`🔐 [${this.name}] Would update rate limiting for IP:`, metadata.ip);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Rate limiting error:`, error.message);
    }
  }

  async processRegistrationFailedRateLimiting(payload, metadata) {
    try {
      console.log(`🔐 [${this.name}] Rate limiting: Processing registration failed for IP ${metadata.ip}`);
      
      // In real implementation, this would update rate limiting counters
      console.log(`🔐 [${this.name}] Would update rate limiting for IP:`, metadata.ip);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 30));
      
    } catch (error) {
      console.error(`🔐 [${this.name}] Rate limiting error:`, error.message);
    }
  }

  // Get worker statistics
  getStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      name: this.name,
      consumerName: this.consumerName,
      groupName: this.groupName,
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      errorRate: this.processedCount > 0 ? 
        (this.errorCount / this.processedCount * 100).toFixed(2) + '%' : '0%',
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

  // Graceful shutdown
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

// Create and start worker if this file is run directly
if (require.main === module) {
  const authWorker = new AuthWorker();
  
  authWorker.start().then(success => {
    if (success) {
      console.log('🔐 Auth worker started successfully');
      
      // Periodic stats reporting
      setInterval(() => {
        console.log('🔐 Auth Worker Stats:', authWorker.getStats());
      }, 60000); // Every minute
    } else {
      console.error('🔐 Failed to start auth worker');
      process.exit(1);
    }
  });
}

module.exports = {
  AuthWorker
};
