import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Category, Professional, NavigationProps } from '../types';

const CategoryDetailScreen: React.FC<NavigationProps> = ({ route, navigation }) => {
  const { categoryId, title } = route.params;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock professionals data
  const mockProfessionals: Professional[] = [
    {
      id: '1',
      userId: 'user1',
      name: 'Juan Pérez',
      profession: 'Plomero',
      category: categoryId,
      description: 'Especialista en reparaciones hidráulicas y fontanería con más de 10 años de experiencia.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0c2e8749c8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.8,
      reviews: 127,
      phone: '+54 9 1234-5678',
      email: 'juan.perez@email.com',
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
        saturday: false,
        sunday: false,
      },
      services: [
        { id: '1', title: 'Reparación de cañerías', description: 'Reparación y mantenimiento de cañerías', price: 5000, duration: 120, category: categoryId },
        { id: '2', title: 'Instalación de grifería', description: 'Instalación de griferías y accesorios', price: 3500, duration: 90, category: categoryId },
      ],
      verified: true,
      is24h: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user2',
      name: 'María González',
      profession: 'Electricista',
      category: categoryId,
      description: 'Técnica electricista matriculada con especialización en instalaciones residenciales e industriales.',
      avatar: 'https://images.unsplash.com/photo-1494790108757-9c159b828b8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.9,
      reviews: 89,
      phone: '+54 9 2345-6789',
      email: 'maria.gonzalez@email.com',
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
        sunday: false,
      },
      services: [
        { id: '3', title: 'Instalación eléctrica', description: 'Instalación completa de sistema eléctrico', price: 8000, duration: 240, category: categoryId },
        { id: '4', title: 'Mantenimiento eléctrico', description: 'Mantenimiento preventivo de instalaciones', price: 3000, duration: 60, category: categoryId },
      ],
      verified: true,
      is24h: true,
      createdAt: '2024-02-20T14:30:00Z',
    },
  ];

  useEffect(() => {
    loadProfessionals();
  }, [categoryId]);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setProfessionals(mockProfessionals);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading professionals:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfessionals();
    setRefreshing(false);
  };

  const renderProfessionalCard = ({ item }: { item: Professional }) => (
    <TouchableOpacity 
      style={styles.professionalCard}
      onPress={() => navigation.navigate('ProfessionalDetail', { professional: item })}
    >
      <Image source={{ uri: item.avatar }} style={styles.professionalAvatar} />
      <View style={styles.professionalInfo}>
        <View style={styles.professionalHeader}>
          <Text style={styles.professionalName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
          {item.is24h && (
            <View style={styles.emergencyBadge}>
              <Icon name="flash-on" size={12} color="white" />
              <Text style={styles.emergencyText}>24h</Text>
            </View>
          )}
        </View>
        <Text style={styles.profession}>{item.profession}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={14} color="#6b7280" />
          <Text style={styles.location}>{item.location.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleContactPress = (professional: Professional) => {
    Alert.alert(
      'Contactar Profesional',
      `¿Quieres contactar a ${professional.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Llamar', 
          onPress: () => console.log('Calling:', professional.phone) 
        },
        { 
          text: 'Mensaje', 
          onPress: () => navigation.navigate('Chat', { professional }) 
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando profesionales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity>
          <Icon name="filter-list" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={professionals}
        renderItem={renderProfessionalCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No se encontraron profesionales</Text>
            <Text style={styles.emptySubtitle}>Intenta con otra categoría o ubicación</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  listContainer: {
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
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  professionalInfo: {
    padding: 16,
  },
  professionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
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
  profession: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default CategoryDetailScreen;
