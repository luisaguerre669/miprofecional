// Real-time Service - Independent Module
// Handles all real-time and WebSocket business logic independently from HTTP layer

const { REALTIME_EVENTS, PROFESSIONAL_EVENTS } = require('../../events/eventTypes');
const eventEmitter = require('../../events/eventEmitter');

class RealtimeService {
  constructor() {
    this.connectedClients = new Map();
    this.professionalConnections = new Map();
    this.trackingSessions = new Map();
    this.setupEventHandlers();
  }

  // Setup event handlers for integration with other modules
  setupEventHandlers() {
    // Listen to professional events
    eventEmitter.on(PROFESSIONAL_EVENTS.LOCATION_UPDATED, (event) => {
      this.broadcastLocationUpdate(event.data);
    });

    eventEmitter.on(REALTIME_EVENTS.PROFESSIONAL_ONLINE, (event) => {
      this.handleProfessionalOnline(event.data);
    });

    eventEmitter.on(REALTIME_EVENTS.PROFESSIONAL_OFFLINE, (event) => {
      this.handleProfessionalOffline(event.data);
    });
  }

  // Handle new client connection
  handleConnection(socket) {
    const clientId = socket.id;
    const connectionInfo = {
      socket,
      connectedAt: new Date().toISOString(),
      userAgent: socket.handshake.headers['user-agent'],
      ip: socket.handshake.address,
      metadata: {}
    };

    this.connectedClients.set(clientId, connectionInfo);

    // Emit connection established event
    eventEmitter.emit(REALTIME_EVENTS.CONNECTION_ESTABLISHED, {
      clientId,
      userAgent: connectionInfo.userAgent,
      ip: connectionInfo.ip
    }, { source: 'realtime-service' });

    console.log(`🔌 Client connected: ${clientId}`);

    // Setup client-specific event handlers
    this.setupClientEventHandlers(socket);

    return connectionInfo;
  }

  // Setup event handlers for individual client
  setupClientEventHandlers(socket) {
    const clientId = socket.id;

    // Professional online event
    socket.on('professional-online', (data) => {
      this.handleProfessionalOnlineEvent(socket, data);
    });

    // Location update event
    socket.on('update-location', (data) => {
      this.handleLocationUpdateEvent(socket, data);
    });

    // Professional offline event
    socket.on('professional-offline', (data) => {
      this.handleProfessionalOfflineEvent(socket, data);
    });

    // Track professional event
    socket.on('track-professional', (data) => {
      this.handleTrackProfessionalEvent(socket, data);
    });

    // Stop tracking event
    socket.on('stop-tracking', (data) => {
      this.handleStopTrackingEvent(socket, data);
    });

    // Disconnect event
    socket.on('disconnect', () => {
      this.handleDisconnection(clientId);
    });
  }

  // Handle professional coming online
  handleProfessionalOnlineEvent(socket, data) {
    const { professionalId } = data;
    const clientId = socket.id;

    if (!professionalId) {
      socket.emit('error', {
        error: 'Missing professional ID',
        message: 'Professional ID is required'
      });
      return;
    }

    // Join professional to their own room
    socket.join(`professional-${professionalId}`);

    // Store professional connection info
    this.professionalConnections.set(professionalId, {
      socketId: clientId,
      socket,
      onlineSince: new Date().toISOString(),
      metadata: data.metadata || {}
    });

    // Update client metadata
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo) {
      clientInfo.metadata.professionalId = professionalId;
      clientInfo.metadata.type = 'professional';
    }

    // Emit professional online event
    eventEmitter.emit(REALTIME_EVENTS.PROFESSIONAL_ONLINE, {
      professionalId,
      socketId: clientId,
      onlineSince: new Date().toISOString()
    }, { source: 'realtime-service' });

    // Broadcast to all clients
    socket.broadcast.emit('professional-status-changed', {
      professionalId,
      status: 'online',
      timestamp: new Date().toISOString()
    });

    console.log(`👨‍💼 Professional online: ${professionalId} - ${clientId}`);

    // Send confirmation to professional
    socket.emit('professional-online-confirmed', {
      professionalId,
      status: 'online',
      timestamp: new Date().toISOString()
    });
  }

  // Handle location update event
  handleLocationUpdateEvent(socket, data) {
    const { professionalId, lat, lng } = data;
    const clientId = socket.id;

    // Validate coordinates
    if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      socket.emit('location-update-error', {
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
      return;
    }

    // Create GeoJSON location
    const location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    // Broadcast location update to all clients
    socket.broadcast.emit('professional-location-updated', {
      professionalId,
      location,
      timestamp: new Date().toISOString(),
      socketId: clientId
    });

    // Also send to tracking rooms
    this.io?.to(`tracking-${professionalId}`).emit('professional-location-updated', {
      professionalId,
      location,
      timestamp: new Date().toISOString(),
      source: 'realtime-broadcast'
    });

    console.log(`📍 Location update: ${professionalId} -> [${lat}, ${lng}]`);

    // Send confirmation to sender
    socket.emit('location-update-confirmed', {
      professionalId,
      location,
      timestamp: new Date().toISOString()
    });

    // Emit location updated event for other services
    eventEmitter.emit(PROFESSIONAL_EVENTS.LOCATION_UPDATED, {
      professionalId,
      location,
      source: 'websocket',
      timestamp: new Date().toISOString()
    }, { source: 'realtime-service' });
  }

  // Handle professional going offline
  handleProfessionalOfflineEvent(socket, data) {
    const { professionalId } = data;
    const clientId = socket.id;

    if (!professionalId) {
      socket.emit('error', {
        error: 'Missing professional ID',
        message: 'Professional ID is required'
      });
      return;
    }

    // Leave professional room
    socket.leave(`professional-${professionalId}`);

    // Remove from professional connections
    this.professionalConnections.delete(professionalId);

    // Update client metadata
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo) {
      clientInfo.metadata.professionalId = null;
      clientInfo.metadata.type = 'client';
    }

    // Emit professional offline event
    eventEmitter.emit(REALTIME_EVENTS.PROFESSIONAL_OFFLINE, {
      professionalId,
      socketId: clientId,
      offlineSince: new Date().toISOString()
    }, { source: 'realtime-service' });

    // Broadcast to all clients
    socket.broadcast.emit('professional-status-changed', {
      professionalId,
      status: 'offline',
      timestamp: new Date().toISOString()
    });

    console.log(`👨‍💼 Professional offline: ${professionalId} - ${clientId}`);

    // Send confirmation to professional
    socket.emit('professional-offline-confirmed', {
      professionalId,
      status: 'offline',
      timestamp: new Date().toISOString()
    });
  }

  // Handle track professional event
  handleTrackProfessionalEvent(socket, data) {
    const { professionalId } = data;
    const clientId = socket.id;

    if (!professionalId) {
      socket.emit('error', {
        error: 'Missing professional ID',
        message: 'Professional ID is required'
      });
      return;
    }

    // Join client to professional's tracking room
    socket.join(`tracking-${professionalId}`);

    // Track session
    if (!this.trackingSessions.has(professionalId)) {
      this.trackingSessions.set(professionalId, new Set());
    }
    this.trackingSessions.get(professionalId).add(clientId);

    // Update client metadata
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo) {
      clientInfo.metadata.tracking = clientInfo.metadata.tracking || [];
      clientInfo.metadata.tracking.push(professionalId);
    }

    // Emit tracking started event
    eventEmitter.emit(REALTIME_EVENTS.TRACKING_STARTED, {
      professionalId,
      clientId,
      timestamp: new Date().toISOString()
    }, { source: 'realtime-service' });

    console.log(`👀 Client ${clientId} tracking professional: ${professionalId}`);

    // Send confirmation to client
    socket.emit('tracking-started', {
      professionalId,
      message: 'Now tracking professional',
      timestamp: new Date().toISOString()
    });

    // Send current professional status if available
    const professionalConnection = this.professionalConnections.get(professionalId);
    if (professionalConnection) {
      socket.emit('professional-status-changed', {
        professionalId,
        status: 'online',
        timestamp: professionalConnection.onlineSince
      });
    }
  }

  // Handle stop tracking event
  handleStopTrackingEvent(socket, data) {
    const { professionalId } = data;
    const clientId = socket.id;

    if (!professionalId) {
      socket.emit('error', {
        error: 'Missing professional ID',
        message: 'Professional ID is required'
      });
      return;
    }

    // Leave tracking room
    socket.leave(`tracking-${professionalId}`);

    // Remove from tracking sessions
    if (this.trackingSessions.has(professionalId)) {
      this.trackingSessions.get(professionalId).delete(clientId);
      if (this.trackingSessions.get(professionalId).size === 0) {
        this.trackingSessions.delete(professionalId);
      }
    }

    // Update client metadata
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo && clientInfo.metadata.tracking) {
      clientInfo.metadata.tracking = clientInfo.metadata.tracking.filter(id => id !== professionalId);
    }

    // Emit tracking stopped event
    eventEmitter.emit(REALTIME_EVENTS.TRACKING_STOPPED, {
      professionalId,
      clientId,
      timestamp: new Date().toISOString()
    }, { source: 'realtime-service' });

    console.log(`🛑 Client ${clientId} stopped tracking: ${professionalId}`);

    // Send confirmation to client
    socket.emit('tracking-stopped', {
      professionalId,
      message: 'Stopped tracking professional',
      timestamp: new Date().toISOString()
    });
  }

  // Handle client disconnection
  handleDisconnection(clientId) {
    const clientInfo = this.connectedClients.get(clientId);
    
    if (!clientInfo) {
      console.log(`🔌 Unknown client disconnected: ${clientId}`);
      return;
    }

    // Clean up professional connections
    if (clientInfo.metadata.professionalId) {
      this.professionalConnections.delete(clientInfo.metadata.professionalId);
      
      // Broadcast professional offline
      clientInfo.socket?.broadcast?.emit('professional-status-changed', {
        professionalId: clientInfo.metadata.professionalId,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    }

    // Clean up tracking sessions
    if (clientInfo.metadata.tracking) {
      clientInfo.metadata.tracking.forEach(professionalId => {
        if (this.trackingSessions.has(professionalId)) {
          this.trackingSessions.get(professionalId).delete(clientId);
          if (this.trackingSessions.get(professionalId).size === 0) {
            this.trackingSessions.delete(professionalId);
          }
        }
      });
    }

    // Remove from connected clients
    this.connectedClients.delete(clientId);

    // Emit connection lost event
    eventEmitter.emit(REALTIME_EVENTS.CONNECTION_LOST, {
      clientId,
      disconnectedAt: new Date().toISOString(),
      sessionDuration: Date.now() - new Date(clientInfo.connectedAt).getTime()
    }, { source: 'realtime-service' });

    console.log(`🔌 Client disconnected: ${clientId}`);
  }

  // Broadcast location update (called by other services)
  broadcastLocationUpdate(locationData) {
    const { professionalId, location } = locationData;

    // Broadcast to all clients
    this.io?.emit('professional-location-updated', {
      professionalId,
      location,
      timestamp: new Date().toISOString(),
      source: 'service-broadcast'
    });

    // Also send to specific tracking room
    this.io?.to(`tracking-${professionalId}`).emit('professional-location-updated', {
      professionalId,
      location,
      timestamp: new Date().toISOString(),
      source: 'service-broadcast'
    });
  }

  // Get real-time statistics
  getRealtimeStats() {
    const onlineProfessionals = Array.from(this.professionalConnections.keys());
    const trackingSessions = {};
    
    this.trackingSessions.forEach((clients, professionalId) => {
      trackingSessions[professionalId] = {
        trackedBy: Array.from(clients),
        trackingCount: clients.size
      };
    });

    return {
      connectedClients: this.connectedClients.size,
      onlineProfessionals: onlineProfessionals.length,
      trackingSessions,
      professionalConnections: onlineProfessionals,
      uptime: process.uptime()
    };
  }

  // Get client information
  getClientInfo(clientId) {
    return this.connectedClients.get(clientId);
  }

  // Get professional connection info
  getProfessionalConnection(professionalId) {
    return this.professionalConnections.get(professionalId);
  }

  // Set IO instance (called by server setup)
  setIO(io) {
    this.io = io;
  }

  // Handle professional online (called by event system)
  handleProfessionalOnline(data) {
    const { professionalId, socketId } = data;
    
    // Update professional connections if not already set
    if (!this.professionalConnections.has(professionalId)) {
      const socket = this.connectedClients.get(socketId)?.socket;
      if (socket) {
        this.professionalConnections.set(professionalId, {
          socketId,
          socket,
          onlineSince: new Date().toISOString()
        });
      }
    }
  }

  // Handle professional offline (called by event system)
  handleProfessionalOffline(data) {
    const { professionalId } = data;
    this.professionalConnections.delete(professionalId);
  }
}

module.exports = new RealtimeService();
