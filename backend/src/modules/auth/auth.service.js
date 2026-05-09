// Auth Service - Business Logic Layer
// Handles all authentication business logic independently from HTTP layer

const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

class AuthService {
  constructor() {
    this.generateTokens = this.generateTokens.bind(this);
    this.validateUser = this.validateUser.bind(this);
  }

  // Generate JWT tokens
  generateTokens(userId) {
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
  }

  // Validate user credentials
  async validateUser(email, password) {
    const user = await User.findByEmail(email);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      error.errorType = 'Invalid credentials';
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account inactive');
      error.statusCode = 401;
      error.errorType = 'Account inactive';
      throw error;
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      const error = new Error('Invalid password');
      error.statusCode = 401;
      error.errorType = 'Invalid credentials';
      throw error;
    }

    return user;
  }

  // Register new user
  async register(userData, ipAddress) {
    const { name, email, phone, password, location, acceptTerms, acceptMarketing } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone';
      const error = new Error(`A user with this ${field} already exists`);
      error.statusCode = 409;
      error.errorType = 'User already exists';
      throw error;
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
      }
    });

    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user._id);

    // Log registration
    logger.logAuth('register', user._id, ipAddress, true);

    return {
      user: user.toJSON(),
      ...tokens,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };
  }

  // Login user
  async login(credentials, ipAddress) {
    const { email, password } = credentials;

    const user = await this.validateUser(email, password);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user._id);

    // Log successful login
    logger.logAuth('login', user._id, ipAddress, true);

    return {
      user: user.toJSON(),
      ...tokens,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };
  }

  // Refresh token
  async refreshToken(tokenData) {
    const { refreshToken } = tokenData;

    if (!refreshToken) {
      const error = new Error('Refresh token required');
      error.statusCode = 401;
      error.errorType = 'Token required';
      throw error;
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        const error = new Error('Invalid token type');
        error.statusCode = 403;
        error.errorType = 'Invalid token';
        throw error;
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        const error = new Error('User not found or inactive');
        error.statusCode = 401;
        error.errorType = 'User not found';
        throw error;
      }

      const tokens = this.generateTokens(user._id);

      return {
        user: user.toJSON(),
        ...tokens,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      };

    } catch (jwtError) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 403;
      error.errorType = 'Token expired';
      throw error;
    }
  }

  // Logout user
  async logout(tokenData) {
    // In a real implementation, you would add the token to a blacklist
    // For now, we just log the logout
    logger.logAuth('logout', null, null, true);
    
    return { message: 'Logout successful' };
  }

  // Get user profile
  async getProfile(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.errorType = 'User not found';
      throw error;
    }

    return user.toJSON();
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    const allowedFields = ['name', 'phone', 'location', 'preferences'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: filteredData },
      { new: true, runValidators: true }
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.errorType = 'User not found';
      throw error;
    }

    return user.toJSON();
  }
}

module.exports = new AuthService();
