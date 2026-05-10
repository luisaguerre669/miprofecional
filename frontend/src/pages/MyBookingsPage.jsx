import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsService } from '../services/api.js';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isConnected, notifications, removeNotification } = useSocket();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchBookings();
  }, [isAuthenticated, navigate]);

  // Listen for real-time updates
  useEffect(() => {
    const socket = window.socketService?.getSocket();
    if (!socket) return;

    const handleBookingStatusChanged = (data) => {
      console.log('Booking status changed in user bookings:', data);
      // Refresh bookings list
      fetchBookings();
    };

    socket.on('booking-status-changed', handleBookingStatusChanged);

    return () => {
      socket.off('booking-status-changed', handleBookingStatusChanged);
    };
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsService.getUserBookings();
      setBookings(response.data || []);
      setError('');
    } catch (error) {
      setError('Error cargando tus reservas');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    try {
      await bookingsService.cancel(bookingId);
      fetchBookings();
      setError('');
    } catch (error) {
      setError('Error cancelando reserva');
      console.error('Error cancelling booking:', error);
    }
  };

  const handleViewProfessional = (professionalId) => {
    navigate(`/professional/${professionalId}`);
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

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const BookingCard = ({ booking }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
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
          
          {booking.professional && (
            <div className="mb-3">
              <p className="text-gray-600">
                <strong>Profesional:</strong> {booking.professional.businessName || booking.professional.profession}
              </p>
              <button
                onClick={() => handleViewProfessional(booking.professional._id)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Ver perfil →
              </button>
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
                <strong>Notas:</strong> {booking.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <button
              onClick={() => handleCancelBooking(booking._id)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() => handleViewProfessional(booking.professional._id)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
          >
            Contactar
          </button>
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus reservas...</p>
        </div>
      </div>
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    React.createElement('header', { className: 'bg-white shadow-sm' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Mis Reservas'),
          React.createElement('button', { 
            onClick: () => navigate('/dashboard'),
            className: 'text-gray-600 hover:text-gray-900'
          }, '← Volver')
        ),
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
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, bookings.filter(b => b.status === 'pending').length)
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
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, bookings.filter(b => b.status === 'confirmed').length)
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
                React.createElement('dt', { className: 'text-sm font-medium text-gray-500 truncate' }, 'Total Gastado'),
                React.createElement('dd', { className: 'text-lg font-medium text-gray-900' }, '$' + bookings.reduce((sum, b) => sum + (b.price || 0), 0).toFixed(2))
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'bg-white rounded-lg shadow mb-6' },
        React.createElement('div', { className: 'border-b border-gray-200' },
          React.createElement('nav', { className: 'flex -mb-px' },
            [
              { value: 'all', label: 'Todas', count: bookings.length },
              { value: 'pending', label: 'Pendientes', count: bookings.filter(b => b.status === 'pending').length },
              { value: 'confirmed', label: 'Confirmadas', count: bookings.filter(b => b.status === 'confirmed').length },
              { value: 'completed', label: 'Completadas', count: bookings.filter(b => b.status === 'completed').length },
              { value: 'cancelled', label: 'Canceladas', count: bookings.filter(b => b.status === 'cancelled').length }
            ].map((tab) =>
              React.createElement('button', {
                key: tab.value,
                onClick: () => setFilter(tab.value),
                className: `py-4 px-6 border-b-2 font-medium text-sm ${
                  filter === tab.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }, `${tab.label} (${tab.count})`)
            )
          )
        )
      ),

      filteredBookings.length > 0 
        ? React.createElement('div', { className: 'space-y-6' },
            filteredBookings.map((booking) =>
              React.createElement(BookingCard, { key: booking._id, booking: booking })
            )
          )
        : React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'text-gray-400 mb-4' },
              React.createElement('svg', { className: 'w-16 h-16 mx-auto', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h2a1 1 0 100-2H7z', clipRule: 'evenodd' })
              )
            ),
            React.createElement('h3', { className: 'text-lg font-medium text-gray-900 mb-2' }, 'No tienes reservas'),
            React.createElement('p', { className: 'text-gray-600 mb-4' },
              filter === 'all' 
                ? 'Aún no has realizado ninguna reserva' 
                : `No tienes reservas ${getStatusText(filter).toLowerCase()}`
            ),
            React.createElement('button', { 
              onClick: () => navigate('/professionals'),
              className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
            }, 'Buscar Profesionales')
          )
    )
  );
};

export default MyBookingsPage;
