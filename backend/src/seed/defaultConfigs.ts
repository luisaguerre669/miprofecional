import { Config } from '../models/Config';

// Configuraciones por defecto para inicializar el sistema
export const defaultConfigs = [
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
  {
    section: 'payment',
    key: 'provider',
    value: 'mercadopago',
    type: 'string',
    description: 'Proveedor de pago principal',
    category: 'payment',
    isPublic: true,
    isEditable: true,
    validation: { options: ['mercadopago', 'stripe', 'transferencia'] }
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
  {
    section: 'subscription',
    key: 'suspension_enabled',
    value: true,
    type: 'boolean',
    description: 'Habilitar suspensión automática por falta de pago',
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
  {
    section: 'notification',
    key: 'email_password',
    value: '',
    type: 'string',
    description: 'Contraseña del email para SMTP',
    category: 'notification',
    isPublic: false,
    isEditable: true
  },
  {
    section: 'notification',
    key: 'warning_email_enabled',
    value: true,
    type: 'boolean',
    description: 'Habilitar emails de advertencia de vencimiento',
    category: 'notification',
    isPublic: false,
    isEditable: true
  },
  {
    section: 'notification',
    key: 'suspension_email_enabled',
    value: true,
    type: 'boolean',
    description: 'Habilitar emails de suspensión',
    category: 'notification',
    isPublic: false,
    isEditable: true
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
  {
    section: 'ui',
    key: 'support_email',
    value: 'soporte@miprofesional.com',
    type: 'string',
    description: 'Email de soporte',
    category: 'ui',
    isPublic: true,
    isEditable: true,
    validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
  },
  {
    section: 'ui',
    key: 'phone_support',
    value: '+54 11 1234-5678',
    type: 'string',
    description: 'Teléfono de soporte',
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
  {
    section: 'system',
    key: 'api_rate_limit',
    value: 100,
    type: 'number',
    description: 'Límite de peticiones por minuto',
    category: 'system',
    isPublic: false,
    isEditable: true,
    validation: { min: 10, max: 1000 }
  },
  {
    section: 'system',
    key: 'backup_enabled',
    value: true,
    type: 'boolean',
    description: 'Habilitar respaldos automáticos',
    category: 'system',
    isPublic: false,
    isEditable: true
  },
  {
    section: 'system',
    key: 'backup_frequency',
    value: 'daily',
    type: 'string',
    description: 'Frecuencia de respaldos',
    category: 'system',
    isPublic: false,
    isEditable: true,
    validation: { options: ['daily', 'weekly', 'monthly'] }
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
  },
  {
    section: 'security',
    key: 'cors_enabled',
    value: true,
    type: 'boolean',
    description: 'Habilitar CORS',
    category: 'security',
    isPublic: false,
    isEditable: true
  },
  {
    section: 'security',
    key: 'cors_origins',
    value: ['http://localhost:3000', 'https://miprofesional.com'],
    type: 'array',
    description: 'Orígenes permitidos para CORS',
    category: 'security',
    isPublic: false,
    isEditable: true
  },
  {
    section: 'security',
    key: 'encryption_enabled',
    value: true,
    type: 'boolean',
    description: 'Habilitar encriptación de datos sensibles',
    category: 'security',
    isPublic: false,
    isEditable: true
  }
];

// Función para inicializar configuraciones por defecto
export const initializeDefaultConfigs = async () => {
  try {
    console.log('Initializing default configurations...');
    
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
    
    console.log(`Successfully initialized ${defaultConfigs.length} default configurations`);
  } catch (error) {
    console.error('Error initializing default configs:', error);
    throw error;
  }
};

export default defaultConfigs;
