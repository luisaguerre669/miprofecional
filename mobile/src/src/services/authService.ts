// Authentication Service for MiProfesional Mobile App

import { apiService } from './api';
import { ApiResponse } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: any;
  location: string;
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
    currency: string;
  };
  membership: {
    type: string;
    expiresAt: string;
    benefits: string[];
  };
  stats: {
    totalBookings: number;
    totalSpent: number;
    favoriteProfessionals: number;
    reviewsGiven: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  location?: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  location?: string;
  avatar?: File;
}

export interface UpdatePreferencesRequest {
  notifications?: boolean;
  emailAlerts?: boolean;
  language?: string;
  currency?: string;
}

class AuthService {
  private currentToken: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    // Initialize from storage (in a real app, this would use AsyncStorage)
    this.initializeFromStorage();
  }

  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Usar API real - conectar con backend simple
      const response = await apiService.post<AuthResponse>('/auth-simple/login', credentials);
      
      if (response.success && response.data) {
        await this.setAuthData(response.data);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        message: 'Error during login',
      };
    }
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Usar API real - conectar con backend simple
      const response = await apiService.post<AuthResponse>('/auth-simple/register', userData);
      
      if (response.success && response.data) {
        await this.setAuthData(response.data);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        message: 'Error during registration',
      };
    }
  }

  // Logout user
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.post<void>('/auth/logout');
      
      if (response.success) {
        await this.clearAuthData();
      }
      
      return response;
    } catch (error) {
      // Even if API call fails, clear local data
      await this.clearAuthData();
      
      return {
        success: true,
        message: 'Logout successful',
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      if (this.currentUser) {
        return {
          success: true,
          data: this.currentUser,
          message: 'Current user retrieved successfully',
        };
      }

      const response = await apiService.get<User>('/auth-simple/profile');
      
      if (response.success && response.data) {
        this.currentUser = response.data;
        await this.saveToStorage();
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
        message: 'Error retrieving current user',
      };
    }
  }

  // Helper methods
  isAuthenticated(): boolean {
    return !!this.currentToken && !!this.currentUser;
  }

  getToken(): string | null {
    return this.currentToken;
  }

  getRefreshToken(): string | null {
    // In a real app, this would be stored securely
    return this.currentToken ? `${this.currentToken}_refresh` : null;
  }

  getCurrentUserSync(): User | null {
    return this.currentUser;
  }

  private async setAuthData(authData: AuthResponse): Promise<void> {
    this.currentToken = authData.token;
    this.currentUser = authData.user;
    await this.saveToStorage();
  }

  private async clearAuthData(): Promise<void> {
    this.currentToken = null;
    this.currentUser = null;
    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    // Usar AsyncStorage real para persistencia
    try {
      const authData = {
        token: this.currentToken,
        user: this.currentUser,
      };
      await AsyncStorage.setItem('authData', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  private async initializeFromStorage(): Promise<void> {
    // Cargar desde AsyncStorage al iniciar
    try {
      const authDataString = await AsyncStorage.getItem('authData');
      if (authDataString) {
        const authData = JSON.parse(authDataString);
        this.currentToken = authData.token;
        this.currentUser = authData.user;
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export singleton instance
export const authService = new AuthService();
