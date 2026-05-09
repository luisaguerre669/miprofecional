// Modules Configuration - Centralized Module Management
// Centralizes all module configurations and dependencies for scalability

const authRoutes = require('../modules/auth/auth.routes');
const bookingRoutes = require('../modules/bookings/booking.routes');
const professionalRoutes = require('../modules/professionals/professional.routes');
const geolocationRoutes = require('../modules/geolocation/geolocation.routes');
const realtimeRoutes = require('../modules/realtime/realtime.routes');

const authService = require('../modules/auth/auth.service');
const bookingService = require('../modules/bookings/booking.service');
const professionalService = require('../modules/professionals/professional.service');
const geolocationService = require('../modules/geolocation/geolocation.service');
const realtimeService = require('../modules/realtime/realtime.service');

const eventEmitter = require('../events/eventEmitter');

// Module Registry - Centralized module management
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.routes = new Map();
    this.services = new Map();
    this.dependencies = new Map();
    this.initializeModules();
  }

  // Initialize all modules with their configurations
  initializeModules() {
    // Auth Module
    this.registerModule('auth', {
      name: 'Authentication Module',
      version: '1.0.0',
      description: 'Handles user authentication, registration, and profile management',
      routes: authRoutes,
      service: authService,
      dependencies: [],
      events: ['user.registered', 'user.logged.in', 'user.logged.out'],
      endpoints: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/refresh',
        'POST /api/auth/logout',
        'GET /api/auth/profile',
        'PUT /api/auth/profile'
      ]
    });

    // Bookings Module
    this.registerModule('bookings', {
      name: 'Bookings Module',
      version: '1.0.0',
      description: 'Handles booking creation, management, and status updates',
      routes: bookingRoutes,
      service: bookingService,
      dependencies: ['auth'],
      events: ['booking.created', 'booking.updated', 'booking.status.changed', 'booking.cancelled', 'booking.completed'],
      endpoints: [
        'POST /api/bookings',
        'GET /api/bookings',
        'GET /api/bookings/:id',
        'PUT /api/bookings/:id',
        'DELETE /api/bookings/:id',
        'GET /api/bookings/stats'
      ]
    });

    // Professionals Module
    this.registerModule('professionals', {
      name: 'Professionals Module',
      version: '1.0.0',
      description: 'Handles professional profiles, search, and location updates',
      routes: professionalRoutes,
      service: professionalService,
      dependencies: ['auth'],
      events: ['professional.location.updated', 'professional.status.changed', 'professional.profile.updated'],
      endpoints: [
        'GET /api/professionals/nearby',
        'PUT /api/professionals/location',
        'GET /api/professionals/search',
        'GET /api/professionals/featured',
        'GET /api/professionals/:id'
      ]
    });

    // Geolocation Module
    this.registerModule('geolocation', {
      name: 'Geolocation Module',
      version: '1.0.0',
      description: 'Handles location-based searches, distance calculations, and geographic operations',
      routes: geolocationRoutes,
      service: geolocationService,
      dependencies: [],
      events: ['geolocation.search.initiated', 'geolocation.search.completed', 'geolocation.distance.calculated'],
      endpoints: [
        'GET /api/geolocation/nearby',
        'GET /api/geolocation/distance',
        'GET /api/geolocation/area',
        'GET /api/geolocation/service-area/:professionalId',
        'GET /api/geolocation/check-service-area/:professionalId',
        'GET /api/geolocation/stats'
      ]
    });

    // Real-time Module
    this.registerModule('realtime', {
      name: 'Real-time Module',
      version: '1.0.0',
      description: 'Handles WebSocket connections, real-time tracking, and live updates',
      routes: realtimeRoutes,
      service: realtimeService,
      dependencies: [],
      events: ['realtime.professional.online', 'realtime.professional.offline', 'realtime.tracking.started', 'realtime.connection.established'],
      endpoints: [
        'GET /api/realtime/stats',
        'GET /api/realtime/clients/:clientId',
        'GET /api/realtime/professionals/:professionalId',
        'POST /api/realtime/broadcast'
      ]
    });
  }

  // Register a module
  registerModule(moduleId, config) {
    this.modules.set(moduleId, config);
    this.routes.set(moduleId, config.routes);
    this.services.set(moduleId, config.service);
    this.dependencies.set(moduleId, config.dependencies);
  }

  // Get module configuration
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  // Get all modules
  getAllModules() {
    return Array.from(this.modules.entries()).map(([id, config]) => ({ id, ...config }));
  }

  // Get module routes
  getModuleRoutes(moduleId) {
    return this.routes.get(moduleId);
  }

  // Get module service
  getModuleService(moduleId) {
    return this.services.get(moduleId);
  }

  // Get module dependencies
  getModuleDependencies(moduleId) {
    return this.dependencies.get(moduleId);
  }

  // Check if module dependencies are satisfied
  checkDependencies(moduleId) {
    const dependencies = this.getModuleDependencies(moduleId);
    return dependencies.every(dep => this.modules.has(dep));
  }

  // Get dependency order (topological sort)
  getDependencyOrder() {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (moduleId) => {
      if (visiting.has(moduleId)) {
        throw new Error(`Circular dependency detected involving module: ${moduleId}`);
      }
      
      if (visited.has(moduleId)) {
        return;
      }

      visiting.add(moduleId);
      
      const dependencies = this.getModuleDependencies(moduleId);
      dependencies.forEach(dep => visit(dep));
      
      visiting.delete(moduleId);
      visited.add(moduleId);
      order.push(moduleId);
    };

    this.modules.forEach((_, moduleId) => {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    });

    return order;
  }

  // Initialize modules in dependency order
  async initializeModules() {
    const order = this.getDependencyOrder();
    
    for (const moduleId of order) {
      const module = this.getModule(moduleId);
      console.log(`🔧 Initializing module: ${module.name}`);
      
      // Setup event listeners for the module
      if (module.events) {
        this.setupModuleEventListeners(moduleId, module.events);
      }
      
      console.log(`✅ Module initialized: ${module.name}`);
    }
  }

  // Setup event listeners for a module
  setupModuleEventListeners(moduleId, events) {
    const service = this.getModuleService(moduleId);
    
    events.forEach(eventType => {
      eventEmitter.on(eventType, (event) => {
        console.log(`📡 ${moduleId} received event: ${eventType}`);
        
        // Call service method if it exists
        if (service && typeof service[`on${eventType.split('.').pop().charAt(0).toUpperCase() + eventType.split('.').pop().slice(1)}`] === 'function') {
          service[`on${eventType.split('.').pop().charAt(0).toUpperCase() + eventType.split('.').pop().slice(1)}`](event);
        }
      });
    });
  }

  // Get module statistics
  getModuleStats() {
    const stats = {
      totalModules: this.modules.size,
      modules: [],
      totalEndpoints: 0,
      totalEvents: 0,
      dependencies: {}
    };

    this.modules.forEach((config, moduleId) => {
      const moduleInfo = {
        id: moduleId,
        name: config.name,
        version: config.version,
        endpoints: config.endpoints?.length || 0,
        events: config.events?.length || 0,
        dependencies: config.dependencies?.length || 0
      };

      stats.modules.push(moduleInfo);
      stats.totalEndpoints += moduleInfo.endpoints;
      stats.totalEvents += moduleInfo.events;
      
      config.dependencies?.forEach(dep => {
        stats.dependencies[dep] = (stats.dependencies[dep] || 0) + 1;
      });
    });

    return stats;
  }

  // Health check for all modules
  async healthCheck() {
    const results = {};
    
    for (const [moduleId, config] of this.modules) {
      try {
        const service = this.getModuleService(moduleId);
        
        // Check if service has health check method
        if (service && typeof service.healthCheck === 'function') {
          results[moduleId] = await service.healthCheck();
        } else {
          // Basic health check - module exists and is loaded
          results[moduleId] = {
            status: 'healthy',
            message: 'Module loaded successfully',
            version: config.version
          };
        }
      } catch (error) {
        results[moduleId] = {
          status: 'unhealthy',
          message: error.message,
          version: config.version
        };
      }
    }

    return results;
  }
}

// Module Loader - Handles dynamic module loading
class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
  }

  // Load a module dynamically
  async loadModule(modulePath) {
    try {
      const module = require(modulePath);
      this.loadedModules.add(modulePath);
      console.log(`📦 Module loaded: ${modulePath}`);
      return module;
    } catch (error) {
      console.error(`❌ Failed to load module ${modulePath}:`, error.message);
      throw error;
    }
  }

  // Unload a module
  unloadModule(modulePath) {
    if (this.loadedModules.has(modulePath)) {
      delete require.cache[require.resolve(modulePath)];
      this.loadedModules.delete(modulePath);
      console.log(`📦 Module unloaded: ${modulePath}`);
    }
  }

  // Get loaded modules
  getLoadedModules() {
    return Array.from(this.loadedModules);
  }
}

// Create singleton instances
const moduleRegistry = new ModuleRegistry();
const moduleLoader = new ModuleLoader();

// Setup event listeners for services
eventEmitter.setupBookingListeners(bookingService);
eventEmitter.setupProfessionalListeners(professionalService);

module.exports = {
  moduleRegistry,
  moduleLoader,
  // Export individual modules for backward compatibility
  authRoutes,
  bookingRoutes,
  professionalRoutes,
  geolocationRoutes,
  realtimeRoutes,
  authService,
  bookingService,
  professionalService,
  geolocationService,
  realtimeService
};
