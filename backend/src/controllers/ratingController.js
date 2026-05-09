// Rating Controller - Sistema de calificaciones y reseñas
// Controlador para gestionar calificaciones de profesionales

const Professional = require('../models/Professional');
const User = require('../models/User');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

class RatingController {
  /**
   * Crear nueva calificación
   */
  async createRating(req, res) {
    try {
      const { 
        professionalId, 
        rating, 
        review, 
        bookingId,
        categories = {
          professionalism: 0,
          quality: 0,
          punctuality: 0,
          communication: 0
        }
      } = req.body;
      
      const userId = req.usuario.id;
      
      console.log(`⭐ Creating rating: user=${userId}, professional=${professionalId}, rating=${rating}`);
      
      // Validar datos
      if (!professionalId || !rating || !review || !bookingId) {
        return res.status(400).json({
          success: false,
          error: 'Professional ID, rating, review, and booking ID are required'
        });
      }
      
      // Validar rango de calificación
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }
      
      // Verificar que la reserva existe y pertenece al usuario
      const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
        professional: professionalId,
        status: 'completed'
      });
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found or not completed'
        });
      }
      
      // Verificar que el profesional existe
      const professional = await Professional.findById(professionalId);
      if (!professional) {
        return res.status(404).json({
          success: false,
          error: 'Professional not found'
        });
      }
      
      // Verificar que el usuario ya no ha calificado este profesional por esta reserva
      const existingRating = await require('../models/Rating').findOne({
        user: userId,
        professional: professionalId,
        booking: bookingId
      });
      
      if (existingRating) {
        return res.status(400).json({
          success: false,
          error: 'You have already rated this professional for this booking'
        });
      }
      
      // Crear nueva calificación
      const Rating = require('../models/Rating');
      const newRating = new Rating({
        user: userId,
        professional: professionalId,
        booking: bookingId,
        rating: parseFloat(rating),
        review: review.trim(),
        categories: categories,
        status: 'published',
        createdAt: new Date()
      });
      
      await newRating.save();
      
      // Actualizar estadísticas del profesional
      await this.updateProfessionalStats(professionalId);
      
      // Obtener calificación actualizada
      const updatedProfessional = await Professional.findById(professionalId)
        .select('stats.rating stats.reviewCount stats.totalRatings');
      
      res.status(201).json({
        success: true,
        data: {
          id: newRating._id,
          rating: newRating.rating,
          review: newRating.review,
          categories: newRating.categories,
          createdAt: newRating.createdAt,
          professional: {
            id: updatedProfessional._id,
            businessName: updatedProfessional.businessName,
            stats: updatedProfessional.stats
          }
        },
        message: 'Rating created successfully'
      });
      
    } catch (error) {
      console.error('❌ Create rating error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create rating'
      });
    }
  }

  /**
   * Obtener calificaciones de un profesional
   */
  async getProfessionalRatings(req, res) {
    try {
      const { professionalId } = req.params;
      const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      console.log(`⭐ Getting ratings for professional: ${professionalId}`);
      
      // Validar parámetros
      const parsedLimit = Math.min(parseInt(limit) || 20, 100);
      const parsedSkip = Math.max(parseInt(skip) || 0, 0);
      
      // Obtener calificaciones con populate
      const Rating = require('../models/Rating');
      const ratings = await Rating.find({ professional: professionalId })
        .populate('user', 'name profileImage')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(parsedSkip)
        .limit(parsedLimit)
        .lean();
      
      // Obtener total
      const total = await Rating.countDocuments({ professional: professionalId });
      
      // Calcular estadísticas
      const allRatings = await Rating.find({ professional: professionalId })
        .select('rating')
        .lean();
      
      const stats = this.calculateRatingStats(allRatings);
      
      res.status(200).json({
        success: true,
        data: ratings,
        pagination: {
          total,
          limit: parsedLimit,
          skip: parsedSkip,
          pages: Math.ceil(total / parsedLimit),
          hasMore: parsedSkip + parsedLimit < total
        },
        stats,
        filters: {
          sortBy,
          sortOrder
        }
      });
      
    } catch (error) {
      console.error('❌ Get ratings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get ratings'
      });
    }
  }

  /**
   * Obtener calificaciones del usuario
   */
  async getUserRatings(req, res) {
    try {
      const userId = req.usuario.id;
      const { limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      console.log(`⭐ Getting user ratings: ${userId}`);
      
      const Rating = require('../models/Rating');
      const ratings = await Rating.find({ user: userId })
        .populate('professional', 'businessName profession contact.phone location.address')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(parseInt(skip) || 0)
        .limit(parseInt(limit) || 20)
        .lean();
      
      const total = await Rating.countDocuments({ user: userId });
      
      res.status(200).json({
        success: true,
        data: ratings,
        pagination: {
          total,
          limit: parseInt(limit) || 20,
          skip: parseInt(skip) || 0,
          pages: Math.ceil(total / (parseInt(limit) || 20)),
          hasMore: (parseInt(skip) || 0) + (parseInt(limit) || 20) < total
        }
      });
      
    } catch (error) {
      console.error('❌ Get user ratings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user ratings'
      });
    }
  }

  /**
   * Actualizar calificación
   */
  async updateRating(req, res) {
    try {
      const { ratingId } = req.params;
      const { rating, review, categories } = req.body;
      const userId = req.usuario.id;
      
      console.log(`⭐ Updating rating: ${ratingId} by user ${userId}`);
      
      const Rating = require('../models/Rating');
      const existingRating = await Rating.findOne({
        _id: ratingId,
        user: userId
      });
      
      if (!existingRating) {
        return res.status(404).json({
          success: false,
          error: 'Rating not found or you do not have permission to update it'
        });
      }
      
      // Validar que el usuario sea el dueño de la calificación
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }
      
      // Actualizar calificación
      const updateData = {
        updatedAt: new Date()
      };
      
      if (rating !== undefined) updateData.rating = parseFloat(rating);
      if (review !== undefined) updateData.review = review.trim();
      if (categories !== undefined) updateData.categories = categories;
      
      const updatedRating = await Rating.findByIdAndUpdate(
        ratingId,
        updateData,
        { new: true }
      ).populate('professional', 'businessName');
      
      // Actualizar estadísticas del profesional si cambió el rating
      if (rating !== undefined) {
        await this.updateProfessionalStats(existingRating.professional);
      }
      
      res.status(200).json({
        success: true,
        data: updatedRating,
        message: 'Rating updated successfully'
      });
      
    } catch (error) {
      console.error('❌ Update rating error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update rating'
      });
    }
  }

  /**
   * Eliminar calificación
   */
  async deleteRating(req, res) {
    try {
      const { ratingId } = req.params;
      const userId = req.usuario.id;
      
      console.log(`⭐ Deleting rating: ${ratingId} by user ${userId}`);
      
      const Rating = require('../models/Rating');
      const existingRating = await Rating.findOne({
        _id: ratingId,
        user: userId
      });
      
      if (!existingRating) {
        return res.status(404).json({
          success: false,
          error: 'Rating not found or you do not have permission to delete it'
        });
      }
      
      await Rating.findByIdAndDelete(ratingId);
      
      // Actualizar estadísticas del profesional
      await this.updateProfessionalStats(existingRating.professional);
      
      res.status(200).json({
        success: true,
        message: 'Rating deleted successfully'
      });
      
    } catch (error) {
      console.error('❌ Delete rating error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete rating'
      });
    }
  }

  /**
   * Obtener estadísticas de calificaciones
   */
  async getRatingStats(req, res) {
    try {
      const { professionalId } = req.params;
      
      console.log(`⭐ Getting rating stats for professional: ${professionalId}`);
      
      const Rating = require('../models/Rating');
      const ratings = await Rating.find({ professional: professionalId })
        .select('rating categories.professionalism categories.quality categories.punctuality categories.communication')
        .lean();
      
      const stats = this.calculateRatingStats(ratings);
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Get rating stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rating stats'
      });
    }
  }

  /**
   * Calcular estadísticas de calificaciones
   */
  calculateRatingStats(ratings) {
    if (!ratings || ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
    
    // Distribución de calificaciones
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      const ratingKey = Math.round(r.rating).toString();
      if (ratingDistribution[ratingKey] !== undefined) {
        ratingDistribution[ratingKey]++;
      }
    });
    
    // Promedios por categoría
    const categorySums = {
      professionalism: { sum: 0, count: 0 },
      quality: { sum: 0, count: 0 },
      punctuality: { sum: 0, count: 0 },
      communication: { sum: 0, count: 0 }
    };
    
    ratings.forEach(r => {
      if (r.categories) {
        Object.keys(r.categories).forEach(category => {
          if (categorySums[category]) {
            categorySums[category].sum += r.categories[category];
            categorySums[category].count++;
          }
        });
      }
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
      ratingDistribution,
      categoryAverages
    };
  }

  /**
   * Actualizar estadísticas del profesional
   */
  async updateProfessionalStats(professionalId) {
    try {
      const Rating = require('../models/Rating');
      const ratings = await Rating.find({ professional: professionalId })
        .select('rating')
        .lean();
      
      const stats = this.calculateRatingStats(ratings);
      
      await Professional.findByIdAndUpdate(professionalId, {
        'stats.rating': stats.averageRating,
        'stats.reviewCount': stats.totalRatings,
        'stats.totalRatings': stats.totalRatings,
        'stats.ratingDistribution': stats.ratingDistribution,
        'stats.categoryAverages': stats.categoryAverages
      });
      
    } catch (error) {
      console.error('❌ Error updating professional stats:', error);
    }
  }

  /**
   * Obtener calificaciones para móviles (optimizado)
   */
  async getMobileRatings(req, res) {
    try {
      const { professionalId } = req.params;
      const { limit = 10, skip = 0 } = req.query;
      
      console.log(`📱 Getting mobile ratings for professional: ${professionalId}`);
      
      const Rating = require('../models/Rating');
      const ratings = await Rating.find({ professional: professionalId })
        .select('rating review createdAt')
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(parseInt(skip) || 0)
        .limit(parseInt(limit) || 10)
        .lean();
      
      // Optimizar para móvil
      const mobileRatings = ratings.map(rating => ({
        id: rating._id,
        rating: rating.rating,
        review: rating.review.substring(0, 200) + (rating.review.length > 200 ? '...' : ''),
        createdAt: rating.createdAt,
        formattedDate: new Date(rating.createdAt).toLocaleDateString('es-AR'),
        user: {
          name: rating.user.name,
          profileImage: rating.user.profileImage ? `${rating.user.profileImage}?w=50&h=50&fit=crop&auto=format` : ''
        }
      }));
      
      const total = await Rating.countDocuments({ professional: professionalId });
      
      res.status(200).json({
        success: true,
        data: mobileRatings,
        pagination: {
          total,
          limit: parseInt(limit) || 10,
          skip: parseInt(skip) || 0,
          hasMore: (parseInt(skip) || 0) + (parseInt(limit) || 10) < total
        }
      });
      
    } catch (error) {
      console.error('❌ Get mobile ratings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get mobile ratings'
      });
    }
  }
}

module.exports = new RatingController();
