// Bookings Repository - Data Access Layer
// Repositorio para acceso a datos de bookings con MongoDB

console.log("🗄️ Bookings Repository - Data Access Layer");

const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Professional = require('../../models/Professional');

class BookingsRepository {
  constructor() {
    this.name = 'bookings-repository';
    this.bookingModel = Booking;
    this.userModel = User;
    this.professionalModel = Professional;
  }

  /**
   * Find booking by ID
   */
  async findById(bookingId) {
    try {
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('user', 'name email phone')
        .populate('professional', 'businessName profession contact.phone location.city')
        .lean();

      return booking;
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding booking by ID:`, error);
      throw error;
    }
  }

  /**
   * Find bookings by user with pagination
   */
  async findByUser(userId, options = {}) {
    try {
      const { 
        status, 
        limit = 20, 
        skip = 0, 
        sortBy = 'date', 
        sortOrder = 'asc' 
      } = options;
      
      const query = { user: userId };
      
      if (status) {
        query.status = status;
      }
      
      // Get total count for pagination
      const total = await this.bookingModel.countDocuments(query);
      
      // Get bookings with pagination
      const bookings = await this.bookingModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .populate('professional', 'businessName profession contact.phone location.city')
        .populate('user', 'name email')
        .lean();

      return {
        bookings,
        total,
        hasMore: (skip + bookings.length) < total
      };

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding bookings by user:`, error);
      throw error;
    }
  }

  /**
   * Find bookings by professional with pagination
   */
  async findByProfessional(professionalId, options = {}) {
    try {
      const { 
        status, 
        limit = 20, 
        skip = 0, 
        sortBy = 'date', 
        sortOrder = 'asc' 
      } = options;
      
      const query = { professional: professionalId };
      
      if (status) {
        query.status = status;
      }
      
      // Get total count for pagination
      const total = await this.bookingModel.countDocuments(query);
      
      // Get bookings with pagination
      const bookings = await this.bookingModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone')
        .populate('professional', 'businessName profession')
        .lean();

      return {
        bookings,
        total,
        hasMore: (skip + bookings.length) < total
      };

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding bookings by professional:`, error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  async getStats(professionalId = null) {
    try {
      const matchStage = professionalId ? { professional: professionalId } : {};
      
      const stats = await this.bookingModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            pendingLockBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending_lock'] }, 1, 0] } },
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
        pendingLockBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        avgPrice: 0
      };

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error getting booking stats:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(options = {}) {
    try {
      const { professionalId, userId, limit = 10 } = options;
      
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
      
      const bookings = await this.bookingModel
        .find(query)
        .sort({ date: 1 })
        .limit(limit)
        .populate('professional', 'businessName profession contact.phone')
        .populate('user', 'name email')
        .lean();

      return bookings;

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error getting upcoming bookings:`, error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findUserById(userId) {
    try {
      const user = await this.userModel
        .findById(userId)
        .select('name email phone status')
        .lean();

      return user;
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding user by ID:`, error);
      throw error;
    }
  }

  /**
   * Find professional by ID
   */
  async findProfessionalById(professionalId) {
    try {
      const professional = await this.professionalModel
        .findById(professionalId)
        .select('businessName profession status location')
        .lean();

      return professional;
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding professional by ID:`, error);
      throw error;
    }
  }

  /**
   * Create booking (used by lock service)
   */
  async create(bookingData) {
    try {
      const booking = new this.bookingModel(bookingData);
      await booking.save();
      
      // Populate references
      await booking.populate('user', 'name email phone');
      await booking.populate('professional', 'businessName profession contact.phone location.city');
      
      return booking.toObject();
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error creating booking:`, error);
      throw error;
    }
  }

  /**
   * Update booking by ID
   */
  async updateById(bookingId, updateData) {
    try {
      const booking = await this.bookingModel
        .findByIdAndUpdate(bookingId, updateData, { new: true })
        .populate('user', 'name email phone')
        .populate('professional', 'businessName profession contact.phone location.city')
        .lean();

      return booking;
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error updating booking:`, error);
      throw error;
    }
  }

  /**
   * Find bookings with lock status
   */
  async findBookingsWithLocks(options = {}) {
    try {
      const { status, lockStatus, limit = 50, skip = 0 } = options;
      
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (lockStatus === 'locked') {
        query.lockId = { $exists: true };
        query.lockExpiresAt = { $gt: new Date() };
      } else if (lockStatus === 'expired') {
        query.lockId = { $exists: true };
        query.lockExpiresAt = { $lt: new Date() };
      }
      
      const bookings = await this.bookingModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('professional', 'businessName profession')
        .lean();

      return bookings;

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding bookings with locks:`, error);
      throw error;
    }
  }

  /**
   * Find expired lock bookings
   */
  async findExpiredLockBookings() {
    try {
      const bookings = await this.bookingModel
        .find({
          status: 'pending_lock',
          lockExpiresAt: { $lt: new Date() }
        })
        .populate('user', 'name email')
        .populate('professional', 'businessName profession')
        .lean();

      return bookings;

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding expired lock bookings:`, error);
      throw error;
    }
  }

  /**
   * Update multiple bookings
   */
  async updateMany(filter, updateData) {
    try {
      const result = await this.bookingModel.updateMany(filter, updateData);
      return result;
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error updating multiple bookings:`, error);
      throw error;
    }
  }

  /**
   * Count bookings by criteria
   */
  async countBookings(filter = {}) {
    try {
      const count = await this.bookingModel.countDocuments(filter);
      return count;
    } catch (error) {
      console.error(`🗄️ [${this.name}] Error counting bookings:`, error);
      throw error;
    }
  }

  /**
   * Find bookings by date range
   */
  async findByDateRange(options = {}) {
    try {
      const { 
        professionalId, 
        userId, 
        startDate, 
        endDate, 
        status, 
        limit = 100 
      } = options;
      
      const query = {};
      
      if (professionalId) {
        query.professional = professionalId;
      }
      
      if (userId) {
        query.user = userId;
      }
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) {
          query.date.$gte = new Date(startDate);
        }
        if (endDate) {
          query.date.$lte = new Date(endDate);
        }
      }
      
      if (status) {
        query.status = status;
      }
      
      const bookings = await this.bookingModel
        .find(query)
        .sort({ date: 1 })
        .limit(limit)
        .populate('user', 'name email')
        .populate('professional', 'businessName profession')
        .lean();

      return bookings;

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error finding bookings by date range:`, error);
      throw error;
    }
  }

  /**
   * Get booking analytics data
   */
  async getBookingAnalytics(options = {}) {
    try {
      const { professionalId, userId, period = '30d' } = options;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
      
      const matchStage = {
        date: { $gte: startDate, $lte: endDate }
      };
      
      if (professionalId) {
        matchStage.professional = professionalId;
      }
      
      if (userId) {
        matchStage.user = userId;
      }
      
      const analytics = await this.bookingModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            totalBookings: { $sum: 1 },
            confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
            cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalRevenue: { $sum: '$price' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
      
      return analytics;

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error getting booking analytics:`, error);
      throw error;
    }
  }

  /**
   * Search bookings
   */
  async searchBookings(searchOptions = {}) {
    try {
      const { 
        query, 
        userId, 
        professionalId, 
        status, 
        dateFrom, 
        dateTo, 
        limit = 50, 
        skip = 0 
      } = searchOptions;
      
      const filter = {};
      
      // Text search
      if (query) {
        filter.$or = [
          { 'service': { $regex: query, $options: 'i' } },
          { 'notes': { $regex: query, $options: 'i' } },
          { 'user.name': { $regex: query, $options: 'i' } },
          { 'professional.businessName': { $regex: query, $options: 'i' } }
        ];
      }
      
      if (userId) {
        filter.user = userId;
      }
      
      if (professionalId) {
        filter.professional = professionalId;
      }
      
      if (status) {
        filter.status = status;
      }
      
      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) {
          filter.date.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          filter.date.$lte = new Date(dateTo);
        }
      }
      
      const total = await this.bookingModel.countDocuments(filter);
      
      const bookings = await this.bookingModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone')
        .populate('professional', 'businessName profession contact.phone')
        .lean();

      return {
        bookings,
        total,
        hasMore: (skip + bookings.length) < total
      };

    } catch (error) {
      console.error(`🗄️ [${this.name}] Error searching bookings:`, error);
      throw error;
    }
  }

  /**
   * Get repository health status
   */
  async getHealthStatus() {
    try {
      const now = new Date();
      
      // Test database connection
      const testQuery = await this.bookingModel.findOne().limit(1).lean();
      
      // Get collection stats
      const stats = await this.bookingModel.stats();
      
      // Check recent activity
      const recentBookings = await this.bookingModel.countDocuments({
        createdAt: { $gte: new Date(now.getTime() - 5 * 60 * 1000) } // Last 5 minutes
      });
      
      // Check expired locks
      const expiredLocks = await this.bookingModel.countDocuments({
        status: 'pending_lock',
        lockExpiresAt: { $lt: now }
      });
      
      return {
        status: 'healthy',
        connected: true,
        collection: 'bookings',
        documentCount: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        recentActivity: recentBookings,
        expiredLocks: expiredLocks,
        indexes: stats.indexes,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create repository instance
const bookingRepository = new BookingsRepository();

module.exports = {
  BookingsRepository,
  bookingRepository
};
