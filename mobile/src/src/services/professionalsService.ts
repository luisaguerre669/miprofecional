// Professionals Service for MiProfesional Mobile App

import { apiService } from './api';
import { ApiResponse, PaginatedResponse } from './api';
import { mockProfessionals, getProfessionalById, getProfessionalsByCategory, searchProfessionals } from './mockData';

// Types
export interface Professional {
  id: string;
  name: string;
  profession: string;
  avatar: any;
  rating: number;
  reviewCount: number;
  description: string;
  location: string;
  phone: string;
  email: string;
  services: string[];
  availability: boolean;
  responseTime: string;
  hourlyRate: number;
  categoryId: string;
  isVerified: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface ProfessionalFilters {
  categoryId?: string;
  search?: string;
  location?: string;
  minRating?: number;
  maxPrice?: number;
  availability?: boolean;
  isVerified?: boolean;
  sortBy?: 'rating' | 'price' | 'responseTime' | 'reviewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProfessionalContactRequest {
  professionalId: string;
  message: string;
  serviceRequested?: string;
  preferredDate?: string;
  preferredTime?: string;
}

class ProfessionalsService {
  // Get all professionals with filters
  async getProfessionals(filters?: ProfessionalFilters): Promise<PaginatedResponse<Professional>> {
    try {
      // In development, use mock data
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        let filteredProfessionals = [...mockProfessionals];

        // Apply filters
        if (filters?.categoryId) {
          filteredProfessionals = getProfessionalsByCategory(filters.categoryId);
        }

        if (filters?.search) {
          filteredProfessionals = searchProfessionals(filters.search);
        }

        if (filters?.location) {
          const locationFilter = filters.location.toLowerCase();
          filteredProfessionals = filteredProfessionals.filter(p =>
            p.location.toLowerCase().includes(locationFilter)
          );
        }

        if (filters?.minRating) {
          filteredProfessionals = filteredProfessionals.filter(p => p.rating >= filters!.minRating!);
        }

        if (filters?.maxPrice) {
          filteredProfessionals = filteredProfessionals.filter(p => p.hourlyRate <= filters!.maxPrice!);
        }

        if (filters?.availability !== undefined) {
          filteredProfessionals = filteredProfessionals.filter(p => p.availability === filters!.availability);
        }

        if (filters?.isVerified !== undefined) {
          filteredProfessionals = filteredProfessionals.filter(p => p.isVerified === filters!.isVerified);
        }

        // Apply sorting
        if (filters?.sortBy) {
          filteredProfessionals.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (filters.sortBy) {
              case 'rating':
                aValue = a.rating;
                bValue = b.rating;
                break;
              case 'price':
                aValue = a.hourlyRate;
                bValue = b.hourlyRate;
                break;
              case 'responseTime':
                aValue = this.parseResponseTime(a.responseTime);
                bValue = this.parseResponseTime(b.responseTime);
                break;
              case 'reviewCount':
                aValue = a.reviewCount;
                bValue = b.reviewCount;
                break;
              default:
                aValue = a.rating;
                bValue = b.rating;
            }

            if (filters.sortOrder === 'desc') {
              return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
            } else {
              return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
          });
        }

        // Apply pagination
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredProfessionals.slice(startIndex, endIndex);

        return {
          success: true,
          data: paginatedData,
          pagination: {
            page,
            limit,
            total: filteredProfessionals.length,
            totalPages: Math.ceil(filteredProfessionals.length / limit),
          },
          message: 'Professionals retrieved successfully',
        };
      }

      // Production API call
      const params = new URLSearchParams();
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.location) params.append('location', filters.location);
      if (filters?.minRating) params.append('minRating', String(filters.minRating));
      if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters?.availability !== undefined) params.append('availability', String(filters.availability));
      if (filters?.isVerified !== undefined) params.append('isVerified', String(filters.isVerified));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      return apiService.get<Professional[]>(`/professionals?${params}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch professionals',
        message: 'Error retrieving professionals',
      };
    }
  }

  // Get professional by ID
  async getProfessionalById(id: string): Promise<ApiResponse<Professional>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const professional = getProfessionalById(id);
        
        if (!professional) {
          return {
            success: false,
            error: 'Professional not found',
            message: 'Professional with the specified ID was not found',
          };
        }

        return {
          success: true,
          data: professional,
          message: 'Professional retrieved successfully',
        };
      }

      return apiService.get<Professional>(`/professionals/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch professional',
        message: 'Error retrieving professional',
      };
    }
  }

  // Get professionals by category
  async getProfessionalsByCategory(categoryId: string, limit: number = 20): Promise<ApiResponse<Professional[]>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const professionals = getProfessionalsByCategory(categoryId).slice(0, limit);

        return {
          success: true,
          data: professionals,
          message: 'Professionals by category retrieved successfully',
        };
      }

      return apiService.get<Professional[]>(`/professionals/category/${categoryId}?limit=${limit}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch professionals by category',
        message: 'Error retrieving professionals by category',
      };
    }
  }

  // Search professionals
  async searchProfessionals(query: string, filters?: Omit<ProfessionalFilters, 'search'>): Promise<PaginatedResponse<Professional>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        let searchResults = searchProfessionals(query);

        // Apply additional filters
        if (filters?.categoryId) {
          searchResults = searchResults.filter(p => p.categoryId === filters!.categoryId);
        }

        if (filters?.minRating) {
          searchResults = searchResults.filter(p => p.rating >= filters!.minRating!);
        }

        if (filters?.maxPrice) {
          searchResults = searchResults.filter(p => p.hourlyRate <= filters!.maxPrice!);
        }

        if (filters?.availability !== undefined) {
          searchResults = searchResults.filter(p => p.availability === filters!.availability);
        }

        // Apply pagination
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = searchResults.slice(startIndex, endIndex);

        return {
          success: true,
          data: paginatedData,
          pagination: {
            page,
            limit,
            total: searchResults.length,
            totalPages: Math.ceil(searchResults.length / limit),
          },
          message: 'Search completed successfully',
        };
      }

      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);
      if (filters?.location) params.append('location', filters.location);
      if (filters?.minRating) params.append('minRating', String(filters.minRating));
      if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters?.availability !== undefined) params.append('availability', String(filters.availability));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      return apiService.get<Professional[]>(`/professionals/search?${params}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search professionals',
        message: 'Error searching professionals',
      };
    }
  }

  // Get featured professionals
  async getFeaturedProfessionals(limit: number = 6): Promise<ApiResponse<Professional[]>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        // Return top rated professionals
        const featuredProfessionals = [...mockProfessionals]
          .filter(p => p.isVerified)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, limit);

        return {
          success: true,
          data: featuredProfessionals,
          message: 'Featured professionals retrieved successfully',
        };
      }

      return apiService.get<Professional[]>(`/professionals/featured?limit=${limit}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch featured professionals',
        message: 'Error retrieving featured professionals',
      };
    }
  }

  // Contact professional
  async contactProfessional(request: ProfessionalContactRequest): Promise<ApiResponse<{ contactId: string }>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        // Simulate contact request
        const contactId = `contact_${Date.now()}`;
        
        return {
          success: true,
          data: { contactId },
          message: 'Contact request sent successfully',
        };
      }

      return apiService.post<{ contactId: string }>('/professionals/contact', request);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send contact request',
        message: 'Error sending contact request',
      };
    }
  }

  // Toggle favorite status
  async toggleFavorite(professionalId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const professional = getProfessionalById(professionalId);
        if (!professional) {
          return {
            success: false,
            error: 'Professional not found',
            message: 'Professional with the specified ID was not found',
          };
        }

        // Toggle favorite status
        professional.isFavorite = !professional.isFavorite;

        return {
          success: true,
          data: { isFavorite: professional.isFavorite },
          message: professional.isFavorite ? 'Added to favorites' : 'Removed from favorites',
        };
      }

      return apiService.post<{ isFavorite: boolean }>(`/professionals/${professionalId}/favorite`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle favorite',
        message: 'Error toggling favorite status',
      };
    }
  }

  // Get professional statistics
  async getProfessionalStats(professionalId: string): Promise<ApiResponse<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    responseRate: number;
    completionRate: number;
  }>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        // Generate mock statistics
        const stats = {
          totalBookings: Math.floor(Math.random() * 100) + 50,
          totalRevenue: Math.floor(Math.random() * 500000) + 100000,
          averageRating: 4.5 + Math.random() * 0.5,
          responseRate: 85 + Math.floor(Math.random() * 15),
          completionRate: 90 + Math.floor(Math.random() * 10),
        };

        return {
          success: true,
          data: stats,
          message: 'Professional statistics retrieved successfully',
        };
      }

      return apiService.get(`/professionals/${professionalId}/stats`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch professional statistics',
        message: 'Error retrieving professional statistics',
      };
    }
  }

  // Helper method to parse response time string to minutes
  private parseResponseTime(responseTime: string): number {
    const match = responseTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : 999;
  }

  // Simulate network delay for development
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export singleton instance
export const professionalsService = new ProfessionalsService();
