// 🛠️ Utilidad para manejo de errores de API - MiProfesional Frontend

export const handleApiError = (error) => {
  console.error('Error de API:', error);

  // Errores de red/CORS
  if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
    return {
      type: 'network',
      message: 'Error de conexión con el servidor. Por favor, verifica tu conexión a internet.',
      userMessage: 'No se pudo conectar con el servidor. Intenta nuevamente.',
      recoverable: true
    };
  }

  // Errores de timeout
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'El servidor tardó demasiado en responder.',
      userMessage: 'El servidor está tardando. Intenta nuevamente en unos segundos.',
      recoverable: true
    };
  }

  // Errores de autenticación
  if (error.response?.status === 401) {
    return {
      type: 'auth',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      userMessage: 'Sesión expirada',
      recoverable: false,
      action: 'redirect_login'
    };
  }

  // Errores de permisos
  if (error.response?.status === 403) {
    return {
      type: 'permission',
      message: 'No tienes permisos para realizar esta acción.',
      userMessage: 'Acceso denegado',
      recoverable: false
    };
  }

  // Errores de recurso no encontrado
  if (error.response?.status === 404) {
    return {
      type: 'not_found',
      message: 'El recurso solicitado no fue encontrado.',
      userMessage: 'Recurso no encontrado',
      recoverable: false
    };
  }

  // Errores del servidor
  if (error.response?.status >= 500) {
    return {
      type: 'server',
      message: 'Error interno del servidor. Por favor, intenta más tarde.',
      userMessage: 'Error del servidor',
      recoverable: true
    };
  }

  // Errores de validación
  if (error.response?.status === 400) {
    return {
      type: 'validation',
      message: error.response?.data?.message || 'Datos inválidos',
      userMessage: 'Verifica los datos ingresados',
      recoverable: true,
      details: error.response?.data?.errors
    };
  }

  // Error genérico
  return {
    type: 'unknown',
    message: error.message || 'Error desconocido',
    userMessage: 'Ocurrió un error inesperado',
    recoverable: true
  };
};

export const isNetworkError = (error) => {
  return error.code === 'ERR_NETWORK' || error.message.includes('CORS');
};

export const isAuthError = (error) => {
  return error.response?.status === 401;
};

export const isServerError = (error) => {
  return error.response?.status >= 500;
};

export const isClientError = (error) => {
  return error.response?.status >= 400 && error.response?.status < 500;
};
