import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useMobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Verificar si podemos ir atrás
    setCanGoBack(location.pathname !== '/');
  }, [location]);

  const goBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  const navigateToRoot = () => {
    navigate('/');
  };

  return {
    canGoBack,
    goBack,
    navigateTo,
    navigateToRoot,
    currentPath: location.pathname
  };
};

// Hook para manejar el teclado en mobile
export const useKeyboard = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      if (windowHeight < screenHeight * 0.8) {
        setKeyboardVisible(true);
        setKeyboardHeight(screenHeight - windowHeight);
      } else {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { keyboardVisible, keyboardHeight };
};

// Hook para manejar gestos táctiles
export const useTouchGestures = (elementRef) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      console.log('Swipe left detected');
    }
    
    if (isRightSwipe) {
      console.log('Swipe right detected');
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart);
    element.addEventListener('touchmove', onTouchMove);
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [elementRef, touchStart, touchEnd]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};

// Hook para manejar el estado de conexión
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
