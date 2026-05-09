// User Model for MiProfesional Backend

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password by default
  },
  avatar: {
    type: String,
    default: null
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [longitude, latitude]
    }
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    emailAlerts: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    currency: {
      type: String,
      enum: ['ARS', 'USD', 'EUR'],
      default: 'ARS'
    }
  },
  membership: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    benefits: [{
      type: String
    }]
  },
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    favoriteProfessionals: {
      type: Number,
      default: 0
    },
    reviewsGiven: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified", "rejected"],
    default: "unverified"
  },
  accountType: {
    type: String,
    enum: ["person", "company"],
    default: "person"
  },
  commercialName: {
    type: String,
    trim: true,
    maxlength: [200, 'Commercial name cannot exceed 200 characters'],
    validate: {
      validator: function(v) {
        // Solo requerido si accountType es "company"
        return this.accountType !== 'company' || (v && v.length > 0);
      },
      message: 'Commercial name is required for company accounts'
    }
  },
  profileImage: { 
    type: String, 
    default: "" 
  },
  
  // Subscription System - Basic monthly subscription
  subscriptionStatus: {
    type: String,
    enum: ["active", "expired", "pending"],
    default: "pending"
  },
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  subscriptionPlan: {
    type: String,
    enum: ["monthly", "six_months"],
    default: "monthly"
  },
  
  // Terms and Conditions - Legal acceptance tracking
  acceptedTerms: {
    type: Boolean,
    default: false
  },
  acceptedTermsDate: {
    type: Date,
    default: null
  },
  
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Verification System - Extension without breaking existing structure
  verification: {
    // Overall verification status
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'basic', 'standard', 'enhanced', 'premium'],
      default: 'none'
    },
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // Email verification
    email: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationToken: String,
      verifiedAt: Date,
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date
    },
    
    // Phone verification
    phone: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationCode: String,
      codeExpiry: Date,
      verifiedAt: Date,
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date
    },
    
    // Identity verification
    identity: {
      isVerified: {
        type: Boolean,
        default: false
      },
      documentType: String,
      documentNumber: String,
      verifiedAt: Date,
      verificationMethod: {
        type: String,
        enum: ['document_upload', 'biometric', 'third_party'],
        default: 'document_upload'
      },
      confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    // Address verification
    address: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verificationMethod: {
        type: String,
        enum: ['document_proof', 'geolocation', 'third_party'],
        default: 'document_proof'
      }
    },
    
    // Risk assessment
    riskAssessment: {
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      riskFactors: [String],
      flags: [String],
      lastAssessment: Date
    },
    
    // Verification timeline
    verificationHistory: [{
      type: String,
      enum: ['email_sent', 'email_verified', 'phone_sent', 'phone_verified', 'identity_submitted', 'identity_verified', 'address_verified'],
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: Object
    }],
    
    // Verification preferences
    preferences: {
      requiresVerification: {
        type: Boolean,
        default: false
      },
      verificationReminder: {
        type: Boolean,
        default: true
      },
      lastReminder: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return this.name;
});

userSchema.virtual('isPremium').get(function() {
  return this.membership.type === 'premium';
});

userSchema.virtual('membershipStatus').get(function() {
  if (this.membership.type === 'free') return 'free';
  if (!this.membership.expiresAt) return 'expired';
  return new Date() > this.membership.expiresAt ? 'expired' : 'active';
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ location: 'text' });
userSchema.index({ 'coordinates': '2dsphere' });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  
  // Update last login if user is being updated and is active
  if (this.isModified && this.isActive && !this.lastLogin) {
    this.lastLogin = new Date();
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.verificationToken = crypto.randomBytes(32).toString('hex');
  return this.verificationToken;
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return this.resetPasswordToken;
};

userSchema.methods.clearPasswordResetFields = function() {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

userSchema.methods.updateStats = async function(updates) {
  const allowedUpdates = ['totalBookings', 'totalSpent', 'favoriteProfessionals', 'reviewsGiven'];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedUpdates.includes(key)) {
      this.stats[key] = value;
    }
  }
  
  return this.save();
};

userSchema.methods.addToFavorites = function(professionalId) {
  // This would be implemented with a separate favorites model
  // For now, just update the count
  this.stats.favoriteProfessionals += 1;
  return this.save();
};

userSchema.methods.removeFromFavorites = function(professionalId) {
  // This would be implemented with a separate favorites model
  // For now, just update the count
  this.stats.favoriteProfessionals = Math.max(0, this.stats.favoriteProfessionals - 1);
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({ verificationToken: token });
};

userSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+password');
};

userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
        premiumUsers: { $sum: { $cond: [{ $eq: ['$membership.type', 'premium'] }, 1, 0] } },
        avgBookings: { $avg: '$stats.totalBookings' },
        avgSpent: { $avg: '$stats.totalSpent' }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    premiumUsers: 0,
    avgBookings: 0,
    avgSpent: 0
  };
};

// Validation methods
userSchema.methods.validatePassword = function(password) {
  // Password validation rules
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Transform output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
