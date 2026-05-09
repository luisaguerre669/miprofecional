import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import RegistroProfesional from './pages/RegistroProfesional';
import HomeCliente from './pages/HomeCliente';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
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
          </Route>

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
