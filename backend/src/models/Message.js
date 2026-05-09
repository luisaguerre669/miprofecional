// Message Model - Sistema de chat y mensajería
// Modelo para mensajes entre usuarios y profesionales

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Información básica
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'professional'],
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['user', 'professional'],
    required: true
  },
  
  // Contenido del mensaje
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Estado del mensaje
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Identificador del chat (para agrupar mensajes)
  chatId: {
    type: String,
    required: true,
    index: true
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date
  },
  
  // Archivos adjuntos (futuro)
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'audio']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  
  // Metadata
  metadata: {
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
messageSchema.index({ sender: 1, recipient: 1, timestamp: -1 });
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ recipient: 1, status: 1, timestamp: -1 });
messageSchema.index({ sender: 1, status: 1, timestamp: -1 });

// Virtuals
messageSchema.virtual('isRead').get(function() {
  return this.status === 'read';
});

messageSchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered' || this.status === 'read';
});

messageSchema.virtual('senderInfo', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true
});

messageSchema.virtual('recipientInfo', {
  ref: 'User',
  localField: 'recipient',
  foreignField: '_id',
  justOne: true
});

// Métodos estáticos
messageSchema.statics.getChatHistory = async function(chatId, options = {}) {
  const { limit = 50, skip = 0, before } = options;
  
  const query = { chatId };
  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }
  
  return this.find(query)
    .populate('sender', 'name profileImage')
    .populate('recipient', 'name profileImage')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

messageSchema.statics.getUnreadCount = async function(userId, userType) {
  const query = {
    recipient: userId,
    recipientType: userType,
    status: { $in: ['sent', 'delivered'] }
  };
  
  return this.countDocuments(query);
};

messageSchema.statics.markAsRead = async function(messageIds) {
  return this.updateMany(
    { _id: { $in: messageIds } },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

messageSchema.statics.deleteMessages = async function(chatId, userId) {
  return this.updateMany(
    { 
      chatId,
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    },
    { 
      'metadata.deleted': true,
      'metadata.deletedAt': new Date()
    }
  );
};

// Middleware para logging
messageSchema.pre('save', function(next) {
  console.log(`💬 Saving message: ${this.chatId} - ${this.sender} -> ${this.recipient}`);
  next();
});

messageSchema.post('save', function(doc) {
  console.log(`💬 Message saved: ${doc._id}`);
});

module.exports = mongoose.model('Message', messageSchema);
