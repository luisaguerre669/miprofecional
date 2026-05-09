import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import './RegistroProfesional.css';

export default function RegistroProfesional() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    location: '',
    category: '',
    companyType: 'independiente',
    cuit: '',
    matricula: ''
  });
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
      const response = await apiClient.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        location: formData.location,
        role: 'professional',
        category: formData.category,
        companyType: formData.companyType,
        cuit: formData.cuit,
        matricula: formData.matricula
      });

      if (response.accessToken) {
        apiClient.setToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        navigate('/app/home');
      } else {
        setError(response.message || 'No se pudo completar el registro profesional.');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card" style={{ maxWidth: '700px' }}>
        <Link to="/registro" className="back-link">
          <ArrowLeft size={16} /> Volver a selección
        </Link>

        <div className="register-header">
          <h2 className="text-3d-dark">Registro Profesional</h2>
          <p>Completa tus datos para crear tu perfil profesional y conectar con clientes.</p>
        </div>

        {error && (
          <div className="error-message" style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Nombre o Razón Social</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez o Empresa XYZ"
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+54 9 11 1234-5678"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="profesional@ejemplo.com"
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

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Categoría</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Selecciona una categoría</option>
                <option value="plomeria">Plomería</option>
                <option value="electricidad">Electricidad</option>
                <option value="construccion">Construcción</option>
                <option value="pintura">Pintura</option>
                <option value="jardineria">Jardinería</option>
                <option value="limpieza">Limpieza</option>
                <option value="mecanica">Mecánica</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Ubicación</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ciudad, Provincia"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Tipo de cuenta</label>
              <select name="companyType" value={formData.companyType} onChange={handleChange}>
                <option value="independiente">Profesional Independiente</option>
                <option value="empresa">Empresa / Pyme</option>
              </select>
            </div>
            {formData.companyType === 'empresa' && (
              <div className="form-group flex-1">
                <label>CUIT</label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleChange}
                  placeholder="30-12345678-9"
                />
              </div>
            )}
          </div>

          {formData.category === 'salud' && formData.companyType === 'independiente' && (
            <div className="form-group">
              <label>Matrícula Profesional</label>
              <input
                type="text"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                placeholder="Ej: MN 123456"
              />
            </div>
          )}

          <button type="submit" className="w-100" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                Registrando profesional...
              </>
            ) : (
              'Registrarme como Profesional'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
