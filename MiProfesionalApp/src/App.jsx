import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import RegistroProfesional from './pages/RegistroProfesional';
import HomeCliente from './pages/HomeCliente';
import ProfessionalDetail from './pages/ProfessionalDetail';
import SubscriptionPage from './pages/SubscriptionPage';
import { SubscriptionSuccess, SubscriptionFailure, SubscriptionPending } from './pages/SubscriptionStatus';
import { TermsAndConditions, PrivacyPolicy } from './pages/LegalPages';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMobileOptimizations, setupInputScroll } from './utils/mobileNavigation';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { analytics } from './services/analytics';
import './services/crashReporter';
import { Onboarding } from './components/Onboarding';
import { FeedbackWidget } from './components/FeedbackWidget';

// Componente para trackear navegación
function AnalyticsTracker() {
  const location = useLocation();
  
  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location]);
  
  return null;
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Inicializar optimizaciones mobile
  useMobileOptimizations();
  
  useEffect(() => {
    // Configurar scroll de inputs en iOS
    setupInputScroll();
    
    // Verificar si es primera visita
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const isFirstVisit = !localStorage.getItem('has_visited');
    
    if (isFirstVisit && !hasCompletedOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('has_visited', 'true');
    }
    
    // Ocultar splash screen nativa después de cargar
    const hideSplash = async () => {
      if (Capacitor.isNativePlatform()) {
        await SplashScreen.hide({
          fadeOutDuration: 500
        });
      }
    };
    
    // Pequeña demora para asegurar que todo está renderizado
    const timer = setTimeout(hideSplash, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AnalyticsTracker />
        
        {showOnboarding && (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        )}
        
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/registro-profesional" element={<RegistroProfesional />} />

          {/* Rutas Protegidas (App Principal) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <HomeCliente />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={null} />
            <Route path="buscar" element={null} />
            <Route path="actividad" element={null} />
            <Route path="perfil" element={null} />
            <Route path="professional/:id" element={<ProfessionalDetail />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="subscription/success" element={<SubscriptionSuccess />} />
            <Route path="subscription/failure" element={<SubscriptionFailure />} />
            <Route path="subscription/pending" element={<SubscriptionPending />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          <Route path="/terminos" element={<TermsAndConditions />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <FeedbackWidget />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
