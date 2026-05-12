import React, { useEffect, useState } from 'react';
import { Users, Briefcase, DollarSign, CheckSquare, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import './HomeCliente.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.request('/admin/stats');
        setStats(response);
      } catch (err) {
        setError('No tienes permisos de administrador o hubo un error.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-message"><Loader2 className="animate-spin" /> Cargando panel...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <h2>Panel de Administración</h2>
      </header>

      <main className="app-main-content" style={{ padding: '20px' }}>
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <div className="stat-card" style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Users color="blue" />
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.totalUsers}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Usuarios</div>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Briefcase color="green" />
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.totalProfessionals}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Profesionales</div>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <ShieldAlert color="orange" />
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.pendingVerifications}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Pendientes</div>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <DollarSign color="purple" />
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${stats.revenue}</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Ingresos</div>
          </div>
        </div>

        <div className="admin-actions">
          <h3>Acciones Rápidas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckSquare size={18} /> Verificaciones Pendientes
            </button>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={18} /> Moderar Reseñas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
