import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationProps, Professional } from '../types';

const EmergencyScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Mock emergency professionals
  const mockEmergencyProfessionals: Professional[] = [
    {
      id: '1',
      userId: 'user1',
      name: 'Pedro Sánchez',
      profession: 'Plomero de Emergencia',
      category: 'reparaciones',
      description: 'Servicio de plomería de emergencia disponible 24/7. Atención inmediata para fugas, desages y obstrucciones.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0c2e8749c8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.9,
      reviews: 203,
      phone: '+54 9 1111-2222',
      email: 'pedro.sanchez@email.com',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: 'Centro, Buenos Aires',
      },
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      services: [
        { id: '1', title: 'Emergencia Plomería', description: 'Atención de urgencias plomería', price: 8000, duration: 60, category: 'reparaciones' },
        { id: '2', title: 'Desagüe de Emergencia', description: 'Desatascamiento de tuberías obstruidas', price: 6000, duration: 45, category: 'reparaciones' },
      ],
      verified: true,
      is24h: true,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user2',
      name: 'Laura Fernández',
      profession: 'Electricista de Emergencia',
      category: 'reparaciones',
      description: 'Servicio eléctrico de emergencia disponible 24/7. Cortes, cortocircuitos y reparaciones urgentes.',
      avatar: 'https://images.unsplash.com/photo-1494790108757-9c159b828b8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.8,
      reviews: 156,
      phone: '+54 9 3333-4444',
      email: 'laura.fernandez@email.com',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: 'Palermo, Buenos Aires',
      },
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      services: [
        { id: '3', title: 'Emergencia Eléctrica', description: 'Reparación de cortocircuitos', price: 10000, duration: 90, category: 'reparaciones' },
        { id: '4', title: 'Reparación Urgente', description: 'Diagnóstico y reparación eléctrica', price: 7000, duration: 60, category: 'reparaciones' },
      ],
      verified: true,
      is24h: true,
      createdAt: '2024-02-20T14:30:00Z',
    },
    {
      id: '3',
      userId: 'user3',
      name: 'Roberto Gómez',
      profession: 'Cerrajero de Emergencia',
      category: 'reparaciones',
      description: 'Servicio de cerrajería de emergencia 24/7. Apertura de puertas, cambio de cerraduras y seguridad.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0c2e8749c8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.7,
      reviews: 98,
      phone: '+54 9 5555-6666',
      email: 'roberto.gomez@email.com',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: 'Belgrano, Buenos Aires',
      },
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      services: [
        { id: '5', title: 'Apertura de Emergencia', description: 'Apertura de puertas y cerraduras', price: 5000, duration: 30, category: 'reparaciones' },
        { id: '6', title: 'Cambio de Cerradura', description: 'Reemplazo completo de cerradura', price: 8000, duration: 45, category: 'reparaciones' },
      ],
      verified: true,
      is24h: true,
      createdAt: '2024-03-10T09:15:00Z',
    },
  ];

  useEffect(() => {
    loadEmergencyProfessionals();
  }, []);

  const loadEmergencyProfessionals = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setProfessionals(mockEmergencyProfessionals);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading emergency professionals:', error);
      setLoading(false);
    }
  };

  const handleEmergencyCall = (phone: string) => {
    Alert.alert(
      'Llamada de Emergencia',
      `¿Llamar al ${phone} para servicio de emergencia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Llamar Ahora', 
          onPress: () => {
            Linking.openURL(`tel:${phone}`);
          }
        },
      ]
    );
  };

  const handleEmergencyMessage = (professional: Professional) => {
    Alert.alert(
      'Mensaje de Emergencia',
      `Enviar mensaje de emergencia a ${professional.name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar Mensaje', 
          onPress: () => navigation.navigate('Chat', { professional }) 
        },
      ]
    );
  };

  const renderProfessionalCard = ({ item }: { item: Professional }) => (
    <View style={styles.professionalCard}>
      <View style={styles.professionalHeader}>
        <Image source={{ uri: item.avatar }} style={styles.professionalAvatar} />
        <View style={styles.professionalInfo}>
          <Text style={styles.professionalName}>{item.name}</Text>
          <View style={styles.professionContainer}>
            <Text style={styles.profession}>{item.profession}</Text>
            <View style={styles.emergencyBadge}>
              <Icon name="flash-on" size={12} color="white" />
              <Text style={styles.emergencyText}>24h</Text>
            </View>
          </View>
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.servicesContainer}>
        <Text style={styles.servicesTitle}>Servicios de Emergencia:</Text>
        {item.services.map((service) => (
          <View key={service.id} style={styles.serviceItem}>
            <Text style={styles.serviceName}>{service.title}</Text>
            <Text style={styles.servicePrice}>${service.price}</Text>
            <Text style={styles.serviceDuration}>{service.duration} min</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.contactContainer}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => handleEmergencyCall(item.phone)}
        >
          <Icon name="phone" size={20} color="white" />
          <Text style={styles.contactButtonText}>Llamar Ahora</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.contactButton, styles.messageButton]}
          onPress={() => handleEmergencyMessage(item)}
        >
          <Icon name="message" size={20} color="white" />
          <Text style={styles.contactButtonText}>Mensaje</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.locationContainer}>
        <Icon name="location-on" size={16} color="#6b7280" />
        <Text style={styles.location}>{item.location.address}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Cargando profesionales de emergencia...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergencias 24 Horas</Text>
          <TouchableOpacity>
            <Icon name="filter-list" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.alertContainer}>
        <View style={styles.alertIcon}>
          <Icon name="warning" size={32} color="#fbbf24" />
        </View>
        <Text style={styles.alertText}>
          Atención de emergencias disponible 24/7. Profesionales verificados listos para ayudarte.
        </Text>
      </View>

      <View style={styles.professionalsList}>
        {professionals.map((professional) => (
          renderProfessionalCard({ item: professional })
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
  },
  alertContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  alertText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 24,
  },
  professionalsList: {
    padding: 16,
  },
  professionalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  professionalHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  professionalInfo: {
    flex: 1,
    marginLeft: 16,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  professionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profession: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  emergencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceName: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  contactContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  messageButton: {
    backgroundColor: '#3b82f6',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
});

export default EmergencyScreen;
