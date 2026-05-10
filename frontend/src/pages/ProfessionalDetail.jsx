import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { professionalsService } from '../services/api.js';

const ProfessionalDetailPage = () => {
  const { id } = useParams();
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfessional();
  }, [id]);

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

  const handleContact = () => {
    // Implementar contacto con profesional
    alert('Función de contacto próximamente');
  };

  const handleBooking = () => {
    window.location.href = `/booking/${professional._id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando profesional...</p>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error || 'Profesional no encontrado'}</p>
          <button 
            onClick={() => window.location.href = '/professionals'}
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
            <h1 className="text-2xl font-bold text-gray-900">Perfil del Profesional</h1>
            <button 
              onClick={() => window.location.href = '/professionals'}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
          </div>
        </div>
      </header>

      {/* Professional Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {professional.avatar ? (
                <img 
                  src={professional.avatar} 
                  alt={professional.businessName || professional.profession}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                  <h2 className="text-2xl font-bold">
                    {professional.businessName || professional.profession}
                  </h2>
                  {professional.verification?.isVerified && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Verificado
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-lg mt-1">{professional.profession}</p>
                
                {/* Rating */}
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(professional.stats?.rating || 0) ? 'text-yellow-400' : 'text-blue-200'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-white">
                      {professional.stats?.rating || 'N/A'} ({professional.stats?.reviewCount || 0} reseñas)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {professional.description || 'No hay descripción disponible.'}
                  </p>
                </div>

                {/* Services */}
                {professional.services && professional.services.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Servicios</h3>
                    <div className="space-y-3">
                      {professional.services.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                              <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                              <p className="text-gray-500 text-xs mt-2">Duración: {service.duration}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-blue-600">
                                ${service.price}
                              </p>
                              {service.isActive && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Activo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {professional.specialties && professional.specialties.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {professional.specialties.map((specialty, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Working Hours */}
                {professional.availability?.workingHours && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Horario de Atención</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(professional.availability.workingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="capitalize text-gray-700">{day}</span>
                          <span className="text-gray-900">
                            {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{professional.contact?.phone || 'No disponible'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{professional.contact?.email || 'No disponible'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {professional.location?.address}, {professional.location?.city}, {professional.location?.state}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de trabajos</span>
                      <span className="font-medium">{professional.stats?.totalBookings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trabajos completados</span>
                      <span className="font-medium">{professional.stats?.completedBookings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasa de respuesta</span>
                      <span className="font-medium">{professional.stats?.responseRate || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarifa</h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      ${professional.pricing?.hourlyRate || 'N/A'}
                    </p>
                    <p className="text-gray-600">por hora</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Moneda: {professional.pricing?.currency || 'ARS'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleContact}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Contactar Profesional
                  </button>
                  <button
                    onClick={handleBooking}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Reservar Servicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetailPage;
