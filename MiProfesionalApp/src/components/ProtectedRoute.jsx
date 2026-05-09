import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!apiClient.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
