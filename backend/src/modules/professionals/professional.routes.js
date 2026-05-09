// Professional Routes - Modular Architecture Preparation
// Defines all professional routes with proper middleware

const express = require('express');
const { query, param, body } = require('express-validator');
const professionalController = require('./professional.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// Validation rules
const nearbyValidation = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('maxDistance').optional().isInt({ min: 100, max: 50000 }).withMessage('Max distance must be between 100 and 50000 meters')
];

const updateLocationValidation = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
];

const searchValidation = [
  query('q').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Search query is required and must be between 1 and 100 characters'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('location').optional().isObject().withMessage('Location must be an object'),
  query('maxDistance').optional().isFloat({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500 km'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
];

const featuredValidation = [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid professional ID')
];

// Public routes (no authentication required)
router.get('/nearby', nearbyValidation, professionalController.handleValidationErrors, professionalController.getNearbyProfessionals);
router.get('/search', searchValidation, professionalController.handleValidationErrors, professionalController.searchProfessionals);
router.get('/featured', featuredValidation, professionalController.handleValidationErrors, professionalController.getFeaturedProfessionals);
router.get('/:id', idValidation, professionalController.handleValidationErrors, professionalController.getProfessionalById);

// Protected routes (authentication required)
router.put('/location', updateLocationValidation, professionalController.handleValidationErrors, authMiddleware, professionalController.updateLocation);

module.exports = router;
