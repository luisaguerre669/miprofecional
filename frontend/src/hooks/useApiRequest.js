// 🎣 Hook personalizado para manejo de requests con loading y errores
import { useState, useCallback } from 'react';
import { handleApiError } from '../utils/apiErrorHandler';

export const useApiRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiCall, ...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall(...args);
      setData(result);
      
      return result;
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);
      
      // Si es error de autenticación, redirigir a login
      if (errorInfo.action === 'redirect_login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
};

// Hook específico para operaciones CRUD
export const useCrudOperations = (service) => {
  const { loading, error, data, execute } = useApiRequest();

  const create = useCallback((itemData) => execute(service.create, itemData), [execute, service]);
  const read = useCallback((id) => execute(service.getById, id), [execute, service]);
  const update = useCallback((id, updateData) => execute(service.update, id, updateData), [execute, service]);
  const remove = useCallback((id) => execute(service.delete, id), [execute, service]);
  const list = useCallback((params) => execute(service.getAll, params), [execute, service]);

  return {
    loading,
    error,
    data,
    create,
    read,
    update,
    remove,
    list
  };
};
