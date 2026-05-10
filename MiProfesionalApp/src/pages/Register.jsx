import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../services/apiClient';
import './Register.css';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,}$/, 'Teléfono inválido (mínimo 10 dígitos)'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  location: z.string().min(3, 'La ubicación es requerida')
});

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.register({
        ...data,
        role: 'client'
      });

      if (response.accessToken) {
        apiClient.setSession(response);
        navigate('/app/home');
      } else {
        setError(response.message || 'No se pudo completar el registro.');
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
          <h2 className="text-3d-dark">Registro de Cliente</h2>
          <p>Regístrate para acceder a profesionales verificados y reservar servicios.</p>
        </div>

        {error && (
          <div className="error-message" style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ej: María Pérez"
            />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              {...register('email')}
              placeholder="maria@ejemplo.com"
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+54 9 11 1234-5678"
            />
            {errors.phone && <span className="error-text">{errors.phone.message}</span>}
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              {...register('password')}
              placeholder="********"
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>
          <div className="form-group">
            <label>Ubicación</label>
            <input
              type="text"
              {...register('location')}
              placeholder="Ciudad, Provincia"
            />
            {errors.location && <span className="error-text">{errors.location.message}</span>}
          </div>

          <button type="submit" className="w-100" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                Registrando...
              </>
            ) : (
              'Registrarme'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
          <p>
            ¿Eres profesional? <Link to="/registro-profesional">Regístrate como profesional</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
