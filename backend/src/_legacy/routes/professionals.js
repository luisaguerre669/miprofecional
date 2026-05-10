// Professionals Routes for MiProfesional Backend

const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const Professional = require('../models/Professional');
const Category = require('../models/Category');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
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
};

// GET /api/v1/professionals
router.get('/', [
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('location').optional().isObject().withMessage('Location must be an object with longitude and latitude'),
  query('maxDistance').optional().isFloat({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500 km'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('availability').optional().isBoolean().withMessage('availability must be a boolean'),
  query('sortBy').optional().isIn(['rating', 'price', 'responseTime', 'reviewCount', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      categoryId,
      search,
      location,
      maxDistance = 50,
      minRating = 0,
      maxPrice,
      isVerified = false,
      availability,
      sortBy = 'stats.rating',
      sortOrder = 'desc',
      limit = 20,
      page = 1
    } = req.query;

    const options = {
      categoryId,
      location: location ? JSON.parse(location) : undefined,
      maxDistance: parseFloat(maxDistance),
      minRating: parseFloat(minRating),
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      isVerified: isVerified === 'true',
      limit: parseInt(limit),
      page: parseInt(page),
      sortBy,
      sortOrder
    };

    let professionals;

    if (search || location || minRating > 0 || maxPrice || isVerified) {
      // Use search method for complex queries
      professionals = await Professional.search(search, options);
    } else {
      // Simple query for basic filtering
      let query = { isActive: true };
      
      if (categoryId) {
        query.categoryId = categoryId;
      }
      
      if (availability !== undefined) {
        query['availability.isAvailable'] = availability === 'true';
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);

      professionals = await Professional.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('categoryId', 'title')
        .populate('userId', 'name email phone');
    }

    const total = await Professional.countDocuments({ isActive: true });
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info('Professionals retrieved', {
      count: professionals.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      categoryId,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      message: 'Professionals retrieved successfully',
      data: professionals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Get professionals error', { error: error.message, query: req.query });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professionals',
      message: 'An error occurred while retrieving professionals'
    });
  }
});

// GET /api/v1/professionals/featured
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const professionals = await Professional.getFeatured(limit);

    logger.info('Featured professionals retrieved', { count: professionals.length, limit });

    res.json({
      success: true,
      message: 'Featured professionals retrieved successfully',
      data: professionals
    });

  } catch (error) {
    logger.error('Get featured professionals error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured professionals',
      message: 'An error occurred while retrieving featured professionals'
    });
  }
});

// GET /api/v1/professionals/verified
router.get('/verified', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const professionals = await Professional.getVerified(limit);

    logger.info('Verified professionals retrieved', { count: professionals.length, limit });

    res.json({
      success: true,
      message: 'Verified professionals retrieved successfully',
      data: professionals
    });

  } catch (error) {
    logger.error('Get verified professionals error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve verified professionals',
      message: 'An error occurred while retrieving verified professionals'
    });
  }
});

// GET /api/v1/professionals/top-rated
router.get('/top-rated', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { limit = 10, categoryId } = req.query;

    const professionals = await Professional.getTopRated(parseInt(limit), categoryId);

    logger.info('Top rated professionals retrieved', { 
      count: professionals.length, 
      limit: parseInt(limit),
      categoryId 
    });

    res.json({
      success: true,
      message: 'Top rated professionals retrieved successfully',
      data: professionals
    });

  } catch (error) {
    logger.error('Get top rated professionals error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve top rated professionals',
      message: 'An error occurred while retrieving top rated professionals'
    });
  }
});

// GET /api/v1/professionals/nearby
router.get('/nearby', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('maxDistance').optional().isInt({ min: 100, max: 50000 }).withMessage('Max distance must be between 100 and 50000 meters')
], handleValidationErrors, async (req, res) => {
  try {
    const { getNearbyProfessionals } = require('../controllers/professionalController');
    return getNearbyProfessionals(req, res);
  } catch (error) {
    logger.error('Get nearby professionals error', { error: error.message, query: req.query });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nearby professionals',
      message: 'An error occurred while retrieving nearby professionals'
    });
  }
});

// GET /api/v1/professionals/search
router.get('/search', [
  query('q').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Search query is required and must be between 1 and 100 characters'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('location').optional().isObject().withMessage('Location must be an object'),
  query('maxDistance').optional().isFloat({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500 km'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const { q: query, categoryId, location, maxDistance = 50, minRating = 0, maxPrice, isVerified = false, limit = 20, page = 1 } = req.query;

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

    const professionals = await Professional.search(query, options);

    logger.info('Professionals search', {
      query,
      count: professionals.length,
      categoryId,
      location,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: professionals,
      meta: {
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        count: professionals.length
      }
    });

  } catch (error) {
    logger.error('Professionals search error', { error: error.message, query: req.query.q });
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'An error occurred while searching professionals'
    });
  }
});

// GET /api/v1/professionals/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Professional.getStats();

    logger.info('Professionals stats retrieved', stats);

    res.json({
      success: true,
      message: 'Professional statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Get professionals stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professional statistics',
      message: 'An error occurred while retrieving professional statistics'
    });
  }
});

// GET /api/v1/professionals/:id
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid professional ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id)
      .populate('categoryId', 'title')
      .populate('userId', 'name email phone avatar location');

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    logger.info('Professional retrieved', { 
      professionalId: id, 
      name: professional.businessName || professional.profession 
    });

    res.json({
      success: true,
      message: 'Professional retrieved successfully',
      data: professional
    });

  } catch (error) {
    logger.error('Get professional error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professional',
      message: 'An error occurred while retrieving the professional'
    });
  }
});

// POST /api/v1/professionals/:id/contact
router.post('/:id/contact', [
  param('id').isMongoId().withMessage('Invalid professional ID'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  body('serviceRequested').optional().trim().isLength({ max: 200 }).withMessage('Service requested cannot exceed 200 characters'),
  body('preferredDate').optional().isISO8601().withMessage('Preferred date must be a valid date'),
  body('preferredTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Preferred time must be in HH:MM format')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, serviceRequested, preferredDate, preferredTime } = req.body;

    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    // In a real implementation, you would:
    // 1. Save the contact request to database
    // 2. Send notification to professional
    // 3. Send confirmation to user
    
    const contactId = `contact_${Date.now()}`;
    
    logger.logBooking('contact_requested', contactId, null, id, {
      message: message.substring(0, 100),
      serviceRequested,
      preferredDate,
      preferredTime
    });

    res.status(201).json({
      success: true,
      message: 'Contact request sent successfully',
      data: {
        contactId,
        professionalId: id,
        message: 'Your message has been sent to the professional. They will contact you soon.'
      }
    });

  } catch (error) {
    logger.error('Contact professional error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to send contact request',
      message: 'An error occurred while sending your contact request'
    });
  }
});

// POST /api/v1/professionals/:id/favorite
router.post('/:id/favorite', [
  param('id').isMongoId().withMessage('Invalid professional ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Add authentication middleware to get userId
    const userId = req.userId || 'demo_user_id';

    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    // In a real implementation, you would:
    // 1. Check if user already has this professional as favorite
    // 2. Add/remove from favorites list
    // 3. Update user stats
    
    const isFavorite = Math.random() > 0.5; // Mock random result

    logger.info('Professional favorite toggled', {
      professionalId: id,
      userId,
      isFavorite
    });

    res.json({
      success: true,
      message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      data: {
        professionalId: id,
        isFavorite
      }
    });

  } catch (error) {
    logger.error('Toggle favorite error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite',
      message: 'An error occurred while toggling favorite status'
    });
  }
});

// GET /api/v1/professionals/:id/stats
router.get('/:id/stats', [
  param('id').isMongoId().withMessage('Invalid professional ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
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

    logger.info('Professional stats retrieved', { professionalId: id, stats });

    res.json({
      success: true,
      message: 'Professional statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Get professional stats error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professional statistics',
      message: 'An error occurred while retrieving professional statistics'
    });
  }
});

// PUT /api/v1/professionals/location
router.put('/location', [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], handleValidationErrors, async (req, res) => {
  try {
    const { updateProfessionalLocation } = require('../controllers/professionalController');
    return updateProfessionalLocation(req, res);
  } catch (error) {
    logger.error('Update professional location error', { error: error.message, userId: req.usuario?.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
      message: 'An error occurred while updating professional location'
    });
  }
});

module.exports = router;
