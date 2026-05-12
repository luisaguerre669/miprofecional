import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación simple (en producción usar backend)
    if (credentials.username === 'admin' && credentials.password === 'verdent2026') {
      localStorage.setItem('adminToken', 'token_admin_' + Date.now());
      navigate('/admin/dashboard');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="admin-login">
      <div className="login-box">
        <div className="logo">MiProfesional Admin</div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          
          <input
            type="text"
            placeholder="Usuario"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
          
          <input
            type="password"
            placeholder="Contraseña"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          
          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
