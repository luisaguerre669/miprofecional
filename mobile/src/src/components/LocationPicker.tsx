import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import { locationService, Location, Address } from '../services';

interface LocationPickerProps {
  onLocationSelect: (location: Location & { address: Address }) => void;
  initialLocation?: Location;
  placeholder?: string;
  showCurrentLocation?: boolean;
  radius?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  placeholder = 'Ingresa tu dirección',
  showCurrentLocation = true,
  radius = 10,
}) => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(initialLocation || null);
  const [suggestions, setSuggestions] = useState<Array<{ address: string; location: Location }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      loadAddressFromLocation(initialLocation);
    }
  }, [initialLocation]);

  const loadAddressFromLocation = async (location: Location) => {
    try {
      setIsLoading(true);
      const addressData = await locationService.reverseGeocode(location);
      setAddress(addressData.formattedAddress);
      setCurrentLocation(location);
      onLocationSelect({ ...location, address: addressData });
    } catch (error) {
      console.error('Error loading address from location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      
      // Check and request permission
      const permissionStatus = await locationService.checkLocationPermission();
      if (!permissionStatus.granted) {
        const requestStatus = await locationService.requestLocationPermission();
        if (!requestStatus.granted) {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tu ubicación para mostrarte los profesionales más cercanos.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Configurar', onPress: () => {} },
            ]
          );
          return;
        }
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      const addressData = await locationService.reverseGeocode(location);
      
      setAddress(addressData.formattedAddress);
      setCurrentLocation(location);
      setShowSuggestions(false);
      
      onLocationSelect({ ...location, address: addressData });
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = async (text: string) => {
    setAddress(text);
    
    if (text.length > 3) {
      try {
        setIsLoading(true);
        // Simulate address suggestions (in real app, this would call a geocoding API)
        const mockSuggestions = [
          {
            address: `${text} 123, Buenos Aires, Argentina`,
            location: { latitude: -34.6037, longitude: -58.3816 },
          },
          {
            address: `${text} 456, Córdoba, Argentina`,
            location: { latitude: -31.4201, longitude: -64.1888 },
          },
          {
            address: `${text} 789, Rosario, Argentina`,
            location: { latitude: -32.9442, longitude: -60.6393 },
          },
        ];
        
        setSuggestions(mockSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error getting address suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: { address: string; location: Location }) => {
    try {
      setIsLoading(true);
      setAddress(suggestion.address);
      setCurrentLocation(suggestion.location);
      setShowSuggestions(false);
      
      const addressData = await locationService.reverseGeocode(suggestion.location);
      onLocationSelect({ ...suggestion.location, address: addressData });
    } catch (error) {
      console.error('Error selecting suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Por favor ingresa una dirección');
      return;
    }

    try {
      setIsLoading(true);
      const location = await locationService.geocodeAddress(address);
      const addressData = await locationService.reverseGeocode(location);
      
      setCurrentLocation(location);
      setShowSuggestions(false);
      
      onLocationSelect({ ...location, address: addressData });
    } catch (error) {
      console.error('Error searching address:', error);
      Alert.alert('Error', 'No se pudo encontrar la dirección');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ubicación</Text>
      
      <View style={styles.inputContainer}>
        <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={address}
          onChangeText={handleAddressChange}
          editable={!isLoading}
        />
        {isLoading && (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.loading} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionSelect(suggestion)}
            >
              <MaterialIcons name="place" size={16} color="#64748b" />
              <Text style={styles.suggestionText}>{suggestion.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {showCurrentLocation && (
          <TouchableOpacity
            style={[styles.actionButton, styles.currentLocationButton]}
            onPress={handleGetCurrentLocation}
            disabled={isLoading}
          >
            <MaterialIcons name="my-location" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Usar ubicación actual</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.searchButton]}
          onPress={handleSearchAddress}
          disabled={isLoading || !address.trim()}
        >
          <MaterialIcons name="search" size={20} color="#ffffff" />
          <Text style={styles.searchButtonText}>Buscar dirección</Text>
        </TouchableOpacity>
      </View>

      {currentLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationInfoTitle}>Ubicación seleccionada:</Text>
          <Text style={styles.locationInfoAddress}>{address}</Text>
          <View style={styles.locationDetails}>
            <View style={styles.locationDetailItem}>
              <MaterialIcons name="gps-fixed" size={16} color="#64748b" />
              <Text style={styles.locationDetailText}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.locationDetailItem}>
              <MaterialIcons name="radar" size={16} color="#64748b" />
              <Text style={styles.locationDetailText}>
                Radio de búsqueda: {radius} km
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 12,
  },
  loading: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  currentLocationButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    flex: 1,
  },
  searchButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  locationInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationInfoAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  locationDetails: {
    gap: 4,
  },
  locationDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDetailText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
});

export default LocationPicker;
