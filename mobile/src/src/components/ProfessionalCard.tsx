import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Professional } from '../types';

interface ProfessionalCardProps {
  professional: Professional;
  onPress: (professional: Professional) => void;
  onCall?: (professional: Professional) => void;
  onMessage?: (professional: Professional) => void;
  onFavorite?: (professional: Professional) => void;
  isFavorite?: boolean;
  style?: any;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onPress,
  onCall,
  onMessage,
  onFavorite,
  isFavorite = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress(professional)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Image source={{ uri: professional.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{professional.name}</Text>
            {onFavorite && (
              <TouchableOpacity
                style={[styles.favoriteButton, isFavorite && styles.favoriteActive]}
                onPress={() => onFavorite(professional)}
              >
                <Icon
                  name={isFavorite ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={isFavorite ? '#ef4444' : '#9ca3af'}
                />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.profession}>{professional.profession}</Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.rating}>{professional.rating}</Text>
              <Text style={styles.reviews}>({professional.reviews})</Text>
            </View>
            
            {professional.is24h && (
              <View style={styles.emergencyBadge}>
                <Icon name="flash-on" size={12} color="white" />
                <Text style={styles.emergencyText}>24h</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {professional.description}
      </Text>
      
      <View style={styles.locationRow}>
        <Icon name="location-on" size={14} color="#6b7280" />
        <Text style={styles.location}>
          {professional.location?.address || 'Ubicación no especificada'}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>Desde ${professional.services[0]?.price || 0}</Text>
          <Text style={styles.duration}>
            {professional.services[0]?.duration || 0} min
          </Text>
        </View>
        
        <View style={styles.actions}>
          {onCall && (
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => onCall(professional)}
            >
              <Icon name="phone" size={16} color="white" />
            </TouchableOpacity>
          )}
          
          {onMessage && (
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={() => onMessage(professional)}
            >
              <Icon name="message" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {professional.verified && (
        <View style={styles.verifiedBadge}>
          <Icon name="verified" size={12} color="#10b981" />
          <Text style={styles.verifiedText}>Verificado</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteActive: {
    backgroundColor: '#fef3c7',
  },
  profession: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emergencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#10b981',
  },
  messageButton: {
    backgroundColor: '#3b82f6',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default ProfessionalCard;
