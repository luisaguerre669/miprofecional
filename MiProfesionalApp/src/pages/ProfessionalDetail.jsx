import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, MessageSquare, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import './HomeCliente.css';

export default function ProfessionalDetail() {
  const { id } = useParams();
  const [professional, setProfessional] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.request(`/professionals/${id}`);
        setProfessional(response);
        
        const reviewsResponse = await apiClient.request(`/reviews/professional/${id}`);
        setReviews(reviewsResponse || []);
      } catch (err) {
        setError('No se pudo cargar el perfil del profesional.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading-message"><Loader2 className="animate-spin" /> Cargando...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!professional) return <div className="error-message">Profesional no encontrado.</div>;

  const displayName = professional.businessName || professional.name || 'Profesional';

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/app/home" className="btn-icon">
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center' }}>{displayName}</h2>
      </header>

      <main className="app-main-content">
        <div className="profile-hero">
          <div className="pro-avatar-large">{displayName.charAt(0)}</div>
          <div className="pro-header-info">
            <h3>{displayName} {professional.verification?.isVerified && <CheckCircle size={18} color="var(--color-accent)" style={{ display: 'inline' }} />}</h3>
            <span className="pro-profession">{professional.profession}</span>
            <div className="pro-rating-summary">
              <Star size={16} fill="var(--color-warning)" color="var(--color-warning)" />
              <strong>{professional.stats?.rating?.toFixed(1) || '0.0'}</strong>
              <span>({professional.stats?.reviewCount || 0} reseñas)</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h4>Descripción</h4>
          <p>{professional.description || 'Sin descripción disponible.'}</p>
        </div>

        <div className="profile-section">
          <h4>Ubicación</h4>
          <div className="info-item">
            <MapPin size={18} />
            <span>{professional.location?.address}, {professional.location?.city}</span>
          </div>
        </div>

        <div className="profile-actions" style={{ display: 'flex', gap: '10px', padding: '20px' }}>
          <a href={`tel:${professional.contact?.phone}`} className="btn-primary flex-1" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Phone size={18} /> Llamar
          </a>
          <a href={`https://wa.me/${professional.contact?.whatsapp?.replace(/\D/g, '')}`} className="btn-accent flex-1" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', border: 'none' }}>
            <MessageSquare size={18} /> WhatsApp
          </a>
        </div>

        <div className="profile-section">
          <h4>Reseñas</h4>
          {reviews.length === 0 ? (
            <p>Aún no hay reseñas para este profesional.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <strong>{review.user?.name}</strong>
                    <div className="rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? "var(--color-warning)" : "none"} color="var(--color-warning)" />
                      ))}
                    </div>
                  </div>
                  <p>{review.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
