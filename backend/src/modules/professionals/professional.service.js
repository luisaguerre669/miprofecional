// Professional Service - Business Logic Layer
// Handles all professional business logic independently from HTTP layer

const Professional = require('../../models/Professional');
const logger = require('../../utils/logger');

class ProfessionalService {
  constructor() {
    this.validateCoordinates = this.validateCoordinates.bind(this);
    this.calculateDistance = this.calculateDistance.bind(this);
  }

  // Validate coordinates
  validateCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      const error = new Error('Latitude and longitude must be valid numbers');
      error.statusCode = 400;
      error.errorType = 'Invalid coordinates';
      throw error;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      const error = new Error('Latitude must be between -90 and 90, longitude between -180 and 180');
      error.statusCode = 400;
      error.errorType = 'Invalid coordinate range';
      throw error;
    }

    return { latitude, longitude };
  }

  // Calculate distance using haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  }

  // Get nearby professionals
  async getNearbyProfessionals(params) {
    const { lat, lng, maxDistance = 5000 } = params;

    // Validate required parameters
    if (!lat || !lng) {
      const error = new Error('Latitude and Longitude are required');
      error.statusCode = 400;
      error.errorType = 'Missing coordinates';
      throw error;
    }

    // Validate coordinates
    const { latitude, longitude } = this.validateCoordinates(lat, lng);

    // Validate distance
    const distance = parseInt(maxDistance);
    if (isNaN(distance) || distance <= 0) {
      const error = new Error('Max distance must be a positive number');
      error.statusCode = 400;
      error.errorType = 'Invalid distance';
      throw error;
    }

    if (distance > 50000) { // 50km max
      const error = new Error('Maximum search distance is 50km (50000 meters)');
      error.statusCode = 400;
      error.errorType = 'Distance too large';
      throw error;
    }

    console.log(`Searching for professionals near [${longitude}, ${latitude}] within ${distance}m`);

    // MongoDB Atlas geospatial query using $near
    const nearbyProfessionals = await Professional.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // [lng, lat] format for GeoJSON
          },
          $maxDistance: distance // Distance in meters
        }
      }
    })
    .select('businessName profession contact.phone location.address location.city location.state location.coordinates verification.isVerified stats.rating stats.reviewCount pricing.hourlyRate')
    .populate('categoryId', 'title')
    .limit(20); // Limit results for performance

    // Calculate distance for each professional
    const professionalsWithDistance = nearbyProfessionals.map(professional => {
      const professionalObj = professional.toObject();
      
      // Calculate distance using haversine formula
      const distanceInMeters = this.calculateDistance(
        latitude, 
        longitude, 
        professional.location.coordinates[1], 
        professional.location.coordinates[0]
      );

      professionalObj.distance = Math.round(distanceInMeters);
      professionalObj.distanceKm = (distanceInMeters / 1000).toFixed(2);
      
      return professionalObj;
    });

    // Sort by distance (closest first)
    professionalsWithDistance.sort((a, b) => a.distance - b.distance);

    return {
      professionals: professionalsWithDistance,
      search: {
        coordinates: { lat: latitude, lng: longitude },
        maxDistance: distance,
        totalFound: professionalsWithDistance.length
      }
    };
  }

  // Update professional location
  async updateLocation(professionalId, locationData, io) {
    const { lat, lng } = locationData;

    // Validate coordinates
    const { latitude, longitude } = this.validateCoordinates(lat, lng);

    // Update professional location in MongoDB Atlas
    const professional = await Professional.findByIdAndUpdate(
      professionalId,
      {
        $set: {
          'location.coordinates': [longitude, latitude], // [lng, lat] format
          'location.type': 'Point'
        }
      },
      { new: true }
    ).select('businessName profession location coordinates');

    if (!professional) {
      const error = new Error('Professional profile not found');
      error.statusCode = 404;
      error.errorType = 'Professional not found';
      throw error;
    }

    // Emit real-time location update if Socket.IO is available
    if (io) {
      const location = {
        type: "Point",
        coordinates: [longitude, latitude]
      };

      io.emit('professional-location-updated', {
        professionalId,
        location,
        timestamp: new Date().toISOString(),
        source: 'api_endpoint'
      });

      console.log(`📍 Ubicación actualizada via API: Profesional ${professionalId} -> [${latitude}, ${longitude}]`);
    }

    return {
      professionalId,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      timestamp: new Date().toISOString()
    };
  }

  // Search professionals
  async searchProfessionals(searchOptions) {
    const { q, categoryId, location, maxDistance = 50, minRating = 0, maxPrice, isVerified = false, limit = 20, page = 1 } = searchOptions;

    const options = {
      categoryId,
      location: location ? JSON.parse(location) : undefined,
      maxDistance: parseFloat(maxDistance),
      minRating: parseFloat(minRating),
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      isVerified: isVerified === 'true',
      limit: parseInt(limit),
      page: parseInt(page),
      sortBy: 'stats.rating',
      sortOrder: 'desc'
    };

    const professionals = await Professional.search(q, options);

    return {
      professionals,
      meta: {
        query: q,
        page: parseInt(page),
        limit: parseInt(limit),
        count: professionals.length
      }
    };
  }

  // Get featured professionals
  async getFeaturedProfessionals(limit = 6) {
    const limitNum = parseInt(limit) || 6;
    
    const professionals = await Professional.getFeatured(limitNum);

    return professionals;
  }

  // Get professional by ID
  async getProfessionalById(id) {
    const professional = await Professional.findById(id)
      .populate('categoryId', 'title')
      .populate('userId', 'name email phone avatar location');

    if (!professional) {
      const error = new Error('Professional with the specified ID was not found');
      error.statusCode = 404;
      error.errorType = 'Professional not found';
      throw error;
    }

    return professional;
  }

  // Get professional statistics
  async getProfessionalStats(id) {
    const professional = await Professional.findById(id);
    
    if (!professional) {
      const error = new Error('Professional with the specified ID was not found');
      error.statusCode = 404;
      error.errorType = 'Professional not found';
      throw error;
    }

    // Update stats if needed
    await professional.updateBookingStats();
    await professional.updateRating();

    const stats = {
      totalBookings: professional.stats.totalBookings,
      completedBookings: professional.stats.completedBookings,
      cancelledBookings: professional.stats.cancelledBookings,
      totalRevenue: professional.stats.totalRevenue,
      averageRating: professional.stats.rating,
      reviewCount: professional.stats.reviewCount,
      responseTime: professional.stats.responseTime,
      responseRate: professional.stats.responseRate,
      completionRate: professional.completionRate,
      cancellationRate: professional.cancellationRate,
      isTopRated: professional.isTopRated
    };

    return stats;
  }
}

module.exports = new ProfessionalService();
