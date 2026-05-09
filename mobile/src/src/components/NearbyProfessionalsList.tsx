import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import { locationService, NearbyProfessional, Location } from '../services';
import { ProfessionalCard, LoadingSpinner, AnimatedButton } from './';

interface NearbyProfessionalsListProps {
  userLocation: Location;
  filters?: {
    radius?: number;
    profession?: string;
    minRating?: number;
    availableOnly?: boolean;
    sortBy?: 'distance' | 'rating' | 'availability';
  };
  onProfessionalSelect: (professional: NearbyProfessional) => void;
  onFiltersChange?: (filters: any) => void;
}

const NearbyProfessionalsList: React.FC<NearbyProfessionalsListProps> = ({
  userLocation,
  filters = {},
  onProfessionalSelect,
  onFiltersChange,
}) => {
  const [professionals, setProfessionals] = useState<NearbyProfessional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNearbyProfessionals();
  }, [userLocation, filters]);

  const loadNearbyProfessionals = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const nearbyProfessionals = await locationService.findNearbyProfessionals(
        userLocation,
        filters
      );

      setProfessionals(nearbyProfessionals);
    } catch (error) {
      console.error('Error loading nearby professionals:', error);
      setError('No se pudieron cargar los profesionales cercanos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNearbyProfessionals();
    setIsRefreshing(false);
  };

  const handleCallProfessional = (professional: NearbyProfessional) => {
    Alert.alert(
      'Llamar profesional',
      `¿Deseas llamar a ${professional.name} al ${professional.phone || 'número no disponible'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => {} },
      ]
    );
  };

  const handleGetDirections = (professional: NearbyProfessional) => {
    Alert.alert(
      'Obtener direcciones',
      `¿Deseas obtener direcciones para llegar a ${professional.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir mapa', onPress: () => {} },
      ]
    );
  };

  const renderProfessional = ({ item }: { item: NearbyProfessional }) => (
    <View style={styles.professionalCard}>
      <TouchableOpacity
        style={styles.professionalContent}
        onPress={() => onProfessionalSelect(item)}
      >
        <View style={styles.professionalHeader}>
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{item.name}</Text>
            <Text style={styles.profession}>{item.profession}</Text>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#f59e0b" />
              <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewsCount}>({item.reviewsCount})</Text>
            </View>
          </View>
          
          <View style={styles.availabilityContainer}>
            <View style={[
              styles.availabilityIndicator,
              item.isAvailable ? styles.available : styles.unavailable
            ]} />
            <Text style={[
              styles.availabilityText,
              item.isAvailable ? styles.availableText : styles.unavailableText
            ]}>
              {item.isAvailable ? 'Disponible' : 'Ocupado'}
            </Text>
          </View>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.distanceContainer}>
            <MaterialIcons name="location-on" size={16} color="#64748b" />
            <Text style={styles.distance}>
              {locationService.formatDistance(item.distance)}
            </Text>
          </View>
          
          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={16} color="#64748b" />
            <Text style={styles.estimatedTime}>
              {locationService.formatTime(item.estimatedTime)}
            </Text>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <MaterialIcons name="place" size={16} color="#64748b" />
          <Text style={styles.address} numberOfLines={2}>
            {item.address.formattedAddress}
          </Text>
        </View>

        <View style={styles.servicesContainer}>
          <Text style={styles.servicesLabel}>Servicios:</Text>
          <View style={styles.servicesList}>
            {item.services.slice(0, 3).map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
            {item.services.length > 3 && (
              <View style={styles.serviceTag}>
                <Text style={styles.serviceText}>+{item.services.length - 3}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceRange}>{item.priceRange}</Text>
          <Text style={styles.priceLabel}>Rango de precios</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCallProfessional(item)}
        >
          <MaterialIcons name="phone" size={20} color="#10b981" />
          <Text style={styles.actionButtonText}>Llamar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.directionsButton]}
          onPress={() => handleGetDirections(item)}
        >
          <MaterialIcons name="directions" size={20} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="location-searching" size={64} color="#94a3b8" />
      <Text style={styles.emptyStateTitle}>No hay profesionales cercanos</Text>
      <Text style={styles.emptyStateMessage}>
        No encontramos profesionales disponibles en tu área. Intenta ampliar el radio de búsqueda o busca en otra ubicación.
      </Text>
      
      <AnimatedButton
        title="Ampliar radio de búsqueda"
        onPress={() => {
          if (onFiltersChange) {
            onFiltersChange({ ...filters, radius: (filters.radius || 10) + 5 });
          }
        }}
        variant="outline"
        size="medium"
        style={styles.emptyStateButton}
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <MaterialIcons name="error-outline" size={64} color="#ef4444" />
      <Text style={styles.errorStateTitle}>Error de conexión</Text>
      <Text style={styles.errorStateMessage}>
        No se pudieron cargar los profesionales. Verifica tu conexión a internet e intenta nuevamente.
      </Text>
      
      <AnimatedButton
        title="Reintentar"
        onPress={loadNearbyProfessionals}
        variant="primary"
        size="medium"
        style={styles.errorStateButton}
      />
    </View>
  );

  if (isLoading && !isRefreshing) {
    return <LoadingSpinner text="Buscando profesionales cercanos..." overlay />;
  }

  if (error) {
    return renderErrorState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Profesionales cercanos ({professionals.length})
        </Text>
        <Text style={styles.headerSubtitle}>
          Radio de búsqueda: {filters.radius || 10} km
        </Text>
      </View>

      <FlatList
        data={professionals}
        renderItem={renderProfessional}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  professionalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  professionalContent: {
    padding: 16,
  },
  professionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  profession: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  reviewsCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  availabilityContainer: {
    alignItems: 'center',
  },
  availabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  available: {
    backgroundColor: '#10b981',
  },
  unavailable: {
    backgroundColor: '#ef4444',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  availableText: {
    color: '#10b981',
  },
  unavailableText: {
    color: '#ef4444',
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#64748b',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  priceLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  callButton: {
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  directionsButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorStateButton: {
    minWidth: 200,
  },
});

export default NearbyProfessionalsList;
