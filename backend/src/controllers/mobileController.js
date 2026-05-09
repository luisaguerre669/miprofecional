// Mobile Controller - Endpoints específicos para la app móvil
// Controlador optimizado para conexión con aplicación móvil

const User = require('../models/User');
const Professional = require('../models/Professional');
const Category = require('../models/Category');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

class MobileController {
  /**
   * Health check específico para móvil
   */
  async mobileHealth(req, res) {
    try {
      console.log('📱 Mobile health check requested');
      
      const health = {
        status: 'ok',
        service: 'MiProfesional Mobile API',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          auth: '/api/mobile/auth/*',
          categories: '/api/mobile/categories',
          professionals: '/api/mobile/professionals/nearby',
          bookings: '/api/mobile/bookings',
          profile: '/api/mobile/profile'
        }
      };
      
      res.status(200).json({
        success: true,
        data: health
      });
      
    } catch (error) {
      console.error('❌ Mobile health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Mobile health check failed'
      });
    }
  }

  /**
   * Obtener categorías optimizadas para móvil
   */
  async getMobileCategories(req, res) {
    try {
      console.log('📱 Getting mobile categories');
      
      const categories = await Category.find({ isActive: true })
        .select('title description imageUrl icon count')
        .lean();
      
      // Optimizar para móvil: incluir solo campos necesarios
      const mobileCategories = categories.map(cat => ({
        id: cat._id,
        title: cat.title,
        description: cat.description || '',
        imageUrl: cat.imageUrl || '',
        icon: cat.icon || '',
        count: cat.count || 0,
        // Optimización: imagen optimizada para móvil
        mobileImageUrl: cat.imageUrl ? `${cat.imageUrl}?w=200&h=150&fit=crop&auto=format` : ''
      }));
      
      res.status(200).json({
        success: true,
        data: mobileCategories,
        count: mobileCategories.length
      });
      
    } catch (error) {
      console.error('❌ Get mobile categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get categories'
      });
    }
  }

  /**
   * Búsqueda de profesionales optimizada para móvil
   */
  async searchMobileProfessionals(req, res) {
    try {
      const { 
        lat, 
        lng, 
        radius = 5000, 
        category = null,
        limit = 20,
        skip = 0,
        sortBy = 'distance'
      } = req.query;
      
      console.log(`📱 Mobile search: lat=${lat}, lng=${lng}, radius=${radius}`);
      
      // Validar coordenadas
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Coordinates are required'
        });
      }
      
      // Construir query optimizado
      const query = {
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(radius)
          }
        }
      };
      
      if (category) {
        query.categoryId = category;
      }
      
      // Query optimizado con lean() y proyecciones específicas
      const professionals = await Professional.find(query)
        .select('businessName profession contact.phone location.address location.city location.coordinates verification.isVerified stats.rating stats.reviewCount pricing.hourlyRate imageUrl')
        .populate('categoryId', 'title')
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();
      
      // Calcular distancias y optimizar para móvil
      const mobileProfessionals = professionals.map(prof => {
        const R = 6371000; // Earth's radius in meters
        const lat1 = parseFloat(lat) * Math.PI / 180;
        const lat2 = prof.location.coordinates[1] * Math.PI / 180;
        const deltaLat = (prof.location.coordinates[1] - parseFloat(lat)) * Math.PI / 180;
        const deltaLng = (prof.location.coordinates[0] - parseFloat(lng)) * Math.PI / 180;
        
        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
          id: prof._id,
          businessName: prof.businessName,
          profession: prof.profession,
          phone: prof.contact.phone,
          address: prof.location.address,
          city: prof.location.city,
          distance: Math.round(distance),
          distanceKm: (distance / 1000).toFixed(1),
          rating: prof.stats.rating || 0,
          reviewCount: prof.stats.reviewCount || 0,
          hourlyRate: prof.pricing.hourlyRate || 0,
          isVerified: prof.verification.isVerified || false,
          category: prof.categoryId?.title || '',
          // Optimización: imágenes optimizadas para móvil
          imageUrl: prof.imageUrl ? `${prof.imageUrl}?w=150&h=150&fit=crop&auto=format` : '',
          mobileImageUrl: prof.imageUrl ? `${prof.imageUrl}?w=300&h=200&fit=crop&auto=format` : ''
        };
      });
      
      // Ordenar por distancia o rating
      if (sortBy === 'rating') {
        mobileProfessionals.sort((a, b) => b.rating - a.rating);
      } else {
        mobileProfessionals.sort((a, b) => a.distance - b.distance);
      }
      
      res.status(200).json({
        success: true,
        data: mobileProfessionals,
        count: mobileProfessionals.length,
        searchParams: { lat, lng, radius, category, limit, skip }
      });
      
    } catch (error) {
      console.error('❌ Mobile search error:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed'
      });
    }
  }

  /**
   * Crear reserva desde móvil
   */
  async createMobileBooking(req, res) {
    try {
      const {
        professionalId,
        service,
        date,
        time,
        duration = 60,
        notes = '',
        address,
        location
      } = req.body;
      
      const userId = req.usuario.id;
      
      console.log(`📱 Creating mobile booking: user=${userId}, professional=${professionalId}`);
      
      // Validar datos mínimos
      if (!professionalId || !service || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }
      
      // Crear booking optimizado para móvil
      const booking = new Booking({
        user: userId,
        professional: professionalId,
        service,
        date: new Date(date),
        time,
        duration: parseInt(duration),
        notes,
        address,
        location,
        status: 'pending',
        source: 'mobile' // Marcar como creado desde móvil
      });
      
      await booking.save();
      
      // Populate para respuesta móvil
      await booking.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'professional', select: 'businessName profession contact.phone' }
      ]);
      
      res.status(201).json({
        success: true,
        data: {
          id: booking._id,
          service: booking.service,
          date: booking.date,
          time: booking.time,
          duration: booking.duration,
          status: booking.status,
          professional: booking.professional,
          createdAt: booking.createdAt
        },
        message: 'Booking created successfully'
      });
      
    } catch (error) {
      console.error('❌ Create mobile booking error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create booking'
      });
    }
  }

  /**
   * Obtener reservas del usuario optimizado para móvil
   */
  async getMobileBookings(req, res) {
    try {
      const { 
        status = null, 
        limit = 20, 
        skip = 0, 
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query;
      
      const userId = req.usuario.id;
      
      console.log(`📱 Getting mobile bookings: user=${userId}, status=${status}`);
      
      // Validar parámetros
      const parsedLimit = Math.min(parseInt(limit) || 20, 100);
      const parsedSkip = Math.max(parseInt(skip) || 0, 0);
      
      // Construir query
      const query = { user: userId };
      if (status) {
        query.status = status;
      }
      
      // Query optimizado para móvil
      const bookings = await Booking.find(query)
        .select('service date time duration status notes createdAt')
        .populate({
          path: 'professional',
          select: 'businessName profession contact.phone location.address location.city',
          match: { isActive: true },
          options: { lean: true }
        })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(parsedSkip)
        .limit(parsedLimit)
        .lean();
      
      // Filtrar profesionales no activos
      const activeBookings = bookings.filter(booking => booking.professional);
      
      // Optimizar para móvil
      const mobileBookings = activeBookings.map(booking => ({
        id: booking._id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        status: booking.status,
        notes: booking.notes || '',
        professional: {
          businessName: booking.professional.businessName,
          profession: booking.professional.profession,
          phone: booking.professional.contact.phone,
          address: booking.professional.location.address,
          city: booking.professional.location.city
        },
        createdAt: booking.createdAt,
        // Formatear para móvil
        formattedDate: new Date(booking.date).toLocaleDateString('es-AR'),
        formattedTime: booking.time || '',
        statusColor: this.getStatusColor(booking.status)
      }));
      
      // Obtener total
      const total = await Booking.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: mobileBookings,
        pagination: {
          total,
          limit: parsedLimit,
          skip: parsedSkip,
          pages: Math.ceil(total / parsedLimit),
          hasMore: parsedSkip + parsedLimit < total
        },
        filters: {
          status,
          sortBy,
          sortOrder
        }
      });
      
    } catch (error) {
      console.error('❌ Get mobile bookings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bookings'
      });
    }
  }

  /**
   * Obtener perfil de usuario optimizado para móvil
   */
  async getMobileProfile(req, res) {
    try {
      const userId = req.usuario.id;
      
      console.log(`📱 Getting mobile profile: user=${userId}`);
      
      // Obtener usuario con datos optimizados para móvil
      const user = await User.findById(userId)
        .select('name email phone location profileImage createdAt')
        .lean();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Obtener estadísticas del usuario
      const [totalBookings, activeBookings, favorites] = await Promise.all([
        Booking.countDocuments({ user: userId }),
        Booking.countDocuments({ user: userId, status: { $in: ['pending', 'confirmed'] } }),
        // Favorites would need to be implemented
        Promise.resolve([])
      ]);
      
      // Optimizar para móvil
      const mobileProfile = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        location: user.location || {},
        profileImage: user.profileImage ? `${user.profileImage}?w=150&h=150&fit=crop&auto=format` : '',
        stats: {
          totalBookings,
          activeBookings,
          favorites: favorites.length
        },
        memberSince: user.createdAt,
        formattedMemberSince: new Date(user.createdAt).toLocaleDateString('es-AR'),
        // Optimización: información adicional para móvil
        isProfileComplete: !!(user.name && user.email),
        hasActiveBookings: activeBookings > 0,
        notificationSettings: {
          push: true,
          email: true,
          sms: false
        }
      };
      
      res.status(200).json({
        success: true,
        data: mobileProfile
      });
      
    } catch (error) {
      console.error('❌ Get mobile profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  /**
   * Actualizar perfil de usuario desde móvil
   */
  async updateMobileProfile(req, res) {
    try {
      const userId = req.usuario.id;
      const { name, phone, location, profileImage } = req.body;
      
      console.log(`📱 Updating mobile profile: user=${userId}`);
      
      // Construir objeto de actualización
      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (location) updateData.location = location;
      if (profileImage) updateData.profileImage = profileImage;
      
      updateData.updatedAt = new Date();
      
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('name email phone location profileImage');
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
      
    } catch (error) {
      console.error('❌ Update mobile profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  /**
   * Obtener favoritos del usuario
   */
  async getMobileFavorites(req, res) {
    try {
      const userId = req.usuario.id;
      
      console.log(`📱 Getting mobile favorites: user=${userId}`);
      
      // Mock implementation - esto necesitaría un modelo de Favoritos
      const favorites = [];
      
      res.status(200).json({
        success: true,
        data: favorites,
        count: favorites.length
      });
      
    } catch (error) {
      console.error('❌ Get mobile favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get favorites'
      });
    }
  }

  /**
   * Agregar a favoritos
   */
  async addToMobileFavorites(req, res) {
    try {
      const userId = req.usuario.id;
      const { professionalId } = req.body;
      
      console.log(`📱 Adding to favorites: user=${userId}, professional=${professionalId}`);
      
      // Mock implementation
      res.status(200).json({
        success: true,
        message: 'Added to favorites successfully'
      });
      
    } catch (error) {
      console.error('❌ Add to favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to favorites'
      });
    }
  }

  /**
   * Obtener estadísticas para móvil
   */
  async getMobileStats(req, res) {
    try {
      console.log('📱 Getting mobile stats');
      
      const [
        totalUsers,
        totalProfessionals,
        totalBookings,
        activeBookings,
        totalCategories
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Professional.countDocuments({ isActive: true }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
        Category.countDocuments({ isActive: true })
      ]);
      
      const stats = {
        users: {
          total: totalUsers,
          active: totalUsers
        },
        professionals: {
          total: totalProfessionals,
          active: totalProfessionals,
          verified: await Professional.countDocuments({ 'verification.isVerified': true })
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          today: await Booking.countDocuments({
            date: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          })
        },
        categories: totalCategories,
        system: {
          uptime: process.uptime(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Get mobile stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats'
      });
    }
  }

  /**
   * Helper para obtener color de estado
   */
  getStatusColor(status) {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      completed: '#3b82f6',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  }
}

module.exports = new MobileController();
