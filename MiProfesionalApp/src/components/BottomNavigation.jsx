import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const location = useLocation();

  return (
    <div className="bottom-nav">
      <Link to="/app/home" className={`nav-item ${location.pathname === '/app/home' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Inicio</span>
      </Link>
      <Link to="/app/buscar" className={`nav-item ${location.pathname === '/app/buscar' ? 'active' : ''}`}>
        <Search size={24} />
        <span>Buscar</span>
      </Link>
      <Link to="/app/actividad" className={`nav-item ${location.pathname === '/app/actividad' ? 'active' : ''}`}>
        <Calendar size={24} />
        <span>Actividad</span>
      </Link>
      <Link to="/app/perfil" className={`nav-item ${location.pathname === '/app/perfil' ? 'active' : ''}`}>
        <User size={24} />
        <span>Perfil</span>
      </Link>
    </div>
  );
}
