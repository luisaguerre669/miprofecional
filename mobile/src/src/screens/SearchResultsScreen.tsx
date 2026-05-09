import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Professional, NavigationProps, SearchFilters } from '../types';

const SearchResultsScreen: React.FC<NavigationProps> = ({ route, navigation }) => {
  const { query } = route.params || {};
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [refreshing, setRefreshing] = useState(false);

  // Mock professionals data
  const mockProfessionals: Professional[] = [
    {
      id: '1',
      userId: 'user1',
      name: 'Carlos Rodríguez',
      profession: 'Jardinero',
      category: 'hogar',
      description: 'Especialista en jardinería y paisajismo con más de 8 años de experiencia.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0c2e8749c8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.7,
      reviews: 89,
      phone: '+54 9 1234-5678',
      email: 'carlos.rodriguez@email.com',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: 'Caballito, Buenos Aires',
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
        { id: '1', title: 'Mantenimiento de jardín', description: 'Cuidado completo del jardín', price: 3000, duration: 180, category: 'hogar' },
        { id: '2', title: 'Paisajismo', description: 'Diseño y mantenimiento de espacios verdes', price: 2500, duration: 120, category: 'hogar' },
      ],
      verified: true,
      is24h: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user2',
      name: 'Ana Martínez',
      profession: 'Limpieza',
      category: 'hogar',
      description: 'Servicios de limpieza profunda para hogares y oficinas.',
      avatar: 'https://images.unsplash.com/photo-1494790108757-9c159b828b8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.5,
      reviews: 156,
      phone: '+54 9 2345-6789',
      email: 'ana.martinez@email.com',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        address: 'Recoleta, Buenos Aires',
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
        { id: '3', title: 'Limpieza estándar', description: 'Limpieza completa del hogar', price: 2000, duration: 120, category: 'hogar' },
        { id: '4', title: 'Limpieza profunda', description: 'Limpieza intensiva de espacios', price: 3500, duration: 240, category: 'hogar' },
      ],
      verified: true,
      is24h: false,
      createdAt: '2024-02-20T14:30:00Z',
    },
  ];

  useEffect(() => {
    if (query) {
      searchProfessionals();
    }
  }, [query]);

  const searchProfessionals = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = mockProfessionals.filter(professional =>
          professional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          professional.profession.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setProfessionals(filtered);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error searching professionals:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchProfessionals();
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
        <View style={styles.priceContainer}>
          <Text style={styles.price}>Desde ${item.services[0].price}</Text>
          <Text style={styles.duration}>{item.services[0].duration} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados de búsqueda</Text>
        <TouchableOpacity>
          <Icon name="filter-list" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar profesionales..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchProfessionals}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchProfessionals}>
          <Icon name="search" size={20} color="white" />
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
            <Text style={styles.emptySubtitle}>Intenta con otros términos de búsqueda</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
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
    marginBottom: 12,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

export default SearchResultsScreen;
