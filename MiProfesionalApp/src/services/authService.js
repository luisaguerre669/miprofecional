/**
 * Auth Service - Autenticación segura para iOS/Android
 * Usa Capacitor Preferences para almacenamiento local seguro
 */
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL || 'https://miprofesional-backend.onrender.com';

/**
 * Guardar token de forma segura
 */
export async function saveToken(token) {
  try {
    await Preferences.set({
      key: 'auth_token',
      value: token
    });
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
}

/**
 * Obtener token almacenado
 */
export async function getToken() {
  try {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Eliminar token (logout)
 */
export async function removeToken() {
  try {
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'refresh_token' });
    await Preferences.remove({ key: 'user_data' });
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
}

/**
 * Guardar datos de usuario
 */
export async function saveUserData(userData) {
  try {
    await Preferences.set({
      key: 'user_data',
      value: JSON.stringify(userData)
    });
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

/**
 * Obtener datos de usuario
 */
export async function getUserData() {
  try {
    const { value } = await Preferences.get({ key: 'user_data' });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Verificar si hay sesión activa
 */
export async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}

/**
 * Login con email y contraseña
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    
    // Guardar tokens
    await saveToken(data.token);
    if (data.refreshToken) {
      await Preferences.set({ key: 'refresh_token', value: data.refreshToken });
    }
    await saveUserData(data.user);
    
    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Registro de usuario
 */
export async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al registrarse');
    }
    
    // Guardar tokens
    await saveToken(data.token);
    if (data.refreshToken) {
      await Preferences.set({ key: 'refresh_token', value: data.refreshToken });
    }
    await saveUserData(data.user);
    
    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logout
 */
export async function logout() {
  try {
    const token = await getToken();
    
    // Notificar al backend
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => {}); // Ignorar errores de red
    }
    
    // Limpiar almacenamiento local
    await removeToken();
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Refrescar token
 */
export async function refreshToken() {
  try {
    const { value: refreshTokenValue } = await Preferences.get({ key: 'refresh_token' });
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al refrescar token');
    }
    
    await saveToken(data.token);
    if (data.refreshToken) {
      await Preferences.set({ key: 'refresh_token', value: data.refreshToken });
    }
    
    return { success: true, token: data.token };
  } catch (error) {
    console.error('Refresh token error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * API client con auth automático
 */
export async function apiClient(endpoint, options = {}) {
  const token = await getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };
  
  let response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Si el token expiró, intentar refrescar
  if (response.status === 401) {
    const refreshResult = await refreshToken();
    
    if (refreshResult.success) {
      // Reintentar con nuevo token
      config.headers['Authorization'] = `Bearer ${refreshResult.token}`;
      response = await fetch(`${API_URL}${endpoint}`, config);
    } else {
      // Token inválido, hacer logout
      await logout();
      window.location.href = '/login';
    }
  }
  
  return response;
}
