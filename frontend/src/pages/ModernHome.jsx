import React, { useState, useEffect } from 'react';
import { MapPin, Search, Star, Shield, Clock, ChevronRight, Menu, X } from 'lucide-react';
import './ModernHome.css';

const ModernHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Buenos Aires, Argentina');

  const categories = [
    { name: 'Construcción', icon: '🏗️', color: '#F59E0B' },
    { name: 'Hogar', icon: '🏠', color: '#10B981' },
    { name: 'Educación', icon: '🎓', color: '#3B82F6' },
    { name: 'Salud', icon: '⚕️', color: '#EF4444' },
    { name: 'Mascotas', icon: '🐾', color: '#8B5CF6' },
    { name: 'Servicios', icon: '🔧', color: '#6B7280' },
    { name: 'Justicia', icon: '⚖️', color: '#1F2937' },
    { name: 'Belleza', icon: '💄', color: '#EC4899' }
  ];

  const professionals = [
    { name: 'María G.', profession: 'Electricista', rating: 4.9, reviews: 128, price: '$5.000', image: '👩‍🔧', verified: true },
    { name: 'Carlos R.', profession: 'Plomero', rating: 4.8, reviews: 95, price: '$4.500', image: '👨‍🔧', verified: true },
    { name: 'Ana M.', profession: 'Diseñadora', rating: 5.0, reviews: 156, price: '$8.000', image: '👩‍🎨', verified: true },
    { name: 'Juan P.', profession: 'Carpintero', rating: 4.9, reviews: 87, price: '$6.000', image: '👨‍🏭', verified: false }
  ];

  const urgencies = [
    { name: 'Cerrajería', time: '15 min', icon: '🔑' },
    { name: 'Electricista', time: '30 min', icon: '⚡' },
    { name: 'Plomero', time: '20 min', icon: '💧' },
    { name: 'Médico', time: '10 min', icon: '🚑' }
  ];

  return (
    <div className="modern-home">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo-icon">MP</div>
          <span className="logo-text">MiProfesional</span>
        </div>

        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <a href="#" className="nav-link active">Inicio</a>
          <a href="#" className="nav-link">Servicios</a>
          <a href="#" className="nav-link">Profesionales</a>
          <a href="#" className="nav-link">Urgencias</a>
          <a href="#" className="nav-link">Ayuda</a>
        </div>

        <div className="nav-actions">
          <button className="btn-outline">Soy Profesional</button>
          <button className="btn-primary">Ingresar</button>
          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-content">
          <h1>
            Encontrá el mejor
            <br />
            <span className="highlight">profesional</span> cerca tuyo
          </h1>
          
          <p className="hero-subtitle">
            Más de 10,000 profesionales verificados listos para ayudarte.
            <br />
            Servicio garantizado en menos de 1 hora.
          </p>

          {/* Search Box */}
          <div className="search-box-modern">
            <div className="search-input-group">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="¿Qué servicio necesitás?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="search-input-group">
              <MapPin className="search-icon" />
              <input
                type="text"
                placeholder="Ubicación"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <button className="search-btn">
              Buscar
            </button>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="badge">
              <Shield className="badge-icon" />
              <span>Profesionales verificados</span>
            </div>
            <div className="badge">
              <Star className="badge-icon" />
              <span>4.8 estrellas promedio</span>
            </div>
            <div className="badge">
              <Clock className="badge-icon" />
              <span>Respuesta en 15 min</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section-modern">
        <div className="section-header">
          <h2>Explorá por categoría</h2>
          <a href="#" className="see-all">Ver todas <ChevronRight /></a>
        </div>
        
        <div className="categories-grid-modern">
          {categories.map((cat) => (
            <div key={cat.name} className="category-card-modern" style={{ '--cat-color': cat.color }}>
              <span className="category-icon-modern">{cat.icon}</span>
              <span className="category-name-modern">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Urgencies */}
      <section className="urgencies-section">
        <h2>🚨 Servicios de urgencia</h2>
        <p className="section-subtitle">Profesionales disponibles ahora mismo</p>
        
        <div className="urgencies-grid">
          {urgencies.map((urg) => (
            <div key={urg.name} className="urgency-card-modern">
              <span className="urgency-icon">{urg.icon}</span>
              <span className="urgency-name">{urg.name}</span>
              <span className="urgency-time">{urg.time}</span>
              <button className="urgency-btn">Llamar</button>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="professionals-section">
        <div className="section-header">
          <h2>Profesionales destacados</h2>
          <a href="#" className="see-all">Ver todos <ChevronRight /></a>
        </div>
        
        <div className="professionals-grid">
          {professionals.map((pro) => (
            <div key={pro.name} className="professional-card-modern">
              <div className="pro-image">{pro.image}</div>
              
              <div className="pro-info">
                <div className="pro-header">
                  <span className="pro-name">{pro.name}</span>
                  {pro.verified && <span className="verified-badge">✓</span>}
                </div>
                
                <span className="pro-profession">{pro.profession}</span>
                
                <div className="pro-rating">
                  <Star className="star-icon" />
                  <span>{pro.rating}</span>
                  <span className="reviews">({pro.reviews})</span>
                </div>
                
                <div className="pro-footer">
                  <span className="pro-price">Desde {pro.price}</span>
                  <button className="contact-btn">Contactar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Sos profesional?</h2>
          <p>Unite a nuestra red y conseguí más clientes</p>
          <button className="cta-btn">Registrarme gratis</button>
        </div>
      </section>
    </div>
  );
};

export default ModernHome;
