import mongoose, { Schema, Document } from 'mongoose';

// Interface para verificación de identidad
export interface IIdentityVerification extends Document {
  userId: string;
  userType: 'client' | 'professional';
  verificationMethod: 'selfie' | 'whatsapp' | 'messenger' | 'email' | 'google';
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  selfieImage?: string; // Base64 o URL de la imagen
  verificationCode?: string; // Código enviado por WhatsApp/Messenger/Email
  verificationData: {
    phoneNumber?: string;
    email?: string;
    googleId?: string;
    messengerUserId?: string;
    whatsappNumber?: string;
  };
  professionalData?: {
    hasLicense: boolean;
    licenseNumber?: string;
    licenseImage?: string; // Base64 o URL de la matrícula
    professionType?: string;
    licenseExpiryDate?: Date;
    issuingAuthority?: string;
  };
  verificationAttempts: number;
  lastVerificationAttempt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema de IdentityVerification
const IdentityVerificationSchema = new Schema<IIdentityVerification>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['client', 'professional']
  },
  verificationMethod: {
    type: String,
    required: true,
    enum: ['selfie', 'whatsapp', 'messenger', 'email', 'google']
  },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  selfieImage: {
    type: String, // Base64 o URL
    required: function(this: IIdentityVerification) {
      return this.userType === 'professional' || this.verificationMethod === 'selfie';
    }
  },
  verificationCode: {
    type: String,
    required: function(this: IIdentityVerification) {
      return ['whatsapp', 'messenger', 'email'].includes(this.verificationMethod);
    }
  },
  verificationData: {
    phoneNumber: String,
    email: String,
    googleId: String,
    messengerUserId: String,
    whatsappNumber: String
  },
  professionalData: {
    hasLicense: {
      type: Boolean,
      required: function(this: IIdentityVerification) {
        return this.userType === 'professional';
      }
    },
    licenseNumber: String,
    licenseImage: String, // Base64 o URL
    professionType: String,
    licenseExpiryDate: Date,
    issuingAuthority: String
  },
  verificationAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  lastVerificationAttempt: Date,
  verifiedAt: Date,
  rejectedAt: Date,
  rejectionReason: {
    type: String,
    enum: [
      'invalid_selfie',
      'fake_document',
      'license_invalid',
      'license_expired',
      'identity_mismatch',
      'admin_rejection',
      'suspicious_activity',
      'other'
    ]
  },
  adminNotes: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true,
  collection: 'identityVerifications'
});

// Índices
IdentityVerificationSchema.index({ userId: 1, verificationMethod: 1 }, { unique: true });
IdentityVerificationSchema.index({ verificationStatus: 1, userType: 1 });
IdentityVerificationSchema.index({ createdAt: -1 });
IdentityVerificationSchema.index({ verifiedAt: -1 });

// Métodos estáticos
IdentityVerificationSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

IdentityVerificationSchema.statics.findPendingVerifications = function() {
  return this.find({ verificationStatus: 'pending' }).sort({ createdAt: 1 });
};

IdentityVerificationSchema.statics.findVerifiedProfessionals = function() {
  return this.find({ 
    verificationStatus: 'verified', 
    userType: 'professional' 
  }).populate('userId');
};

IdentityVerificationSchema.statics.checkVerificationStatus = function(userId: string) {
  return this.findOne({ 
    userId, 
    verificationStatus: 'verified' 
  });
};

// Métodos de instancia
IdentityVerificationSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationAttempts += 1;
  this.lastVerificationAttempt = new Date();
  return code;
};

IdentityVerificationSchema.methods.isExpired = function() {
  if (this.verificationStatus === 'verified') return false;
  
  const now = new Date();
  const created = new Date(this.createdAt);
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceCreation > 24; // Expira después de 24 horas
};

IdentityVerificationSchema.methods.canRetryVerification = function() {
  return this.verificationAttempts < 10 && !this.isExpired();
};

IdentityVerificationSchema.methods.verify = function() {
  this.verificationStatus = 'verified';
  this.verifiedAt = new Date();
  return this.save();
};

IdentityVerificationSchema.methods.reject = function(reason: string, adminNotes?: string) {
  this.verificationStatus = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  if (adminNotes) this.adminNotes = adminNotes;
  return this.save();
};

// Middleware para validar datos antes de guardar
IdentityVerificationSchema.pre('save', function(next) {
  // Validar que profesionales con matrícula tengan los datos requeridos
  if (this.userType === 'professional' && this.professionalData?.hasLicense) {
    if (!this.professionalData.licenseNumber) {
      next(new Error('El número de matrícula es requerido para profesionales con licencia'));
      return;
    }
    if (!this.professionalData.licenseImage) {
      next(new Error('La imagen de la matrícula es requerida para profesionales con licencia'));
      return;
    }
  }
  
  // Validar que la imagen de selfie esté presente para profesionales
  if (this.userType === 'professional' && !this.selfieImage) {
    next(new Error('La selfie es requerida para profesionales'));
    return;
  }
  
  next();
});

// Exportar el modelo
export const IdentityVerification = mongoose.model<IIdentityVerification>('IdentityVerification', IdentityVerificationSchema);

export default IdentityVerification;
