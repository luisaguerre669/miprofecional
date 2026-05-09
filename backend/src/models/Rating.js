// Rating Model - Sistema de calificaciones y reseñas
// Modelo para calificaciones de profesionales por usuarios

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
  
  // Calificación principal
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  
  // Reseña del usuario
  review: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Categorías de calificación
  categories: {
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    }
  },
  
  // Estado y metadata
  status: {
    type: String,
    enum: ['draft', 'published', 'flagged', 'removed'],
    default: 'draft'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
ratingSchema.index({ user: 1, createdAt: -1 });
ratingSchema.index({ professional: 1, createdAt: -1 });
ratingSchema.index({ booking: 1 });
ratingSchema.index({ professional: 1, rating: -1 });
ratingSchema.index({ status: 1 });

// Virtuals
ratingSchema.virtual('isPublished').get(function() {
  return this.status === 'published';
});

ratingSchema.virtual('averageCategoryRating').get(function() {
  const categories = this.categories;
  const validCategories = Object.values(categories).filter(cat => cat > 0);
  
  if (validCategories.length === 0) return 0;
  
  const sum = validCategories.reduce((acc, cat) => acc + cat, 0);
  return sum / validCategories.length;
});

// Métodos estáticos
ratingSchema.statics.getProfessionalStats = async function(professionalId) {
  const ratings = await this.find({ professional: professionalId, status: 'published' })
    .select('rating categories.professionalism categories.quality categories.punctuality categories.communication')
    .lean();
  
  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      categoryAverages: {
        professionalism: 0,
        quality: 0,
        punctuality: 0,
        communication: 0
      }
    };
  }
  
  const totalRatings = ratings.length;
  const sumRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = sumRating / totalRatings;
  
  // Calcular promedios por categoría
  const categorySums = {
    professionalism: { sum: 0, count: 0 },
    quality: { sum: 0, count: 0 },
    punctuality: { sum: 0, count: 0 },
    communication: { sum: 0, count: 0 }
  };
  
  ratings.forEach(rating => {
    Object.keys(rating.categories).forEach(category => {
      if (rating.categories[category] > 0) {
        categorySums[category].sum += rating.categories[category];
        categorySums[category].count++;
      }
    });
  });
  
  const categoryAverages = {};
  Object.keys(categorySums).forEach(category => {
    if (categorySums[category].count > 0) {
      categoryAverages[category] = categorySums[category].sum / categorySums[category].count;
    }
  });
  
  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalRatings,
    categoryAverages
  };
};

ratingSchema.statics.getUserRatingsSummary = async function(userId) {
  const ratings = await this.find({ user: userId, status: 'published' })
    .populate('professional', 'businessName profession')
    .populate('booking', 'service date')
    .sort({ createdAt: -1 })
    .lean();
  
  return ratings.map(rating => ({
    id: rating._id,
    rating: rating.rating,
    review: rating.review,
    professional: rating.professional,
    booking: rating.booking,
    categories: rating.categories,
    createdAt: rating.createdAt,
    formattedDate: new Date(rating.createdAt).toLocaleDateString('es-AR')
  }));
};

// Middleware para logging
ratingSchema.pre('save', function(next) {
  console.log(`⭐ Saving rating: ${this.rating} for professional ${this.professional}`);
  next();
});

ratingSchema.post('save', function(doc) {
  console.log(`⭐ Rating saved: ${doc._id}`);
});

module.exports = mongoose.model('Rating', ratingSchema);
