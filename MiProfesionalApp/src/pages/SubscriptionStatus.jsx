import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import './Register.css';

export const SubscriptionSuccess = () => (
  <div className="register-container">
    <div className="register-card" style={{ textAlign: 'center' }}>
      <CheckCircle size={64} color="green" style={{ marginBottom: '20px' }} />
      <h2>¡Suscripción Activada!</h2>
      <p>Tu pago ha sido procesado correctamente. Tu perfil profesional ya es visible para todos los clientes.</p>
      <Link to="/app/home" className="btn-primary w-100" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        Ir al Inicio <ArrowRight size={18} />
      </Link>
    </div>
  </div>
);

export const SubscriptionFailure = () => (
  <div className="register-container">
    <div className="register-card" style={{ textAlign: 'center' }}>
      <XCircle size={64} color="red" style={{ marginBottom: '20px' }} />
      <h2>Pago Fallido</h2>
      <p>No pudimos procesar tu pago. Por favor intenta nuevamente o utiliza otro medio de pago.</p>
      <Link to="/app/subscription" className="btn-primary w-100" style={{ marginTop: '20px' }}>
        Reintentar pago
      </Link>
    </div>
  </div>
);

export const SubscriptionPending = () => (
  <div className="register-container">
    <div className="register-card" style={{ textAlign: 'center' }}>
      <Clock size={64} color="orange" style={{ marginBottom: '20px' }} />
      <h2>Pago Pendiente</h2>
      <p>Tu pago se está procesando. Activaremos tu perfil apenas recibamos la confirmación.</p>
      <Link to="/app/home" className="btn-primary w-100" style={{ marginTop: '20px' }}>
        Volver al Inicio
      </Link>
    </div>
  </div>
);
