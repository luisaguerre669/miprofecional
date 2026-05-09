// Auth Controller - Modular Architecture Preparation
// Handles HTTP requests/responses only - Business logic in service layer

const authService = require('./auth.service');
const { body, validationResult } = require('express-validator');

const authController = {
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

  // POST /api/auth/register
  register: async (req, res) => {
    try {
      const result = await authService.register(req.body, req.ip);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Registration failed',
        message: error.message
      });
    }
  },

  // POST /api/auth/login
  login: async (req, res) => {
    try {
      const result = await authService.login(req.body, req.ip);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Login failed',
        message: error.message
      });
    }
  },

  // POST /api/auth/refresh
  refreshToken: async (req, res) => {
    try {
      const result = await authService.refreshToken(req.body);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Token refresh failed',
        message: error.message
      });
    }
  },

  // POST /api/auth/logout
  logout: async (req, res) => {
    try {
      await authService.logout(req.body);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Logout failed',
        message: error.message
      });
    }
  },

  // GET /api/auth/profile
  getProfile: async (req, res) => {
    try {
      const result = await authService.getProfile(req.usuario.id);
      
      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Profile retrieval failed',
        message: error.message
      });
    }
  },

  // PUT /api/auth/profile
  updateProfile: async (req, res) => {
    try {
      const result = await authService.updateProfile(req.usuario.id, req.body);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Profile update failed',
        message: error.message
      });
    }
  }
};

module.exports = authController;
