/**
 * Analytics Service - Seguimiento de eventos y métricas
 * Compatible con web y mobile (Capacitor)
 */

const ANALYTICS_ENDPOINT = import.meta.env.VITE_API_URL + '/api/analytics';

// Eventos trackables
export const AnalyticsEvents = {
  // Autenticación
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  PASSWORD_RESET: 'password_reset',
  
  // Navegación
  PAGE_VIEW: 'page_view',
  SCREEN_VIEW: 'screen_view',
  
  // Profesionales
  PROFESSIONAL_SEARCH: 'professional_search',
  PROFESSIONAL_VIEWED: 'professional_viewed',
  PROFESSIONAL_CONTACTED: 'professional_contacted',
  
  // Reseñas
  REVIEW_SUBMITTED: 'review_submitted',
  REVIEW_VIEWED: 'review_viewed',
  
  // Suscripciones
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Pagos
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // Imágenes
  IMAGE_UPLOADED: 'image_uploaded',
  CAMERA_USED: 'camera_used',
  GALLERY_USED: 'gallery_used',
  
  // Errores
  ERROR_OCCURRED: 'error_occurred',
  CRASH_REPORT: 'crash_report'
};

class Analytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.queue = [];
    this.isOnline = navigator.onLine;
    
    this.init();
  }
  
  init() {
    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Enviar eventos pendientes al cargar
    this.loadQueuedEvents();
    
    // Flush periódico cada 30 segundos
    setInterval(() => this.flushQueue(), 30000);
  }
  
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  setUserId(userId) {
    this.userId = userId;
  }
  
  /**
   * Trackear evento
   */
  track(eventName, properties = {}) {
    const event = {
      event_name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: this.userId,
        platform: this.getPlatform(),
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
      }
    };
    
    if (this.isOnline) {
      this.sendEvent(event);
    } else {
      this.queueEvent(event);
    }
    
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, properties);
    }
  }
  
  /**
   * Trackear vista de página
   */
  pageView(pageName, properties = {}) {
    this.track(AnalyticsEvents.PAGE_VIEW, {
      page: pageName,
      url: window.location.pathname,
      referrer: document.referrer,
      ...properties
    });
  }
  
  /**
   * Trackear error
   */
  trackError(error, context = {}) {
    this.track(AnalyticsEvents.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context
    });
  }
  
  /**
   * Trackear tiempo de carga
   */
  trackTiming(category, variable, time, label = '') {
    this.track('timing', {
      timing_category: category,
      timing_variable: variable,
      timing_time: time,
      timing_label: label
    });
  }
  
  /**
   * Medir performance de API
   */
  async trackApiCall(endpoint, method, duration, success = true) {
    this.track('api_call', {
      endpoint,
      method,
      duration_ms: duration,
      success
    });
  }
  
  getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    return 'web';
  }
  
  async sendEvent(event) {
    try {
      const token = localStorage.getItem('token');
      await fetch(ANALYTICS_ENDPOINT + '/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Analytics send failed:', error);
      this.queueEvent(event);
    }
  }
  
  queueEvent(event) {
    this.queue.push(event);
    this.saveQueuedEvents();
  }
  
  async flushQueue() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    for (const event of events) {
      await this.sendEvent(event);
    }
    
    this.saveQueuedEvents();
  }
  
  saveQueuedEvents() {
    try {
      localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
    } catch (e) {
      // Storage lleno, ignorar
    }
  }
  
  loadQueuedEvents() {
    try {
      const saved = localStorage.getItem('analytics_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      this.queue = [];
    }
  }
}

// Instancia singleton
export const analytics = new Analytics();

// Hook para React
export function useAnalytics() {
  return {
    track: (event, props) => analytics.track(event, props),
    pageView: (page, props) => analytics.pageView(page, props),
    trackError: (error, context) => analytics.trackError(error, context),
    setUser: (userId) => analytics.setUserId(userId)
  };
}

export default analytics;
