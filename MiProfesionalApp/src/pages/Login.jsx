import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import './Register.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.login(formData);

      if (response.accessToken) {
        apiClient.setToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        navigate('/app/home');
      } else {
        setError(response.message || 'No se pudo iniciar sesión.');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        <div className="register-header">
          <h2>Iniciar sesión</h2>
          <p>Accede a tu cuenta para ver profesionales y reservar servicios.</p>
        </div>

        {error && (
          <div className="error-message" style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </div>

          <button type="submit" className="w-100" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            ¿No tienes cuenta? <Link to="/registro">Regístrate como cliente</Link>
          </p>
          <p>
            ¿Eres profesional? <Link to="/registro-profesional">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
