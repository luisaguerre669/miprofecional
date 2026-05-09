// Booking Model for MiProfesional Backend

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: [true, 'Professional ID is required']
  },
  service: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [200, 'Service name cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Booking date must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending_lock', 'pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending_lock',
    required: true
  },
  // Event Versioning for Distributed Consistency
  version: {
    type: Number,
    default: 1,
    required: true,
    min: [1, 'Version must be at least 1']
  },
  // Soft Global Lock Fields
  lockId: {
    type: String,
    default: null,
    sparse: true
  },
  lockExpiresAt: {
    type: Date,
    default: null
  },
  // Idempotency Key
  requestId: {
    type: String,
    default: null,
    sparse: true
  },
  // Event Ordering
  eventId: {
    type: String,
    default: null,
    sparse: true
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ professional: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ user: 1, professional: 1 });
bookingSchema.index({ professional: 1, date: 1 });
bookingSchema.index({ professional: 1, status: 1 });

// Optimized MongoDB Indexes for Production Performance

// Core query indexes - most frequently used queries
bookingSchema.index({ user: 1, date: -1 }); // User bookings list
bookingSchema.index({ professional: 1, date: 1 }); // Professional availability check
bookingSchema.index({ professional: 1, date: 1, status: 1 }); // Atomic conflict detection
bookingSchema.index({ status: 1, date: -1 }); // Status-based queries

// Soft Global Lock Indexes (sparse for efficiency)
bookingSchema.index({ lockId: 1 }, { sparse: true, name: 'idx_lockId' });
bookingSchema.index({ lockExpiresAt: 1 }, { sparse: true, name: 'idx_lockExpiresAt' });
bookingSchema.index({ status: 1, lockExpiresAt: 1 }, { name: 'idx_status_lockExpiresAt' });

// Event Versioning Indexes (sparse for efficiency)
bookingSchema.index({ version: 1 }, { name: 'idx_version' });
bookingSchema.index({ eventId: 1 }, { sparse: true, name: 'idx_eventId' });
bookingSchema.index({ requestId: 1 }, { sparse: true, name: 'idx_requestId' });
bookingSchema.index({ professional: 1, date: 1, version: 1 }, { name: 'idx_professional_date_version' });

// Optimized compound indexes for common query patterns
bookingSchema.index({ user: 1, status: 1, date: -1 }, { name: 'idx_user_status_date' });
bookingSchema.index({ professional: 1, status: 1, date: 1 }, { name: 'idx_professional_status_date' });
bookingSchema.index({ date: 1, status: 1 }, { name: 'idx_date_status' });

// TTL index for expired locks (automatic cleanup)
bookingSchema.index(
  { lockExpiresAt: 1 }, 
  { 
    expireAfterSeconds: 0, 
    sparse: true, 
    name: 'idx_lockExpiresAt_ttl',
    partialFilterExpression: { status: 'pending_lock' }
  }
);

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Ensure date is in the future
  if (this.date <= new Date()) {
    return next(new Error('Booking date must be in the future'));
  }
  next();
});

// Instance methods
bookingSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.version += 1;
  this.lockId = null;
  this.lockExpiresAt = null;
  return this.save();
};

bookingSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.version += 1;
  this.lockId = null;
  this.lockExpiresAt = null;
  return this.save();
};

bookingSchema.methods.complete = function() {
  this.status = 'completed';
  this.version += 1;
  this.lockId = null;
  this.lockExpiresAt = null;
  return this.save();
};

// Soft Global Lock Methods
bookingSchema.methods.acquireLock = function(lockId, ttlSeconds = 10) {
  this.status = 'pending_lock';
  this.lockId = lockId;
  this.lockExpiresAt = new Date(Date.now() + (ttlSeconds * 1000));
  this.version += 1;
  return this.save();
};

bookingSchema.methods.releaseLock = function() {
  this.lockId = null;
  this.lockExpiresAt = null;
  this.version += 1;
  return this.save();
};

bookingSchema.methods.isLockExpired = function() {
  return this.lockExpiresAt && this.lockExpiresAt < new Date();
};

bookingSchema.methods.isLocked = function() {
  return this.lockId && this.lockExpiresAt && this.lockExpiresAt > new Date();
};

bookingSchema.methods.canTransitionTo = function(newStatus) {
  // Define valid transitions
  const validTransitions = {
    'pending_lock': ['pending', 'cancelled'],
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'cancelled': [],
    'completed': []
  };
  
  return validTransitions[this.status]?.includes(newStatus) || false;
};

// Event Versioning Methods
bookingSchema.methods.applyEvent = function(event) {
  // Only apply event if version is newer
  if (event.version <= this.version) {
    return false; // Event is outdated
  }
  
  // Apply event based on type
  switch (event.type) {
    case 'BOOKING_CREATED':
      this.status = 'pending';
      break;
    case 'BOOKING_CONFIRMED':
      if (this.canTransitionTo('confirmed')) {
        this.status = 'confirmed';
      }
      break;
    case 'BOOKING_CANCELLED':
      if (this.canTransitionTo('cancelled')) {
        this.status = 'cancelled';
      }
      break;
    case 'BOOKING_COMPLETED':
      if (this.canTransitionTo('completed')) {
        this.status = 'completed';
      }
      break;
    default:
      return false; // Unknown event type
  }
  
  this.version = event.version;
  this.eventId = event.eventId;
  
  return true;
};

// Static methods
bookingSchema.statics.findByUser = function(userId, options = {}) {
  const { status, limit = 20, skip = 0, sortBy = 'date', sortOrder = 'asc' } = options;
  
  const query = { user: userId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('professional', 'businessName profession contact.phone location.city')
    .populate('user', 'name email');
};

bookingSchema.statics.findByProfessional = function(professionalId, options = {}) {
  const { status, limit = 20, skip = 0, sortBy = 'date', sortOrder = 'asc' } = options;
  
  const query = { professional: professionalId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email phone')
    .populate('professional', 'businessName profession');
};

bookingSchema.statics.getStats = async function(professionalId = null) {
  const matchStage = professionalId ? { professional: professionalId } : {};
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalRevenue: { $sum: '$price' },
        avgPrice: { $avg: '$price' }
      }
    }
  ]);
  
  return stats[0] || {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    avgPrice: 0
  };
};

bookingSchema.statics.getUpcomingBookings = function(professionalId = null, userId = null, limit = 10) {
  const query = {
    date: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };
  
  if (professionalId) {
    query.professional = professionalId;
  }
  
  if (userId) {
    query.user = userId;
  }
  
  return this.find(query)
    .sort({ date: 1 })
    .limit(limit)
    .populate('professional', 'businessName profession contact.phone')
    .populate('user', 'name email');
};

// Soft Global Lock Static Methods
bookingSchema.statics.checkSlotAvailability = async function(professionalId, date, duration = 60) {
  const startTime = new Date(date);
  const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
  
  // Check for existing bookings that would conflict
  const conflictingBookings = await this.find({
    professional: professionalId,
    $or: [
      {
        date: { $gte: startTime, $lt: endTime }
      },
      {
        date: { $lt: startTime },
        $expr: { $lt: [{ $add: ['$date', { $multiply: [60 * 60 * 1000, 1] }] }, endTime] }
      }
    ],
    status: { $in: ['pending_lock', 'pending', 'confirmed'] }
  });
  
  return conflictingBookings.length === 0;
};

bookingSchema.statics.atomicCreateBooking = async function(bookingData, lockId) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Step 1: Check slot availability atomically
      const isAvailable = await this.checkSlotAvailability(
        bookingData.professional, 
        bookingData.date
      );
      
      if (!isAvailable) {
        throw new Error('Slot not available - conflicting booking exists');
      }
      
      // Step 2: Create booking with lock
      const booking = new this({
        ...bookingData,
        status: 'pending_lock',
        lockId,
        lockExpiresAt: new Date(Date.now() + (10 * 1000)), // 10 seconds TTL
        version: 1
      });
      
      await booking.save({ session });
      
      return booking;
    });
  } finally {
    await session.endSession();
  }
};

bookingSchema.statics.findByLockId = function(lockId) {
  return this.findOne({ lockId });
};

bookingSchema.statics.findExpiredLocks = function() {
  return this.find({
    status: 'pending_lock',
    lockExpiresAt: { $lt: new Date() }
  });
};

bookingSchema.statics.cleanupExpiredLocks = async function() {
  const expiredBookings = await this.findExpiredLocks();
  const results = [];
  
  for (const booking of expiredBookings) {
    try {
      booking.status = 'cancelled';
      booking.version += 1;
      booking.lockId = null;
      booking.lockExpiresAt = null;
      await booking.save();
      
      results.push({
        bookingId: booking._id,
        previousStatus: 'pending_lock',
        newStatus: 'cancelled'
      });
    } catch (error) {
      console.error(`Failed to cleanup expired lock for booking ${booking._id}:`, error);
    }
  }
  
  return results;
};

// Event Versioning Static Methods
bookingSchema.statics.findByEventId = function(eventId) {
  return this.findOne({ eventId });
};

bookingSchema.statics.findByRequestId = function(requestId) {
  return this.findOne({ requestId });
};

bookingSchema.statics.getEventHistory = function(bookingId) {
  return this.findById(bookingId)
    .select('version eventId status createdAt updatedAt')
    .sort({ version: 1 });
};

bookingSchema.statics.applyEventVersioned = async function(bookingId, event) {
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      const booking = await this.findById(bookingId).session(session);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Check version conflict
      if (event.version <= booking.version) {
        return {
          success: false,
          reason: 'Event version is outdated',
          currentVersion: booking.version,
          eventVersion: event.version
        };
      }
      
      // Apply event
      const applied = booking.applyEvent(event);
      
      if (applied) {
        await booking.save({ session });
        return {
          success: true,
          bookingId: booking._id,
          previousVersion: booking.version - 1,
          newVersion: booking.version,
          newStatus: booking.status
        };
      } else {
        return {
          success: false,
          reason: 'Invalid event transition',
          currentStatus: booking.status,
          eventType: event.type
        };
      }
    });
    
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = mongoose.model('Booking', bookingSchema);
