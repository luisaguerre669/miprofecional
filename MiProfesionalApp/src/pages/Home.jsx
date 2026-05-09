import React from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/Banner';
import MapMockup from '../components/MapMockup';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-layout dark-mode">
      {/* Header y Registro */}
      <header className="glass-header">
        <div className="logo-3d text-3d">MiProfesional</div>
        <div className="auth-buttons">
          <button className="btn-neon" onClick={() => navigate('/login')}>Soy Cliente</button>
          <button className="btn-neon pro" onClick={() => navigate('/registro-profesional')}>Soy Profesional (Selfie + Matrícula)</button>
        </div>
      </header>

      {/* Mosaico y Banner Principal */}
      <main className="hero-container">
        <div className="category-grid">
          <div className="cat-card" style={{ backgroundImage: "url('/pro_ad_1.png')" }}>
            <span>Educación</span>
          </div>
          <div className="cat-card" style={{ backgroundImage: "url('/pro_ad_3.png')" }}>
            <span>Belleza</span>
          </div>
          
          <section className="main-banner-interactivo">
            <Banner />
          </section>

          <div className="cat-card" style={{ backgroundImage: "url('/pro_ad_4.png')" }}>
            <span>Hogar</span>
          </div>
          <div className="cat-card" style={{ backgroundImage: "url('/pro_ad_2.png')" }}>
            <span>Mascotas</span>
          </div>
        </div>
      </main>

      {/* Botón Urgencias 24h */}
      <section className="urgencias-container container">
        <button className="btn-urgencia-neon" onClick={() => navigate('/login')}>
          URGENCIAS 24H: Cerrajería, Enfermería, Remolque
        </button>
      </section>

      {/* Zona Interactiva al 50/50 */}
      <section className="interactive-zone container">
        <div id="map-half">
          <MapMockup />
        </div>
        <div id="feedback-half" className="glass-panel">
          <h3>Comunidad y Sugerencias</h3>
          <div className="rating">★★★★★ (4.8)</div>
          <textarea placeholder="¿Cómo podemos mejorar?"></textarea>
          <button className="btn-arrancar" onClick={() => navigate('/app/home')}>¡ARRANCAR SERVICIO!</button>
        </div>
      </section>

      {/* Footer Legal y Descargas */}
      <footer className="home-footer container">
        <div className="downloads">
          <button className="btn-outline">Descargar para Android</button>
          <button className="btn-outline">Descargar para iPhone</button>
          <button className="btn-outline">Instalar en Windows</button>
        </div>
        <p className="legal-text">
          MiProfesional es un nexo. No manejamos dinero ni garantizamos presupuestos. Acuerdo entre partes. Pago vía transferencia (Mercado Pago).
        </p>
      </footer>
    </div>
  );
}
