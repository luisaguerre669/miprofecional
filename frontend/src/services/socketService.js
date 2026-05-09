import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  connect(token, userType = 'user', userId = null) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      query: {
        type: userType
      }
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.isConnected = true;
      
      // Join appropriate room based on user type
      if (userType === 'user' && userId) {
        this.socket.emit('join-user-room', userId);
      } else if (userType === 'professional' && userId) {
        this.socket.emit('join-professional-room', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Emit events
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Listen to events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Join user room
  joinUserRoom(userId) {
    this.emit('join-user-room', userId);
  }

  // Join professional room
  joinProfessionalRoom(professionalId) {
    this.emit('join-professional-room', professionalId);
  }

  // Notify about new booking
  notifyNewBooking(bookingData) {
    this.emit('new-booking', bookingData);
  }

  // Notify about booking status update
  notifyBookingStatusUpdate(bookingData) {
    this.emit('booking-status-updated', bookingData);
  }

  // Notify about availability update
  notifyAvailabilityUpdate(data) {
    this.emit('availability-updated', data);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
