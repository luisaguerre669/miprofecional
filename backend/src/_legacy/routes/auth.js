// Authentication Routes for MiProfesional Backend

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generarToken, verificarToken } = require('../config/jwt');
const bcrypt = require('bcryptjs');
const { basicAntiFraud } = require('../middleware/basicAntiFraud');

const router = express.Router();

// JWT token generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }

    req.userId = decoded.userId;
    next();
  });
};

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

// POST /api/v1/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('location').trim().isLength({ min: 2, max: 200 }).withMessage('Location must be between 2 and 200 characters'),
  body('acceptTerms').isBoolean().equals('true').withMessage('You must accept terms and conditions')
], handleValidationErrors, basicAntiFraud, async (req, res) => {
  try {
    const { name, email, phone, password, location, acceptTerms, acceptMarketing } = req.body;

    // Anti-fraud validation already checks for unique email and phone in basicAntiFraud middleware

    // Validate terms acceptance
    if (!acceptTerms) {
      return res.status(400).json({
        success: false,
        message: "Debe aceptar los términos y condiciones para continuar."
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
      location,
      preferences: {
        emailAlerts: acceptMarketing || false,
        notifications: true,
        language: 'es',
        currency: 'ARS'
      },
      // Guardar automáticamente aceptación de términos
      acceptedTerms: true,
      acceptedTermsDate: new Date()
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Log registration
    logger.logAuth('register', user._id, req.ip, true);

    // Emit user registered event (event-driven architecture)
    const { eventSystem } = require('../events');
    eventSystem.emitAuthUserRegistered(
      user._id,
      user.email,
      user.name,
      user.phone,
      user.location,
      { ip: req.ip, userAgent: req.get('User-Agent') }
    ).catch(eventError => {
      // Event emission should not block the response
      console.error('Event emission error:', eventError);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    logger.error('Registration error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email with password
    const user = await User.findByEmail(email);

    if (!user) {
      logger.logAuth('login', null, req.ip, false, { email, reason: 'user_not_found' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.logAuth('login', user._id, req.ip, false, { reason: 'account_inactive' });
      return res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.logAuth('login', user._id, req.ip, false, { reason: 'invalid_password' });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Log successful login
    logger.logAuth('login', user._id, req.ip, true);

    // Emit user logged in event (event-driven architecture)
    const { eventSystem } = require('../events');
    eventSystem.emitAuthUserLoggedIn(
      user._id,
      user.email,
      req.body.rememberMe || false,
      { ip: req.ip, userAgent: req.get('User-Agent') }
    ).catch(eventError => {
      // Event emission should not block the response
      console.error('Event emission error:', eventError);
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    logger.error('Login error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token in a blacklist
    // For now, we'll just log the logout
    logger.logAuth('logout', req.userId, req.ip, true);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error', { error: error.message, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        message: 'Please provide a valid refresh token'
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired refresh token',
          message: 'Please login again'
        });
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive',
          message: 'Please login again'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user._id);

      logger.logAuth('refresh', user._id, req.ip, true);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });
    });

  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found'
      });
    }

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user.toJSON()
    });

  } catch (error) {
    logger.error('Get profile error', { error: error.message, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: 'An error occurred while retrieving your profile'
    });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.logAuth('forgot_password', null, req.ip, false, { email, reason: 'user_not_found' });
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // In a real implementation, send email with reset link
    // For now, we'll just log it
    logger.info('Password reset requested', {
      userId: user._id,
      email,
      resetToken,
      ip: req.ip
    });

    logger.logAuth('forgot_password', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });

  } catch (error) {
    logger.error('Forgot password error', { error: error.message, email: req.body.email });
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset',
      message: 'An error occurred while processing your request'
    });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Find user by reset token
    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'The password reset link is invalid or has expired'
      });
    }

    // Update password
    user.password = newPassword;
    user.clearPasswordResetFields();
    await user.save();

    logger.logAuth('reset_password', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: 'An error occurred while resetting your password'
    });
  }
});

// PUT /api/v1/auth/change-password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current password',
        message: 'Your current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.logAuth('change_password', user._id, req.ip, true);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error', { error: error.message, userId: req.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: 'An error occurred while changing your password'
    });
  }
});

module.exports = router;
