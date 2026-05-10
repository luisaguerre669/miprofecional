import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(apiClient.isAuthenticated() ? 'checking' : 'guest');

  useEffect(() => {
    const handleSessionExpired = () => {
      setStatus('guest');
      navigate('/login', { replace: true, state: { from: location } });
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [location, navigate]);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      if (!apiClient.isAuthenticated()) {
        setStatus('guest');
        return;
      }

      try {
        const profile = await apiClient.getProfile();
        if (!active) return;
        if (profile?.user) {
          localStorage.setItem('currentUser', JSON.stringify(profile.user));
        }
        setStatus('authenticated');
      } catch {
        if (active) setStatus('guest');
      }
    };

    validateSession();
    return () => {
      active = false;
    };
  }, []);

  if (status === 'checking') {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Validando sesion...</div>;
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
