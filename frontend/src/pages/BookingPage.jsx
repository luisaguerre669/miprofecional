import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { professionalsService, bookingsService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchProfessional();
    generateAvailableSlots();
  }, [id, isAuthenticated, navigate]);

  const fetchProfessional = async () => {
    try {
      setLoading(true);
      const response = await professionalsService.getById(id);
      setProfessional(response);
      setError('');
    } catch (error) {
      setError('Error cargando profesional');
      console.error('Error fetching professional:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = () => {
    const slots = [];
    const today = new Date();
    
    // Generate slots for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip past dates
      if (date < today) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Check if professional works on this day (simplified)
      const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      
      if (isWorkingDay) {
        // Generate time slots from 9:00 to 18:00
        for (let hour = 9; hour <= 17; hour++) {
          slots.push({
            date: dateStr,
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: true
          });
        }
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setBookingLoading(true);
      setError('');

      const bookingData = {
        professionalId: id,
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
        notes: notes,
        price: professional?.pricing?.hourlyRate || 0
      };

      const response = await bookingsService.create(bookingData);
      
      // Redirect to bookings page on success
      navigate('/my-bookings', { 
        state: { success: true, message: 'Reserva creada exitosamente' }
      });
      
    } catch (error) {
      setError(error.message || 'Error creando reserva');
      console.error('Error creating booking:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  const getAvailableTimesForDate = (date) => {
    return availableSlots.filter(slot => slot.date === date);
  };

  const getUniqueDates = () => {
    const dates = [...new Set(availableSlots.map(slot => slot.date))];
    return dates.sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de reserva...</p>
        </div>
      </div>
    );
  }

  if (error && !professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/professionals')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver a profesionales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Reservar Servicio</h1>
            <button 
              onClick={() => navigate(`/professional/${id}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver al perfil
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professional Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                {professional.avatar ? (
                  <img 
                    src={professional.avatar} 
                    alt={professional.businessName || professional.profession}
                    className="w-16 h-16 rounded-full mr-4 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {professional.businessName || professional.profession}
                  </h3>
                  <p className="text-gray-600">{professional.profession}</p>
                  <div className="flex items-center mt-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-600">
                      {professional.stats?.rating || 'N/A'} ({professional.stats?.reviewCount || 0})
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Ubicación:</strong> {professional.location?.city}, {professional.location?.state}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Tarifa:</strong> ${professional.pricing?.hourlyRate || 'N/A'}/hora
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Contacto:</strong> {professional.contact?.phone || 'No disponible'}
                </p>
              </div>

              {professional.services && professional.services.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Servicios Disponibles</h4>
                  <div className="space-y-2">
                    {professional.services.slice(0, 3).map((service, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium text-gray-700">{service.name}</p>
                        <p className="text-gray-500">${service.price} - {service.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Completar Reserva</h2>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* Service Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicio *
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  <option value="General">Consulta General</option>
                  {professional.services?.map((service, index) => (
                    <option key={index} value={service.name}>
                      {service.name} - ${service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una fecha</option>
                  {getUniqueDates().map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {getAvailableTimesForDate(selectedDate).map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors duration-200 ${
                          selectedTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe lo que necesitas o alguna pregunta para el profesional..."
                />
              </div>

              {/* Booking Summary */}
              {selectedDate && selectedTime && selectedService && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Resumen de Reserva</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Servicio:</strong> {selectedService}</p>
                    <p><strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-ES')}</p>
                    <p><strong>Hora:</strong> {selectedTime}</p>
                    <p><strong>Precio estimado:</strong> ${professional.pricing?.hourlyRate || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleBooking}
                disabled={bookingLoading || !selectedDate || !selectedTime || !selectedService}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {bookingLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando reserva...
                  </span>
                ) : (
                  'Confirmar Reserva'
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Al confirmar la reserva, aceptas nuestros términos y condiciones.
                La reserva estará sujeta a disponibilidad del profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
