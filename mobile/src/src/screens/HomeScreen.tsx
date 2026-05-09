import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Category, Professional, NavigationProps } from '../types';

const HomeScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProfessionals, setFeaturedProfessionals] = useState<Professional[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with API calls
  const mockCategories: Category[] = [
    {
      id: 'hogar',
      title: 'Servicios del hogar',
      imageUrl: 'https://images.unsplash.com/photo-1584294249143-aa4a9443e1b5?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 156,
    },
    {
      id: 'reparaciones',
      title: 'Reparaciones y mantenimiento',
      imageUrl: 'https://images.unsplash.com/photo-1621905252509-c736a4a7a5c7?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 89,
    },
    {
      id: 'salud',
      title: 'Salud y bienestar',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 92,
    },
    {
      id: 'belleza',
      title: 'Belleza y estética',
      imageUrl: 'https://images.unsplash.com/photo-1560069002-2ce093a6a9c8?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 67,
    },
    {
      id: 'automotriz',
      title: 'Automotriz y mecánica',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 78,
    },
    {
      id: 'mascotas',
      title: 'Mascotas y cuidados',
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3be275044db?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 45,
    },
    {
      id: 'construccion',
      title: 'Construcción y obras',
      imageUrl: 'https://images.unsplash.com/photo-1541888941276-79c511ec5134?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 124,
    },
    {
      id: 'tecnologia',
      title: 'Tecnología y soporte',
      imageUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=400&h=300&fit=crop&crop=entropy&auto=format',
      count: 203,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Simulate API call
      setCategories(mockCategories);
      // Load featured professionals
      setFeaturedProfessionals([]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryDetail', { categoryId: category.id, title: category.title });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('SearchResults', { query: searchQuery });
    }
  };

  const handleEmergencyPress = () => {
    Alert.alert(
      'Emergencias 24 horas',
      '¿Necesitas ayuda urgente? Te conectaremos con profesionales disponibles ahora mismo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Solicitar ayuda', onPress: () => navigation.navigate('Emergency') },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>MiProfesional</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Icon name="person" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.heroSection}>
        <Text style={styles.heroTitle}>Encontrá el profesional que necesitás</Text>
        <Text style={styles.heroSubtitle}>Conectamos personas con profesionales en tu zona</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="¿Qué servicio necesitás?"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Icon name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Emergency Banner */}
      <TouchableOpacity style={styles.emergencyBanner} onPress={handleEmergencyPress}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.emergencyGradient}>
          <Icon name="warning" size={24} color="white" />
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergencias 24 horas</Text>
            <Text style={styles.emergencySubtitle}>Ayuda disponible ahora</Text>
          </View>
          <Icon name="arrow-forward" size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explorá por categorías</Text>
        <Text style={styles.sectionSubtitle}>Encontrá el servicio perfecto para tus necesidades</Text>
        
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
            >
              <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.categoryOverlay}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryCount}>{category.count} profesionales</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profesionales destacados</Text>
        <Text style={styles.sectionSubtitle}>Los mejores profesionales de tu zona</Text>
        
        {featuredProfessionals.length === 0 ? (
          <View style={styles.noProfessionals}>
            <Icon name="search" size={48} color="#9ca3af" />
            <Text style={styles.noProfessionalsText">Pronto disponibles</Text>
            <Text style={styles.noProfessionalsSubtitle}>Estamos agregando los mejores profesionales</Text>
          </View>
        ) : (
          // Featured professionals list would go here
          <View />
        )}
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    padding: 24,
    margin: 16,
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBanner: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    height: 160,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noProfessionals: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noProfessionalsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noProfessionalsSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default HomeScreen;
