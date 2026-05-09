// Geo Controller - Geolocalización real con mapas
// Controlador para manejar GPS, mapas y búsqueda por ubicación

const Professional = require('../models/Professional');
const User = require('../models/User');
const Category = require('../models/Category');

class GeoController {
  /**
   * Obtener ubicación actual del usuario
   */
  async getCurrentLocation(req, res) {
    try {
      const { lat, lng, accuracy = 0 } = req.body;
      const userId = req.usuario.id;
      
      console.log(`🗺️ Updating user location: ${userId} - ${lat}, ${lng}`);
      
      // Validar coordenadas
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }
      
      // Validar rangos de coordenadas
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates'
        });
      }
      
      // Actualizar ubicación del usuario
      const user = await User.findByIdAndUpdate(
        userId,
        {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          locationAccuracy: parseFloat(accuracy),
          lastLocationUpdate: new Date(),
          locationEnabled: true
        },
        { new: true }
      ).select('name location lastLocationUpdate');
      
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          location: user.location,
          lastLocationUpdate: user.lastLocationUpdate,
          locationEnabled: true
        },
        message: 'Location updated successfully'
      });
      
    } catch (error) {
      console.error('❌ Update location error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update location'
      });
    }
  }

  /**
   * Buscar profesionales por GPS real
   */
  async searchNearbyProfessionals(req, res) {
    try {
      const { 
        lat, 
        lng, 
        radius = 5000, 
        category = null,
        limit = 20,
        skip = 0,
        sortBy = 'distance',
        minRating = 0,
        verified = false
      } = req.query;
      
      console.log(`🗺️ GPS search: lat=${lat}, lng=${lng}, radius=${radius}`);
      
      // Validar coordenadas
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const searchRadius = Math.min(parseInt(radius), 50000); // Máximo 50km
      
      // Construir query geoespacial
      const query = {
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: searchRadius
          }
        }
      };
      
      // Filtros adicionales
      if (category) {
        query.categoryId = category;
      }
      
      if (minRating > 0) {
        query['stats.rating'] = { $gte: parseFloat(minRating) };
      }
      
      if (verified === 'true') {
        query['verification.isVerified'] = true;
      }
      
      // Ejecutar query con geoespacial
      const professionals = await Professional.find(query)
        .select('businessName profession contact.phone contact.email location.address location.city location.coordinates verification.isVerified stats.rating stats.reviewCount pricing.hourlyRate imageUrl description')
        .populate('categoryId', 'title')
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();
      
      // Calcular distancias y enriquecer datos
      const enrichedProfessionals = professionals.map(prof => {
        // Calcular distancia exacta usando Haversine
        const distance = this.calculateDistance(
          latitude, longitude,
          prof.location.coordinates[1],
          prof.location.coordinates[0]
        );
        
        return {
          id: prof._id,
          businessName: prof.businessName,
          profession: prof.profession,
          description: prof.description || '',
          phone: prof.contact.phone,
          email: prof.contact.email,
          address: prof.location.address,
          city: prof.location.city,
          coordinates: {
            lat: prof.location.coordinates[1],
            lng: prof.location.coordinates[0]
          },
          distance: Math.round(distance),
          distanceKm: (distance / 1000).toFixed(1),
          distanceMi: (distance / 1609.34).toFixed(1),
          rating: prof.stats.rating || 0,
          reviewCount: prof.stats.reviewCount || 0,
          hourlyRate: prof.pricing.hourlyRate || 0,
          isVerified: prof.verification.isVerified || false,
          category: prof.categoryId?.title || '',
          // Imágenes optimizadas para móvil
          imageUrl: prof.imageUrl ? `${prof.imageUrl}?w=150&h=150&fit=crop&auto=format` : '',
          largeImageUrl: prof.imageUrl ? `${prof.imageUrl}?w=400&h=300&fit=crop&auto=format` : '',
          availability: this.generateMockAvailability(),
          responseTime: this.generateMockResponseTime(),
          // Formatear para UX
          formattedDistance: this.formatDistance(distance),
          ratingStars: this.generateRatingStars(prof.stats.rating || 0)
        };
      });
      
      // Ordenar resultados
      if (sortBy === 'rating') {
        enrichedProfessionals.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'reviews') {
        enrichedProfessionals.sort((a, b) => b.reviewCount - a.reviewCount);
      } else {
        enrichedProfessionals.sort((a, b) => a.distance - b.distance);
      }
      
      // Obtener total para paginación
      const totalQuery = { ...query };
      delete totalQuery.location.$near.$maxDistance;
      const total = await Professional.countDocuments(totalQuery);
      
      res.status(200).json({
        success: true,
        data: enrichedProfessionals,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: parseInt(skip) + parseInt(limit) < total
        },
        searchParams: {
          center: { lat: latitude, lng: longitude },
          radius: searchRadius,
          category,
          sortBy,
          filters: { minRating, verified }
        },
        mapData: {
          center: { lat: latitude, lng: longitude },
          bounds: this.calculateBounds(latitude, longitude, searchRadius),
          markers: enrichedProfessionals.map(prof => ({
            id: prof.id,
            position: prof.coordinates,
            title: prof.businessName,
            rating: prof.rating,
            isVerified: prof.isVerified
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ GPS search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search nearby professionals'
      });
    }
  }

  /**
   * Obtener profesionales en un área (bounding box)
   */
  async getProfessionalsInArea(req, res) {
    try {
      const { 
        north, 
        south, 
        east, 
        west,
        category = null,
        limit = 50
      } = req.query;
      
      console.log(`🗺️ Area search: bounds=${north},${west},${south},${east}`);
      
      // Validar coordenadas del bounding box
      if (!north || !south || !east || !west) {
        return res.status(400).json({
          success: false,
          error: 'All bounding box coordinates are required (north, south, east, west)'
        });
      }
      
      // Construir query para bounding box
      const query = {
        isActive: true,
        'location.coordinates': {
          $geoWithin: {
            $box: [
              [parseFloat(west), parseFloat(south)], // [minLng, minLat]
              [parseFloat(east), parseFloat(north)]  // [maxLng, maxLat]
            ]
          }
        }
      };
      
      if (category) {
        query.categoryId = category;
      }
      
      const professionals = await Professional.find(query)
        .select('businessName profession location.address location.coordinates stats.rating stats.reviewCount imageUrl')
        .populate('categoryId', 'title')
        .limit(parseInt(limit))
        .lean();
      
      const enrichedProfessionals = professionals.map(prof => ({
        id: prof._id,
        businessName: prof.businessName,
        profession: prof.profession,
        address: prof.location.address,
        coordinates: {
          lat: prof.location.coordinates[1],
          lng: prof.location.coordinates[0]
        },
        rating: prof.stats.rating || 0,
        reviewCount: prof.stats.reviewCount || 0,
        category: prof.categoryId?.title || '',
        imageUrl: prof.imageUrl ? `${prof.imageUrl}?w=100&h=100&fit=crop&auto=format` : ''
      }));
      
      res.status(200).json({
        success: true,
        data: enrichedProfessionals,
        bounds: {
          north: parseFloat(north),
          south: parseFloat(south),
          east: parseFloat(east),
          west: parseFloat(west)
        },
        count: enrichedProfessionals.length
      });
      
    } catch (error) {
      console.error('❌ Area search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get professionals in area'
      });
    }
  }

  /**
   * Obtener direcciones sugeridas (autocomplete)
   */
  async getAddressSuggestions(req, res) {
    try {
      const { query, lat, lng, limit = 10 } = req.query;
      
      console.log(`🗺️ Address suggestions: ${query}`);
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Query must be at least 2 characters long'
        });
      }
      
      // Simular búsqueda de direcciones (integrar con Google Places API)
      const suggestions = [
        {
          id: '1',
          address: 'Av. Corrientes 1234, Buenos Aires, Argentina',
          coordinates: { lat: -34.6037, lng: -58.3816 },
          type: 'address'
        },
        {
          id: '2',
          address: 'Palermo, Buenos Aires, Argentina',
          coordinates: { lat: -34.5884, lng: -58.4085 },
          type: 'neighborhood'
        },
        {
          id: '3',
          address: 'CABA, Argentina',
          coordinates: { lat: -34.6037, lng: -58.3816 },
          type: 'city'
        }
      ].filter(suggestion => 
        suggestion.address.toLowerCase().includes(query.toLowerCase())
      ).slice(0, parseInt(limit));
      
      res.status(200).json({
        success: true,
        data: suggestions,
        query,
        count: suggestions.length
      });
      
    } catch (error) {
      console.error('❌ Address suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get address suggestions'
      });
    }
  }

  /**
   * Geocodificar dirección a coordenadas
   */
  async geocodeAddress(req, res) {
    try {
      const { address } = req.body;
      
      console.log(`🗺️ Geocoding address: ${address}`);
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address is required'
        });
      }
      
      // Simular geocodificación (integrar con Google Geocoding API)
      const geocoded = {
        address: address,
        coordinates: { lat: -34.6037, lng: -58.3816 },
        formattedAddress: 'Av. Corrientes 1234, Buenos Aires, Argentina',
        components: {
          street_number: '1234',
          street: 'Av. Corrientes',
          neighborhood: 'San Nicolás',
          city: 'Buenos Aires',
          state: 'CABA',
          country: 'Argentina',
          postal_code: '1001'
        },
        accuracy: 'high',
        confidence: 0.95
      };
      
      res.status(200).json({
        success: true,
        data: geocoded,
        message: 'Address geocoded successfully'
      });
      
    } catch (error) {
      console.error('❌ Geocode error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to geocode address'
      });
    }
  }

  /**
   * Calcular ruta entre dos puntos
   */
  async calculateRoute(req, res) {
    try {
      const { 
        origin_lat, 
        origin_lng, 
        destination_lat, 
        destination_lng,
        mode = 'driving'
      } = req.query;
      
      console.log(`🗺️ Calculating route: ${origin_lat},${origin_lng} -> ${destination_lat},${destination_lng}`);
      
      // Validar coordenadas
      if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
        return res.status(400).json({
          success: false,
          error: 'Origin and destination coordinates are required'
        });
      }
      
      // Simular cálculo de ruta (integrar con Google Directions API)
      const route = {
        origin: { lat: parseFloat(origin_lat), lng: parseFloat(origin_lng) },
        destination: { lat: parseFloat(destination_lat), lng: parseFloat(destination_lng) },
        mode,
        distance: 5230, // metros
        duration: 12, // minutos
        duration_in_traffic: 15, // minutos con tráfico
        steps: [
          {
            instruction: 'Head northeast on Av. Corrientes',
            distance: 500,
            duration: 2
          },
          {
            instruction: 'Turn right onto Av. 9 de Julio',
            distance: 1200,
            duration: 3
          },
          {
            instruction: 'Turn left onto Av. de Mayo',
            distance: 3530,
            duration: 7
          }
        ],
        polyline: 'encoded_polyline_string_here',
        bounds: {
          northeast: { lat: -34.58, lng: -58.37 },
          southwest: { lat: -34.62, lng: -58.39 }
        }
      };
      
      res.status(200).json({
        success: true,
        data: route,
        message: 'Route calculated successfully'
      });
      
    } catch (error) {
      console.error('❌ Route calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate route'
      });
    }
  }

  /**
   * Calcular distancia usando fórmula Haversine
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en metros
  }

  /**
   * Calcular bounds del mapa
   */
  calculateBounds(lat, lng, radius) {
    const earthRadius = 6371000; // metros
    const latDelta = (radius / earthRadius) * (180 / Math.PI);
    const lngDelta = (radius / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    
    return {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    };
  }

  /**
   * Formatear distancia para UX
   */
  formatDistance(distance) {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Generar estrellas de rating
   */
  generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return {
      full: fullStars,
      half: hasHalfStar ? 1 : 0,
      empty: emptyStars,
      total: rating
    };
  }

  /**
   * Generar disponibilidad mock
   */
  generateMockAvailability() {
    const availability = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
      availability.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('es-AR', { weekday: 'long' }),
        available: Math.random() > 0.3,
        timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].filter(() => Math.random() > 0.5)
      });
    }
    
    return availability;
  }

  /**
   * Generar tiempo de respuesta mock
   */
  generateMockResponseTime() {
    const times = ['Inmediato', '30 min', '1 hora', '2 horas', 'Hoy'];
    return times[Math.floor(Math.random() * times.length)];
  }
}

module.exports = new GeoController();
