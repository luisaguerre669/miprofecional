// Geolocation Service - Independent Module
// Handles all geolocation business logic independently from HTTP layer

const Professional = require('../../models/Professional');
const eventEmitter = require('../../events/eventEmitter');
const { GEOLOCATION_EVENTS } = require('../../events/eventTypes');

class GeolocationService {
  constructor() {
    this.validateCoordinates = this.validateCoordinates.bind(this);
    this.calculateDistance = this.calculateDistance.bind(this);
    this.createGeoJSONLocation = this.createGeoJSONLocation.bind(this);
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

  // Create GeoJSON location object
  createGeoJSONLocation(longitude, latitude) {
    return {
      type: 'Point',
      coordinates: [longitude, latitude] // [lng, lat] format for GeoJSON
    };
  }

  // Calculate distance using haversine formula (in meters)
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

  // Convert meters to kilometers
  metersToKilometers(meters) {
    return {
      meters: Math.round(meters),
      kilometers: (meters / 1000).toFixed(2)
    };
  }

  // Find nearby professionals using MongoDB Atlas geospatial query
  async findNearbyProfessionals(params) {
    const { lat, lng, maxDistance = 5000, categoryId, minRating = 0, isVerified = false, limit = 20 } = params;

    // Validate required parameters
    if (!lat || !lng) {
      const error = new Error('Latitude and Longitude are required');
      error.statusCode = 400;
      error.errorType = 'Missing coordinates';
      throw error;
    }

    // Validate coordinates
    const { latitude, longitude } = this.validateCoordinates(lat, lng);

    // Validate and parse distance
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

    // Emit search initiated event
    eventEmitter.emit(GEOLOCATION_EVENTS.LOCATION_SEARCH_INITIATED, {
      coordinates: { lat: latitude, lng: longitude },
      maxDistance: distance,
      filters: { categoryId, minRating, isVerified }
    }, { source: 'geolocation-service' });

    console.log(`🔍 Searching for professionals near [${longitude}, ${latitude}] within ${distance}m`);

    // Build query
    const query = {
      isActive: true,
      location: {
        $near: {
          $geometry: this.createGeoJSONLocation(longitude, latitude),
          $maxDistance: distance
        }
      }
    };

    // Add optional filters
    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (minRating > 0) {
      query['stats.rating'] = { $gte: minRating };
    }

    if (isVerified) {
      query['verification.isVerified'] = true;
    }

    // Execute query
    const nearbyProfessionals = await Professional.find(query)
      .select('businessName profession contact.phone location.address location.city location.state location.coordinates verification.isVerified stats.rating stats.reviewCount pricing.hourlyRate categoryId')
      .populate('categoryId', 'title')
      .limit(parseInt(limit));

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

      const distanceInfo = this.metersToKilometers(distanceInMeters);
      
      return {
        ...professionalObj,
        ...distanceInfo
      };
    });

    // Sort by distance (closest first)
    professionalsWithDistance.sort((a, b) => a.meters - b.meters);

    // Emit search completed event
    eventEmitter.emit(GEOLOCATION_EVENTS.LOCATION_SEARCH_COMPLETED, {
      coordinates: { lat: latitude, lng: longitude },
      maxDistance: distance,
      resultsCount: professionalsWithDistance.length,
      executionTime: Date.now()
    }, { source: 'geolocation-service' });

    return {
      professionals: professionalsWithDistance,
      search: {
        coordinates: { lat: latitude, lng: longitude },
        maxDistance: distance,
        totalFound: professionalsWithDistance.length,
        filters: { categoryId, minRating, isVerified }
      },
      performance: {
        queryTime: Date.now(),
        resultsCount: professionalsWithDistance.length
      }
    };
  }

  // Calculate distance between two points
  calculateDistanceBetweenPoints(point1, point2) {
    const { lat: lat1, lng: lng1 } = point1;
    const { lat: lat2, lng: lng2 } = point2;

    // Validate coordinates
    this.validateCoordinates(lat1, lng1);
    this.validateCoordinates(lat2, lng2);

    const distanceInMeters = this.calculateDistance(
      parseFloat(lat1), 
      parseFloat(lng1), 
      parseFloat(lat2), 
      parseFloat(lng2)
    );

    return this.metersToKilometers(distanceInMeters);
  }

  // Find professionals within a specific area (bounding box)
  findProfessionalsInArea(bounds, options = {}) {
    const { 
      northEast: { lat: neLat, lng: neLng }, 
      southWest: { lat: swLat, lng: swLng } 
    } = bounds;

    // Validate bounds
    this.validateCoordinates(neLat, neLng);
    this.validateCoordinates(swLat, swLng);

    if (swLat >= neLat || swLng >= neLng) {
      const error = new Error('Invalid bounding box coordinates');
      error.statusCode = 400;
      error.errorType = 'Invalid bounds';
      throw error;
    }

    // Build bounding box query
    const query = {
      isActive: true,
      'location.coordinates': {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)], // Southwest corner
            [parseFloat(neLng), parseFloat(neLat)]  // Northeast corner
          ]
        }
      }
    };

    // Add optional filters
    if (options.categoryId) {
      query.categoryId = options.categoryId;
    }

    if (options.minRating > 0) {
      query['stats.rating'] = { $gte: options.minRating };
    }

    if (options.isVerified) {
      query['verification.isVerified'] = true;
    }

    return Professional.find(query)
      .select('businessName profession location.coordinates verification.isVerified stats.rating')
      .populate('categoryId', 'title')
      .limit(options.limit || 50);
  }

  // Get professional's service area (based on their location and service radius)
  async getProfessionalServiceArea(professionalId) {
    const professional = await Professional.findById(professionalId)
      .select('businessName location location.serviceRadius');

    if (!professional) {
      const error = new Error('Professional not found');
      error.statusCode = 404;
      error.errorType = 'Professional not found';
      throw error;
    }

    const { coordinates } = professional.location;
    const serviceRadius = professional.location.serviceRadius || 50; // Default 50km

    return {
      professionalId: professional._id,
      businessName: professional.businessName,
      center: {
        lat: coordinates[1],
        lng: coordinates[0]
      },
      serviceRadius: {
        kilometers: serviceRadius,
        meters: serviceRadius * 1000
      },
      coverageArea: {
        type: 'Circle',
        coordinates: coordinates,
        radius: serviceRadius * 1000 // in meters
      }
    };
  }

  // Check if a point is within a professional's service area
  async isPointInServiceArea(professionalId, point) {
    const { lat, lng } = point;
    
    // Validate coordinates
    this.validateCoordinates(lat, lng);

    const serviceArea = await this.getProfessionalServiceArea(professionalId);
    const distance = this.calculateDistance(
      serviceArea.center.lat,
      serviceArea.center.lng,
      parseFloat(lat),
      parseFloat(lng)
    );

    const isInArea = distance <= serviceArea.serviceRadius.meters;

    // Emit distance calculated event
    eventEmitter.emit(GEOLOCATION_EVENTS.DISTANCE_CALCULATED, {
      professionalId,
      point: { lat, lng },
      distance: this.metersToKilometers(distance),
      isInServiceArea: isInArea
    }, { source: 'geolocation-service' });

    return {
      isInServiceArea: isInArea,
      distance: this.metersToKilometers(distance),
      serviceRadius: serviceArea.serviceRadius
    };
  }

  // Get geolocation statistics
  getGeolocationStats() {
    return {
      supportedQueries: [
        'nearby-professionals',
        'distance-calculation',
        'area-search',
        'service-area-check'
      ],
      maxSearchDistance: 50000, // 50km
      coordinateValidation: {
        latitudeRange: [-90, 90],
        longitudeRange: [-180, 180]
      },
      performanceMetrics: {
        maxResults: 20,
        defaultRadius: 5000, // 5km
        indexingStrategy: '2dsphere'
      }
    };
  }
}

module.exports = new GeolocationService();
