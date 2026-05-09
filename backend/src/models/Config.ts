import mongoose, { Schema, Document } from 'mongoose';

// Interface para configuración de la aplicación
export interface IConfig extends Document {
  section: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: 'payment' | 'subscription' | 'notification' | 'ui' | 'system' | 'security';
  isPublic: boolean; // Si puede ser accedida por el frontend
  isEditable: boolean; // Si puede ser editada en la consola
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema de Config
const ConfigSchema = new Schema<IConfig>({
  section: {
    type: String,
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['payment', 'subscription', 'notification', 'ui', 'system', 'security'],
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    options: [String]
  }
}, {
  timestamps: true,
  collection: 'configs'
});

// Índices compuestos
ConfigSchema.index({ section: 1, key: 1 }, { unique: true });
ConfigSchema.index({ category: 1, isPublic: 1 });
ConfigSchema.index({ isEditable: 1 });

// Métodos estáticos
ConfigSchema.statics.getConfig = function(section: string, key?: string) {
  const query: any = { section };
  if (key) query.key = key;
  
  return this.find(query).sort({ key: 1 });
};

ConfigSchema.statics.getPublicConfigs = function(category?: string) {
  const query: any = { isPublic: true };
  if (category) query.category = category;
  
  return this.find(query).sort({ section: 1, key: 1 });
};

ConfigSchema.statics.getConfigValue = function(section: string, key: string, defaultValue?: any) {
  return this.findOne({ section, key })
    .then(config => config ? config.value : defaultValue);
};

ConfigSchema.statics.setConfig = function(section: string, key: string, value: any, type?: string) {
  return this.findOneAndUpdate(
    { section, key },
    { 
      value, 
      type: type || typeof value,
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );
};

ConfigSchema.statics.getCategoryConfigs = function(category: string) {
  return this.find({ category }).sort({ section: 1, key: 1 });
};

// Método para validar valor según reglas
ConfigSchema.methods.validateValue = function(value: any): { isValid: boolean; error?: string } {
  if (!this.validation) return { isValid: true };
  
  const { min, max, pattern, options } = this.validation;
  
  // Validación de rango para números
  if (this.type === 'number' && (typeof value === 'number' || !isNaN(value))) {
    const numValue = Number(value);
    if (min !== undefined && numValue < min) {
      return { isValid: false, error: `Value must be at least ${min}` };
    }
    if (max !== undefined && numValue > max) {
      return { isValid: false, error: `Value must be at most ${max}` };
    }
  }
  
  // Validación de patrón para strings
  if (this.type === 'string' && pattern && typeof value === 'string') {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return { isValid: false, error: `Value does not match required pattern` };
    }
  }
  
  // Validación de opciones
  if (options && options.length > 0) {
    if (!options.includes(value)) {
      return { isValid: false, error: `Value must be one of: ${options.join(', ')}` };
    }
  }
  
  return { isValid: true };
};

// Exportar el modelo
export const Config = mongoose.model<IConfig>('Config', ConfigSchema);

export default Config;
