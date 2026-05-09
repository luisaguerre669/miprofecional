const axios = require('axios');
const logger = require('../config/logger');

class N8NService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL;
    this.apiUrl = process.env.N8N_API_URL;
    this.timeout = 30000; // 30 segundos
  }

  // Enviar datos a N8N para procesamiento
  async sendProfessionalData(professionalData) {
    try {
      logger.info('Enviando datos a N8N para procesamiento', { 
        email: professionalData.email,
        profesion: professionalData.profesion 
      });

      // Preparar payload para N8N
      const payload = {
        nombre: professionalData.nombre?.trim() || '',
        email: professionalData.email?.toLowerCase().trim() || '',
        telefono: professionalData.telefono || '',
        profesion: professionalData.profesion?.trim() || '',
        categoria: professionalData.categoria?.toLowerCase().trim() || '',
        descripcion: professionalData.descripcion || '',
        experiencia: parseInt(professionalData.experiencia) || 0,
        precio_hora: parseFloat(professionalData.precio_hora) || 0,
        disponibilidad: professionalData.disponibilidad || 'flexible',
        ubicacion: professionalData.ubicacion || '',
        certificaciones: professionalData.certificaciones || [],
        idiomas: professionalData.idiomas || ['español'],
        timestamp: new Date().toISOString(),
        source: 'miprofesional-api',
        environment: process.env.NODE_ENV || 'development'
      };

      // Enviar a webhook N8N
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MiProfesional-Backend/1.0',
          'X-Environment': process.env.NODE_ENV || 'development'
        },
        timeout: this.timeout
      });

      logger.info('Respuesta recibida de N8N', { 
        status: response.status,
        hasData: !!response.data 
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };

    } catch (error) {
      logger.error('Error comunicando con N8N', { 
        error: error.message,
        webhookUrl: this.webhookUrl,
        email: professionalData?.email 
      });

      // Manejar diferentes tipos de error
      if (error.response) {
        // N8N respondió con error
        return {
          success: false,
          error: error.response.data?.message || 'Error en procesamiento N8N',
          status: error.response.status,
          details: error.response.data
        };
      } else if (error.request) {
        // No se pudo conectar a N8N
        return {
          success: false,
          error: 'No se pudo conectar con N8N',
          details: 'Timeout o conexión rechazada'
        };
      } else {
        // Error de configuración
        return {
          success: false,
          error: 'Error de configuración N8N',
          details: error.message
        };
      }
    }
  }

  // Verificar estado de N8N
  async checkHealth() {
    try {
      const healthUrl = `${this.apiUrl}/healthz`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      
      return {
        success: true,
        status: 'healthy',
        response: response.data
      };
    } catch (error) {
      logger.error('N8N health check failed', { error: error.message });
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Obtener información del workflow
  async getWorkflowInfo(workflowId) {
    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/workflows/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error obteniendo info de workflow N8N', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Activar/desactivar workflow
  async toggleWorkflow(workflowId, active = true) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/workflows/${workflowId}/activate`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.info(`Workflow ${workflowId} ${active ? 'activado' : 'desactivado'}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error cambiando estado de workflow N8N', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar configuración
  validateConfig() {
    const errors = [];

    if (!this.webhookUrl) {
      errors.push('N8N_WEBHOOK_URL no configurado');
    }

    if (!this.apiUrl) {
      errors.push('N8N_API_URL no configurado');
    }

    if (!process.env.N8N_API_TOKEN) {
      errors.push('N8N_API_TOKEN no configurado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Obtener URL del webhook
  getWebhookUrl() {
    return this.webhookUrl;
  }

  // Actualizar configuración
  updateConfig(newConfig) {
    if (newConfig.webhookUrl) this.webhookUrl = newConfig.webhookUrl;
    if (newConfig.apiUrl) this.apiUrl = newConfig.apiUrl;
    if (newConfig.timeout) this.timeout = newConfig.timeout;
    
    logger.info('Configuración N8N actualizada', { 
      webhookUrl: this.webhookUrl,
      apiUrl: this.apiUrl 
    });
  }
}

// Exportar singleton
module.exports = new N8NService();
