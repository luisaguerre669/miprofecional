import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Professional, NavigationProps } from '../types';

const FavoritesScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock favorites data
  const mockFavorites: Professional[] = [
    {
      id: '1',
      userId: 'user1',
      name: 'Pedro López',
      profession: 'Jardinero',
      category: 'hogar',
      description: 'Especialista en jardinería y paisajismo con más de 10 años de experiencia.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0c2e8749c8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.9,
      reviews: 67,
      phone: '+54 9 1234-5678',
      email: 'pedro.lopez@email.com',
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
        { id: '1', title: 'Diseño de Jardines', description: 'Diseño completo de espacios verdes', price: 5000, duration: 180, category: 'hogar' },
        { id: '2', title: 'Mantenimiento', description: 'Mantenimiento periódico del jardín', price: 2000, duration: 120, category: 'hogar' },
      ],
      verified: true,
      is24h: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user2',
      name: 'Sofía Ramírez',
      profession: 'Electricista',
      category: 'reparaciones',
      description: 'Técnica electricista matriculada con especialización en instalaciones residenciales.',
      avatar: 'https://images.unsplash.com/photo-1494790108757-9c159b828b8a?w=150&h=150&fit=crop&crop=face&auto=format',
      rating: 4.8,
      reviews: 92,
      phone: '+54 9 2345-6789',
      email: 'sofia.ramirez@email.com',
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
        saturday: false,
        sunday: false,
      },
      services: [
        { id: '3', title: 'Instalación Eléctrica', description: 'Instalación completa de sistema eléctrico', price: 8000, duration: 240, category: 'reparaciones' },
        { id: '4', title: 'Mantenimiento Eléctrico', description: 'Mantenimiento preventivo de instalaciones', price: 3000, duration: 60, category: 'reparaciones' },
      ],
      verified: true,
      is24h: false,
      createdAt: '2024-02-20T14:30:00Z',
    },
  ];

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setFavorites(mockFavorites);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const renderFavoriteCard = ({ item }: { item: Professional }) => (
    <View style={styles.favoriteCard}>
      <TouchableOpacity onPress={() => navigation.navigate('ProfessionalDetail', { professional: item })}>
        <Image source={{ uri: item.avatar }} style={styles.favoriteAvatar} />
        <View style={styles.favoriteInfo}>
          <View style={styles.favoriteHeader}>
            <Text style={styles.favoriteName}>{item.name}</Text>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Icon name="favorite" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#fbbf24" />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
        </View>
        <Text style={styles.favoriteProfession}>{item.profession}</Text>
        <Text style={styles.favoriteDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.favoriteFooter}>
          <View style={styles.locationContainer}>
            <Icon name="location-on" size={14} color="#6b7280" />
            <Text style={styles.location}>{item.location.address}</Text>
          </View>
          <Text style={styles.favoritePrice}>Desde ${item.services[0].price}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const toggleFavorite = (professionalId: string) => {
    Alert.alert(
      'Eliminar de Favoritos',
      '¿Quieres eliminar este profesional de tus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: () => {
            const updatedFavorites = favorites.filter(fav => fav.id !== professionalId);
            setFavorites(updatedFavorites);
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Favoritos</Text>
        <TouchableOpacity>
          <Icon name="filter-list" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavoriteCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="favorite-border" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No tienes favoritos</Text>
            <Text style={styles.emptySubtitle}>
              Agrega profesionales a tus favoritos para encontrarlos rápidamente
            </Text>
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
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  favoriteInfo: {
    padding: 16,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
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
  favoriteProfession: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  favoritePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
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

export default FavoritesScreen;
