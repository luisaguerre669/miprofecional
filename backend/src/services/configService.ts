import { Config } from '../models/Config';

// Servicio para gestión de configuraciones
class ConfigService {
  
  // Inicializar configuraciones por defecto
  async initializeDefaultConfigs() {
    const defaultConfigs = [
      // Configuraciones de Pago (Mercado Pago)
      {
        section: 'mercadopago',
        key: 'access_token',
        value: '',
        type: 'string',
        description: 'Token de acceso a la API de Mercado Pago',
        category: 'payment',
        isPublic: false,
        isEditable: true,
        validation: { pattern: '^[A-Za-z0-9_-]+$' }
      },
      {
        section: 'mercadopago',
        key: 'public_key',
        value: '',
        type: 'string',
        description: 'Clave pública de Mercado Pago para frontend',
        category: 'payment',
        isPublic: true,
        isEditable: true,
        validation: { pattern: '^[A-Za-z0-9_-]+$' }
      },
      {
        section: 'mercadopago',
        key: 'webhook_url',
        value: 'https://miprofesional.com/api/webhooks/mercadopago',
        type: 'string',
        description: 'URL para recibir notificaciones de Mercado Pago',
        category: 'payment',
        isPublic: false,
        isEditable: true
      },
      {
        section: 'payment',
        key: 'alias',
        value: 'miprofesional.mp',
        type: 'string',
        description: 'Alias de la billetera virtual para recibir pagos',
        category: 'payment',
        isPublic: true,
        isEditable: true,
        validation: { pattern: '^[a-z0-9.]+$' }
      },
      {
        section: 'payment',
        key: 'cbu',
        value: '',
        type: 'string',
        description: 'CBU de la cuenta bancaria para transferencias',
        category: 'payment',
        isPublic: false,
        isEditable: true,
        validation: { pattern: '^[0-9]{22}$' }
      },
      {
        section: 'payment',
        key: 'currency',
        value: 'ARS',
        type: 'string',
        description: 'Moneda predeterminada para pagos',
        category: 'payment',
        isPublic: true,
        isEditable: true,
        validation: { options: ['ARS', 'USD', 'EUR'] }
      },
      
      // Configuraciones de Suscripción
      {
        section: 'subscription',
        key: 'trial_days',
        value: 30,
        type: 'number',
        description: 'Días de prueba gratuita para profesionales',
        category: 'subscription',
        isPublic: true,
        isEditable: true,
        validation: { min: 7, max: 90 }
      },
      {
        section: 'subscription',
        key: 'monthly_price',
        value: 8000,
        type: 'number',
        description: 'Precio mensual de suscripción en pesos argentinos',
        category: 'subscription',
        isPublic: true,
        isEditable: true,
        validation: { min: 1000, max: 50000 }
      },
      {
        section: 'subscription',
        key: 'warning_days',
        value: 5,
        type: 'number',
        description: 'Días antes del vencimiento para enviar advertencia',
        category: 'subscription',
        isPublic: false,
        isEditable: true,
        validation: { min: 1, max: 30 }
      },
      {
        section: 'subscription',
        key: 'grace_period_days',
        value: 7,
        type: 'number',
        description: 'Días de gracia después del vencimiento',
        category: 'subscription',
        isPublic: false,
        isEditable: true,
        validation: { min: 1, max: 30 }
      },
      {
        section: 'subscription',
        key: 'auto_renewal',
        value: true,
        type: 'boolean',
        description: 'Renovación automática de suscripciones',
        category: 'subscription',
        isPublic: false,
        isEditable: true
      },
      
      // Configuraciones de Notificación
      {
        section: 'notification',
        key: 'email_enabled',
        value: true,
        type: 'boolean',
        description: 'Habilitar envío de notificaciones por email',
        category: 'notification',
        isPublic: false,
        isEditable: true
      },
      {
        section: 'notification',
        key: 'smtp_host',
        value: 'smtp.gmail.com',
        type: 'string',
        description: 'Servidor SMTP para envío de emails',
        category: 'notification',
        isPublic: false,
        isEditable: true
      },
      {
        section: 'notification',
        key: 'smtp_port',
        value: 587,
        type: 'number',
        description: 'Puerto SMTP',
        category: 'notification',
        isPublic: false,
        isEditable: true,
        validation: { min: 1, max: 65535 }
      },
      {
        section: 'notification',
        key: 'email_from',
        value: 'noreply@miprofesional.com',
        type: 'string',
        description: 'Email remitente para notificaciones',
        category: 'notification',
        isPublic: false,
        isEditable: true,
        validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
      },
      
      // Configuraciones de UI
      {
        section: 'ui',
        key: 'app_name',
        value: 'MiProfesional',
        type: 'string',
        description: 'Nombre de la aplicación',
        category: 'ui',
        isPublic: true,
        isEditable: true
      },
      {
        section: 'ui',
        key: 'primary_color',
        value: '#3b82f6',
        type: 'string',
        description: 'Color primario de la interfaz',
        category: 'ui',
        isPublic: true,
        isEditable: true,
        validation: { pattern: '^#[0-9A-Fa-f]{6}$' }
      },
      {
        section: 'ui',
        key: 'secondary_color',
        value: '#10b981',
        type: 'string',
        description: 'Color secundario de la interfaz',
        category: 'ui',
        isPublic: true,
        isEditable: true,
        validation: { pattern: '^#[0-9A-Fa-f]{6}$' }
      },
      {
        section: 'ui',
        key: 'logo_url',
        value: '/assets/logo.png',
        type: 'string',
        description: 'URL del logo de la aplicación',
        category: 'ui',
        isPublic: true,
        isEditable: true
      },
      
      // Configuraciones de Sistema
      {
        section: 'system',
        key: 'maintenance_mode',
        value: false,
        type: 'boolean',
        description: 'Modo de mantenimiento',
        category: 'system',
        isPublic: true,
        isEditable: true
      },
      {
        section: 'system',
        key: 'debug_mode',
        value: false,
        type: 'boolean',
        description: 'Modo de depuración',
        category: 'system',
        isPublic: false,
        isEditable: true
      },
      {
        section: 'system',
        key: 'max_file_size',
        value: 5242880,
        type: 'number',
        description: 'Tamaño máximo de archivos en bytes (5MB)',
        category: 'system',
        isPublic: false,
        isEditable: true,
        validation: { min: 1048576, max: 104857600 }
      },
      
      // Configuraciones de Seguridad
      {
        section: 'security',
        key: 'jwt_expires_in',
        value: '7d',
        type: 'string',
        description: 'Tiempo de expiración del token JWT',
        category: 'security',
        isPublic: false,
        isEditable: true,
        validation: { options: ['1h', '24h', '7d', '30d'] }
      },
      {
        section: 'security',
        key: 'password_min_length',
        value: 8,
        type: 'number',
        description: 'Longitud mínima de contraseña',
        category: 'security',
        isPublic: false,
        isEditable: true,
        validation: { min: 6, max: 20 }
      },
      {
        section: 'security',
        key: 'rate_limit_enabled',
        value: true,
        type: 'boolean',
        description: 'Habilitar límite de velocidad de peticiones',
        category: 'security',
        isPublic: false,
        isEditable: true
      }
    ];

    for (const config of defaultConfigs) {
      try {
        await Config.findOneAndUpdate(
          { section: config.section, key: config.key },
          config,
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Error creating config ${config.section}.${config.key}:`, error);
      }
    }

    console.log('Default configurations initialized successfully');
  }

  // Obtener valor de configuración
  async getConfig(section: string, key: string, defaultValue?: any) {
    try {
      const config = await Config.findOne({ section, key });
      return config ? config.value : defaultValue;
    } catch (error) {
      console.error(`Error getting config ${section}.${key}:`, error);
      return defaultValue;
    }
  }

  // Establecer valor de configuración
  async setConfig(section: string, key: string, value: any) {
    try {
      const config = await Config.findOneAndUpdate(
        { section, key },
        { value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return config;
    } catch (error) {
      console.error(`Error setting config ${section}.${key}:`, error);
      throw error;
    }
  }

  // Obtener configuraciones públicas
  async getPublicConfigs() {
    try {
      const configs = await Config.find({ isPublic: true }).sort({ category: 1, section: 1, key: 1 });
      return configs;
    } catch (error) {
      console.error('Error getting public configs:', error);
      throw error;
    }
  }

  // Obtener configuraciones por categoría
  async getConfigsByCategory(category: string) {
    try {
      const configs = await Config.find({ category }).sort({ section: 1, key: 1 });
      return configs;
    } catch (error) {
      console.error(`Error getting configs for category ${category}:`, error);
      throw error;
    }
  }

  // Validar configuración
  async validateConfig(section: string, key: string, value: any) {
    try {
      const config = await Config.findOne({ section, key });
      if (!config) {
        throw new Error('Configuration not found');
      }

      return config.validateValue(value);
    } catch (error) {
      console.error(`Error validating config ${section}.${key}:`, error);
      throw error;
    }
  }

  // Obtener configuraciones de pago
  async getPaymentConfigs() {
    return this.getConfigsByCategory('payment');
  }

  // Obtener configuraciones de suscripción
  async getSubscriptionConfigs() {
    return this.getConfigsByCategory('subscription');
  }

  // Actualizar múltiples configuraciones
  async updateMultipleConfigs(configs: Array<{section: string, key: string, value: any}>) {
    const results = [];
    
    for (const config of configs) {
      try {
        const result = await this.setConfig(config.section, config.key, config.value);
        results.push({ success: true, config: result });
      } catch (error) {
        results.push({ 
          success: false, 
          section: config.section, 
          key: config.key, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  }

  // Exportar configuraciones
  async exportConfigs(category?: string) {
    try {
      const query: any = {};
      if (category) query.category = category;
      
      const configs = await Config.find(query).sort({ category: 1, section: 1, key: 1 });
      
      const exportData = configs.reduce((acc, config) => {
        if (!acc[config.category]) acc[config.category] = {};
        if (!acc[config.category][config.section]) acc[config.category][config.section] = {};
        
        acc[config.category][config.section][config.key] = {
          value: config.value,
          type: config.type,
          description: config.description,
          isPublic: config.isPublic,
          isEditable: config.isEditable
        };
        
        return acc;
      }, {} as any);
      
      return exportData;
    } catch (error) {
      console.error('Error exporting configs:', error);
      throw error;
    }
  }

  // Importar configuraciones
  async importConfigs(configData: any) {
    const results = [];
    
    for (const [category, categoryData] of Object.entries(configData)) {
      for (const [section, sectionData] of Object.entries(categoryData as any)) {
        for (const [key, keyData] of Object.entries(sectionData as any)) {
          try {
            const config = keyData as any;
            await this.setConfig(section, key, config.value);
            results.push({ success: true, category, section, key });
          } catch (error) {
            results.push({ 
              success: false, 
              category, 
              section, 
              key, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      }
    }
    
    return results;
  }
}

export const configService = new ConfigService();
export default configService;
