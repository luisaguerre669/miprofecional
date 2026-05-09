const axios = require('axios');
const Professional = require('../models/Professional');

class ProfessionalRegistrationController {
  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://tu-n8n-instance.com/webhook/profesional-alta';
  }

  // 🎯 DISEÑO DEL FLUJO DE REGISTRO COMPLETO
  async registerProfessional(req, res) {
    try {
      console.log('🚀 Iniciando flujo de registro profesional...');
      
      // 📋 1. Validación inicial de datos
      const validationResult = this.validateInitialData(req.body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.errors,
          step: 'validation_initial'
        });
      }

      // 🔄 2. Enviar datos a N8N para procesamiento con IA
      console.log('📡 Enviando datos a N8N para procesamiento IA...');
      const n8nResponse = await this.sendToN8N(req.body);
      
      // 📊 3. Procesar respuesta de N8N
      if (n8nResponse.success) {
        // ✅ Registro exitoso en N8N
        console.log('✅ Profesional procesado exitosamente por N8N');
        
        return res.status(201).json({
          success: true,
          message: 'Profesional registrado exitosamente',
          data: {
            professional_id: n8nResponse.profesional_id,
            status: n8nResponse.status,
            score_calidad: n8nResponse.score_calidad,
            next_steps: this.getNextSteps(n8nResponse.status)
          },
          step: 'registration_complete'
        });
      } else {
        // ❌ Error en procesamiento N8N
        console.error('❌ Error en procesamiento N8N:', n8nResponse.message);
        
        return res.status(400).json({
          success: false,
          message: n8nResponse.message || 'Error en el procesamiento del registro',
          errors: n8nResponse.errors || [],
          suggestions: n8nResponse.suggestions || {},
          step: 'n8n_processing_error'
        });
      }
    } catch (error) {
      console.error('🚨 Error crítico en registro profesional:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        step: 'server_error'
      });
    }
  }

  // 📋 VALIDACIÓN INICIAL DE DATOS
  validateInitialData(data) {
    const errors = [];
    const required = ['nombre', 'email', 'telefono', 'categoria', 'profesion'];
    
    // Validación de campos requeridos
    required.forEach(field => {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`El campo ${field} es requerido`);
      }
    });

    // Validación de formato de email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('El formato del email es inválido');
    }

    // Validación de teléfono
    if (data.telefono) {
      const phoneDigits = data.telefono.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        errors.push('El teléfono debe tener entre 10 y 15 dígitos');
      }
    }

    // Validación de categorías permitidas
    const allowedCategories = [
      'plomeria', 'electricidad', 'construccion', 'pintura', 
      'jardineria', 'limpieza', 'mecanica', 'otros'
    ];
    if (data.categoria && !allowedCategories.includes(data.categoria.toLowerCase())) {
      errors.push(`La categoría debe ser una de: ${allowedCategories.join(', ')}`);
    }

    // Validación de experiencia
    if (data.experiencia && (isNaN(data.experiencia) || data.experiencia < 0)) {
      errors.push('La experiencia debe ser un número positivo');
    }

    // Validación de precio
    if (data.precio_hora && (isNaN(data.precio_hora) || data.precio_hora <= 0)) {
      errors.push('El precio por hora debe ser un número mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 📡 COMUNICACIÓN CON WEBHOOK N8N
  async sendToN8N(professionalData) {
    try {
      // Preparar datos para N8N
      const n8nPayload = {
        nombre: professionalData.nombre.trim(),
        email: professionalData.email.toLowerCase().trim(),
        telefono: professionalData.telefono,
        categoria: professionalData.categoria.toLowerCase().trim(),
        profesion: professionalData.profesion.trim(),
        experiencia: professionalData.experiencia || 0,
        precio_hora: professionalData.precio_hora || 0,
        descripcion: professionalData.descripcion || '',
        disponibilidad: professionalData.disponibilidad || 'flexible',
        ubicacion: professionalData.ubicacion || '',
        certificaciones: professionalData.certificaciones || [],
        idiomas: professionalData.idiomas || ['español'],
        ip_address: professionalData.ip_address || req?.ip || 'unknown',
        user_agent: professionalData.user_agent || req?.get('User-Agent') || 'unknown',
        timestamp: new Date().toISOString()
      };

      console.log('📤 Enviando payload a N8N:', JSON.stringify(n8nPayload, null, 2));

      // Enviar a webhook de N8N
      const response = await axios.post(this.n8nWebhookUrl, n8nPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MiProfesional-Backend/1.0'
        },
        timeout: 30000 // 30 segundos timeout
      });

      console.log('📥 Respuesta de N8N:', response.status, response.data);

      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('❌ Error comunicando con N8N:', error.message);
      
      // Si N8N responde con error, intentar extraer detalles
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Error en el procesamiento de N8N',
          errors: error.response.data.errors || [],
          suggestions: error.response.data.suggestions || {}
        };
      }
      
      return {
        success: false,
        message: 'Error de comunicación con el servicio de procesamiento',
        errors: ['n8n_communication_error']
      };
    }
  }

  // 🔄 ESTADOS DEL REGISTRO PROFESIONAL
  getRegistrationStatuses() {
    return {
      'pendiente_aprobacion': {
        description: 'Registro recibido, pendiente de revisión administrativa',
        next_actions: ['Esperar email de confirmación', 'Preparar documentación'],
        estimated_time: '1-2 días hábiles'
      },
      'requiere_correccion': {
        description: 'Se requiere corrección de datos proporcionados',
        next_actions: ['Revisar sugerencias enviadas', 'Actualizar información'],
        estimated_time: 'Inmediato'
      },
      'aprobado': {
        description: 'Profesional aprobado y activo en la plataforma',
        next_actions: ['Configurar perfil', 'Empezar a recibir solicitudes'],
        estimated_time: 'Inmediato'
      },
      'rechazado': {
        description: 'Registro rechazado por no cumplir requisitos',
        next_actions: ['Contactar soporte', 'Revisar políticas'],
        estimated_time: 'N/A'
      }
    };
  }

  // 📋 PRÓXIMOS PASOS SEGÚN ESTADO
  getNextSteps(status) {
    const statuses = this.getRegistrationStatuses();
    return statuses[status] || {
      description: 'Estado desconocido',
      next_actions: ['Contactar soporte'],
      estimated_time: 'N/A'
    };
  }

  // 📊 OBTENER ESTADO DE REGISTRO
  async getRegistrationStatus(req, res) {
    try {
      const { email } = req.params;
      
      // Buscar profesional en MongoDB
      const professional = await Professional.findOne({ 
        email: email.toLowerCase().trim() 
      });

      if (!professional) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado',
          step: 'not_found'
        });
      }

      const statusInfo = this.getNextSteps(professional.verification.status);

      return res.status(200).json({
        success: true,
        data: {
          professional_id: professional._id,
          nombre: professional.businessName,
          email: professional.email,
          status: professional.verification.status,
          is_verified: professional.verification.isVerified,
          status_info: statusInfo,
          created_at: professional.createdAt,
          stats: professional.stats
        },
        step: 'status_retrieved'
      });
    } catch (error) {
      console.error('❌ Error obteniendo estado de registro:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        step: 'server_error'
      });
    }
  }

  // 🔄 ACTUALIZAR ESTADO (para admin)
  async updateRegistrationStatus(req, res) {
    try {
      const { professional_id } = req.params;
      const { status, admin_notes } = req.body;

      // Validar estado
      const allowedStatuses = ['unverified', 'pending', 'verified', 'rejected'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido',
          allowed_statuses: allowedStatuses
        });
      }

      // Actualizar profesional
      const professional = await Professional.findByIdAndUpdate(
        professional_id,
        {
          'verification.status': status,
          'verification.isVerified': status === 'verified',
          admin_notes: admin_notes,
          updated_at: new Date()
        },
        { new: true }
      );

      if (!professional) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: {
          professional_id: professional._id,
          status: professional.verification.status,
          is_verified: professional.verification.isVerified
        }
      });
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // 📈 MÉTRICAS DE REGISTRO
  async getRegistrationMetrics(req, res) {
    try {
      const metrics = await Professional.aggregate([
        {
          $group: {
            _id: '$verification.status',
            count: { $sum: 1 },
            avg_score: { $avg: '$stats.rating' },
            avg_experience: { $avg: '$experience' }
          }
        }
      ]);

      const total = await Professional.countDocuments();
      const verified = await Professional.countDocuments({ 'verification.isVerified': true });

      return res.status(200).json({
        success: true,
        data: {
          total_professionals: total,
          verified_professionals: verified,
          verification_rate: total > 0 ? (verified / total * 100).toFixed(2) : 0,
          status_breakdown: metrics,
          last_updated: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error obteniendo métricas:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new ProfessionalRegistrationController();
