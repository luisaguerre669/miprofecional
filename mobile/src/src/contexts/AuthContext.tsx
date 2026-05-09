import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  location: string;
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
    currency: string;
  };
  membership: {
    type: 'free' | 'basic' | 'premium';
    expiresAt?: string;
  };
  stats: {
    totalBookings: number;
    totalSpent: number;
    favoriteProfessionals: number;
    reviewsGiven: number;
  };
  isVerified: boolean;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends Omit<AuthState, 'refreshToken'> {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKENS'; payload: { token: string; refreshToken: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        error: null,
      };
    case 'SET_TOKENS':
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedRefreshToken = await AsyncStorage.getItem('auth_refresh_token');
      const storedUser = await AsyncStorage.getItem('auth_user');

      if (storedToken && storedRefreshToken && storedUser) {
        const user = JSON.parse(storedUser);
        
        // Verify token is still valid by checking profile
        try {
          const profileData = await authService.getProfile();
          dispatch({ type: 'SET_USER', payload: profileData });
          dispatch({ type: 'SET_TOKENS', payload: { token: storedToken, refreshToken: storedRefreshToken } });
        } catch (error) {
          // Token is invalid, clear stored data
          await clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const storeAuthData = async (user: User, token: string, refreshToken: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_refresh_token', refreshToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_refresh_token');
      await AsyncStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Error clearing stored auth data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.login(email, password);
      
      dispatch({ type: 'SET_USER', payload: response.data.user });
      dispatch({ type: 'SET_TOKENS', payload: { 
        token: response.data.accessToken, 
        refreshToken: response.data.refreshToken 
      }});
      
      await storeAuthData(response.data.user, response.data.accessToken, response.data.refreshToken);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.register(userData);
      
      dispatch({ type: 'SET_USER', payload: response.data.user });
      dispatch({ type: 'SET_TOKENS', payload: { 
        token: response.data.accessToken, 
        refreshToken: response.data.refreshToken 
      }});
      
      await storeAuthData(response.data.user, response.data.accessToken, response.data.refreshToken);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrarse';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      if (state.token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await clearStoredAuth();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(state.refreshToken);
      
      dispatch({ type: 'SET_TOKENS', payload: { 
        token: response.data.accessToken, 
        refreshToken: response.data.refreshToken 
      }});
      
      await AsyncStorage.setItem('auth_token', response.data.accessToken);
      await AsyncStorage.setItem('auth_refresh_token', response.data.refreshToken);
    } catch (error: any) {
      // Refresh token is invalid, logout user
      await logout();
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.updateProfile(userData);
      
      dispatch({ type: 'UPDATE_USER', payload: response.data });
      
      // Update stored user data
      if (state.user) {
        const updatedUser = { ...state.user, ...response.data };
        await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar perfil';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.updatePreferences(preferences);
      
      dispatch({ type: 'UPDATE_USER', payload: { preferences: response.data } });
      
      // Update stored user data
      if (state.user) {
        const updatedUser = { ...state.user, preferences: { ...state.user.preferences, ...response.data } };
        await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar preferencias';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await authService.forgotPassword(email);
      
      // Success message will be handled by the service
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al solicitar recuperación de contraseña';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await authService.resetPassword(token, newPassword);
      
      // Success message will be handled by the service
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al restablecer contraseña';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    updatePreferences,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
