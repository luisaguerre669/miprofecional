/**
 * Mobile Navigation - Gestos táctiles y navegación iOS nativa
 */
import { useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Helper para detectar plataforma
const isPlatform = (platform) => Capacitor.getPlatform() === platform;
const isNative = () => Capacitor.isNativePlatform();

/**
 * Hook para manejar el botón de atrás en Android
 * y gestos de navegación iOS
 */
export function useMobileNavigation() {
  useEffect(() => {
    // Solo en dispositivos móviles
    if (!isPlatform('ios') && !isPlatform('android')) return;
    
    // Manejar botón de atrás en Android
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
    
    // Configurar status bar para modo oscuro
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    
    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, []);
}

/**
 * Hook para manejar el teclado virtual en iOS
 */
export function useKeyboardHandling() {
  useEffect(() => {
    if (!isPlatform('ios')) return;
    
    // Escuchar eventos del teclado
    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.classList.add('keyboard-visible');
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });
    
    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-visible');
      document.body.style.removeProperty('--keyboard-height');
    });
    
    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
    };
  }, []);
}

/**
 * Hook para safe areas en iPhone con notch
 */
export function useSafeAreas() {
  useEffect(() => {
    if (!isPlatform('ios')) return;
    
    // Aplicar safe areas CSS
    const style = document.documentElement.style;
    
    // Detectar si tiene notch
    const hasNotch = window.screen.height >= 812 || window.screen.width >= 812;
    
    if (hasNotch) {
      style.setProperty('--sat', 'env(safe-area-inset-top)');
      style.setProperty('--sar', 'env(safe-area-inset-right)');
      style.setProperty('--sab', 'env(safe-area-inset-bottom)');
      style.setProperty('--sal', 'env(safe-area-inset-left)');
    } else {
      style.setProperty('--sat', '20px');
      style.setProperty('--sar', '0px');
      style.setProperty('--sab', '0px');
      style.setProperty('--sal', '0px');
    }
  }, []);
}

/**
 * Hook para pausar/reanudar la app
 */
export function useAppState(callback) {
  useEffect(() => {
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      callback?.(isActive);
    });
    
    return () => {
      listener.then(l => l.remove());
    };
  }, [callback]);
}

/**
 * Hook combinado para toda la navegación mobile
 */
export function useMobileOptimizations() {
  useMobileNavigation();
  useKeyboardHandling();
  useSafeAreas();
}

/**
 * Ocultar teclado
 */
export async function hideKeyboard() {
  if (isPlatform('ios') || isPlatform('android')) {
    await Keyboard.hide();
  }
}

/**
 * Mostrar teclado
 */
export async function showKeyboard() {
  if (isPlatform('ios') || isPlatform('android')) {
    await Keyboard.show();
  }
}

/**
 * Configurar scroll para inputs (evita que el teclado los tape)
 */
export function setupInputScroll() {
  if (!isPlatform('ios')) return;
  
  const inputs = document.querySelectorAll('input, textarea');
  
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  });
}
