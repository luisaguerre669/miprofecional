/**
 * Crash Reporting Service - Captura y reporte de errores
 * Integración con backend para tracking de crashes
 */

import { analytics, AnalyticsEvents } from './analytics';

class CrashReporter {
  constructor() {
    this.crashes = [];
    this.isInitialized = false;
  }
  
  init() {
    if (this.isInitialized) return;
    
    // Capturar errores globales
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'uncaught_exception',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Capturar rechazos de promesas no manejados
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_promise_rejection'
      });
    });
    
    // Capturar errores de React (si está disponible)
    if (window.React) {
      this.setupReactErrorBoundary();
    }
    
    this.isInitialized = true;
    console.log('[CrashReporter] Initialized');
  }
  
  handleError(error, context = {}) {
    const crashReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack || 'No stack trace',
        ...context
      },
      device: this.getDeviceInfo(),
      app: this.getAppInfo()
    };
    
    // Guardar localmente
    this.crashes.push(crashReport);
    this.saveCrashes();
    
    // Enviar a analytics
    analytics.track(AnalyticsEvents.CRASH_REPORT, {
      error_message: crashReport.error.message,
      error_name: crashReport.error.name,
      error_stack: crashReport.error.stack,
      ...context
    });
    
    // Enviar a backend inmediatamente
    this.sendCrashToBackend(crashReport);
    
    console.error('[CrashReporter]', crashReport);
  }
  
  getDeviceInfo() {
    return {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
      memory: navigator.deviceMemory || 'unknown',
      connection: navigator.connection ? {
        effective_type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null
    };
  }
  
  getAppInfo() {
    return {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      build: import.meta.env.VITE_APP_BUILD || '1',
      environment: import.meta.env.MODE,
      url: window.location.href,
      referrer: document.referrer
    };
  }
  
  async sendCrashToBackend(crashReport) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      
      await fetch(`${apiUrl}/api/crashes/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(crashReport)
      });
    } catch (e) {
      // Si falla el envío, queda guardado localmente
      console.warn('Failed to send crash report:', e);
    }
  }
  
  saveCrashes() {
    try {
      // Mantener solo últimos 50 crashes
      const recentCrashes = this.crashes.slice(-50);
      localStorage.setItem('crash_reports', JSON.stringify(recentCrashes));
    } catch (e) {
      // Storage lleno
    }
  }
  
  loadCrashes() {
    try {
      const saved = localStorage.getItem('crash_reports');
      if (saved) {
        this.crashes = JSON.parse(saved);
      }
    } catch (e) {
      this.crashes = [];
    }
  }
  
  // Enviar crashes pendientes
  async sendPendingCrashes() {
    this.loadCrashes();
    
    for (const crash of this.crashes) {
      await this.sendCrashToBackend(crash);
    }
    
    this.crashes = [];
    localStorage.removeItem('crash_reports');
  }
  
  setupReactErrorBoundary() {
    // Configuración para Error Boundaries de React
    window.__CRASH_REPORTER__ = this;
  }
}

// Instancia global
export const crashReporter = new CrashReporter();

// Inicializar automáticamente
crashReporter.init();

export default crashReporter;
