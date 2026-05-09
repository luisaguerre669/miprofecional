const socketHandler = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins their personal room
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      connectedUsers.set(socket.id, { userId, type: 'user' });
      console.log(`User ${userId} joined their room`);
    });

    // Professional joins their personal room
    socket.on('join-professional-room', (professionalId) => {
      socket.join(`professional-${professionalId}`);
      connectedUsers.set(socket.id, { professionalId, type: 'professional' });
      console.log(`Professional ${professionalId} joined their room`);
    });

    // Handle new booking notification
    socket.on('new-booking', (bookingData) => {
      // Notify the professional about the new booking
      io.to(`professional-${bookingData.professional}`).emit('booking-received', {
        type: 'new_booking',
        booking: bookingData,
        message: `Nueva reserva de ${bookingData.userName} para ${bookingData.service}`,
        timestamp: new Date()
      });
    });

    // Handle booking status update
    socket.on('booking-status-updated', (bookingData) => {
      // Notify the user about the status change
      io.to(`user-${bookingData.user}`).emit('booking-status-changed', {
        type: 'status_change',
        booking: bookingData,
        message: getStatusMessage(bookingData.status),
        timestamp: new Date()
      });

      // Also notify the professional if they're not the one who made the change
      if (socket.handshake.query.type !== 'professional') {
        io.to(`professional-${bookingData.professional}`).emit('booking-status-changed', {
          type: 'status_change',
          booking: bookingData,
          message: getStatusMessage(bookingData.status),
          timestamp: new Date()
        });
      }
    });

    // Handle availability update
    socket.on('availability-updated', (data) => {
      io.to(`professional-${data.professionalId}`).emit('availability-changed', {
        type: 'availability_change',
        availability: data.availability,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        console.log(`User disconnected: ${socket.id}`);
        connectedUsers.delete(socket.id);
      }
    });
  });

  // Helper function to get status message
  function getStatusMessage(status) {
    switch (status) {
      case 'confirmed':
        return '¡Tu reserva ha sido confirmada!';
      case 'cancelled':
        return 'Tu reserva ha sido cancelada';
      case 'completed':
        return 'Tu reserva ha sido completada';
      case 'pending':
        return 'Tu reserva está pendiente de confirmación';
      default:
        return 'El estado de tu reserva ha cambiado';
    }
  }

  return io;
};

module.exports = socketHandler;
