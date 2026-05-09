// API Client for MiProfesional App connected to backend
import DOMPurify from 'dompurify';

// La URL base de la API debe venir SIEMPRE de las variables de entorno.
// Si no existe, usamos una ruta relativa basada en el origin actual para web,
// o un fallback local. NUNCA usar localhost en producción o Capacitor.
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback inteligente para web: usar el mismo dominio actual
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  
  // Último recurso (solo funcionará en navegador local, fallará en Capacitor)
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  removeToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated() {
    return Boolean(this.getToken());
  }

  sanitizeInput(input) {
    if (typeof input === 'string') {
      return DOMPurify.sanitize(input);
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }

  async processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken }
    });
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      signal: AbortSignal.timeout(options.timeout || 10000), // 10s timeout
      ...options
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(this.sanitizeInput(config.body));
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;

      if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
        // Token expired, try to refresh
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          try {
            const refreshResponse = await this.refreshToken();
            const newToken = refreshResponse.accessToken;
            this.setToken(newToken);

            // Retry original request with new token
            this.isRefreshing = false;
            this.processQueue(null, newToken);
            return this.request(endpoint, options, retryCount);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.processQueue(refreshError, null);
            this.removeToken();
            window.location.href = '/login'; // Redirect to login
            const error = new Error('Session expired. Please login again.');
            error.cause = refreshError;
            throw error;
          }
        } else {
          // Wait for refresh to complete
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => this.request(endpoint, options, retryCount));
        }
      }

      if (!response.ok) {
        const message = data?.message || `HTTP Error ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TimeoutError' && retryCount < 2) {
        // Retry on timeout, up to 2 times
        return this.request(endpoint, options, retryCount + 1);
      }

      console.error('API request failed:', error);
      throw error;
    }
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  }



  async getProfile() {
    return this.request('/auth/me');
  }

  async getFeaturedProfessionals(limit = 10) {
    return this.request(`/professionals/featured?limit=${encodeURIComponent(limit)}`);
  }

  async searchProfessionals(params = {}) {
    const urlParams = new URLSearchParams(params);
    return this.request(`/professionals/search?${urlParams.toString()}`);
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: bookingData
    });
  }

  async getBookings(status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/bookings${query}`);
  }

  async registerProfessional(professionalData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: professionalData
    });
  }
}

const apiClient = new ApiClient();

export default apiClient;
