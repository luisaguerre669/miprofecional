import React from "react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="logo">MiProfesional</div>
          <p>Conectamos personas con profesionales confiables en todo Argentina.</p>
          <div className="social-links">
            <a href="#">📘</a>
            <a href="#">📸</a>
            <a href="#">💬</a>
            <a href="#">🎵</a>
          </div>
        </div>

        <div className="footer-column">
          <h4>Enlaces útiles</h4>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/services">Categorías</a></li>
            <li><a href="/services">Profesionales</a></li>
            <li><a href="/services">Urgencias 24H</a></li>
            <li><a href="/legal">Contacto</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Para profesionales</h4>
          <ul>
            <li><a href="#">Registrarse</a></li>
            <li><a href="#">Iniciar sesión</a></li>
            <li><a href="#">Mi perfil</a></li>
            <li><a href="#">Mis servicios</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Ayuda</h4>
          <ul>
            <li><a href="#">Centro de ayuda</a></li>
            <li><a href="/legal">Términos y condiciones</a></li>
            <li><a href="/legal">Política de privacidad</a></li>
            <li><a href="/legal">Contacto</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Descargá la App</h4>
          <p>y llevá MiProfesional a donde vayas</p>
          <div className="store-buttons">
            <button className="store-button">📱 Google Play</button>
            <button className="store-button">🍎 App Store</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 MiProfesional. Todos los derechos reservados.
      </div>
    </footer>
  );
}

export default Footer;
