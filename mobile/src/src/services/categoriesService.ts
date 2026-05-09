// Categories Service for MiProfesional Mobile App

import { apiService } from './api';
import { ApiResponse, PaginatedResponse } from './api';
import { CATEGORIES_DATA } from '../constants/assets';

// Types
export interface Category {
  id: string;
  title: string;
  image: any; // Image source from require()
  professionalCount: number;
  description?: string;
  icon?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'count' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

class CategoriesService {
  // Get all categories
  async getCategories(filters?: CategoryFilters): Promise<ApiResponse<Category[]>> {
    try {
      // In development, use mock data
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        let filteredCategories = [...CATEGORIES_DATA];

        // Apply filters
        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredCategories = filteredCategories.filter(category =>
            category.title.toLowerCase().includes(searchTerm)
          );
        }

        if (filters?.isActive !== undefined) {
          filteredCategories = filteredCategories.filter(category =>
            (category.isActive ?? true) === filters.isActive
          );
        }

        // Apply sorting
        if (filters?.sortBy) {
          filteredCategories.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (filters.sortBy) {
              case 'name':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
              case 'count':
                aValue = a.professionalCount;
                bValue = b.professionalCount;
                break;
              case 'createdAt':
                aValue = a.createdAt || '';
                bValue = b.createdAt || '';
                break;
              default:
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
            }

            if (filters.sortOrder === 'desc') {
              return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
            } else {
              return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
          });
        }

        return {
          success: true,
          data: filteredCategories,
          message: 'Categories retrieved successfully',
        };
      }

      // Production API call
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      return apiService.get<Category[]>(`/categories?${params}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        message: 'Error retrieving categories',
      };
    }
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const category = CATEGORIES_DATA.find(cat => cat.id === id);
        
        if (!category) {
          return {
            success: false,
            error: 'Category not found',
            message: 'Category with the specified ID was not found',
          };
        }

        return {
          success: true,
          data: category,
          message: 'Category retrieved successfully',
        };
      }

      return apiService.get<Category>(`/categories/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch category',
        message: 'Error retrieving category',
      };
    }
  }

  // Get featured categories
  async getFeaturedCategories(limit: number = 6): Promise<ApiResponse<Category[]>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        // Return categories with most professionals
        const featuredCategories = [...CATEGORIES_DATA]
          .sort((a, b) => b.professionalCount - a.professionalCount)
          .slice(0, limit);

        return {
          success: true,
          data: featuredCategories,
          message: 'Featured categories retrieved successfully',
        };
      }

      return apiService.get<Category[]>(`/categories/featured?limit=${limit}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch featured categories',
        message: 'Error retrieving featured categories',
      };
    }
  }

  // Search categories
  async searchCategories(query: string): Promise<ApiResponse<Category[]>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const searchTerm = query.toLowerCase();
        const searchResults = CATEGORIES_DATA.filter(category =>
          category.title.toLowerCase().includes(searchTerm)
        );

        return {
          success: true,
          data: searchResults,
          message: 'Search completed successfully',
        };
      }

      return apiService.get<Category[]>(`/categories/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search categories',
        message: 'Error searching categories',
      };
    }
  }

  // Get category statistics
  async getCategoryStats(): Promise<ApiResponse<{
    totalCategories: number;
    activeCategories: number;
    totalProfessionals: number;
    topCategories: Category[];
  }>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const totalCategories = CATEGORIES_DATA.length;
        const activeCategories = CATEGORIES_DATA.filter(cat => cat.isActive !== false).length;
        const totalProfessionals = CATEGORIES_DATA.reduce((sum, cat) => sum + cat.professionalCount, 0);
        const topCategories = [...CATEGORIES_DATA]
          .sort((a, b) => b.professionalCount - a.professionalCount)
          .slice(0, 5);

        return {
          success: true,
          data: {
            totalCategories,
            activeCategories,
            totalProfessionals,
            topCategories,
          },
          message: 'Category statistics retrieved successfully',
        };
      }

      return apiService.get('/categories/stats');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch category statistics',
        message: 'Error retrieving category statistics',
      };
    }
  }

  // Simulate network delay for development
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 800 + 400; // 400-1200ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Helper method to get categories with professional count
  async getCategoriesWithProfessionalCount(): Promise<ApiResponse<Category[]>> {
    try {
      const categoriesResponse = await this.getCategories();
      
      if (!categoriesResponse.success || !categoriesResponse.data) {
        return categoriesResponse;
      }

      // In a real app, this would be an API call to get professional counts
      // For now, we'll use the mock data counts
      return {
        success: true,
        data: categoriesResponse.data,
        message: 'Categories with professional count retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories with professional count',
        message: 'Error retrieving categories with professional count',
      };
    }
  }
}

// Export singleton instance
export const categoriesService = new CategoriesService();
