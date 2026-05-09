import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="Logo" height="40" style={{ marginRight: '10px', borderRadius: '4px' }} />
              Mi<span>Profesional</span>
            </h3>
            <p>Conectando talento con necesidades, de forma rápida y segura.</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Para Clientes</h4>
              <a href="#">Buscar profesionales</a>
              <a href="#">Cómo funciona</a>
              <a href="#">Garantía de servicio</a>
            </div>
            <div className="link-group">
              <h4>Para Profesionales</h4>
              <a href="#">Unirse a la red</a>
              <a href="#">Planes y precios</a>
              <a href="#">Centro de ayuda</a>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <a href="#">Términos y condiciones</a>
              <a href="#">Política de privacidad</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>
            MiProfesional actúa solo como intermediario tecnológico. 
            No se responsabiliza por trabajos, pagos o conflictos directos entre las partes.
          </p>
          <p className="copyright">&copy; {new Date().getFullYear()} MiProfesional. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
