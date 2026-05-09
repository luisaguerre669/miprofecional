import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Professional, Booking, NavigationProps } from '../types';

const BookingScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Mock bookings data
  const mockBookings: Booking[] = [
    {
      id: '1',
      professionalId: '1',
      clientId: 'client1',
      serviceId: '1',
      date: '2024-04-25',
      time: '14:00',
      status: 'confirmed',
      totalAmount: 5000,
      notes: 'Reparación de cañería en cocina',
      createdAt: '2024-04-20T10:00:00Z',
    },
    {
      id: '2',
      professionalId: '2',
      clientId: 'client1',
      serviceId: '3',
      date: '2024-04-26',
      time: '10:00',
      status: 'confirmed',
      totalAmount: 3500,
      notes: 'Mantenimiento de jardín',
      createdAt: '2024-04-22T15:30:00Z',
    },
    {
      id: '3',
      professionalId: '1',
      clientId: 'client1',
      serviceId: '2',
      date: '2024-04-15',
      time: '16:00',
      status: 'completed',
      totalAmount: 2000,
      notes: 'Diseño de jardín',
      createdAt: '2024-04-10T09:00:00Z',
    },
    {
      id: '4',
      professionalId: '2',
      clientId: 'client1',
      serviceId: '4',
      date: '2024-04-18',
      time: '11:00',
      status: 'cancelled',
      totalAmount: 8000,
      notes: 'Cliente canceló',
      createdAt: '2024-04-18T08:00:00Z',
    },
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setBookings(mockBookings);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const filteredBookings = bookings.filter(booking => {
    switch (activeTab) {
      case 'upcoming':
        return booking.status === 'confirmed' || booking.status === 'pending';
      case 'completed':
        return booking.status === 'completed';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const getStatusColor = () => {
      switch (item.status) {
        case 'confirmed':
          return '#3b82f6';
        case 'completed':
          return '#10b981';
        case 'cancelled':
          return '#ef4444';
        case 'pending':
          return '#f59e0b';
        default:
          return '#6b7280';
      }
    };

    const getStatusText = () => {
      switch (item.status) {
        case 'confirmed':
          return 'Confirmado';
        case 'completed':
          return 'Completado';
        case 'cancelled':
          return 'Cancelado';
        case 'pending':
          return 'Pendiente';
        default:
          return 'Desconocido';
      }
    };

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.dateContainer}>
            <Icon name="calendar-today" size={16} color="#6b7280" />
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        
        <View style={styles.bookingInfo}>
          <Text style={styles.time}>{item.time}</Text>
          <Text style={styles.service}>Reparación de cañería</Text>
          <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
        </View>
        
        <View style={styles.bookingFooter}>
          <Text style={styles.amount}>${item.totalAmount}</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="more-vert" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabButton = (tab: 'upcoming' | 'completed' | 'cancelled', title: string, count: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando reservas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Reservas</Text>
        <TouchableOpacity>
          <Icon name="add" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('upcoming', 'Próximas', 2)}
        {renderTabButton('completed', 'Completadas', 1)}
        {renderTabButton('cancelled', 'Canceladas', 1)}
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="calendar-today" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No tienes reservas</Text>
            <Text style={styles.emptySubtitle}>
              Reserva servicios con profesionales de confianza
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  bookingInfo: {
    marginBottom: 12,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  service: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  notes: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
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

export default BookingScreen;
