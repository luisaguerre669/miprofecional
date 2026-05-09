const mongoose = require("mongoose");

// 📋 MODELO MONGODB DE PROFESIONALES - SIMPLIFICADO Y DIRECTO
const professionalSchema = new mongoose.Schema({
  // 📋 INFORMACIÓN BÁSICA
  nombre: { 
    type: String, 
    required: [true, 'El nombre es requerido'], 
    trim: true, 
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: { 
    type: String, 
    required: [true, 'El email es requerido'], 
    trim: true, 
    lowercase: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'El formato del email es inválido'
    }
  },
  telefono: { 
    type: String, 
    required: [true, 'El teléfono es requerido'],
    validate: {
      validator: function(v) {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      },
      message: 'El teléfono debe tener entre 10 y 15 dígitos'
    }
  },

  // 🔧 INFORMACIÓN PROFESIONAL
  profesion: { 
    type: String, 
    required: [true, 'La profesión es requerida'], 
    trim: true, 
    maxlength: [100, 'La profesión no puede exceder 100 caracteres']
  },
  categoria: { 
    type: String, 
    required: [true, 'La categoría es requerida'],
    enum: {
      values: ['plomeria', 'electricidad', 'construccion', 'pintura', 'jardineria', 'limpieza', 'mecanica', 'otros'],
      message: 'La categoría debe ser una de: plomeria, electricidad, construccion, pintura, jardineria, limpieza, mecanica, otros'
    },
    lowercase: true,
    trim: true
  },
  descripcion: { 
    type: String, 
    trim: true, 
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    default: ''
  },
  experiencia: { 
    type: Number, 
    default: 0, 
    min: [0, 'La experiencia no puede ser negativa'], 
    max: [50, 'La experiencia no puede exceder 50 años']
  },
  certificaciones: [{ 
    type: String, 
    trim: true 
  }],
  idiomas: [{ 
    type: String, 
    trim: true,
    default: 'español'
  }],

  // 💰 PRECIOS Y DISPONIBILIDAD
  precio_hora: { 
    type: Number, 
    default: 0, 
    min: [0, 'El precio por hora no puede ser negativo']
  },
  disponibilidad: { 
    type: String, 
    default: 'flexible',
    enum: ['inmediata', 'flexible', 'programada', 'fin_de_semana', 'nocturna']
  },
  ubicacion: { 
    type: String, 
    trim: true, 
    default: '',
    maxlength: [200, 'La ubicación no puede exceder 200 caracteres']
  },

  // 🤖 RESULTADOS DE N8N (IA)
  score_calidad: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100
  },
  validacion_n8n: {
    es_valido: { type: Boolean, default: false },
    errores: [{ type: String }],
    validaciones: { type: mongoose.Schema.Types.Mixed },
    fecha_validacion: { type: Date, default: Date.now }
  },
  sugerencias_n8n: {
    precio_hora_sugerido: { type: Number },
    descripcion_sugerida: { type: String },
    certificaciones_sugeridas: [{ type: String }],
    fecha_sugerencia: { type: Date, default: Date.now }
  },

  // 🔄 ESTADO DEL REGISTRO
  estado: { 
    type: String, 
    enum: ['pendiente', 'aprobado', 'rechazado', 'requiere_correccion'], 
    default: 'pendiente',
    index: true
  },
  fecha_registro: { 
    type: Date, 
    default: Date.now 
  },
  fecha_aprobacion: { 
    type: Date 
  },
  notas_admin: { 
    type: String, 
    trim: true 
  },

  // 📈 ESTADÍSTICAS INICIALES
  stats: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 }
  },

  // 📱 METADATOS
  ip_address: { type: String },
  user_agent: { type: String },
  source: { type: String, default: 'web' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 📊 ÍNDICES PARA RENDIMIENTO
professionalSchema.index({ email: 1 }, { unique: true });
professionalSchema.index({ estado: 1 });
professionalSchema.index({ categoria: 1 });
professionalSchema.index({ score_calidad: -1 });
professionalSchema.index({ fecha_registro: -1 });
professionalSchema.index({ nombre: "text", profesion: "text", descripcion: "text" });

// 🔄 VIRTUALS
professionalSchema.virtual('estado_display').get(function() {
  const statusMap = {
    'pendiente': 'Pendiente de Aprobación',
    'aprobado': 'Aprobado',
    'rechazado': 'Rechazado',
    'requiere_correccion': 'Requiere Corrección'
  };
  return statusMap[this.estado] || 'Desconocido';
});

professionalSchema.virtual('is_active').get(function() {
  return this.estado === 'aprobado';
});

// 🔄 MIDDLEWARES
professionalSchema.pre('save', function(next) {
  if (this.isModified('estado') && this.estado === 'aprobado') {
    this.fecha_aprobacion = new Date();
  }
  next();
});

// 📊 MÉTODOS ESTÁTICOS
professionalSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

professionalSchema.statics.findByEstado = function(estado) {
  return this.find({ estado }).sort({ fecha_registro: -1 });
};

professionalSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ estado: 'aprobado' })
    .sort({ 'stats.rating': -1, score_calidad: -1 })
    .limit(limit);
};

professionalSchema.statics.findByCategory = function(categoria) {
  return this.find({ 
    categoria: categoria.toLowerCase(), 
    estado: 'aprobado' 
  }).sort({ score_calidad: -1, 'stats.rating': -1 });
};

// 🔄 MÉTODOS DE INSTANCIA
professionalSchema.methods.updateEstado = function(nuevoEstado, notas = '') {
  this.estado = nuevoEstado;
  if (notas) this.notas_admin = notas;
  if (nuevoEstado === 'aprobado') {
    this.fecha_aprobacion = new Date();
  }
  return this.save();
};

professionalSchema.methods.updateFromN8N = function(n8nResponse) {
  this.score_calidad = n8nResponse.score_calidad || 0;
  this.estado = n8nResponse.estado || 'pendiente';
  
  if (n8nResponse.validacion) {
    this.validacion_n8n = {
      es_valido: n8nResponse.validacion.esValido || false,
      errores: n8nResponse.validacion.errores || [],
      validaciones: n8nResponse.validacion.validaciones || {},
      fecha_validacion: new Date()
    };
  }
  
  if (n8nResponse.sugerencias) {
    this.sugerencias_n8n = {
      precio_hora_sugerido: n8nResponse.sugerencias.precio_hora_sugerido,
      descripcion_sugerida: n8nResponse.sugerencias.descripcion_sugerida,
      certificaciones_sugeridas: n8nResponse.sugerencias.certificaciones_sugeridas || [],
      fecha_sugerencia: new Date()
    };
  }
  
  return this.save();
};

// 📋 VALIDACIONES PERSONALIZADAS
professionalSchema.statics.validateEmailUnique = async function(email, excludeId = null) {
  const query = { email: email.toLowerCase().trim() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existing = await this.findOne(query);
  return !existing; // Retorna true si es único (no existe)
};

professionalSchema.statics.validateRequiredFields = function(data) {
  const errors = [];
  const required = ['nombre', 'email', 'telefono', 'profesion', 'categoria'];
  
  required.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`El campo ${field} es requerido`);
    }
  });
  
  return errors;
};

professionalSchema.statics.validateEmailFormat = function(email) {
  const errors = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('El formato del email es inválido');
  }
  return errors;
};

professionalSchema.statics.validatePhoneFormat = function(telefono) {
  const errors = [];
  const digits = telefono.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    errors.push('El teléfono debe tener entre 10 y 15 dígitos');
  }
  return errors;
};

professionalSchema.statics.validateCategory = function(categoria) {
  const errors = [];
  const allowed = ['plomeria', 'electricidad', 'construccion', 'pintura', 'jardineria', 'limpieza', 'mecanica', 'otros'];
  if (!allowed.includes(categoria.toLowerCase())) {
    errors.push(`La categoría debe ser una de: ${allowed.join(', ')}`);
  }
  return errors;
};

// Exportación segura para evitar redefinición del modelo
module.exports = mongoose.models.Professional || mongoose.model('Professional', professionalSchema);
