import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProfessionals: 0,
    totalClients: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Cargar estadísticas
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    // Simulación de datos
    setStats({
      totalProfessionals: 1250,
      totalClients: 3840,
      activeSubscriptions: 890,
      monthlyRevenue: 12500000
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">MiProfesional</div>
        <nav>
          <a href="#" className="active">📊 Dashboard</a>
          <a href="#">👥 Profesionales</a>
          <a href="#">👤 Clientes</a>
          <a href="#">💳 Suscripciones</a>
          <a href="#">⭐ Reseñas</a>
          <a href="#">⚙️ Configuración</a>
        </nav>
        
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="main-content">
        <header>
          <h1>Panel de Administración</h1>
          <div className="admin-info">
            <span>Admin</span>
            <div className="avatar">A</div>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👷</div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalProfessionals}</span>
              <span className="stat-label">Profesionales</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalClients}</span>
              <span className="stat-label">Clientes</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-info">
              <span className="stat-number">{stats.activeSubscriptions}</span>
              <span className="stat-label">Suscripciones</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <span className="stat-number">${(stats.monthlyRevenue / 1000000).toFixed(1)}M</span>
              <span className="stat-label">Ingresos/mes</span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section">
            <h2>Profesionales Recientes</h2>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Juan Pérez</td>
                  <td>Electricista</td>
                  <td><span className="badge verified">✓ Verificado</span></td>
                  <td><button>Ver</button></td>
                </tr>
                <tr>
                  <td>María González</td>
                  <td>Plomera</td>
                  <td><span className="badge pending">⏳ Pendiente</span></td>
                  <td><button>Ver</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h2>Últimas Reseñas</h2>
            <div className="review-card">
              <div className="review-header">
                <span className="stars">⭐⭐⭐⭐⭐</span>
                <span className="reviewer">Carlos R.</span>
              </div>
              <p>Excelente servicio, muy profesional y puntual.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
