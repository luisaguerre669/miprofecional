import React from 'react';
import RegisterForm from '../components/Auth/RegisterForm';

const RegisterPage = () => {
  const handleRegisterSuccess = (response) => {
    console.log('Registro exitoso:', response);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
    </div>
  );
};

export default RegisterPage;
