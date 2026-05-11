import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Home() {
  const categories = [
    { name: "Construcción", icon: "🏗️" },
    { name: "Hogar", icon: "🏠" },
    { name: "Educación", icon: "🎓" },
    { name: "Salud", icon: "⚕️" },
    { name: "Mascotas", icon: "🐾" },
    { name: "Servicios", icon: "🔧" },
    { name: "Justicia", icon: "⚖️" },
    { name: "Belleza", icon: "💄" }
  ];

  const urgencies = [
    { name: "Cerrajería", time: "24 HORAS", icon: "🔒" },
    { name: "Ambulancia", time: "24 HORAS", icon: "🚑" },
    { name: "Remolque", time: "24 HORAS", icon: "🚛" },
    { name: "Enfermería", time: "24 HORAS", icon: "🏥" }
  ];

  return (
    <div className="home">
      <Header />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-main">
          <h1>
            ENCUENTRA
            <br />
            TU <span>PROFESIONAL</span>
            <br />
            HOY
          </h1>
          <p className="hero-subtitle">
            Conectamos personas con profesionales confiables en todo Argentina.
          </p>
          <div className="hero-tags">
            <span>RÁPIDO</span>
            <span>•</span>
            <span>CONFIABLE</span>
            <span>•</span>
            <span>CERCA TUYO</span>
            <span>•</span>
            <span>24/7</span>
            <span>•</span>
            <span>SEGURO</span>
          </div>
        </div>

        <div className="search-box">
          <h3>¿Qué servicio necesitás?</h3>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Ej: Electricista, Plomero, Abogado..."
          />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Tu ubicación"
            defaultValue="Buenos Aires, Argentina"
          />
          <button className="search-button">Buscar Profesional</button>
        </div>

        <div className="pro-promo">
          <h3>¿SOS PROFESIONAL?</h3>
          <p>Potenciá tu negocio y conseguí más clientes</p>
          <button>PUBLICÁ GRATIS</button>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <h2>Explorá por categorías</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.name} className="category-card">
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Professionals / Ads */}
      <section className="featured-section">
        <h2>Profesionales destacados</h2>
        <div className="featured-carousel">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ad-card">
              <div>TU PUBLICIDAD</div>
              <div style={{ color: '#10B981' }}>AQUÍ</div>
              <button>ANUNCIATE</button>
            </div>
          ))}
        </div>
      </section>

      {/* Map and Urgencies */}
      <section className="map-urgencies-section">
        <div>
          <h3>Profesionales cerca tuyo</h3>
          <div className="map-container">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=-58.5,-34.7,-58.3,-34.5&layer=mapnik"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              title="Mapa"
            />
          </div>
        </div>

        <div className="urgencies-box">
          <h3>🔴 Urgencias 24H</h3>
          <div className="urgency-cards">
            {urgencies.map((urg) => (
              <div key={urg.name} className="urgency-card">
                <div className="urgency-icon">{urg.icon}</div>
                <div className="urgency-name">{urg.name}</div>
                <div className="urgency-time">{urg.time}</div>
                <button className="urgency-call">Llamar</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Promo */}
      <section className="app-promo">
        <h3>LLEVÁ MiProfesional SIEMPRE CON VOS</h3>
        <p>Descargá nuestra App y encontrá profesionales desde tu celular.</p>
        <div className="store-buttons">
          <button className="store-button">📱 Google Play</button>
          <button className="store-button">🍎 App Store</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
