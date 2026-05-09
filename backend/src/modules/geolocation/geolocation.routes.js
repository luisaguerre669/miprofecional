// Geolocation Routes - Modular Architecture Preparation
// Defines all geolocation routes with proper middleware

const express = require('express');
const { query, param } = require('express-validator');
const geolocationController = require('./geolocation.controller');

const router = express.Router();

// Validation rules
const nearbyValidation = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('maxDistance').optional().isInt({ min: 100, max: 50000 }).withMessage('Max distance must be between 100 and 50000 meters'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const distanceValidation = [
  query('lat1').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude for point 1'),
  query('lng1').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude for point 1'),
  query('lat2').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude for point 2'),
  query('lng2').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude for point 2')
];

const areaValidation = [
  query('northEastLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid northeast latitude'),
  query('northEastLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid northeast longitude'),
  query('southWestLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid southwest latitude'),
  query('southWestLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid southwest longitude'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const serviceAreaValidation = [
  param('professionalId').isMongoId().withMessage('Invalid professional ID')
];

const checkServiceAreaValidation = [
  param('professionalId').isMongoId().withMessage('Invalid professional ID'),
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
];

// Geolocation routes (all public)
router.get('/nearby', nearbyValidation, geolocationController.handleValidationErrors, geolocationController.getNearbyProfessionals);
router.get('/distance', distanceValidation, geolocationController.handleValidationErrors, geolocationController.calculateDistance);
router.get('/area', areaValidation, geolocationController.handleValidationErrors, geolocationController.findProfessionalsInArea);
router.get('/service-area/:professionalId', serviceAreaValidation, geolocationController.handleValidationErrors, geolocationController.getProfessionalServiceArea);
router.get('/check-service-area/:professionalId', checkServiceAreaValidation, geolocationController.handleValidationErrors, geolocationController.checkServiceArea);
router.get('/stats', geolocationController.getGeolocationStats);

module.exports = router;
