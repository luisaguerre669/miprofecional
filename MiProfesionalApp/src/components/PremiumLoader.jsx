import React from 'react';
import './PremiumLoader.css';

/**
 * Premium Loader - Indicadores de carga profesionales
 * Diferentes estilos para diferentes contextos
 */

export const Spinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClass = `spinner-${size}`;
  const colorClass = `spinner-${color}`;
  
  return (
    <div className={`premium-spinner ${sizeClass} ${colorClass}`}>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
  );
};

export const DotsLoader = ({ size = 'medium' }) => {
  return (
    <div className={`dots-loader dots-${size}`}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export const PulseLoader = ({ text = 'Cargando...' }) => {
  return (
    <div className="pulse-loader">
      <div className="pulse-ring"></div>
      <div className="pulse-ring"></div>
      <div className="pulse-ring"></div>
      {text && <span className="pulse-text">{text}</span>}
    </div>
  );
};

export const ProgressBar = ({ progress = 0, height = 8, color = 'primary' }) => {
  return (
    <div className="progress-bar-container" style={{ height: `${height}px` }}">
      <div
        className={`progress-bar-fill progress-${color}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

export const FullPageLoader = ({ message = 'Cargando MiProfesional...' }) => {
  return (
    <div className="full-page-loader">
      <div className="full-page-loader-content">
        <div className="logo-animation">
          <span className="logo-text">Mi</span>
          <span className="logo-text-profesional">Profesional</span>
        </div>
        <DotsLoader size="large" />
        <p className="loader-message">{message}</p>
      </div>
    </div>
  );
};

export const ButtonLoader = ({ loading, children, disabled }) => {
  return (
    <button className="button-with-loader" disabled={disabled || loading}>
      {loading ? (
        <>
          <Spinner size="small" color="white" />
          <span className="button-loader-text">Procesando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export const ContentLoader = ({ children, loading, fallback }) => {
  if (loading) {
    return fallback || <PulseLoader />;
  }
  return children;
};

export default {
  Spinner,
  DotsLoader,
  PulseLoader,
  ProgressBar,
  FullPageLoader,
  ButtonLoader,
  ContentLoader
};
