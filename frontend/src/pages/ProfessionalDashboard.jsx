import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalDashboardService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isConnected, notifications, removeNotification } = useSocket();
  
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    avgRating: 0,
    reviewCount: 0
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [availability, setAvailability] = useState({
    isAvailable: true,
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  // Listen for real-time updates
  useEffect(() => {
    const socket = window.socketService?.getSocket();
    if (!socket) return;

    const handleBookingReceived = (data) => {
      console.log('New booking received in dashboard:', data);
      // Refresh bookings list
      fetchDashboardData();
    };

    const handleBookingStatusChanged = (data) => {
      console.log('Booking status changed in dashboard:', data);
      // Refresh bookings list and stats
      fetchDashboardData();
    };

    socket.on('booking-received', handleBookingReceived);
    socket.on('booking-status-changed', handleBookingStatusChanged);

    return () => {
      socket.off('booking-received', handleBookingReceived);
      socket.off('booking-status-changed', handleBookingStatusChanged);
    };
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and bookings in parallel
      const [statsResponse, bookingsResponse] = await Promise.all([
        professionalDashboardService.getStats(),
        professionalDashboardService.getBookings()
      ]);
      
      setStats(statsResponse.data || stats);
      setBookings(bookingsResponse.data || []);
      setError('');
    } catch (error) {
      setError('Error cargando datos del dashboard');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await professionalDashboardService.updateBookingStatus(bookingId, newStatus);
      
      // Refresh bookings list
      const bookingsResponse = await professionalDashboardService.getBookings();
      setBookings(bookingsResponse.data || []);
      
      // Refresh stats
      const statsResponse = await professionalDashboardService.getStats();
      setStats(statsResponse.data || stats);
      
      setError('');
    } catch (error) {
      setError('Error actualizando estado de reserva');
      console.error('Error updating booking status:', error);
    }
  };

  const handleUpdateAvailability = async () => {
    try {
      await professionalDashboardService.updateAvailability(availability);
      setError('');
    } catch (error) {
      setError('Error actualizando disponibilidad');
      console.error('Error updating availability:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const getFilteredBookings = (status) => {
    return bookings.filter(booking => booking.status === status);
  };

  const BookingCard = ({ booking }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900 mr-3">
              {booking.service}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
          
          {booking.user && (
            <div className="mb-3">
              <p className="text-gray-600">
                <strong>Cliente:</strong> {booking.user.name}
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Contacto:</strong> {booking.user.email} | {booking.user.phone}
              </p>
            </div>
          )}

          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(booking.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(booking.date).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            {booking.price && (
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ${booking.price}
              </p>
            )}
          </div>

          {booking.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Notas del cliente:</strong> {booking.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors duration-200"
              >
                Confirmar
              </button>
              <button
                onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200"
              >
                Rechazar
              </button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <button
              onClick={() => handleUpdateBookingStatus(booking._id, 'completed')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
            >
              Completar
            </button>
          )}
        </div>
      </div>

      <div className="border-t pt-3 mt-4">
        <p className="text-xs text-gray-500">
          Reserva creada el {new Date(booking.createdAt).toLocaleDateString('es-ES')}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { 
          className: 'animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4'
        }),
        React.createElement('p', { className: 'text-gray-600' }, 'Cargando dashboard profesional...')
      )
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    React.createElement('header', { className: 'bg-white shadow-sm' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Dashboard Profesional'),
          React.createElement('button', { 
            onClick: () => navigate('/dashboard'),
            className: 'text-gray-600 hover:text-gray-900'
          }, '← Volver')
        )
      )
    ),

    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      // Connection Status Indicator
      React.createElement('div', { className: 'mb-4' },
        React.createElement('div', { 
          className: `flex items-center px-3 py-2 rounded-lg text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`
        },
          React.createElement('div', { 
            className: `w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }` 
          }),
          isConnected ? 'Conectado en tiempo real' : 'Desconectado'
        )
      ),

      // Notifications Panel
      notifications.length > 0 && React.createElement('div', { 
        className: 'bg-blue-50 border border-blue-200 rounded-lg mb-6' 
      },
        React.createElement('h3', { className: 'text-sm font-medium text-blue-800 mb-2' }, 
          `Notificaciones (${notifications.length})`
        ),
        notifications.slice(0, 3).map((notification, index) =>
          React.createElement('div', { 
            key: index, 
            className: 'flex items-center justify-between p-2 bg-white rounded mb-1' 
          },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('p', { className: 'text-sm text-gray-800' }, notification.message),
              React.createElement('p', { className: 'text-xs text-gray-500' }, 
                new Date(notification.timestamp).toLocaleTimeString()
              )
            ),
            React.createElement('button', {
              onClick: () => removeNotification(index),
              className: 'text-blue-600 hover:text-blue-800 text-sm'
            }, '×')
          )
        )
      ),

      error && React.createElement('div', { 
        className: 'bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6'
      }, error),

      // Stats Cards
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { className: 'flex-shrink-0' },
              React.createElement('div', { className: 'w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center' },
                React.createElement('svg', { className: 'w-5 h-5 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
                )
              )
            ),
            React.createElement('div', { className: 'ml-5 w-0 flex-1' },
              React.createElement('dl', null,
                React.createElement('dt', { className: 'text-sm font-medium text-gray-500 truncate' }, 'Total Reservas'),
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, stats.totalBookings)
              )
            )
          )
        ),

        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { className: 'flex-shrink-0' },
              React.createElement('div', { className: 'w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center' },
                React.createElement('svg', { className: 'w-5 h-5 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
                )
              )
            ),
            React.createElement('div', { className: 'ml-5 w-0 flex-1' },
              React.createElement('dl', null,
                React.createElement('dt', { className: 'text-sm font-medium text-gray-500 truncate' }, 'Pendientes'),
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, stats.pendingBookings)
              )
            )
          )
        ),

        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { className: 'flex-shrink-0' },
              React.createElement('div', { className: 'w-8 h-8 bg-green-500 rounded-md flex items-center justify-center' },
                React.createElement('svg', { className: 'w-5 h-5 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
                )
              )
            ),
            React.createElement('div', { className: 'ml-5 w-0 flex-1' },
              React.createElement('dl', null,
                React.createElement('dt', { className: 'text-sm font-medium text-gray-500 truncate' }, 'Confirmadas'),
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, stats.confirmedBookings)
              )
            )
          )
        ),

        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { className: 'flex-shrink-0' },
              React.createElement('div', { className: 'w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center' },
                React.createElement('svg', { className: 'w-5 h-5 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
                )
              )
            ),
            React.createElement('div', { className: 'ml-5 w-0 flex-1' },
              React.createElement('dl', null,
                React.createElement('dt', { className: 'text-sm font-medium text-gray-500 truncate' }, 'Ingresos'),
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, '$' + (stats.totalRevenue || 0).toFixed(2))
              )
            )
          )
        )
      ),

      // Navigation Tabs
      React.createElement('div', { className: 'bg-white rounded-lg shadow mb-6' },
        React.createElement('div', { className: 'border-b border-gray-200' },
          React.createElement('nav', { className: 'flex -mb-px' },
            [
              { value: 'overview', label: 'Resumen' },
              { value: 'pending', label: `Pendientes (${getFilteredBookings('pending').length})` },
              { value: 'confirmed', label: `Confirmadas (${getFilteredBookings('confirmed').length})` },
              { value: 'completed', label: `Completadas (${getFilteredBookings('completed').length})` },
              { value: 'availability', label: 'Disponibilidad' }
            ].map((tab) =>
              React.createElement('button', {
                key: tab.value,
                onClick: () => setActiveTab(tab.value),
                className: `py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }, tab.label)
            )
          )
        )
      ),

      // Tab Content
      activeTab === 'overview' && React.createElement('div', { className: 'space-y-6' },
        // Recent Bookings
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Reservas Recientes'),
          bookings.slice(0, 5).map((booking) =>
            React.createElement(BookingCard, { key: booking._id, booking: booking })
          )
        )
      ),

      activeTab === 'pending' && React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Reservas Pendientes'),
          getFilteredBookings('pending').map((booking) =>
            React.createElement(BookingCard, { key: booking._id, booking: booking })
          )
        )
      ),

      activeTab === 'confirmed' && React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Reservas Confirmadas'),
          getFilteredBookings('confirmed').map((booking) =>
            React.createElement(BookingCard, { key: booking._id, booking: booking })
          )
        )
      ),

      activeTab === 'completed' && React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Reservas Completadas'),
          getFilteredBookings('completed').map((booking) =>
            React.createElement(BookingCard, { key: booking._id, booking: booking })
          )
        )
      ),

      activeTab === 'availability' && React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
          React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Gestionar Disponibilidad'),
          
          React.createElement('div', { className: 'mb-6' },
            React.createElement('label', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                checked: availability.isAvailable,
                onChange: (e) => setAvailability({...availability, isAvailable: e.target.checked}),
                className: 'mr-2'
              }),
              'Disponible para recibir reservas'
            )
          ),

          React.createElement('div', null,
            React.createElement('h3', { className: 'text-md font-medium text-gray-900 mb-4' }, 'Horario de Atención'),
            Object.entries(availability.workingHours).map(([day, hours]) =>
              React.createElement('div', { key: day, className: 'flex items-center mb-3' },
                React.createElement('div', { className: 'w-24 capitalize' }, day),
                React.createElement('input', {
                  type: 'checkbox',
                  checked: !hours.closed,
                  onChange: (e) => {
                    const newWorkingHours = {...availability.workingHours};
                    newWorkingHours[day] = {
                      ...hours,
                      closed: !e.target.checked
                    };
                    setAvailability({...availability, workingHours: newWorkingHours});
                  },
                  className: 'mr-2'
                }),
                !hours.closed && React.createElement('div', { className: 'flex items-center space-x-2' },
                  React.createElement('input', {
                    type: 'time',
                    value: hours.open,
                    onChange: (e) => {
                      const newWorkingHours = {...availability.workingHours};
                      newWorkingHours[day] = {...hours, open: e.target.value};
                      setAvailability({...availability, workingHours: newWorkingHours});
                    },
                    className: 'px-2 py-1 border rounded'
                  }),
                  React.createElement('span', null, 'a'),
                  React.createElement('input', {
                    type: 'time',
                    value: hours.close,
                    onChange: (e) => {
                      const newWorkingHours = {...availability.workingHours};
                      newWorkingHours[day] = {...hours, close: e.target.value};
                      setAvailability({...availability, workingHours: newWorkingHours});
                    },
                    className: 'px-2 py-1 border rounded'
                  })
                )
              )
            )
          ),

          React.createElement('button', {
            onClick: handleUpdateAvailability,
            className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200'
          }, 'Guardar Disponibilidad')
        )
      )
    )
  );
};

export default ProfessionalDashboard;
