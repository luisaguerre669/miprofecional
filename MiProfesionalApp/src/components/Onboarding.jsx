import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

/**
 * Onboarding Component - Tutorial interactivo para primer uso
 * Mejora la retención y experiencia de nuevos usuarios
 */

const onboardingSteps = [
  {
    id: 1,
    title: 'Bienvenido a MiProfesional',
    description: 'Encuentra profesionales verificados cerca de ti. Plomeros, electricistas, albañiles y más.',
    icon: '👋',
    color: '#28a745'
  },
  {
    id: 2,
    title: 'Busca por Categoría',
    description: 'Explora diferentes categorías de servicios. Filtra por ubicación, calificación y disponibilidad.',
    icon: '🔍',
    color: '#0E8ECB'
  },
  {
    id: 3,
    title: 'Verifica Reseñas',
    description: 'Lee opiniones reales de otros clientes. Todos nuestros profesionales están verificados.',
    icon: '⭐',
    color: '#F5A623'
  },
  {
    id: 4,
    title: 'Paga con Seguridad',
    description: 'Paga con Mercado Pago. Tu dinero está protegido hasta que confirmes el servicio.',
    icon: '🔒',
    color: '#28a745'
  },
  {
    id: 5,
    title: '¿Eres Profesional?',
    description: 'Regístrate como profesional y comienza a recibir solicitudes de clientes en tu zona.',
    icon: '💼',
    color: '#323A45'
  }
];

export function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si ya se completó el onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (hasCompletedOnboarding) {
      setIsVisible(false);
      onComplete?.();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_date', new Date().toISOString());
    setIsVisible(false);
    onComplete?.();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div 
            className="onboarding-progress-bar"
            style={{ width: `${progress}%`, backgroundColor: step.color }}
          />
        </div>

        {/* Skip Button */}
        <button className="onboarding-skip" onClick={handleSkip}>
          Saltar
        </button>

        {/* Content */}
        <div className="onboarding-content">
          <div 
            className="onboarding-icon"
            style={{ backgroundColor: `${step.color}20`, color: step.color }}
          >
            {step.icon}
          </div>

          <h2 className="onboarding-title" style={{ color: step.color }}>
            {step.title}
          </h2>

          <p className="onboarding-description">
            {step.description}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="onboarding-indicators">
          {onboardingSteps.map((_, index) => (
            <button
              key={index}
              className={`onboarding-indicator ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
              style={index === currentStep ? { backgroundColor: step.color } : {}}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="onboarding-navigation">
          <button 
            className="onboarding-btn-prev"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            ← Anterior
          </button>

          <button 
            className="onboarding-btn-next"
            onClick={handleNext}
            style={{ backgroundColor: step.color }}
          >
            {currentStep === onboardingSteps.length - 1 ? '¡Comenzar!' : 'Siguiente →'}
          </button>
        </div>

        {/* Step Counter */}
        <div className="onboarding-counter">
          {currentStep + 1} de {onboardingSteps.length}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para controlar el onboarding
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('onboarding_completed');
    const isFirstVisit = !localStorage.getItem('has_visited');
    
    if (isFirstVisit && !hasCompleted) {
      setShowOnboarding(true);
      localStorage.setItem('has_visited', 'true');
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_completed_date');
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding
  };
}

export default Onboarding;
