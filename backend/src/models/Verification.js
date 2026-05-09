// Verification Model - Sistema de verificación de identidad
// Modelo para tracking de verificaciones de usuarios y profesionales

const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  // Información básica
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  },
  
  // Tipo de verificación
  verificationType: {
    type: String,
    enum: ['identity', 'professional_license', 'business_registration', 'address_proof', 'phone', 'email', 'selfie', 'document'],
    required: true
  },
  
  // Estado de la verificación
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'expired', 'cancelled'],
    default: 'pending',
    required: true
  },
  
  // Datos de verificación
  verificationData: {
    // Para verificación de identidad
    identity: {
      documentType: {
        type: String,
        enum: ['dni', 'passport', 'cedula', 'other']
      },
      documentNumber: String,
      firstName: String,
      lastName: String,
      birthDate: Date,
      gender: String,
      nationality: String
    },
    
    // Para licencia profesional
    professionalLicense: {
      licenseNumber: String,
      issuingAuthority: String,
      issueDate: Date,
      expiryDate: Date,
      profession: String,
      specialization: String
    },
    
    // Para registro de empresa
    businessRegistration: {
      companyName: String,
      registrationNumber: String,
      taxId: String,
      legalForm: String,
      registrationDate: Date,
      registeredAddress: String
    },
    
    // Para comprobante de domicilio
    addressProof: {
      address: String,
      city: String,
      province: String,
      postalCode: String,
      documentType: String,
      issuingDate: Date
    },
    
    // Para verificación telefónica
    phone: {
      phoneNumber: String,
      countryCode: String,
      verificationCode: String,
      codeExpiry: Date,
      attempts: Number
    },
    
    // Para verificación de email
    email: {
      emailAddress: String,
      verificationToken: String,
      tokenExpiry: Date,
      attempts: Number
    },
    
    // Para selfie verification
    selfie: {
      imageReference: String,
      faceMatchConfidence: Number,
      livenessCheck: Boolean,
      timestamp: Date
    },
    
    // Para documentos generales
    document: {
      documentType: String,
      documentReference: String,
      extractedData: Object,
      ocrConfidence: Number
    }
  },
  
  // Archivos adjuntos
  attachments: [{
    type: {
      type: String,
      enum: ['document_front', 'document_back', 'selfie', 'license', 'registration', 'proof', 'other']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Proceso de revisión
  reviewProcess: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String,
    manualReview: {
      type: Boolean,
      default: false
    }
  },
  
  // Scoring de confianza
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Risk assessment
  riskAssessment: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    riskFactors: [{
      type: String,
      enum: ['new_account', 'suspicious_document', 'mismatched_data', 'high_value', 'international', 'other']
    }],
    flags: [{
      type: String,
      enum: ['manual_review_required', 'additional_docs_needed', 'suspicious_activity', 'high_risk', 'fraud_detected']
    }]
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  completedAt: Date,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    location: {
      country: String,
      city: String,
      coordinates: [Number] // [lng, lat]
    },
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin'],
      default: 'web'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    notes: String,
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
verificationSchema.index({ user: 1, verificationType: 1, status: 1 });
verificationSchema.index({ professional: 1, verificationType: 1, status: 1 });
verificationSchema.index({ status: 1, submittedAt: -1 });
verificationSchema.index({ 'reviewProcess.reviewedBy': 1 });
verificationSchema.index({ confidenceScore: -1 });
verificationSchema.index({ 'riskAssessment.riskLevel': 1 });
verificationSchema.index({ expiresAt: 1 });

// Virtuals
verificationSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

verificationSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

verificationSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

verificationSchema.virtual('isExpired').get(function() {
  return this.status === 'expired' || (this.expiresAt && this.expiresAt < new Date());
});

verificationSchema.virtual('requiresManualReview').get(function() {
  return this.riskAssessment.riskLevel === 'high' || 
         this.riskAssessment.riskLevel === 'critical' ||
         this.riskAssessment.flags.includes('manual_review_required');
});

verificationSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

verificationSchema.virtual('professionalInfo', {
  ref: 'Professional',
  localField: 'professional',
  foreignField: '_id',
  justOne: true
});

// Métodos estáticos
verificationSchema.statics.getUserVerifications = async function(userId, options = {}) {
  const { status = null, type = null, limit = 20, skip = 0 } = options;
  
  const query = { user: userId };
  if (status) query.status = status;
  if (type) query.verificationType = type;
  
  const verifications = await this.find(query)
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  return verifications;
};

verificationSchema.statics.getProfessionalVerifications = async function(professionalId, options = {}) {
  const { status = null, type = null, limit = 20, skip = 0 } = options;
  
  const query = { professional: professionalId };
  if (status) query.status = status;
  if (type) query.verificationType = type;
  
  const verifications = await this.find(query)
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  return verifications;
};

verificationSchema.statics.getPendingVerifications = async function(options = {}) {
  const { limit = 50, skip = 0, riskLevel = null } = options;
  
  const query = { status: 'pending' };
  if (riskLevel) query['riskAssessment.riskLevel'] = riskLevel;
  
  const verifications = await this.find(query)
    .populate('user', 'name email')
    .populate('professional', 'businessName email')
    .sort({ 'metadata.priority': -1, submittedAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  return verifications;
};

verificationSchema.statics.getVerificationStats = async function() {
  const [
    totalVerifications,
    pendingVerifications,
    approvedVerifications,
    rejectedVerifications,
    expiredVerifications,
    highRiskVerifications,
    manualReviewVerifications,
    averageConfidenceScore
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: 'approved' }),
    this.countDocuments({ status: 'rejected' }),
    this.countDocuments({ status: 'expired' }),
    this.countDocuments({ 'riskAssessment.riskLevel': { $in: ['high', 'critical'] } }),
    this.countDocuments({ 'riskAssessment.flags': 'manual_review_required' }),
    this.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgScore: { $avg: '$confidenceScore' } } }
    ])
  ]);
  
  return {
    total: totalVerifications,
    pending: pendingVerifications,
    approved: approvedVerifications,
    rejected: rejectedVerifications,
    expired: expiredVerifications,
    highRisk: highRiskVerifications,
    manualReview: manualReviewVerifications,
    averageConfidenceScore: averageConfidenceScore[0]?.avgScore || 0,
    approvalRate: totalVerifications > 0 ? ((approvedVerifications / totalVerifications) * 100).toFixed(1) : '0',
    rejectionRate: totalVerifications > 0 ? ((rejectedVerifications / totalVerifications) * 100).toFixed(1) : '0'
  };
};

verificationSchema.statics.calculateUserTrustScore = async function(userId) {
  const verifications = await this.find({ user: userId });
  
  if (verifications.length === 0) return 0;
  
  const approvedVerifications = verifications.filter(v => v.status === 'approved');
  const totalConfidence = verifications.reduce((sum, v) => sum + v.confidenceScore, 0);
  
  const baseScore = (approvedVerifications.length / verifications.length) * 50;
  const confidenceBonus = (totalConfidence / (verifications.length * 100)) * 50;
  
  return Math.min(Math.round(baseScore + confidenceBonus), 100);
};

verificationSchema.statics.calculateProfessionalTrustScore = async function(professionalId) {
  const verifications = await this.find({ professional: professionalId });
  
  if (verifications.length === 0) return 0;
  
  const approvedVerifications = verifications.filter(v => v.status === 'approved');
  const totalConfidence = verifications.reduce((sum, v) => sum + v.confidenceScore, 0);
  
  // Ponderación diferente para profesionales
  const baseScore = (approvedVerifications.length / verifications.length) * 60;
  const confidenceBonus = (totalConfidence / (verifications.length * 100)) * 40;
  
  return Math.min(Math.round(baseScore + confidenceBonus), 100);
};

verificationSchema.statics.markExpiredVerifications = async function() {
  const expiredVerifications = await this.find({
    status: { $in: ['pending', 'under_review'] },
    expiresAt: { $lt: new Date() }
  });
  
  for (const verification of expiredVerifications) {
    verification.status = 'expired';
    verification.completedAt = new Date();
    await verification.save();
  }
  
  return expiredVerifications.length;
};

verificationSchema.statics.getHighRiskVerifications = async function() {
  return this.find({
    'riskAssessment.riskLevel': { $in: ['high', 'critical'] },
    status: { $in: ['pending', 'under_review'] }
  })
  .populate('user', 'name email')
  .populate('professional', 'businessName email')
  .sort({ 'metadata.priority': -1, submittedAt: 1 })
  .lean();
};

// Middleware para logging
verificationSchema.pre('save', function(next) {
  console.log(`🔐 Saving verification: ${this.verificationType} - ${this.status}`);
  next();
});

verificationSchema.post('save', function(doc) {
  console.log(`🔐 Verification saved: ${doc._id}`);
});

verificationSchema.pre(['remove', 'deleteOne'], function(next) {
  console.log(`🔐 Deleting verification: ${this._id}`);
  next();
});

module.exports = mongoose.model('Verification', verificationSchema);
