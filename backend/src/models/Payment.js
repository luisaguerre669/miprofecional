// Payment Model - Sistema de pagos con Mercado Pago
// Modelo para gestionar transacciones financieras

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Información básica
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  
  // Información del pago
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Amount must be a valid number'
    }
  },
  currency: {
    type: String,
    required: true,
    enum: ['ARS', 'USD', 'EUR'],
    default: 'ARS'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Método de pago
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mercadopago', 'transferencia', 'efectivo', 'tarjeta', 'otro'],
    default: 'mercadopago'
  },
  
  // Estado del pago
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'],
    required: true,
    default: 'pending'
  },
  statusDetail: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Integración con Mercado Pago
  preferenceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mercadoPagoId: {
    type: String,
    index: true
  },
  initPoint: String,
  qrCode: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
  chargedBackAt: Date,
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    deviceInfo: String,
    location: {
      country: String,
      city: String,
      ip: String
    },
    fraud: {
      riskScore: {
        type: Number,
        min: 0,
        max: 100
      },
      flagged: {
        type: Boolean,
        default: false
      },
      reasons: [String]
    },
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    expiresAt: Date,
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ professional: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ preferenceId: 1 });
paymentSchema.index({ mercadoPagoId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtuals
paymentSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

paymentSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

paymentSchema.virtual('isFailed').get(function() {
  return ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(this.status);
});

paymentSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

paymentSchema.virtual('professionalInfo', {
  ref: 'Professional',
  localField: 'professional',
  foreignField: '_id',
  justOne: true
});

paymentSchema.virtual('bookingInfo', {
  ref: 'Booking',
  localField: 'booking',
  foreignField: '_id',
  justOne: true
});

// Métodos estáticos
paymentSchema.statics.getUserPayments = async function(userId, options = {}) {
  const { limit = 20, skip = 0, status = null, paymentMethod = null } = options;
  
  const query = { user: userId };
  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  
  const payments = await this.find(query)
    .populate('booking', 'service date time')
    .populate('professional', 'businessName profession')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  return payments;
};

paymentSchema.statics.getProfessionalPayments = async function(professionalId, options = {}) {
  const { limit = 20, skip = 0, status = null, startDate = null, endDate = null } = options;
  
  const query = { professional: professionalId };
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const payments = await this.find(query)
    .populate('user', 'name email')
    .populate('booking', 'service date time')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  return payments;
};

paymentSchema.statics.getPaymentStats = async function(filters = {}) {
  const { userId = null, professionalId = null, startDate = null, endDate = null } = filters;
  
  const matchStage = {};
  if (userId) matchStage.user = new mongoose.Types.ObjectId(userId);
  if (professionalId) matchStage.professional = new mongoose.Types.ObjectId(professionalId);
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const [
    totalPayments,
    approvedPayments,
    pendingPayments,
    rejectedPayments,
    totalAmount,
    approvedAmount,
    todayPayments,
    todayAmount
  ] = await Promise.all([
    this.countDocuments(matchStage),
    this.countDocuments({ ...matchStage, status: 'approved' }),
    this.countDocuments({ ...matchStage, status: 'pending' }),
    this.countDocuments({ ...matchStage, status: 'rejected' }),
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    this.aggregate([
      { $match: { ...matchStage, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    this.countDocuments({
      ...matchStage,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    this.aggregate([
      {
        $match: {
          ...matchStage,
          status: 'approved',
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  
  return {
    total: totalPayments,
    approved: approvedPayments,
    pending: pendingPayments,
    rejected: rejectedPayments,
    totalAmount: totalAmount[0]?.total || 0,
    approvedAmount: approvedAmount[0]?.total || 0,
    today: {
      count: todayPayments,
      amount: todayAmount[0]?.total || 0
    },
    approvalRate: totalPayments > 0 ? ((approvedPayments / totalPayments) * 100).toFixed(1) : '0',
    averageAmount: approvedPayments > 0 ? ((approvedAmount[0]?.total || 0) / approvedPayments).toFixed(2) : '0'
  };
};

paymentSchema.statics.getPendingPayments = async function() {
  const payments = await this.find({
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
  })
  .populate('user', 'name email')
  .populate('professional', 'businessName')
  .populate('booking', 'service date')
  .sort({ createdAt: 1 })
  .lean();
  
  return payments;
};

paymentSchema.statics.markAsExpired = async function() {
  const expiredPayments = await this.find({
    status: 'pending',
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 horas
  });
  
  for (const payment of expiredPayments) {
    payment.status = 'cancelled';
    payment.statusDetail = 'Payment expired';
    payment.cancelledAt = new Date();
    await payment.save();
  }
  
  return expiredPayments.length;
};

paymentSchema.statics.retryFailedPayments = async function() {
  const failedPayments = await this.find({
    status: 'rejected',
    'metadata.retryCount': { $lt: 'metadata.maxRetries' },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
  });
  
  for (const payment of failedPayments) {
    // Aquí se reintentaría el pago con Mercado Pago
    console.log(`💳 Retrying payment: ${payment._id}`);
    payment.metadata.retryCount += 1;
    await payment.save();
  }
  
  return failedPayments.length;
};

// Middleware para logging
paymentSchema.pre('save', function(next) {
  console.log(`💳 Saving payment: ${this.amount} ${this.currency} - ${this.status}`);
  next();
});

paymentSchema.post('save', function(doc) {
  console.log(`💳 Payment saved: ${doc._id} - ${doc.status}`);
});

paymentSchema.pre(['remove', 'deleteOne'], function(next) {
  console.log(`💳 Deleting payment: ${this._id}`);
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
