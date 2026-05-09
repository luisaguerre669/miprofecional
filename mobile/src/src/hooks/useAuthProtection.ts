import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts';

interface UseAuthProtectionOptions {
  requiredAuth?: boolean;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export const useAuthProtection = (options: UseAuthProtectionOptions = {}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigation = useNavigation();
  
  const {
    requiredAuth = true,
    redirectTo = 'Login',
    onUnauthorized,
  } = options;

  useEffect(() => {
    if (!isLoading) {
      if (requiredAuth && !isAuthenticated) {
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          navigation.navigate(redirectTo as never);
        }
      }
    }
  }, [isAuthenticated, isLoading, requiredAuth, redirectTo, onUnauthorized, navigation]);

  return {
    isAuthorized: !requiredAuth || isAuthenticated,
    isLoading,
    user,
  };
};

export default useAuthProtection;
