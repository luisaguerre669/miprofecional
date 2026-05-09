import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import { Address } from '../services';

interface LocationDisplayProps {
  address: Address;
  showFullAddress?: boolean;
  onEdit?: () => void;
  compact?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  address,
  showFullAddress = false,
  onEdit,
  compact = false,
}) => {
  const formatLocationText = () => {
    if (showFullAddress) {
      return address.formattedAddress;
    }

    // Show hierarchical location: Barrio, Ciudad, Provincia
    const parts = [];
    
    if (address.neighborhood) {
      parts.push(address.neighborhood);
    }
    
    if (address.city && address.city !== address.neighborhood) {
      parts.push(address.city);
    }
    
    if (address.province) {
      parts.push(address.province);
    }

    return parts.join(', ');
  };

  const getLocationIcon = () => {
    if (address.neighborhood) {
      return 'location-city'; // Barrio específico
    } else if (address.city) {
      return 'location-on'; // Ciudad
    } else {
      return 'public'; // Solo provincia
    }
  };

  const getLocationColor = () => {
    if (address.province === 'Ciudad Autónoma de Buenos Aires' || address.province === 'CABA') {
      return '#3b82f6'; // Azul para CABA
    } else if (address.province === 'Buenos Aires') {
      return '#10b981'; // Verde para Provincia de Buenos Aires
    } else if (address.province === 'Córdoba') {
      return '#f59e0b'; // Amarillo para Córdoba
    } else if (address.province === 'Santa Fe') {
      return '#ef4444'; // Rojo para Santa Fe
    } else {
      return '#64748b'; // Gris para otras provincias
    }
  };

  const getLocationLevel = () => {
    if (address.neighborhood) {
      return 'Barrio';
    } else if (address.city) {
      return 'Ciudad';
    } else {
      return 'Provincia';
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <MaterialIcons 
          name={getLocationIcon()} 
          size={16} 
          color={getLocationColor()} 
        />
        <Text style={[styles.compactText, { color: getLocationColor() }]}>
          {formatLocationText()}
        </Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <MaterialIcons name="edit" size={14} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <MaterialIcons 
            name={getLocationIcon()} 
            size={20} 
            color={getLocationColor()} 
          />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText}>{formatLocationText()}</Text>
            <Text style={[styles.locationLevel, { color: getLocationColor() }]}>
              {getLocationLevel()}
            </Text>
          </View>
        </View>
        
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <MaterialIcons name="edit" size={20} color="#64748b" />
            <Text style={styles.editText}>Cambiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Detailed location breakdown */}
      <View style={styles.detailsContainer}>
        {address.street && (
          <View style={styles.detailItem}>
            <MaterialIcons name="home" size={16} color="#64748b" />
            <Text style={styles.detailText}>
              {address.street} {address.streetNumber || ''}
            </Text>
          </View>
        )}
        
        {address.neighborhood && (
          <View style={styles.detailItem}>
            <MaterialIcons name="location-city" size={16} color="#64748b" />
            <Text style={styles.detailText}>Barrio: {address.neighborhood}</Text>
          </View>
        )}
        
        {address.city && (
          <View style={styles.detailItem}>
            <MaterialIcons name="location-on" size={16} color="#64748b" />
            <Text style={styles.detailText}>Ciudad: {address.city}</Text>
          </View>
        )}
        
        <View style={styles.detailItem}>
          <MaterialIcons name="map" size={16} color="#64748b" />
          <Text style={styles.detailText}>Provincia: {address.province}</Text>
        </View>
        
        {address.postalCode && (
          <View style={styles.detailItem}>
            <MaterialIcons name="local-post-office" size={16} color="#64748b" />
            <Text style={styles.detailText}>CP: {address.postalCode}</Text>
          </View>
        )}
      </View>

      {/* Location accuracy indicator */}
      <View style={styles.accuracyContainer}>
        <MaterialIcons name="gps-fixed" size={16} color="#10b981" />
        <Text style={styles.accuracyText}>Ubicación precisa</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  locationLevel: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  accuracyText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
});

export default LocationDisplay;
