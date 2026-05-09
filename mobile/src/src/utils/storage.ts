import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_REFRESH_TOKEN: 'auth_refresh_token',
  AUTH_USER: 'auth_user',
  USER_PREFERENCES: 'user_preferences',
  FAVORITE_PROFESSIONALS: 'favorite_professionals',
  RECENT_SEARCHES: 'recent_searches',
  BOOKING_HISTORY: 'booking_history',
  APP_SETTINGS: 'app_settings',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  NOTIFICATION_TOKEN: 'notification_token',
  LAST_LOGIN: 'last_login',
} as const;

// Storage utility functions
export class StorageService {
  // Generic methods
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  static async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        return defaultValue || null;
      }
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return defaultValue || null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Auth specific methods
  static async setAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken),
      this.setItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN, refreshToken),
    ]);
  }

  static async getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getItem(STORAGE_KEYS.AUTH_TOKEN),
      this.getItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  }

  static async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      this.removeItem(STORAGE_KEYS.AUTH_REFRESH_TOKEN),
      this.removeItem(STORAGE_KEYS.AUTH_USER),
      this.removeItem(STORAGE_KEYS.LAST_LOGIN),
    ]);
  }

  // User preferences
  static async setUserPreferences(preferences: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  static async getUserPreferences(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  // Favorites
  static async setFavoriteProfessionals(professionals: string[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.FAVORITE_PROFESSIONALS, professionals);
  }

  static async getFavoriteProfessionals(): Promise<string[]> {
    const favorites = await this.getItem<string[]>(STORAGE_KEYS.FAVORITE_PROFESSIONALS);
    return favorites || [];
  }

  static async addFavoriteProfessional(professionalId: string): Promise<void> {
    const favorites = await this.getFavoriteProfessionals();
    if (!favorites.includes(professionalId)) {
      favorites.push(professionalId);
      await this.setFavoriteProfessionals(favorites);
    }
  }

  static async removeFavoriteProfessional(professionalId: string): Promise<void> {
    const favorites = await this.getFavoriteProfessionals();
    const updatedFavorites = favorites.filter(id => id !== professionalId);
    await this.setFavoriteProfessionals(updatedFavorites);
  }

  // Recent searches
  static async addRecentSearch(search: string): Promise<void> {
    const recentSearches = await this.getRecentSearches();
    const updatedSearches = [search, ...recentSearches.filter(s => s !== search)].slice(0, 10);
    await this.setItem(STORAGE_KEYS.RECENT_SEARCHES, updatedSearches);
  }

  static async getRecentSearches(): Promise<string[]> {
    const searches = await this.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES);
    return searches || [];
  }

  static async clearRecentSearches(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  }

  // App settings
  static async setAppSettings(settings: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  static async getAppSettings(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.APP_SETTINGS);
  }

  // Onboarding
  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    const completed = await this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed || false;
  }

  // Notification token
  static async setNotificationToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.NOTIFICATION_TOKEN, token);
  }

  static async getNotificationToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.NOTIFICATION_TOKEN);
  }

  // Last login
  static async setLastLogin(): Promise<void> {
    const lastLogin = new Date().toISOString();
    await this.setItem(STORAGE_KEYS.LAST_LOGIN, lastLogin);
  }

  static async getLastLogin(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.LAST_LOGIN);
  }

  // Storage info and cleanup
  static async getStorageInfo(): Promise<{ [key: string]: string | null }> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      const storageInfo: { [key: string]: string | null } = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        storageInfo[key] = value;
      }
      
      return storageInfo;
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {};
    }
  }

  static async cleanupExpiredData(): Promise<void> {
    try {
      // Clean up data older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Clean recent searches older than 30 days
      const lastLogin = await this.getLastLogin();
      if (lastLogin && new Date(lastLogin) < thirtyDaysAgo) {
        await this.clearRecentSearches();
      }
      
      // Clean up any other expired data as needed
      console.log('Storage cleanup completed');
    } catch (error) {
      console.error('Error during storage cleanup:', error);
    }
  }

  // Debug method to get all stored data
  static async getAllStoredData(): Promise<{ [key: string]: any }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data: { [key: string]: any } = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error getting all stored data:', error);
      return {};
    }
  }
}

export default StorageService;
