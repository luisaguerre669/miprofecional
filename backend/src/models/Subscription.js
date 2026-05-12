const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'cancelled', 'suspended'],
    default: 'inactive'
  },
  mercadoPagoSubscriptionId: {
    type: String,
    default: null
  },
  mercadoPagoPayerId: {
    type: String,
    default: null
  },
  currentPeriodStart: {
    type: Date,
    default: null
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    default: null
  },
  lastPayment: {
    amount: Number,
    currency: String,
    date: Date,
    status: String
  },
  nextPaymentDate: {
    type: Date,
    default: null
  },
  features: {
    maxServices: { type: Number, default: 3 },
    featuredListings: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false }
  },
  invoices: [{
    id: String,
    amount: Number,
    currency: String,
    status: String,
    date: Date,
    pdfUrl: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Método para verificar si la suscripción está activa
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && 
         this.currentPeriodEnd && 
         new Date() < this.currentPeriodEnd;
};

// Método para obtener el plan actual
subscriptionSchema.methods.getPlanDetails = function() {
  const plans = {
    free: {
      name: 'Gratis',
      price: 0,
      maxServices: 3,
      featuredListings: 0,
      prioritySupport: false,
      analytics: false
    },
    basic: {
      name: 'Básico',
      price: 9990, // $9.990 ARS
      maxServices: 10,
      featuredListings: 2,
      prioritySupport: false,
      analytics: true
    },
    premium: {
      name: 'Premium',
      price: 19990, // $19.990 ARS
      maxServices: 50,
      featuredListings: 10,
      prioritySupport: true,
      analytics: true,
      customDomain: true
    },
    enterprise: {
      name: 'Empresarial',
      price: 49990, // $49.990 ARS
      maxServices: 999,
      featuredListings: 50,
      prioritySupport: true,
      analytics: true,
      customDomain: true
    }
  };
  
  return plans[this.plan] || plans.free;
};

// Índices
subscriptionSchema.index({ professionalId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ mercadoPagoSubscriptionId: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
