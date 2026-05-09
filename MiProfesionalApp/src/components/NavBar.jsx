import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import './NavBar.css';

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="MiProfesional Logo" height="40" style={{ marginRight: '10px', borderRadius: '4px' }} />
          Mi<span>Profesional</span>
        </Link>
        
        <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/servicios" className="nav-link">Servicios</Link>
          <Link to="/profesionales" className="nav-link">Profesionales</Link>
          <Link to="/ayuda" className="nav-link">Ayuda</Link>
          
          <div className="navbar-actions">
            <Link to="/registro" className="btn-secondary">
              <User size={18} /> Registrarse
            </Link>
            <Link to="/registro" className="btn-primary" style={{ display: 'inline-block', textAlign: 'center' }}>
              Descargar App
            </Link>
          </div>
        </div>

        <button 
          className="mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
