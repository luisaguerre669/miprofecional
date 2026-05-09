import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { apiService } from './api';
import { 
  ARGENTINA_PROVINCES, 
  CABA_NEIGHBORHOODS, 
  formatAddress as formatArgentinaAddress,
  parseAddress,
  getProvinceInfo,
  isValidCABANeighborhood
} from '../constants/argentinaLocations';

// Types
export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface Address {
  street?: string;
  streetNumber?: string;
  neighborhood?: string; // barrio (ej: Palermo, Belgrano, La Boca)
  city: string; // ciudad (ej: Buenos Aires, Córdoba, Rosario)
  province: string; // provincia (ej: Buenos Aires, CABA, Córdoba, Santa Fe)
  country?: string;
  postalCode?: string;
  formattedAddress: string;
  administrativeArea?: string; // área administrativa adicional
  subAdministrativeArea?: string; // sub-área administrativa
}

export interface LocationWithAddress extends Location {
  address: Address;
}

export interface NearbyProfessional {
  id: string;
  name: string;
  profession: string;
  avatar?: string;
  rating: number;
  reviewsCount: number;
  distance: number; // in kilometers
  estimatedTime: number; // in minutes
  location: Location;
  address: Address;
  isAvailable: boolean;
  priceRange: string;
  services: string[];
}

export interface LocationFilters {
  radius?: number; // in kilometers
  profession?: string;
  minRating?: number;
  availableOnly?: boolean;
  sortBy?: 'distance' | 'rating' | 'availability';
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'disabled' | 'restricted';
}

// Location Service Class
export class LocationService {
  private static instance: LocationService;
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Permission Management
  async checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const result = await Geolocation.requestAuthorization('whenInUse');
        return {
          granted: result === 'granted',
          canAskAgain: result === 'denied',
          status: result,
        };
      } else {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        return {
          granted,
          canAskAgain: !granted,
          status: granted ? 'granted' : 'denied',
        };
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      };
    }
  }

  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const result = await Geolocation.requestAuthorization('whenInUse');
        return {
          granted: result === 'granted',
          canAskAgain: result === 'denied',
          status: result,
        };
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        return {
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
          canAskAgain: granted === PermissionsAndroid.RESULTS.DENIED,
          status: granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied',
        };
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      };
    }
  }

  // Current Location
  async getCurrentLocation(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<Location> {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      };

      const finalOptions = { ...defaultOptions, ...options };

      Geolocation.getCurrentPosition(
        (position: GeolocationResponse) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          this.currentLocation = location;
          resolve(location);
        },
        (error: GeolocationError) => {
          console.error('Error getting location:', error);
          let errorMessage = 'No se pudo obtener tu ubicación';

          switch (error.code) {
            case 1:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case 2:
              errorMessage = 'Ubicación no disponible';
              break;
            case 3:
              errorMessage = 'Tiempo de espera agotado';
              break;
          }

          reject(new Error(errorMessage));
        },
        finalOptions
      );
    });
  }

  // Location Watching
  startLocationUpdates(
    callback: (location: Location) => void,
    options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
      distanceFilter?: number;
    }
  ): void {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      distanceFilter: 10, // 10 meters
    };

    const finalOptions = { ...defaultOptions, ...options };

    this.watchId = Geolocation.watchPosition(
      (position: GeolocationResponse) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        this.currentLocation = location;
        callback(location);
      },
      (error: GeolocationError) => {
        console.error('Error in location updates:', error);
      },
      finalOptions
    );
  }

  stopLocationUpdates(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Geocoding (Address to Coordinates)
  async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await apiService.get('/location/geocode', {
        params: { address },
      });

      if (response.data.success) {
        return response.data.location;
      } else {
        throw new Error(response.data.message || 'No se pudo encontrar la dirección');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error('No se pudo encontrar la dirección');
    }
  }

  // Reverse Geocoding (Coordinates to Address)
  async reverseGeocode(location: Location): Promise<Address> {
    try {
      const response = await apiService.get('/location/reverse-geocode', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      if (response.data && response.data.success) {
        const apiAddress = response.data.address;
        
        // Enhance with Argentina-specific data
        const enhancedAddress = this.enhanceAddressWithArgentinaData(apiAddress);
        
        return enhancedAddress;
      } else {
        // Fallback to mock Argentina geocoding
        return this.mockArgentinaReverseGeocode(location);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Fallback to mock data
      return this.mockArgentinaReverseGeocode(location);
    }
  }

  // Mock Argentina reverse geocoding for development/fallback
  private mockArgentinaReverseGeocode(location: Location): Address {
    const { latitude, longitude } = location;
    
    // CABA area (approximate bounds)
    if (latitude >= -34.7 && latitude <= -34.5 && longitude >= -58.5 && longitude <= -58.3) {
      const neighborhoods = ['Palermo', 'Belgrano', 'Recoleta', 'San Telmo', 'La Boca', 'Puerto Madero'];
      const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      
      return {
        street: 'Av. Corrientes',
        streetNumber: '1234',
        neighborhood: randomNeighborhood,
        city: 'Ciudad Autónoma de Buenos Aires',
        province: 'Ciudad Autónoma de Buenos Aires',
        country: 'Argentina',
        postalCode: 'C1000AAA',
        formattedAddress: `Av. Corrientes 1234, ${randomNeighborhood}, CABA, Argentina`,
      };
    }
    
    // Buenos Aires province area (La Plata)
    if (latitude >= -35.0 && latitude <= -34.8 && longitude >= -58.0 && longitude <= -57.8) {
      return {
        street: 'Calle 7',
        streetNumber: '567',
        neighborhood: 'Centro',
        city: 'La Plata',
        province: 'Buenos Aires',
        country: 'Argentina',
        postalCode: 'B1900AAA',
        formattedAddress: 'Calle 7 567, Centro, La Plata, Buenos Aires, Argentina',
      };
    }
    
    // Córdoba area
    if (latitude >= -31.5 && latitude <= -31.3 && longitude >= -64.2 && longitude <= -64.1) {
      return {
        street: 'Av. Vélez Sarsfield',
        streetNumber: '789',
        neighborhood: 'Güemes',
        city: 'Córdoba',
        province: 'Córdoba',
        country: 'Argentina',
        postalCode: 'X5000AAA',
        formattedAddress: 'Av. Vélez Sarsfield 789, Güemes, Córdoba, Argentina',
      };
    }
    
    // Rosario area
    if (latitude >= -33.0 && latitude <= -32.8 && longitude >= -60.7 && longitude >= -60.6) {
      return {
        street: 'C Córdoba',
        streetNumber: '1011',
        neighborhood: 'Centro',
        city: 'Rosario',
        province: 'Santa Fe',
        country: 'Argentina',
        postalCode: 'S2000AAA',
        formattedAddress: 'C Córdoba 1011, Centro, Rosario, Argentina',
      };
    }
    
    // Default fallback
    return {
      street: 'Av. Principal',
      streetNumber: '1000',
      neighborhood: 'Centro',
      city: 'Ciudad Desconocida',
      province: 'Provincia Desconocida',
      country: 'Argentina',
      postalCode: '0000AAA',
      formattedAddress: 'Av. Principal 1000, Centro, Ciudad Desconocida, Argentina',
    };
  }

  // Enhance address with Argentina-specific data
  private enhanceAddressWithArgentinaData(address: any): Address {
    const enhanced: Address = {
      street: address.street || '',
      streetNumber: address.streetNumber || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      province: address.province || '',
      country: address.country || 'Argentina',
      postalCode: address.postalCode || '',
      formattedAddress: address.formattedAddress || '',
      administrativeArea: address.administrativeArea || '',
      subAdministrativeArea: address.subAdministrativeArea || '',
    };

    // Normalize province names
    if (enhanced.province) {
      const provinceInfo = getProvinceInfo(enhanced.province.toLowerCase());
      if (provinceInfo) {
        enhanced.province = provinceInfo.name;
      } else {
        // Try to match by partial name
        const matchedProvince = ARGENTINA_PROVINCES.find(p => 
          enhanced.province.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(enhanced.province.toLowerCase())
        );
        if (matchedProvince) {
          enhanced.province = matchedProvince.name;
        }
      }
    }

    // Validate CABA neighborhoods
    if (enhanced.province === 'Ciudad Autónoma de Buenos Aires' && enhanced.neighborhood) {
      if (!isValidCABANeighborhood(enhanced.neighborhood)) {
        // Try to find closest match
        const normalizedNeighborhood = enhanced.neighborhood.toLowerCase();
        const closestMatch = CABA_NEIGHBORHOODS.find(n => 
          n.toLowerCase().includes(normalizedNeighborhood) ||
          normalizedNeighborhood.includes(n.toLowerCase())
        );
        if (closestMatch) {
          enhanced.neighborhood = closestMatch;
        }
      }
    }

    // Format address properly
    enhanced.formattedAddress = formatArgentinaAddress({
      street: enhanced.street,
      streetNumber: enhanced.streetNumber,
      neighborhood: enhanced.neighborhood,
      city: enhanced.city,
      province: enhanced.province,
      country: enhanced.country,
    });

    return enhanced;
  }

  // Get location with address
  async getLocationWithAddress(): Promise<LocationWithAddress> {
    try {
      const location = await this.getCurrentLocation();
      const address = await this.reverseGeocode(location);

      return {
        ...location,
        address,
      };
    } catch (error) {
      console.error('Error getting location with address:', error);
      throw error;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  // Estimate travel time (simple calculation)
  estimateTravelTime(distance: number, transportMode: 'walking' | 'driving' | 'transit' = 'driving'): number {
    const speeds = {
      walking: 5, // km/h
      driving: 40, // km/h (average city speed)
      transit: 25, // km/h (average transit speed)
    };

    const speed = speeds[transportMode];
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    return timeInMinutes;
  }

  // Find nearby professionals
  async findNearbyProfessionals(
    userLocation: Location,
    filters: LocationFilters = {}
  ): Promise<NearbyProfessional[]> {
    try {
      const response = await apiService.get('/professionals/nearby', {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: filters.radius || 10, // Default 10km
          profession: filters.profession,
          minRating: filters.minRating,
          availableOnly: filters.availableOnly,
          sortBy: filters.sortBy || 'distance',
        },
      });

      if (response.data.success) {
        return response.data.professionals.map((professional: any) => ({
          ...professional,
          distance: this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            professional.location.latitude,
            professional.location.longitude
          ),
          estimatedTime: this.estimateTravelTime(
            this.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              professional.location.latitude,
              professional.location.longitude
            )
          ),
        }));
      } else {
        throw new Error(response.data.message || 'No se encontraron profesionales cercanos');
      }
    } catch (error) {
      console.error('Error finding nearby professionals:', error);
      throw new Error('No se encontraron profesionales cercanos');
    }
  }

  // Get directions between two points
  async getDirections(
    origin: Location,
    destination: Location,
    transportMode: 'walking' | 'driving' | 'transit' = 'driving'
  ): Promise<{
    distance: number;
    duration: number;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
      maneuver?: string;
    }>;
  }> {
    try {
      const response = await apiService.get('/location/directions', {
        params: {
          originLat: origin.latitude,
          originLng: origin.longitude,
          destLat: destination.latitude,
          destLng: destination.longitude,
          transportMode,
        },
      });

      if (response.data.success) {
        return response.data.directions;
      } else {
        throw new Error(response.data.message || 'No se pudieron obtener las direcciones');
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      throw new Error('No se pudieron obtener las direcciones');
    }
  }

  // Check if location is within service area
  isWithinServiceArea(location: Location, serviceArea: {
    center: Location;
    radius: number;
  }): boolean {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceArea.center.latitude,
      serviceArea.center.longitude
    );

    return distance <= serviceArea.radius;
  }

  // Get current location
  getCurrentLocationData(): Location | null {
    return this.currentLocation;
  }

  // Utility methods
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Format distance for display
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)} km`;
    } else {
      return `${Math.round(distance)} km`;
    }
  }

  // Format time for display
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();

export default locationService;
