import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import { ProvinceStatsCard } from '../components';
import { LoadingSpinner } from '../components';

interface ProvinceData {
  province: string;
  provinceCode: string;
  totalClients: number;
  totalProfessionals: number;
  totalSubscriptions: number;
  clientGrowthRate: number;
  professionalGrowthRate: number;
  topCategories?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  topCities?: Array<{
    city: string;
    clients: number;
    professionals: number;
    total: number;
  }>;
}

const ProvinceAnalyticsScreen: React.FC = () => {
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] =<'totalSubscriptions' | 'totalClients' | 'totalProfessionals' | 'growth'>('totalSubscriptions');
  const [filter, setFilter] = useState<'all' | 'highGrowth' | 'lowGrowth'>('all');

  useEffect(() => {
    loadProvinceAnalytics();
  }, [sortBy, filter]);

  const loadProvinceAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API call
      const mockData: ProvinceData[] = [
        {
          province: 'Ciudad Autónoma de Buenos Aires',
          provinceCode: 'CABA',
          totalClients: 45000,
          totalProfessionals: 3200,
          totalSubscriptions: 48200,
          clientGrowthRate: 12.5,
          professionalGrowthRate: 8.3,
          topCategories: [
            { category: 'Plomería', count: 850, percentage: 26.5 },
            { category: 'Electricidad', count: 720, percentage: 22.4 },
            { category: 'Estética', count: 650, percentage: 20.2 },
          ],
          topCities: [
            { city: 'Palermo', clients: 8500, professionals: 620, total: 9120 },
            { city: 'Belgrano', clients: 7200, professionals: 510, total: 7710 },
            { city: 'Recoleta', clients: 6800, professionals: 480, total: 7280 },
          ]
        },
        {
          province: 'Buenos Aires',
          provinceCode: 'BA',
          totalClients: 38000,
          totalProfessionals: 2800,
          totalSubscriptions: 40800,
          clientGrowthRate: 15.2,
          professionalGrowthRate: 11.7,
          topCategories: [
            { category: 'Construcción', count: 920, percentage: 32.9 },
            { category: 'Jardinería', count: 680, percentage: 24.3 },
            { category: 'Pintura', count: 520, percentage: 18.6 },
          ],
          topCities: [
            { city: 'La Plata', clients: 12000, professionals: 850, total: 12850 },
            { city: 'Mar del Plata', clients: 9800, professionals: 720, total: 10520 },
            { city: 'Bahía Blanca', clients: 7200, professionals: 510, total: 7710 },
          ]
        },
        {
          province: 'Córdoba',
          provinceCode: 'CB',
          totalClients: 22000,
          totalProfessionals: 1800,
          totalSubscriptions: 23800,
          clientGrowthRate: 18.7,
          professionalGrowthRate: 14.2,
          topCategories: [
            { category: 'Electricidad', count: 480, percentage: 26.7 },
            { category: 'Mecánica', count: 420, percentage: 23.3 },
            { category: 'Plomería', count: 360, percentage: 20.0 },
          ],
          topCities: [
            { city: 'Córdoba', clients: 15000, professionals: 1100, total: 16100 },
            { city: 'Villa María', clients: 4200, professionals: 380, total: 4580 },
            { city: 'Río Cuarto', clients: 2800, professionals: 320, total: 3120 },
          ]
        },
        {
          province: 'Santa Fe',
          provinceCode: 'SF',
          totalClients: 19000,
          totalProfessionals: 1500,
          totalSubscriptions: 20500,
          clientGrowthRate: 9.8,
          professionalGrowthRate: 7.5,
          topCategories: [
            { category: 'Electricidad', count: 380, percentage: 25.3 },
            { category: 'Plomería', count: 320, percentage: 21.3 },
            { category: 'Mecánica', count: 280, percentage: 18.7 },
          ],
          topCities: [
            { city: 'Rosario', clients: 12000, professionals: 920, total: 12920 },
            { city: 'Santa Fe', clients: 5200, professionals: 420, total: 5620 },
            { city: 'Venado Tuerto', clients: 1800, professionals: 160, total: 1960 },
          ]
        },
        {
          province: 'Mendoza',
          provinceCode: 'MZ',
          totalClients: 12000,
          totalProfessionals: 900,
          totalSubscriptions: 12900,
          clientGrowthRate: 22.1,
          professionalGrowthRate: 16.8,
          topCategories: [
            { category: 'Jardinería', count: 280, percentage: 31.1 },
            { category: 'Pintura', count: 220, percentage: 24.4 },
            { category: 'Electricidad', count: 180, percentage: 20.0 },
          ],
          topCities: [
            { city: 'Mendoza', clients: 8500, professionals: 680, total: 9180 },
            { city: 'Godoy Cruz', clients: 2200, professionals: 150, total: 2350 },
            { city: 'Las Heras', clients: 1300, professionals: 70, total: 1370 },
          ]
        },
        {
          province: 'Tucumán',
          provinceCode: 'TM',
          totalClients: 8500,
          totalProfessionals: 650,
          totalSubscriptions: 9150,
          clientGrowthRate: 25.3,
          professionalGrowthRate: 19.4,
          topCategories: [
            { category: 'Electricidad', count: 180, percentage: 27.7 },
            { category: 'Plomería', count: 140, percentage: 21.5 },
            { category: 'Mecánica', count: 120, percentage: 18.5 },
          ],
          topCities: [
            { city: 'San Miguel de Tucumán', clients: 6800, professionals: 520, total: 7320 },
            { city: 'Yerba Buena', clients: 1200, professionals: 90, total: 1290 },
            { city: 'Banda del Río Salí', clients: 500, professionals: 40, total: 540 },
          ]
        }
      ];

      // Apply filters and sorting
      let filteredData = [...mockData];

      if (filter === 'highGrowth') {
        filteredData = filteredData.filter(p => p.clientGrowthRate > 15);
      } else if (filter === 'lowGrowth') {
        filteredData = filteredData.filter(p => p.clientGrowthRate < 15);
      }

      // Apply sorting
      filteredData.sort((a, b) => {
        switch (sortBy) {
          case 'totalClients':
            return b.totalClients - a.totalClients;
          case 'totalProfessionals':
            return b.totalProfessionals - a.totalProfessionals;
          case 'growth':
            return b.clientGrowthRate - a.clientGrowthRate;
          default:
            return b.totalSubscriptions - a.totalSubscriptions;
        }
      });

      setProvinces(filteredData);
    } catch (error) {
      console.error('Error loading province analytics:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProvinceAnalytics();
  };

  const handleProvincePress = (province: ProvinceData) => {
    Alert.alert(
      `${province.province}`,
      `Clientes: ${province.totalClients.toLocaleString()}\nProfesionales: ${province.totalProfessionals.toLocaleString()}\nTotal: ${province.totalSubscriptions.toLocaleString()}\n\nCrecimiento Clientes: ${province.clientGrowthRate}%\nCrecimiento Profesionales: ${province.professionalGrowthRate}%`,
      [
        { text: 'OK', style: 'default' },
        { text: 'Ver Detalles', onPress: () => {} },
      ]
    );
  };

  const getTotalStats = () => {
    return provinces.reduce(
      (acc, province) => ({
        totalClients: acc.totalClients + province.totalClients,
        totalProfessionals: acc.totalProfessionals + province.totalProfessionals,
        totalSubscriptions: acc.totalSubscriptions + province.totalSubscriptions,
        averageGrowth: acc.averageGrowth + province.clientGrowthRate,
      }),
      { totalClients: 0, totalProfessionals: 0, totalSubscriptions: 0, averageGrowth: 0 }
    );
  };

  const renderHeader = () => {
    const stats = getTotalStats();
    const averageGrowth = provinces.length > 0 ? stats.averageGrowth / provinces.length : 0;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas por Provincia</Text>
          <Text style={styles.subtitle}>Análisis de suscripciones y crecimiento regional</Text>
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <MaterialIcons name="people" size={24} color="#3b82f6" />
            <Text style={styles.summaryNumber}>{(stats.totalClients / 1000).toFixed(1)}K</Text>
            <Text style={styles.summaryLabel}>Clientes</Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialIcons name="business-center" size={24} color="#10b981" />
            <Text style={styles.summaryNumber}>{(stats.totalProfessionals / 1000).toFixed(1)}K</Text>
            <Text style={styles.summaryLabel}>Profesionales</Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialIcons name="trending-up" size={24} color="#f59e0b" />
            <Text style={styles.summaryNumber}>{averageGrowth.toFixed(1)}%</Text>
            <Text style={styles.summaryLabel}>Crecimiento</Text>
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'totalSubscriptions' && styles.sortButtonActive]}
              onPress={() => setSortBy('totalSubscriptions')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'totalSubscriptions' && styles.sortButtonTextActive]}>
                Total
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'totalClients' && styles.sortButtonActive]}
              onPress={() => setSortBy('totalClients')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'totalClients' && styles.sortButtonTextActive]}>
                Clientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'growth' && styles.sortButtonActive]}
              onPress={() => setSortBy('growth')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'growth' && styles.sortButtonTextActive]}>
                Crecimiento
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'highGrowth' && styles.filterButtonActive]}
              onPress={() => setFilter('highGrowth')}
            >
              <Text style={[styles.filterButtonText, filter === 'highGrowth' && styles.filterButtonTextActive]}>
                Alto Crecimiento
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderProvince = ({ item }: { item: ProvinceData }) => (
    <ProvinceStatsCard
      province={item.province}
      provinceCode={item.provinceCode}
      totalClients={item.totalClients}
      totalProfessionals={item.totalProfessionals}
      totalSubscriptions={item.totalSubscriptions}
      clientGrowthRate={item.clientGrowthRate}
      professionalGrowthRate={item.professionalGrowthRate}
      onPress={() => handleProvincePress(item)}
    />
  );

  if (loading) {
    return <LoadingSpinner text="Cargando estadísticas..." overlay />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={provinces}
        renderItem={renderProvince}
        keyExtractor={(item) => item.provinceCode}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="bar-chart" size={64} color="#94a3b8" />
            <Text style={styles.emptyStateTitle}>No hay datos disponibles</Text>
            <Text style={styles.emptyStateMessage}>
              No se encontraron estadísticas para mostrar
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
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  sortButtons: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  list: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
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
  },
});

export default ProvinceAnalyticsScreen;
