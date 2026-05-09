// Bookings Service for MiProfesional Mobile App

import { apiService } from './api';
import { ApiResponse, PaginatedResponse } from './api';
import { mockBookings, getServicesByProfessional } from './mockData';

// Types
export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  professionalName: string;
  serviceTitle: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  location: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  professionalId: string;
  serviceTitle: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface BookingFilters {
  status?: Booking['status'];
  professionalId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface AvailableTimeSlots {
  date: string;
  timeSlots: TimeSlot[];
}

class BookingsService {
  // Get user bookings
  async getUserBookings(filters?: BookingFilters): Promise<PaginatedResponse<Booking>> {
    try {
      // In development, use mock data
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        let filteredBookings = [...mockBookings];

        // Apply filters
        if (filters?.status) {
          filteredBookings = filteredBookings.filter(b => b.status === filters!.status);
        }

        if (filters?.professionalId) {
          filteredBookings = filteredBookings.filter(b => b.professionalId === filters!.professionalId);
        }

        if (filters?.startDate) {
          filteredBookings = filteredBookings.filter(b => b.date >= filters!.startDate!);
        }

        if (filters?.endDate) {
          filteredBookings = filteredBookings.filter(b => b.date <= filters!.endDate!);
        }

        // Apply sorting
        if (filters?.sortBy) {
          filteredBookings.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (filters.sortBy) {
              case 'date':
                aValue = new Date(`${a.date} ${a.time}`);
                bValue = new Date(`${b.date} ${b.time}`);
                break;
              case 'price':
                aValue = a.price;
                bValue = b.price;
                break;
              case 'createdAt':
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
                break;
              default:
                aValue = new Date(`${a.date} ${a.time}`);
                bValue = new Date(`${b.date} ${b.time}`);
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
        const paginatedData = filteredBookings.slice(startIndex, endIndex);

        return {
          success: true,
          data: paginatedData,
          pagination: {
            page,
            limit,
            total: filteredBookings.length,
            totalPages: Math.ceil(filteredBookings.length / limit),
          },
          message: 'Bookings retrieved successfully',
        };
      }

      // Production API call
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.professionalId) params.append('professionalId', filters.professionalId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      return apiService.get<Booking[]>(`/bookings?${params}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings',
        message: 'Error retrieving bookings',
      };
    }
  }

  // Get booking by ID
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const booking = mockBookings.find(b => b.id === id);
        
        if (!booking) {
          return {
            success: false,
            error: 'Booking not found',
            message: 'Booking with the specified ID was not found',
          };
        }

        return {
          success: true,
          data: booking,
          message: 'Booking retrieved successfully',
        };
      }

      return apiService.get<Booking>(`/bookings/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking',
        message: 'Error retrieving booking',
      };
    }
  }

  // Create new booking
  async createBooking(bookingData: CreateBookingRequest): Promise<ApiResponse<Booking>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        // Validate booking data
        if (!this.validateBookingData(bookingData)) {
          return {
            success: false,
            error: 'Invalid booking data',
            message: 'Please check all required fields',
          };
        }

        // Create new booking (mock)
        const newBooking: Booking = {
          id: `booking_${Date.now()}`,
          userId: '1', // Mock user ID
          professionalId: bookingData.professionalId,
          professionalName: 'Professional Name', // This would come from professional data
          serviceTitle: bookingData.serviceTitle,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration,
          price: this.calculatePrice(bookingData.duration), // Mock price calculation
          status: 'pending',
          location: bookingData.location,
          notes: bookingData.notes || '',
          createdAt: new Date().toISOString(),
        };

        mockBookings.push(newBooking);

        return {
          success: true,
          data: newBooking,
          message: 'Booking created successfully',
        };
      }

      return apiService.post<Booking>('/bookings', bookingData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking',
        message: 'Error creating booking',
      };
    }
  }

  // Update booking
  async updateBooking(id: string, updateData: UpdateBookingRequest): Promise<ApiResponse<Booking>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const bookingIndex = mockBookings.findIndex(b => b.id === id);
        
        if (bookingIndex === -1) {
          return {
            success: false,
            error: 'Booking not found',
            message: 'Booking with the specified ID was not found',
          };
        }

        // Update booking
        mockBookings[bookingIndex] = {
          ...mockBookings[bookingIndex],
          ...updateData,
          updatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          data: mockBookings[bookingIndex],
          message: 'Booking updated successfully',
        };
      }

      return apiService.put<Booking>(`/bookings/${id}`, updateData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update booking',
        message: 'Error updating booking',
      };
    }
  }

  // Cancel booking
  async cancelBooking(id: string, reason?: string): Promise<ApiResponse<Booking>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const bookingIndex = mockBookings.findIndex(b => b.id === id);
        
        if (bookingIndex === -1) {
          return {
            success: false,
            error: 'Booking not found',
            message: 'Booking with the specified ID was not found',
          };
        }

        // Check if booking can be cancelled
        const booking = mockBookings[bookingIndex];
        if (booking.status === 'completed' || booking.status === 'cancelled') {
          return {
            success: false,
            error: 'Cannot cancel booking',
            message: 'This booking cannot be cancelled',
          };
        }

        // Cancel booking
        mockBookings[bookingIndex] = {
          ...booking,
          status: 'cancelled',
          notes: reason ? `${booking.notes}\n\nCancellation reason: ${reason}` : booking.notes,
          updatedAt: new Date().toISOString(),
        };

        return {
          success: true,
          data: mockBookings[bookingIndex],
          message: 'Booking cancelled successfully',
        };
      }

      return apiService.post<Booking>(`/bookings/${id}/cancel`, { reason });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel booking',
        message: 'Error cancelling booking',
      };
    }
  }

  // Get available time slots for a professional
  async getAvailableTimeSlots(professionalId: string, date: string): Promise<ApiResponse<AvailableTimeSlots>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        // Generate mock time slots
        const timeSlots: TimeSlot[] = [];
        const startHour = 8;
        const endHour = 20;
        
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Randomly make some slots unavailable
            const isAvailable = Math.random() > 0.2; // 80% availability
            
            timeSlots.push({
              time,
              available: isAvailable,
              reason: isAvailable ? undefined : 'Already booked',
            });
          }
        }

        return {
          success: true,
          data: {
            date,
            timeSlots,
          },
          message: 'Available time slots retrieved successfully',
        };
      }

      return apiService.get<AvailableTimeSlots>(`/bookings/available-slots?professionalId=${professionalId}&date=${date}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available time slots',
        message: 'Error retrieving available time slots',
      };
    }
  }

  // Get booking statistics
  async getBookingStats(): Promise<ApiResponse<{
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    upcomingBookings: Booking[];
  }>> {
    try {
      if (apiService.getConfig().enableMock) {
        await this.simulateNetworkDelay();
        
        const totalBookings = mockBookings.length;
        const pendingBookings = mockBookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = mockBookings.filter(b => b.status === 'confirmed').length;
        const completedBookings = mockBookings.filter(b => b.status === 'completed').length;
        const cancelledBookings = mockBookings.filter(b => b.status === 'cancelled').length;
        const totalSpent = mockBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + b.price, 0);
        
        const today = new Date().toISOString().split('T')[0];
        const upcomingBookings = mockBookings
          .filter(b => b.date >= today && b.status !== 'cancelled')
          .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
          .slice(0, 3);

        return {
          success: true,
          data: {
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            cancelledBookings,
            totalSpent,
            upcomingBookings,
          },
          message: 'Booking statistics retrieved successfully',
        };
      }

      return apiService.get('/bookings/stats');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking statistics',
        message: 'Error retrieving booking statistics',
      };
    }
  }

  // Helper methods
  private validateBookingData(bookingData: CreateBookingRequest): boolean {
    return !!(
      bookingData.professionalId &&
      bookingData.serviceTitle &&
      bookingData.date &&
      bookingData.time &&
      bookingData.duration &&
      bookingData.location
    );
  }

  private calculatePrice(duration: string): number {
    // Mock price calculation based on duration
    const durationHours = parseInt(duration) || 1;
    const basePrice = 2000; // Base price per hour
    return durationHours * basePrice;
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export singleton instance
export const bookingsService = new BookingsService();
