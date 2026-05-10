import mongoose, { Schema, Document } from 'mongoose';

// Interface para Subscription
export interface ISubscription extends Document {
  professionalId: string;
  planType: 'trial' | 'professional';
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  nextPaymentDate?: Date;
  amount: number;
  currency: string;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  autoRenew: boolean;
  notificationsSent: {
    fiveDaysWarning: boolean;
    oneDayWarning: boolean;
    expired: boolean;
    suspended: boolean;
  };
  isVisible: boolean; // Controla si el perfil es visible para clientes
  gracePeriodEnd?: Date; // Período de gracia después del vencimiento
  subscriptionHistory: Array<{
    date: Date;
    action: 'created' | 'renewed' | 'expired' | 'cancelled' | 'suspended' | 'reactivated';
    amount?: number;
    paymentMethod?: string;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Schema de Subscription
const SubscriptionSchema = new Schema<ISubscription>({
  professionalId: {
    type: String,
    required: true,
    ref: 'Professional',
    index: true
  },
  planType: {
    type: String,
    required: true,
    enum: ['trial', 'professional'],
    default: 'trial'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  trialEndDate: {
    type: Date,
    required: function() {
      return this.planType === 'trial';
    }
  },
  nextPaymentDate: {
    type: Date,
    required: function() {
      return this.planType === 'professional';
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    default: 8000 // $8.000 pesos argentinos
  },
  currency: {
    type: String,
    required: true,
    default: 'ARS'
  },
  paymentMethod: {
    type: String,
    enum: ['mercadopago', 'stripe', 'transferencia', 'efectivo']
  },
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number,
    min: 0
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  notificationsSent: {
    fiveDaysWarning: {
      type: Boolean,
      default: false
    },
    oneDayWarning: {
      type: Boolean,
      default: false
    },
    expired: {
      type: Boolean,
      default: false
    },
    suspended: {
      type: Boolean,
      default: false
    }
  },
  isVisible: {
    type: Boolean,
    required: true,
    default: true
  },
  gracePeriodEnd: {
    type: Date
  },
  subscriptionHistory: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    action: {
      type: String,
      required: true,
      enum: ['created', 'renewed', 'expired', 'cancelled', 'suspended', 'reactivated']
    },
    amount: {
      type: Number,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['mercadopago', 'stripe', 'transferencia', 'efectivo']
    },
    reason: {
      type: String
    }
  }]
}, {
  timestamps: true,
  collection: 'subscriptions'
});

// Índices compuestos para mejor rendimiento
SubscriptionSchema.index({ professionalId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });
SubscriptionSchema.index({ nextPaymentDate: 1 });
SubscriptionSchema.index({ isVisible: 1, status: 1 });
SubscriptionSchema.index({ trialEndDate: 1, planType: 1 });

// Métodos estáticos
SubscriptionSchema.statics.createTrialSubscription = function(professionalId: string) {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 días de prueba
  
  const endDate = new Date(trialEndDate);
  
  return this.create({
    professionalId,
    planType: 'trial',
    status: 'active',
    startDate: new Date(),
    endDate,
    trialEndDate,
    amount: 0,
    currency: 'ARS',
    isVisible: true,
    subscriptionHistory: [{
      date: new Date(),
      action: 'created',
      reason: 'Trial subscription created'
    }]
  });
};

SubscriptionSchema.statics.getActiveSubscription = function(professionalId: string) {
  return this.findOne({
    professionalId,
    status: 'active',
    isVisible: true
  }).sort({ createdAt: -1 });
};

SubscriptionSchema.statics.getExpiringSoon = function(daysAhead = 5) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    status: 'active',
    endDate: { $lte: futureDate },
    'notificationsSent.fiveDaysWarning': false
  }).populate('professionalId');
};

SubscriptionSchema.statics.getExpiredForSuspension = function() {
  const now = new Date();
  
  return this.find({
    status: 'active',
    endDate: { $lt: now },
    isVisible: true
  }).populate('professionalId');
};

SubscriptionSchema.statics.getSubscriptionsNeedingPayment = function() {
  const now = new Date();
  
  return this.find({
    planType: 'professional',
    status: 'active',
    nextPaymentDate: { $lte: now },
    autoRenew: true
  }).populate('professionalId');
};

// Métodos de instancia
SubscriptionSchema.methods.startPaidSubscription = function(paymentData: any) {
  const now = new Date();
  const nextPayment = new Date(now);
  nextPayment.setMonth(nextPayment.getMonth() + 1); // Próximo pago en 1 mes
  
  this.planType = 'professional';
  this.status = 'active';
  this.endDate = nextPayment;
  this.nextPaymentDate = nextPayment;
  this.amount = 8000;
  this.lastPaymentDate = now;
  this.lastPaymentAmount = paymentData.amount || 8000;
  this.paymentMethod = paymentData.method;
  this.isVisible = true;
  this.notificationsSent = {
    fiveDaysWarning: false,
    oneDayWarning: false,
    expired: false,
    suspended: false
  };
  
  this.subscriptionHistory.push({
    date: now,
    action: 'renewed',
    amount: this.lastPaymentAmount,
    paymentMethod: this.paymentMethod,
    reason: 'Converted to paid subscription'
  });
  
  return this.save();
};

SubscriptionSchema.methods.suspendProfile = function() {
  const now = new Date();
  const gracePeriodEnd = new Date(now);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7 días de gracia
  
  this.status = 'suspended';
  this.isVisible = false;
  this.gracePeriodEnd = gracePeriodEnd;
  this.notificationsSent.suspended = true;
  
  this.subscriptionHistory.push({
    date: now,
    action: 'suspended',
    reason: 'Payment not received, profile suspended'
  });
  
  return this.save();
};

SubscriptionSchema.methods.reactivateProfile = function(paymentData: any) {
  const now = new Date();
  const nextPayment = new Date(now);
  nextPayment.setMonth(nextPayment.getMonth() + 1);
  
  this.status = 'active';
  this.isVisible = true;
  this.endDate = nextPayment;
  this.nextPaymentDate = nextPayment;
  this.lastPaymentDate = now;
  this.lastPaymentAmount = paymentData.amount || 8000;
  this.paymentMethod = paymentData.method;
  this.gracePeriodEnd = undefined;
  this.notificationsSent = {
    fiveDaysWarning: false,
    oneDayWarning: false,
    expired: false,
    suspended: false
  };
  
  this.subscriptionHistory.push({
    date: now,
    action: 'reactivated',
    amount: this.lastPaymentAmount,
    paymentMethod: this.paymentMethod,
    reason: 'Profile reactivated after payment'
  });
  
  return this.save();
};

SubscriptionSchema.methods.sendNotification = function(type: 'fiveDaysWarning' | 'oneDayWarning' | 'expired' | 'suspended') {
  this.notificationsSent[type] = true;
  return this.save();
};

SubscriptionSchema.methods.getDaysUntilExpiry = function() {
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

SubscriptionSchema.methods.isInGracePeriod = function() {
  if (!this.gracePeriodEnd) return false;
  return new Date() <= this.gracePeriodEnd;
};

// Middleware para validaciones
SubscriptionSchema.pre('save', function(next) {
  // Validar que la fecha de fin sea posterior a la de inicio
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Si es trial, validar trialEndDate
  if (this.planType === 'trial' && !this.trialEndDate) {
    this.trialEndDate = new Date(this.startDate);
    this.trialEndDate.setDate(this.trialEndDate.getDate() + 30);
  }
  
  // Si es profesional, validar nextPaymentDate
  if (this.planType === 'professional' && !this.nextPaymentDate) {
    this.nextPaymentDate = new Date(this.endDate);
  }
  
  next();
});

// Exportar el modelo
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
