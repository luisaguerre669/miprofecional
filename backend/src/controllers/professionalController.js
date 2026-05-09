// Professional Controller for MiProfesional Backend

const Professional = require('../models/Professional');

// Get nearby professionals by location
const getNearbyProfessionals = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing coordinates',
        message: 'Latitude (lat) and Longitude (lng) are required'
      });
    }

    // Parse and validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const distance = parseInt(maxDistance);

    // Validate coordinate ranges
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinate range',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Validate distance
    if (isNaN(distance) || distance <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid distance',
        message: 'Max distance must be a positive number'
      });
    }

    if (distance > 50000) { // 50km max
      return res.status(400).json({
        success: false,
        error: 'Distance too large',
        message: 'Maximum search distance is 50km (50000 meters)'
      });
    }

    console.log(`Searching for professionals near [${longitude}, ${latitude}] within ${distance}m`);

    // MongoDB Atlas geospatial query using $near with optimized performance
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
    .select('businessName profession contact.phone location.address location.city location.state location.coordinates verification.isVerified verification.verificationStatus accountType profileImage stats.rating stats.reviewCount pricing.hourlyRate')
    .populate('categoryId', 'title')
    .limit(20) // Limit results for performance
    .lean(); // Use lean for better performance

    // Calculate distance for each professional (in meters) - optimized for lean()
    const professionalsWithDistance = nearbyProfessionals.map(professional => {
      // Calculate distance using haversine formula
      const R = 6371000; // Earth's radius in meters
      const lat1 = latitude * Math.PI / 180;
      const lat2 = professional.location.coordinates[1] * Math.PI / 180;
      const deltaLat = (professional.location.coordinates[1] - latitude) * Math.PI / 180;
      const deltaLng = (professional.location.coordinates[0] - longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceInMeters = R * c;

      // Add distance fields to lean object
      professional.distance = Math.round(distanceInMeters);
      professional.distanceKm = (distanceInMeters / 1000).toFixed(2);
      
      return professional;
    });

    // Sort by distance (closest first)
    professionalsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      message: 'Nearby professionals retrieved successfully',
      data: {
        professionals: professionalsWithDistance,
        search: {
          coordinates: { lat: latitude, lng: longitude },
          maxDistance: distance,
          totalFound: professionalsWithDistance.length
        }
      }
    });

  } catch (error) {
    console.error('Get nearby professionals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nearby professionals',
      message: 'An error occurred while searching for nearby professionals'
    });
  }
};

// Update professional location (protected endpoint)
const updateProfessionalLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Validate required coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing coordinates',
        message: 'Latitude (lat) and Longitude (lng) are required'
      });
    }

    // Parse and validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinate ranges
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinate range',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Get professional ID from authenticated user
    // Note: This assumes the authenticated user is a professional
    // In a real implementation, you would verify this
    const professionalId = req.usuario.id;

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
    ).select('businessName profession location coordinates verification.isVerified verification.verificationStatus accountType profileImage');

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional profile not found'
      });
    }

    // Get Socket.IO instance from app
    const io = req.app.get('io');
    
    if (io) {
      // Create GeoJSON location for real-time broadcast
      const location = {
        type: "Point",
        coordinates: [longitude, latitude]
      };

      // Emit real-time location update to all clients
      io.emit('professional-location-updated', {
        professionalId,
        location,
        timestamp: new Date().toISOString(),
        source: 'api_endpoint'
      });

      console.log(`📍 Ubación actualizada via API: Profesional ${professionalId} -> [${latitude}, ${longitude}]`);
    }

    // Emit professional location updated event (event-driven architecture)
    const { eventSystem } = require('../events');
    eventSystem.emitProfessionalLocationUpdated(
      professionalId,
      { lat: latitude, lng: longitude },
      professional.location.coordinates ? { 
        lat: professional.location.coordinates[1], 
        lng: professional.location.coordinates[0] 
      } : null,
      { ip: req.ip, userAgent: req.get('User-Agent') }
    ).catch(eventError => {
      // Event emission should not block the response
      console.error('Event emission error:', eventError);
    });

    res.json({
      success: true,
      message: 'Professional location updated successfully',
      data: {
        professionalId,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update professional location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
      message: 'An error occurred while updating professional location'
    });
  }
};

module.exports = {
  getNearbyProfessionals,
  updateProfessionalLocation
};
