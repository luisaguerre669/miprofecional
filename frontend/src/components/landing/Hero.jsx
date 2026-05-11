import React, { useState, useEffect } from 'react';
import './Hero.css';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const professionals = [
    {
      id: 1,
      name: 'María González',
      profession: 'Electricista Certificada',
      rating: 4.9,
      reviews: 128,
      description: 'Especialista en instalaciones eléctricas residenciales e industriales'
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      profession: 'Plomero Maestro',
      rating: 4.8,
      reviews: 95,
      description: '20 años de experiencia en plomería y sistemas de calefacción'
    },
    {
      id: 3,
      name: 'Ana Martínez',
      profession: 'Diseñadora de Interiores',
      rating: 5.0,
      reviews: 156,
      description: 'Transforma tus espacios con diseños modernos y funcionales'
    },
    {
      id: 4,
      name: 'Juan Pérez',
      profession: 'Carpintero Artesanal',
      rating: 4.9,
      reviews: 87,
      description: 'Muebles a medida con acabados de alta calidad'
    }
  ];

  const banners = [
    { id: 1, title: 'Primer servicio GRATIS', subtitle: 'Regístrate hoy y obtén 20% de descuento', color: 'gradient-1', icon: '🎁' },
    { id: 2, title: 'Profesionales Verificados', subtitle: 'Todos nuestros expertos están certificados', color: 'gradient-2', icon: '✓' },
    { id: 3, title: 'Garantía de Satisfacción', subtitle: 'O te devolvemos tu dinero', color: 'gradient-3', icon: '🛡️' },
    { id: 4, title: 'Atención 24/7', subtitle: 'Emergencias las resolvemos en el día', color: 'gradient-4', icon: '⚡' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % professionals.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [professionals.length]);

  return (
    <section className="hero">
      <div className="hero-background"></div>
      
      <div className="hero-content">
        <div className="container">
          <div className="hero-text animate-slideUp">
            <h1 className="hero-title">
              MiProfesional
              <span className="hero-title-highlight">Plataforma de Servicios Profesionales</span>
            </h1>
            <p className="hero-subtitle">
              Encuentra y contrata profesionales certificados de manera segura.
              <br />
              <span className="hero-subtitle-accent">Calidad garantizada en cada servicio.</span>
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">Profesionales</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.8</span>
                <span className="stat-label">Rating promedio</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Verificados</span>
              </div>
            </div>

            <div className="hero-cta">
              <button className="btn btn-primary btn-large">
                Comenzar ahora →
              </button>
              <button className="btn btn-secondary btn-large">
                Ver servicios
              </button>
            </div>
          </div>

          <div className="hero-carousel">
            <div className="carousel-container">
              {professionals.map((pro, index) => (
                <div 
                  key={pro.id}
                  className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                >
                  <div className="professional-card">
                    <div className="professional-info">
                      <h3>{pro.name}</h3>
                      <p className="profession">{pro.profession}</p>
                      <div className="rating">
                        <span>⭐ {pro.rating}</span>
                        <span className="reviews">({pro.reviews} reseñas)</span>
                      </div>
                      <p className="description">{pro.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="carousel-indicators">
                {professionals.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-banners">
        <div className="container">
          <div className="banners-grid">
            {banners.map((banner) => (
              <div key={banner.id} className={`banner-card ${banner.color}`}>
                <span className="banner-icon">{banner.icon}</span>
                <h4>{banner.title}</h4>
                <p>{banner.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
