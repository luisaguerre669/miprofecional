import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import ProfessionalsPage from './pages/Professionals';
import ProfessionalDetailPage from './pages/ProfessionalDetail';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfessionalDashboard from './pages/ProfessionalDashboard';

function App() {
  return React.createElement(
    AuthProvider,
    null,
    React.createElement(
      Router,
      null,
      React.createElement(
        'div',
        null,
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) }),
          React.createElement(Route, { path: '/login', element: React.createElement(LoginPage) }),
          React.createElement(Route, { path: '/register', element: React.createElement(RegisterPage) }),
          React.createElement(Route, { path: '/dashboard', element: React.createElement(DashboardPage) }),
          React.createElement(Route, { path: '/professionals', element: React.createElement(ProfessionalsPage) }),
          React.createElement(Route, { path: '/professional/:id', element: React.createElement(ProfessionalDetailPage) }),
          React.createElement(Route, { path: '/booking/:id', element: React.createElement(BookingPage) }),
          React.createElement(Route, { path: '/my-bookings', element: React.createElement(MyBookingsPage) }),
          React.createElement(Route, { path: '/professional-dashboard', element: React.createElement(ProfessionalDashboard) })
        )
      )
    )
  );
}

export default App;
