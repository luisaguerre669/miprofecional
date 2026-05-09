// Services Index for MiProfesional Mobile App

// Export all services
export { apiService } from './api';
export { categoriesService } from './categoriesService';
export { professionalsService } from './professionalsService';
export { authService } from './authService';
export { bookingsService } from './bookingsService';
export { locationService } from './locationService';

// Export types
export type { ApiResponse, PaginatedResponse } from './api';
export type { Category, CategoryFilters } from './categoriesService';
export type { Professional, ProfessionalFilters, ProfessionalContactRequest } from './professionalsService';
export type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  PasswordResetRequest, 
  PasswordResetConfirmRequest,
  UpdateProfileRequest,
  UpdatePreferencesRequest 
} from './authService';
export type { 
  Booking, 
  CreateBookingRequest, 
  UpdateBookingRequest, 
  BookingFilters, 
  TimeSlot, 
  AvailableTimeSlots 
} from './bookingsService';
export type {
  Location,
  Address,
  LocationWithAddress,
  NearbyProfessional,
  LocationFilters,
  LocationPermissionStatus
} from './locationService';

// Export mock data for development
export {
  mockProfessionals,
  mockServices,
  mockBookings,
  mockReviews,
  mockEmergencyContacts,
  mockUser,
  getProfessionalById,
  getProfessionalsByCategory,
  searchProfessionals,
  getServicesByProfessional,
  getBookingsByUser,
  getReviewsByProfessional,
  getFavoritesByUser,
} from './mockData';

// Export assets constants
export { CATEGORIES_IMAGES, PLACEHOLDER_IMAGES, ICONS, CATEGORIES_DATA } from '../constants/assets';
