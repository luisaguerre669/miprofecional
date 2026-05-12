import React, { useState } from 'react';
import { Check, Loader2, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import apiClient from '../services/apiClient';
import './HomeCliente.css';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (planType) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.request('/subscriptions/create-preference', {
        method: 'POST',
        body: { planType }
      });
      
      if (response.init_point) {
        window.location.href = response.init_point;
      } else {
        setError('No se pudo generar el link de pago.');
      }
    } catch (err) {
      setError(err.message || 'Error al procesar la suscripción.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h2>Membresía Profesional</h2>
      </header>

      <main className="app-main-content" style={{ padding: '20px' }}>
        <div className="subscription-intro" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Zap size={48} color="var(--color-accent)" style={{ marginBottom: '10px' }} />
          <h3>¡Lleva tu negocio al siguiente nivel!</h3>
          <p>Activa tu suscripción para aparecer en las búsquedas y recibir contactos directos de clientes.</p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}

        <div className="plans-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Plan Mensual */}
          <div className="plan-card" style={{ border: '2px solid #eee', borderRadius: '15px', padding: '20px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4>Mensual</h4>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$5.000 <span style={{ fontSize: '0.8rem', color: '#666' }}>/mes</span></div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}><Check size={18} color="green" /> Perfil público visible</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}><Check size={18} color="green" /> Contacto ilimitado</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}><Check size={18} color="green" /> Galería de imágenes</li>
            </ul>
            <button className="btn-primary w-100" onClick={() => handleSubscribe('monthly')} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Elegir Plan Mensual'}
            </button>
          </div>

          {/* Plan Semestral */}
          <div className="plan-card" style={{ border: '2px solid var(--color-accent)', borderRadius: '15px', padding: '20px', background: '#f0f9ff', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--color-accent)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              AHORRA 16%
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4>Semestral</h4>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$25.000 <span style={{ fontSize: '0.8rem', color: '#666' }}>/6 meses</span></div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}><Check size={18} color="green" /> Todos los beneficios</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}><Check size={18} color="green" /> Insignia destacada</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}><Check size={18} color="green" /> Soporte prioritario</li>
            </ul>
            <button className="btn-accent w-100" onClick={() => handleSubscribe('six_months')} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Elegir Plan Semestral'}
            </button>
          </div>
        </div>

        <div className="security-info" style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '10px', color: '#666', fontSize: '0.9rem' }}>
          <ShieldCheck size={20} />
          <p>Pagos seguros procesados por Mercado Pago. Puedes cancelar en cualquier momento.</p>
        </div>
      </main>
    </div>
  );
}
