import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  onPress?: (service: Service) => void;
  onBook?: (service: Service) => void;
  style?: any;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onBook,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(service)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.duration}>{service.duration} min</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${service.price}</Text>
          <Text style={styles.priceLabel}>por servicio</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {service.description}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.category}>
          <Icon name="category" size={14} color="#6b7280" />
          <Text style={styles.categoryText}>{service.category}</Text>
        </View>
        
        {onBook && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => onBook(service)}
          >
            <Icon name="calendar-today" size={16} color="white" />
            <Text style={styles.bookButtonText}>Reservar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priceLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default ServiceCard;
