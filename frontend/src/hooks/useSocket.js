import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import socketService from '../services/socketService';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      return;
    }

    const token = localStorage.getItem('token');
    const userType = user.role === 'professional' ? 'professional' : 'user';
    const userId = user._id;

    // Connect to socket
    socketService.connect(token, userType, userId);

    // Listen to connection events
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket connected successfully');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    // Listen to booking notifications
    const handleBookingReceived = (data) => {
      console.log('New booking received:', data);
      setNotifications(prev => [data, ...prev]);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nueva Reserva', {
          body: data.message,
          icon: '/favicon.ico'
        });
      }
    };

    const handleBookingStatusChanged = (data) => {
      console.log('Booking status changed:', data);
      setNotifications(prev => [data, ...prev]);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Estado de Reserva Actualizado', {
          body: data.message,
          icon: '/favicon.ico'
        });
      }
    };

    const handleAvailabilityChanged = (data) => {
      console.log('Availability changed:', data);
      setNotifications(prev => [data, ...prev]);
    };

    // Register event listeners
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      if (userType === 'professional') {
        socket.on('booking-received', handleBookingReceived);
      }
      
      socket.on('booking-status-changed', handleBookingStatusChanged);
      socket.on('availability-changed', handleAvailabilityChanged);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('booking-received', handleBookingReceived);
        socket.off('booking-status-changed', handleBookingStatusChanged);
        socket.off('availability-changed', handleAvailabilityChanged);
      }
    };
  }, [isAuthenticated, user]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Send booking notification
  const notifyNewBooking = useCallback((bookingData) => {
    socketService.notifyNewBooking(bookingData);
  }, []);

  // Send booking status update
  const notifyBookingStatusUpdate = useCallback((bookingData) => {
    socketService.notifyBookingStatusUpdate(bookingData);
  }, []);

  // Send availability update
  const notifyAvailabilityUpdate = useCallback((data) => {
    socketService.notifyAvailabilityUpdate(data);
  }, []);

  return {
    isConnected,
    notifications,
    clearNotifications,
    removeNotification,
    notifyNewBooking,
    notifyBookingStatusUpdate,
    notifyAvailabilityUpdate
  };
};
