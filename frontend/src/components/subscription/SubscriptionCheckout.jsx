import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionCheckout = () => {
  const [plans, setPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          payerEmail: 'usuario@ejemplo.com',
          professionalId: '123456'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirigir a Mercado Pago
        window.location.href = data.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-checkout">
      <h2>Elige tu plan</h2>
      
      <div className="plans-grid">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={`plan-card ${selectedPlan === key ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(key)}
          >
            <h3>{plan.name}</h3>
            <p className="price">${plan.price / 100}/mes</p>
            <ul>
              <li>Hasta {plan.features?.maxServices || 10} servicios</li>
              <li>{plan.features?.featuredListings || 2} destacados</li>
              {plan.features?.prioritySupport && <li>Soporte prioritario</li>}
            </ul>
          </div>
        ))}
      </div>

      <button 
        className="subscribe-btn"
        onClick={handleSubscribe}
        disabled={loading}
      >
        {loading ? 'Procesando...' : 'Suscribirme'}
      </button>
    </div>
  );
};

export default SubscriptionCheckout;
