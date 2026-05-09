// Geolocation Controller - Modular Architecture Preparation
// Handles HTTP requests/responses only - Business logic in service layer

const geolocationService = require('./geolocation.service');
const { query, validationResult } = require('express-validator');

const geolocationController = {
  // Validation middleware
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        errors: errors.array()
      });
    }
    next();
  },

  // GET /api/geolocation/nearby - Find nearby professionals
  getNearbyProfessionals: async (req, res) => {
    try {
      const searchParams = {
        ...req.query
      };
      
      const result = await geolocationService.findNearbyProfessionals(searchParams);
      
      res.json({
        success: true,
        message: 'Nearby professionals retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve nearby professionals',
        message: error.message
      });
    }
  },

  // GET /api/geolocation/distance - Calculate distance between two points
  calculateDistance: async (req, res) => {
    try {
      const { lat1, lng1, lat2, lng2 } = req.query;
      
      const result = geolocationService.calculateDistanceBetweenPoints(
        { lat: lat1, lng: lng1 },
        { lat: lat2, lng: lng2 }
      );
      
      res.json({
        success: true,
        message: 'Distance calculated successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to calculate distance',
        message: error.message
      });
    }
  },

  // GET /api/geolocation/area - Find professionals in area
  findProfessionalsInArea: async (req, res) => {
    try {
      const { 
        northEastLat, northEastLng, 
        southWestLat, southWestLng,
        categoryId, minRating, isVerified, limit 
      } = req.query;

      const bounds = {
        northEast: { lat: northEastLat, lng: northEastLng },
        southWest: { lat: southWestLat, lng: southWestLng }
      };

      const options = { categoryId, minRating, isVerified, limit };
      
      const result = await geolocationService.findProfessionalsInArea(bounds, options);
      
      res.json({
        success: true,
        message: 'Professionals in area retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve professionals in area',
        message: error.message
      });
    }
  },

  // GET /api/geolocation/service-area/:professionalId - Get professional service area
  getProfessionalServiceArea: async (req, res) => {
    try {
      const { professionalId } = req.params;
      
      const result = await geolocationService.getProfessionalServiceArea(professionalId);
      
      res.json({
        success: true,
        message: 'Professional service area retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve service area',
        message: error.message
      });
    }
  },

  // GET /api/geolocation/check-service-area/:professionalId - Check if point is in service area
  checkServiceArea: async (req, res) => {
    try {
      const { professionalId } = req.params;
      const { lat, lng } = req.query;
      
      const result = await geolocationService.isPointInServiceArea(
        professionalId, 
        { lat, lng }
      );
      
      res.json({
        success: true,
        message: 'Service area check completed successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to check service area',
        message: error.message
      });
    }
  },

  // GET /api/geolocation/stats - Get geolocation service statistics
  getGeolocationStats: async (req, res) => {
    try {
      const result = geolocationService.getGeolocationStats();
      
      res.json({
        success: true,
        message: 'Geolocation statistics retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve geolocation statistics',
        message: error.message
      });
    }
  }
};

module.exports = geolocationController;
