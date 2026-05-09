// Professional Controller - Modular Architecture Preparation
// Handles HTTP requests/responses only - Business logic in service layer

const professionalService = require('./professional.service');
const { body, query, validationResult } = require('express-validator');

const professionalController = {
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

  // GET /api/professionals/nearby - Get nearby professionals
  getNearbyProfessionals: async (req, res) => {
    try {
      const { lat, lng, maxDistance } = req.query;
      
      const result = await professionalService.getNearbyProfessionals({ lat, lng, maxDistance });
      
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

  // PUT /api/professionals/location - Update professional location
  updateLocation: async (req, res) => {
    try {
      const { lat, lng } = req.body;
      const professionalId = req.usuario.id;
      
      const result = await professionalService.updateLocation(professionalId, { lat, lng }, req.app.get('io'));
      
      res.json({
        success: true,
        message: 'Professional location updated successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to update location',
        message: error.message
      });
    }
  },

  // GET /api/professionals/search - Search professionals
  searchProfessionals: async (req, res) => {
    try {
      const searchOptions = {
        ...req.query
      };
      
      const result = await professionalService.searchProfessionals(searchOptions);
      
      res.json({
        success: true,
        message: 'Professionals search completed successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Search failed',
        message: error.message
      });
    }
  },

  // GET /api/professionals/featured - Get featured professionals
  getFeaturedProfessionals: async (req, res) => {
    try {
      const { limit } = req.query;
      
      const result = await professionalService.getFeaturedProfessionals(limit);
      
      res.json({
        success: true,
        message: 'Featured professionals retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve featured professionals',
        message: error.message
      });
    }
  },

  // GET /api/professionals/:id - Get professional by ID
  getProfessionalById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await professionalService.getProfessionalById(id);
      
      res.json({
        success: true,
        message: 'Professional retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve professional',
        message: error.message
      });
    }
  }
};

module.exports = professionalController;
