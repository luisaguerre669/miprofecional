import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage = () => {
  const handleLoginSuccess = (response) => {
    console.log('Login exitoso:', response);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
};

export default LoginPage;
