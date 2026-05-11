// ❌ Componente de Error Message - MiProfesional Frontend
import React from 'react';

const ErrorMessage = ({ error, onRetry, className = '' }) => {
  if (!error) return null;

  const getErrorIcon = (type) => {
    switch (type) {
      case 'network':
        return '🌐';
      case 'timeout':
        return '⏰';
      case 'auth':
        return '🔐';
      case 'permission':
        return '🚫';
      case 'server':
        return '🔥';
      case 'validation':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'network':
      case 'timeout':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'auth':
      case 'permission':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'server':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'validation':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getErrorColor(error.type)} ${className}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">{getErrorIcon(error.type)}</span>
        <div className="flex-1">
          <h3 className="font-medium mb-1">{error.userMessage}</h3>
          <p className="text-sm opacity-75">{error.message}</p>
          
          {error.details && (
            <ul className="mt-2 text-sm">
              {error.details.map((detail, index) => (
                <li key={index} className="list-disc list-inside">• {detail}</li>
              ))}
            </ul>
          )}
          
          {error.recoverable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-white border border-current rounded hover:bg-gray-50 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
