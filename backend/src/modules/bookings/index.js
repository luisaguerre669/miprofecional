// Bookings Module Index - Module Entry Point
// Punto de entrada unificado para el módulo de bookings

console.log("📦 Bookings Module Index - Module Entry Point");

const { BookingsController } = require('./controller');
const { BookingsService } = require('./service');
const { BookingsRepository } = require('./repository');

// Create singleton instances
const bookingsController = new BookingsController();
const bookingsService = new BookingsService();
const bookingRepository = new BookingsRepository();

// Module exports
module.exports = {
  // Classes
  BookingsController,
  BookingsService,
  BookingsRepository,
  
  // Instances
  bookingsController,
  bookingsService,
  bookingRepository,
  
  // Module info
  moduleInfo: {
    name: 'bookings',
    version: '1.0.0',
    description: 'Modular bookings system with Soft Global Lock integration',
    components: ['controller', 'service', 'repository'],
    features: [
      'Soft Global Lock',
      'Event Versioning',
      'Idempotency',
      'Distributed Consistency',
      'Atomic Operations'
    ]
  }
};
