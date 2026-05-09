// Mobile API Service - Conexión entre frontend móvil y backend
// Servicio para conectar la app móvil con el backend real

const axios = require('axios');
const jwt = require('jsonwebtoken');

class MobileApiService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
    this.timeout = 10000;
    
    // Configurar axios defaults
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`🔗 Mobile API Service initialized: ${this.baseURL}`);
  }

  /**
   * Autenticación de usuario
   */
  async login(email, password) {
    try {
      console.log(`🔑 Attempting login for: ${email}`);
      
      const response = await this.axios.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.data.success && response.data.token) {
        // Guardar token en localStorage o AsyncStorage
        await this.saveToken(response.data.token);
        console.log('✅ Login successful');
        return { success: true, user: response.data.user, token: response.data.token };
      }
      
      return { success: false, error: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(userData) {
    try {
      console.log(`📝 Registering new user: ${userData.email}`);
      
      const response = await this.axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        console.log('✅ Registration successful');
        return { success: true, user: response.data.user };
      }
      
      return { success: false, error: response.data.message || 'Registration failed' };
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Obtener perfil de usuario
   */
  async getUserProfile(token) {
    try {
      const response = await this.axios.get('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, profile: response.data };
    } catch (error) {
      console.error('❌ Profile error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Obtener categorías de servicios
   */
  async getCategories() {
    try {
      const response = await this.axios.get('/api/categories');
      
      return { success: true, categories: response.data };
    } catch (error) {
      console.error('❌ Categories error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Buscar profesionales cercanos
   */
  async searchNearbyProfessionals(lat, lng, radius = 5000, category = null) {
    try {
      const params = { lat, lng, radius };
      if (category) params.category = category;
      
      const response = await this.axios.get('/api/professionals/nearby', { params });
      
      return { success: true, professionals: response.data };
    } catch (error) {
      console.error('❌ Search error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Crear nueva reserva
   */
  async createBooking(bookingData, token) {
    try {
      const response = await this.axios.post('/api/bookings', bookingData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, booking: response.data };
    } catch (error) {
      console.error('❌ Booking error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Obtener reservas del usuario
   */
  async getUserBookings(token, status = null, limit = 20, skip = 0) {
    try {
      const params = { limit, skip };
      if (status) params.status = status;
      
      const response = await this.axios.get('/api/bookings', {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, bookings: response.data };
    } catch (error) {
      console.error('❌ Bookings error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Actualizar reserva
   */
  async updateBooking(bookingId, updateData, token) {
    try {
      const response = await this.axios.put(`/api/bookings/${bookingId}`, updateData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, booking: response.data };
    } catch (error) {
      console.error('❌ Update booking error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Cancelar reserva
   */
  async cancelBooking(bookingId, token) {
    try {
      const response = await this.axios.delete(`/api/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('❌ Cancel booking error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Agregar profesional a favoritos
   */
  async addToFavorites(professionalId, token) {
    try {
      const response = await this.axios.post('/api/favorites', { professionalId }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('❌ Add to favorites error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Obtener favoritos del usuario
   */
  async getFavorites(token) {
    try {
      const response = await this.axios.get('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: true, favorites: response.data };
    } catch (error) {
      console.error('❌ Get favorites error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  /**
   * Verificar validez del token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  /**
   * Guardar token (implementación básica)
   */
  async saveToken(token) {
    // En React Native, esto usaría AsyncStorage
    // Por ahora, solo logueamos
    console.log('💾 Token saved:', token.substring(0, 20) + '...');
  }

  /**
   * Obtener token guardado
   */
  async getSavedToken() {
    // En React Native, esto usaría AsyncStorage
    return null; // Implementar según el storage
  }

  /**
   * Health check del backend
   */
  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      
      return { 
        healthy: true, 
        status: response.data.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Health check error:', error.message);
      return { 
        healthy: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getSystemStats() {
    try {
      const response = await this.axios.get('/api/stats');
      
      return { success: true, stats: response.data };
    } catch (error) {
      console.error('❌ Stats error:', error.response?.data?.message || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }
}

module.exports = MobileApiService;
