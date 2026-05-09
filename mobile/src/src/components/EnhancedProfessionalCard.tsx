import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import RatingStars from './RatingStars';

interface EnhancedProfessionalCardProps {
  id: string;
  name: string;
  profession: string;
  avatar: any;
  rating: number;
  reviewCount: number;
  description: string;
  location: string;
  phone: string;
  services: string[];
  availability: boolean;
  responseTime: string;
  hourlyRate: number;
  isVerified: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
  onContactPress: () => void;
}

const EnhancedProfessionalCard: React.FC<EnhancedProfessionalCardProps> = ({
  id,
  name,
  profession,
  avatar,
  rating,
  reviewCount,
  description,
  location,
  phone,
  services,
  availability,
  responseTime,
  hourlyRate,
  isVerified,
  isFavorite,
  onPress,
  onFavoritePress,
  onContactPress,
}) => {
  const animatedValue = React.useRef(new Animated.Value(1)).current;
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const favoriteScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.99,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
    ]).start();
  };

  const handleFavoritePress = () => {
    // Animate favorite button
    Animated.sequence([
      Animated.timing(favoriteScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(favoriteScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
    ]).start();
    
    onFavoritePress();
  };

  const cardStyle = {
    opacity: animatedValue,
    transform: [{ scale: scaleValue }],
  };

  const favoriteButtonStyle = {
    transform: [{ scale: favoriteScale }],
  };

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Header with avatar and info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image source={avatar} style={styles.avatar} />
            {availability && (
              <View style={styles.availabilityIndicator}>
                <View style={styles.dot} />
              </View>
            )}
          </View>
          
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <TouchableOpacity
                style={[styles.favoriteButton, favoriteButtonStyle]}
                onPress={handleFavoritePress}
              >
                <MaterialIcons
                  name={isFavorite ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={isFavorite ? '#ef4444' : '#94a3b8'}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.professionRow}>
              <Text style={styles.profession}>{profession}</Text>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={12} color="#3b82f6" />
                </View>
              )}
            </View>
            
            <View style={styles.ratingRow}>
              <RatingStars rating={rating} size={14} />
              <Text style={styles.ratingText}>({reviewCount})</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Location and response time */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="location-on" size={16} color="#64748b" />
            <Text style={styles.infoText}>{location}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color="#64748b" />
            <Text style={styles.infoText}>{responseTime}</Text>
          </View>
        </View>

        {/* Services preview */}
        {services.length > 0 && (
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesLabel}>Servicios:</Text>
            <View style={styles.servicesList}>
              {services.slice(0, 3).map((service, index) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
              {services.length > 3 && (
                <View style={styles.moreServicesTag}>
                  <Text style={styles.serviceText}>+{services.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer with price and contact */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Tarifa/hora</Text>
            <Text style={styles.price}>${hourlyRate}</Text>
          </View>
          
          <TouchableOpacity style={styles.contactButton} onPress={onContactPress}>
            <MaterialIcons name="phone" size={16} color="#ffffff" />
            <Text style={styles.contactButtonText}>Contactar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10b981',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  professionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profession: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#dbeafe',
    padding: 2,
    borderRadius: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreServicesTag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnhancedProfessionalCard;
