import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Register.css';

export const TermsAndConditions = () => (
  <div className="register-container">
    <div className="register-card" style={{ maxWidth: '800px', textAlign: 'left' }}>
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Volver
      </Link>
      <h2>Términos y Condiciones</h2>
      <p>Bienvenido a MiProfesional. Al utilizar nuestra plataforma, aceptas los siguientes términos:</p>
      <ul>
        <li>MiProfesional es una plataforma de conexión entre clientes y profesionales independientes.</li>
        <li><strong>Aclaración Legal:</strong> MiProfesional actúa únicamente como plataforma de conexión. Los presupuestos, pagos y trabajos realizados son responsabilidad exclusiva de las partes involucradas.</li>
        <li>Los profesionales son responsables de la veracidad de la información en sus perfiles.</li>
        <li>Queda prohibido el uso de la plataforma para actividades ilícitas.</li>
      </ul>
      <p>Última actualización: Mayo 2026</p>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <div className="register-container">
    <div className="register-card" style={{ maxWidth: '800px', textAlign: 'left' }}>
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Volver
      </Link>
      <h2>Política de Privacidad</h2>
      <p>En MiProfesional protegemos tus datos personales.</p>
      <ul>
        <li>Recopilamos información básica para el funcionamiento del servicio.</li>
        <li>No compartimos tus datos con terceros sin tu consentimiento, excepto lo necesario para la conexión entre partes.</li>
        <li>Utilizamos cookies para mejorar la experiencia de usuario.</li>
      </ul>
    </div>
  </div>
);
