import React from "react";

function Header() {
  return (
    <header className="header">
      <div className="logo">MiProfesional</div>
      <nav>
        <a href="/" className="active">Inicio</a>
        <a href="/services">Categorías</a>
        <a href="/services">Profesionales</a>
        <a href="/services">Urgencias 24H</a>
        <a href="/services">Reseñas</a>
        <a href="/legal">Contacto</a>
        <button>Soy Cliente</button>
        <button>Soy Profesional</button>
      </nav>
    </header>
  );
}

export default Header;
