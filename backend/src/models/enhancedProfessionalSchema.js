const mongoose = require("mongoose");

// 🎯 MODELO MEJORADO DE PROFESIONAL PARA INTEGRACIÓN CON N8N
const enhancedProfessionalSchema = new mongoose.Schema({
  // 📋 INFORMACIÓN BÁSICA
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  email: { 
    type: String, 
    required: true, 
    trim: true, 
    lowercase: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Email inválido'
    }
  },
  telefono: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      },
      message: 'Teléfono debe tener entre 10 y 15 dígitos'
    }
  },

  // 🔧 INFORMACIÓN PROFESIONAL
  profesion: { type: String, required: true, trim: true, maxlength: 100 },
  categoria: { 
    type: String, 
    required: true,
    enum: ['plomeria', 'electricidad', 'construccion', 'pintura', 'jardineria', 'limpieza', 'mecanica', 'otros'],
    lowercase: true,
    trim: true
  },
  descripcion: { type: String, trim: true, maxlength: 1000 },
  experiencia: { type: Number, default: 0, min: 0, max: 50 },
  certificaciones: [{ type: String, trim: true }],
  idiomas: [{ type: String, trim: true, default: 'español' }],

  // 💰 PRECIOS Y DISPONIBILIDAD
  pricing: {
    hourlyRate: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'ARS', enum: ['ARS', 'USD', 'EUR'] },
    pricingModel: { 
      type: String, 
      default: 'hourly',
      enum: ['hourly', 'project', 'daily', 'negotiable']
    }
  },
  disponibilidad: { 
    type: String, 
    default: 'flexible',
    enum: ['inmediata', 'flexible', 'programada', 'fin_de_semana', 'nocturna']
  },
  serviceRadiusKm: { type: Number, default: 10, min: 1, max: 500 },

  // 📍 UBICACIÓN
  location: {
    address: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'Argentina', trim: true },
    postalCode: { type: String, trim: true },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        validate: {
          validator(value) {
            return Array.isArray(value) &&
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90;
          },
          message: "Coordenadas inválidas. Use [longitude, latitude]."
        }
      }
    }
  },

  // 📊 SCORE Y CALIDAD (PROVENIENTE DE IA)
  score_calidad: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100,
    index: true
  },
  validacion_ia: {
    es_valido: { type: Boolean, default: false },
    errores: [{ type: String }],
    validaciones: { type: mongoose.Schema.Types.Mixed },
    fecha_validacion: { type: Date, default: Date.now }
  },
  sugerencias_ia: {
    precio_hora_sugerido: { type: Number },
    descripcion_sugerida: { type: String },
    certificaciones_sugeridas: [{ type: String }],
    fecha_sugerencia: { type: Date, default: Date.now }
  },

  // 🔄 ESTADOS DEL REGISTRO
  verification: {
    status: { 
      type: String, 
      enum: ['unverified', 'pendiente_aprobacion', 'requiere_correccion', 'verified', 'rejected'], 
      default: 'unverified',
      index: true
    },
    isVerified: { type: Boolean, default: false, index: true },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    admin_notes: { type: String }
  },

  // 📈 ESTADÍSTICAS Y RENDIMIENTO
  stats: {
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0, index: true },
    cancelledBookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    averageResponseTime: { type: Number, default: 0 }, // en minutos
    lastActive: { type: Date, default: Date.now }
  },

  // 🎯 VISIBILIDAD Y PROMOCIÓN
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  isPremium: { type: Boolean, default: false },
  profileViews: { type: Number, default: 0 },
  contactRequests: { type: Number, default: 0 },

  // 📸 MULTIMEDIA
  imageUrl: { type: String, default: '' },
  gallery: [{
    url: { type: String },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  portfolio: [{
    title: { type: String, required: true },
    description: { type: String },
    images: [{ type: String }],
    completedAt: { type: Date },
    client: { type: String }
  }],

  // 🔔 NOTIFICACIONES Y COMUNICACIÓN
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  },

  // 📱 INTEGRACIONES EXTERNAS
  integrations: {
    n8n_workflow_id: { type: String },
    webhook_responses: [{
      timestamp: { type: Date, default: Date.now },
      response_data: { type: mongoose.Schema.Types.Mixed },
      success: { type: Boolean }
    }],
    external_ids: { type: mongoose.Schema.Types.Mixed } // Para integraciones futuras
  },

  // 📝 METADATOS Y AUDITORÍA
  metadata: {
    ip_address: { type: String },
    user_agent: { type: String },
    source: { type: String, default: 'web' }, // web, mobile, api
    campaign: { type: String },
    referrer: { type: String }
  },

  // 🕐 TIMESTAMP
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  deletedAt: { type: Date } // Para soft deletes
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 📊 ÍNDICES PARA RENDIMIENTO
enhancedProfessionalSchema.index({ "location.coordinates": "2dsphere" });
enhancedProfessionalSchema.index({ 
  nombre: "text", 
  profesion: "text", 
  categoria: "text", 
  descripcion: "text", 
  "location.city": "text" 
});
enhancedProfessionalSchema.index({ "verification.isVerified": 1, "isActive": 1 });
enhancedProfessionalSchema.index({ isFeatured: 1, "stats.rating": -1 });
enhancedProfessionalSchema.index({ categoria: 1, "location.city": 1 });
enhancedProfessionalSchema.index({ score_calidad: -1 });
enhancedProfessionalSchema.index({ "verification.status": 1, createdAt: -1 });

// 🔄 VIRTUALS
enhancedProfessionalSchema.virtual('status_display').get(function() {
  const statusMap = {
    'unverified': 'No Verificado',
    'pendiente_aprobacion': 'Pendiente de Aprobación',
    'requiere_correccion': 'Requiere Corrección',
    'verified': 'Verificado',
    'rejected': 'Rechazado'
  };
  return statusMap[this.verification.status] || 'Desconocido';
});

enhancedProfessionalSchema.virtual('is_available').get(function() {
  return this.isActive && this.verification.isVerified;
});

enhancedProfessionalSchema.virtual('completion_percentage').get(function() {
  let completed = 0;
  const total = 10;
  
  if (this.descripcion && this.descripcion.length > 50) completed++;
  if (this.experiencia > 0) completed++;
  if (this.pricing.hourlyRate > 0) completed++;
  if (this.location.address) completed++;
  if (this.certificaciones.length > 0) completed++;
  if (this.gallery.length > 0) completed++;
  if (this.portfolio.length > 0) completed++;
  if (this.idiomas.length > 1) completed++;
  if (this.serviceRadiusKm > 10) completed++;
  if (this.isPremium) completed++;
  
  return Math.round((completed / total) * 100);
});

// 🔄 MIDDLEWARES
enhancedProfessionalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Actualizar lastActive si el profesional está activo
  if (this.isModified('stats') && this.isActive) {
    this.stats.lastActive = new Date();
  }
  
  next();
});

// 📊 MÉTODOS ESTÁTICOS
enhancedProfessionalSchema.statics.findByLocation = function(coordinates, maxDistance = 50) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates
        },
        $maxDistance: maxDistance * 1000 // Convertir km a metros
      }
    },
    isActive: true,
    "verification.isVerified": true
  });
};

enhancedProfessionalSchema.statics.findByCategory = function(category, city = null) {
  const query = {
    categoria: category.toLowerCase(),
    isActive: true,
    "verification.isVerified": true
  };
  
  if (city) {
    query["location.city"] = new RegExp(city, 'i');
  }
  
  return this.find(query).sort({ "stats.rating": -1, score_calidad: -1 });
};

enhancedProfessionalSchema.statics.getTopRated = function(limit = 10) {
  return this.find({
    isActive: true,
    "verification.isVerified": true,
    "stats.rating": { $gte: 4 }
  })
  .sort({ "stats.rating": -1, "stats.reviewCount": -1 })
  .limit(limit);
};

// 🔄 MÉTODOS DE INSTANCIA
enhancedProfessionalSchema.methods.updateStats = function(bookingData) {
  if (bookingData.completed) {
    this.stats.completedBookings += 1;
    this.stats.totalEarnings += bookingData.amount || 0;
  } else if (bookingData.cancelled) {
    this.stats.cancelledBookings += 1;
  }
  
  if (bookingData.rating) {
    const totalRating = this.stats.rating * this.stats.reviewCount + bookingData.rating;
    this.stats.reviewCount += 1;
    this.stats.rating = totalRating / this.stats.reviewCount;
  }
  
  return this.save();
};

enhancedProfessionalSchema.methods.addToGallery = function(imageUrl, caption = '') {
  this.gallery.push({
    url: imageUrl,
    caption: caption,
    uploadedAt: new Date()
  });
  return this.save();
};

enhancedProfessionalSchema.methods.addPortfolioItem = function(item) {
  this.portfolio.push({
    ...item,
    completedAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model("Professional", enhancedProfessionalSchema);
