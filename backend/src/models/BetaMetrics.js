const mongoose = require('mongoose');

/**
 * BetaMetrics Schema
 * Métricas de uso para la beta cerrada
 */
const betaMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['client', 'professional'],
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  // Eventos de onboarding
  onboarding: {
    started: { type: Boolean, default: false },
    startedAt: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    stepsViewed: [{ type: Number }],
    skipped: { type: Boolean, default: false }
  },
  // Registro
  registration: {
    started: { type: Boolean, default: false },
    startedAt: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    method: { type: String, enum: ['email', 'google', 'facebook'] },
    timeSpentSeconds: Number
  },
  // Actividad
  activity: {
    lastActiveAt: Date,
    totalSessions: { type: Number, default: 0 },
    totalTimeMinutes: { type: Number, default: 0 },
    screensVisited: [{ type: String }],
    actions: [{
      type: { type: String },
      timestamp: Date,
      metadata: mongoose.Schema.Types.Mixed
    }]
  },
  // Conversiones
  conversions: {
    profileCompleted: { type: Boolean, default: false },
    firstSearch: { type: Boolean, default: false },
    firstContact: { type: Boolean, default: false },
    firstBooking: { type: Boolean, default: false },
    firstPayment: { type: Boolean, default: false },
    subscriptionStarted: { type: Boolean, default: false }
  },
  // Feedback
  feedback: {
    nps: { type: Number, min: 0, max: 10 },
    submittedAt: Date,
    comments: String
  },
  // Errores encontrados
  errors: [{
    type: String,
    message: String,
    stack: String,
    timestamp: Date,
    screen: String
  }],
  // Metadata
  device: {
    type: { type: String },
    os: String,
    browser: String,
    screenResolution: String
  }
}, {
  timestamps: true
});

// Índices para análisis
betaMetricsSchema.index({ userId: 1, createdAt: -1 });
betaMetricsSchema.index({ 'registration.completed': 1 });
betaMetricsSchema.index({ 'conversions.firstPayment': 1 });

// Métodos estáticos para analytics
betaMetricsSchema.statics.getConversionFunnel = async function() {
  const total = await this.countDocuments();
  
  return {
    total,
    registered: await this.countDocuments({ 'registration.completed': true }),
    profileCompleted: await this.countDocuments({ 'conversions.profileCompleted': true }),
    firstSearch: await this.countDocuments({ 'conversions.firstSearch': true }),
    firstContact: await this.countDocuments({ 'conversions.firstContact': true }),
    firstBooking: await this.countDocuments({ 'conversions.firstBooking': true }),
    firstPayment: await this.countDocuments({ 'conversions.firstPayment': true })
  };
};

betaMetricsSchema.statics.getRetentionStats = async function(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: null,
        avgSessions: { $avg: '$activity.totalSessions' },
        avgTimeMinutes: { $avg: '$activity.totalTimeMinutes' },
        returningUsers: {
          $sum: { $cond: [{ $gt: ['$activity.totalSessions', 1] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('BetaMetrics', betaMetricsSchema);
