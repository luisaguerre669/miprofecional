// 🌐 Cliente API Centralizado - MiProfesional Frontend
import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_PATH = '/api';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_BASE_PATH}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔄 Interceptor para añadir token JWT a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔄 Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Si el token expiró (401), redirigir a login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Mensaje de error amigable
    const errorMessage = error.response?.data?.message || error.message || 'Error en la conexión';
    return Promise.reject(new Error(errorMessage));
  }
);

// 📦 Servicios de autenticación
export const authService = {
  // 🔐 Registro de usuario
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      // Guardar token y usuario si el registro es exitoso
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 🔑 Login de usuario
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Guardar token y usuario en localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 🔄 Refresh token
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      
      // Actualizar token en localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      // Si falla el refresh, limpiar y redirigir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // 🚪 Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage siempre
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // 👤 Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 🔍 Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // 🔄 Obtener token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

// 📦 Servicios de profesionales
export const professionalsService = {
  // 🔍 Obtener todos los profesionales
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/professionals', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📍 Obtener profesionales cercanos
  getNearby: async (lat, lng, params = {}) => {
    try {
      const response = await apiClient.get('/professionals/nearby', { 
        params: { lat, lng, ...params } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 🔍 Buscar profesionales
  search: async (query, params = {}) => {
    try {
      const response = await apiClient.get('/professionals/search', { 
        params: { q: query, ...params } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ⭐ Obtener profesionales destacados
  getFeatured: async (limit = 10) => {
    try {
      const response = await apiClient.get('/professionals/featured', { 
        params: { limit } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ✅ Obtener profesionales verificados
  getVerified: async (limit = 20) => {
    try {
      const response = await apiClient.get('/professionals/verified', { 
        params: { limit } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 🏆 Obtener mejores calificados
  getTopRated: async (limit = 10) => {
    try {
      const response = await apiClient.get('/professionals/top-rated', { 
        params: { limit } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📄 Obtener detalle de profesional por ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/professionals/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// 📦 Servicios de reservas (bookings)
export const bookingsService = {
  // 📅 Crear nueva reserva
  create: async (bookingData) => {
    try {
      const response = await apiClient.post('/bookings', bookingData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📋 Obtener reservas del usuario
  getUserBookings: async (params = {}) => {
    try {
      const response = await apiClient.get('/bookings', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📄 Obtener detalle de reserva por ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ✏️ Actualizar reserva
  update: async (id, updateData) => {
    try {
      const response = await apiClient.put(`/bookings/${id}`, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ❌ Cancelar reserva
  cancel: async (id) => {
    try {
      const response = await bookingsService.update(id, { status: 'cancelled' });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 🗑️ Eliminar reserva
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/bookings/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📅 Obtener reservas próximas
  getUpcoming: async (limit = 10) => {
    try {
      const response = await bookingsService.getUserBookings({ 
        status: 'pending,confirmed', 
        limit,
        sortBy: 'date',
        sortOrder: 'asc'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📊 Obtener estadísticas de reservas
  getStats: async () => {
    try {
      const response = await apiClient.get('/bookings/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// 📦 Servicios para profesionales (dashboard profesional)
export const professionalDashboardService = {
  // 📊 Obtener estadísticas del profesional
  getStats: async () => {
    try {
      const response = await apiClient.get('/professionals/dashboard/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📅 Obtener reservas del profesional
  getBookings: async (params = {}) => {
    try {
      const response = await apiClient.get('/professionals/dashboard/bookings', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📋 Obtener reservas por estado
  getBookingsByStatus: async (status) => {
    try {
      const response = await apiClient.get('/professionals/dashboard/bookings', { 
        params: { status } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ✅ Actualizar estado de reserva
  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await apiClient.put(`/professionals/dashboard/bookings/${bookingId}`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 📅 Obtener calendario de reservas
  getCalendar: async (year, month) => {
    try {
      const response = await apiClient.get('/professionals/dashboard/calendar', { 
        params: { year, month } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ⏰ Actualizar disponibilidad
  updateAvailability: async (availabilityData) => {
    try {
      const response = await apiClient.put('/professionals/dashboard/availability', availabilityData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 👤 Obtener perfil del profesional
  getProfile: async () => {
    try {
      const response = await apiClient.get('/professionals/dashboard/profile');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ✏️ Actualizar perfil del profesional
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/professionals/dashboard/profile', profileData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// 📦 Servicios generales de API
export const apiService = {
  // GET genérico
  get: (url, config = {}) => apiClient.get(url, config),
  
  // POST genérico
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  
  // PUT genérico
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  
  // DELETE genérico
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// Exportar cliente por si se necesita personalizar
export default apiClient;
