const mongoose = require('mongoose');

/**
 * BetaInvitation Schema
 * Sistema de invitaciones para beta cerrada
 */
const betaInvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['professional', 'client', 'admin'],
    default: 'professional'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'used', 'expired'],
    default: 'pending'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  },
  metadata: {
    source: String,
    campaign: String,
    notes: String
  }
}, {
  timestamps: true
});

// Índices
betaInvitationSchema.index({ code: 1 });
betaInvitationSchema.index({ email: 1 });
betaInvitationSchema.index({ status: 1 });

// Métodos estáticos
betaInvitationSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BETA-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

betaInvitationSchema.statics.validateCode = async function(code) {
  const invitation = await this.findOne({ 
    code: code.toUpperCase(),
    status: { $in: ['pending', 'sent'] },
    expiresAt: { $gt: new Date() }
  });
  
  if (!invitation) {
    return { valid: false, reason: 'INVALID_OR_EXPIRED' };
  }
  
  return { valid: true, invitation };
};

// Métodos de instancia
betaInvitationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

betaInvitationSchema.methods.markAsUsed = function(userId) {
  this.status = 'used';
  this.usedAt = new Date();
  this.userId = userId;
  return this.save();
};

module.exports = mongoose.model('BetaInvitation', betaInvitationSchema);
