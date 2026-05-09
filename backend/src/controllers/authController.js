const bcrypt = require("bcryptjs");
const { generarToken } = require("../config/jwt");
const User = require("../models/User");

// Input validation
const validateLoginInput = (email, password) => {
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email');
  }
  
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validationErrors = validateLoginInput(email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validationErrors.join(', ')
      });
    }

    // MongoDB is mandatory - no fallback
    try {
      // Find user by email (include password field)
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'No account found with this email'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = generarToken({
        id: user._id,
        email: user.email
      });

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            location: user.location,
            coordinates: user.coordinates,
            preferences: user.preferences,
            membership: user.membership,
            stats: user.stats,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            // Nuevos campos de verificación
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus,
            accountType: user.accountType,
            profileImage: user.profileImage,
            // Nuevos campos de suscripción
            subscriptionStatus: user.subscriptionStatus,
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionEndDate: user.subscriptionEndDate,
            subscriptionPlan: user.subscriptionPlan,
            // Nuevos campos de términos y condiciones
            acceptedTerms: user.acceptedTerms,
            acceptedTermsDate: user.acceptedTermsDate
          }
        }
      });

    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: 'Database connection failed. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
};
