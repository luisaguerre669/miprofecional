import React, { useEffect, useState } from 'react';
import { Search, Star, MapPin, SlidersHorizontal, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import apiClient from '../services/apiClient';
import './HomeCliente.css';

export default function HomeCliente() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [bookingData, setBookingData] = useState({ date: '', time: '', service: '' });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [loadError, setLoadError] = useState('');
  const [currentUser, setCurrentUser] = useState(apiClient.getCurrentUser());

  const categories = [
    { name: 'Construcción', icon: '👷' },
    { name: 'Salud', icon: '👨‍⚕️' },
    { name: 'Belleza', icon: '💇‍♀️' },
    { name: 'Hogar', icon: '🧹' },
    { name: 'Mascotas', icon: '🐕' },
    { name: 'Legal', icon: '⚖️' }
  ];

  useEffect(() => {
    apiClient.getProfile()
      .then((response) => {
        if (response?.user) {
          setCurrentUser(response.user);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
      })
      .catch(() => {});
    fetchFeaturedProfessionals();
  }, []);

  async function fetchFeaturedProfessionals() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.getFeaturedProfessionals(12);
      setProfessionals(response?.data || []);
    } catch (error) {
      console.error('Error cargando profesionales:', error);
      setLoadError(error.message || 'No se pudieron cargar los profesionales.');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchText.trim()) {
      fetchFeaturedProfessionals();
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.searchProfessionals({ q: searchText, limit: 20 });
      setProfessionals(response?.data || []);
    } catch (error) {
      console.error('Error buscando profesionales:', error);
      setLoadError(error.message || 'No se pudo completar la busqueda.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSelect = (professional) => {
    setSelectedProfessional(professional);
    setBookingData({
      professionalId: professional._id,
      date: '',
      time: '',
      service: professional.profession || professional.category || 'Servicio'
    });
    setBookingError('');
    setBookingSuccess('');
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    try {
      await apiClient.createBooking({
        professionalId: bookingData.professionalId,
        date: bookingData.date,
        time: bookingData.time,
        service: bookingData.service
      });
      setBookingSuccess('Reserva creada correctamente. ¡Revisa tu agenda!');
      setBookingData((prev) => ({ ...prev, date: '', time: '' }));
    } catch (error) {
      setBookingError(error.message || 'No se pudo crear la reserva.');
    }
  };

  const handleLogout = () => {
    apiClient.removeToken();
    navigate('/login');
  };

  const displayName = (pro) => {
    return pro.businessName || pro.name || pro.fullName || 'Profesional';
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="location-selector">
          <MapPin size={18} color="var(--color-accent)" />
          <div className="location-text">
            <span>Ubicación actual</span>
            <strong>Tu dirección</strong>
          </div>
        </div>
        <button className="btn-icon" onClick={handleLogout} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <LogOut size={22} color="var(--color-text-main)" />
        </button>
      </header>

      <div className="search-container">
        <form className="search-bar" onSubmit={handleSearch}>
          <Search size={20} color="var(--color-text-muted)" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar profesionales por servicio o categoría"
          />
          <button type="submit" className="filter-btn">
            <SlidersHorizontal size={20} />
          </button>
        </form>
      </div>

      <main className="app-main-content">
        {currentUser?.role === 'professional' && (
          <section className="app-section">
            <div className="empty-state">
              Estado de cuenta profesional: {currentUser.verificationStatus === 'verified' ? 'verificado' : 'pendiente de verificacion'}
            </div>
          </section>
        )}

        <section className="app-section">
          <div className="section-title">
            <h3>Categorías</h3>
            <span className="see-all">Ver todas</span>
          </div>
          <div className="shortcuts-scroll">
            {categories.map((cat, idx) => (
              <div key={idx} className="shortcut-item">
                <div className="shortcut-icon"><span>{cat.icon}</span></div>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="app-section">
          <h3>Profesionales Destacados</h3>
          {loading ? (
            <div className="loading-message">Cargando profesionales...</div>
          ) : loadError ? (
            <div className="empty-state">{loadError}</div>
          ) : professionals.length === 0 ? (
            <div className="empty-state">No se encontraron profesionales. Intenta otra búsqueda.</div>
          ) : (
            <div className="featured-list">
              {professionals.map((pro) => (
                <div key={pro._id} className="pro-card">
                  <div className="pro-avatar-placeholder">{displayName(pro).charAt(0)}</div>
                  <div className="pro-info">
                    <h4>{displayName(pro)}</h4>
                    <span className="pro-profession">{pro.profession || pro.category || 'Servicio'}</span>
                    <div className="pro-stats">
                      <div className="rating">
                        <Star size={14} fill="var(--color-warning)" color="var(--color-warning)" />
                        <span>{pro.stats?.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                      <span className="jobs">{pro.location?.city || 'Sin ubicación'}</span>
                    </div>
                    <p className="pro-description">{pro.description || 'Perfil profesional disponible en la plataforma.'}</p>
                    <button className="btn-primary" type="button" onClick={() => handleBookingSelect(pro)}>
                      Reservar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedProfessional && (
          <section className="app-section booking-section">
            <div className="section-title">
              <h3>Reservar con {displayName(selectedProfessional)}</h3>
            </div>

            <form className="booking-form" onSubmit={handleBookingSubmit}>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Fecha</label>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Hora</label>
                  <input
                    type="time"
                    name="time"
                    value={bookingData.time}
                    onChange={handleBookingChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Servicio</label>
                <input
                  type="text"
                  name="service"
                  value={bookingData.service}
                  onChange={handleBookingChange}
                  placeholder="Ej: Reparación eléctrica"
                />
              </div>

              {bookingError && <p className="error-message" style={{ color: '#c33' }}>{bookingError}</p>}
              {bookingSuccess && <p className="success-message" style={{ color: '#2d7a2d' }}>{bookingSuccess}</p>}

              <button type="submit" className="w-100 btn-primary">
                Confirmar reserva
              </button>
            </form>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
