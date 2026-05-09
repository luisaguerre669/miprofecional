const axios = require('axios');
const Professional = require('../models/Professional');

class RegisterController {
  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://tu-n8n-instance.com/webhook/profesional-alta';
  }

  // 🚀 ENDPOINT PRINCIPAL - REGISTRO DE PROFESIONAL
  async registerProfessional(req, res) {
    try {
      console.log('🚀 Iniciando registro de profesional...');
      
      // 📋 1. Validar datos obligatorios
      const validationErrors = this.validateRequiredFields(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Datos requeridos faltantes',
          errors: validationErrors
        });
      }

      // 📧 2. Validar formato de email
      const emailErrors = Professional.validateEmailFormat(req.body.email);
      if (emailErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email inválido',
          errors: emailErrors
        });
      }

      // 📱 3. Validar formato de teléfono
      const phoneErrors = Professional.validatePhoneFormat(req.body.telefono);
      if (phoneErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Teléfono inválido',
          errors: phoneErrors
        });
      }

      // 🏷️ 4. Validar categoría
      const categoryErrors = Professional.validateCategory(req.body.categoria);
      if (categoryErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Categoría inválida',
          errors: categoryErrors
        });
      }

      // 🔄 5. Verificar email duplicado
      const emailExists = await this.checkEmailExists(req.body.email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado',
          errors: ['email_duplicado']
        });
      }

      // 📡 6. Enviar datos a N8N
      console.log('📡 Enviando datos a N8N...');
      const n8nResponse = await this.sendToN8N(req.body);
      
      if (!n8nResponse.success) {
        return res.status(400).json({
          success: false,
          message: 'Error en procesamiento N8N',
          errors: n8nResponse.errors || ['n8n_processing_error'],
          suggestions: n8nResponse.suggestions || {}
        });
      }

      // 💾 7. Guardar resultado final en MongoDB
      console.log('💾 Guardando profesional en MongoDB...');
      const professional = await this.saveProfessional(req.body, n8nResponse);

      // 📧 8. Enviar email de confirmación (opcional)
      await this.sendConfirmationEmail(professional);

      // ✅ 9. Respuesta exitosa
      return res.status(201).json({
        success: true,
        message: 'Profesional registrado exitosamente',
        data: {
          professional_id: professional._id,
          estado: professional.estado,
          score_calidad: professional.score_calidad,
          fecha_registro: professional.fecha_registro,
          next_steps: this.getNextSteps(professional.estado)
        }
      });

    } catch (error) {
      console.error('🚨 Error en registro profesional:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // 📋 Validación de campos obligatorios
  validateRequiredFields(data) {
    return Professional.validateRequiredFields(data);
  }

  // 🔄 Verificar si email existe
  async checkEmailExists(email) {
    try {
      const existing = await Professional.findByEmail(email);
      return !!existing;
    } catch (error) {
      console.error('Error verificando email:', error);
      return false;
    }
  }

  // 📡 Enviar datos a webhook N8N
  async sendToN8N(professionalData) {
    try {
      // Preparar payload para N8N
      const payload = {
        nombre: professionalData.nombre.trim(),
        email: professionalData.email.toLowerCase().trim(),
        telefono: professionalData.telefono,
        profesion: professionalData.profesion.trim(),
        categoria: professionalData.categoria.toLowerCase().trim(),
        descripcion: professionalData.descripcion || '',
        experiencia: parseInt(professionalData.experiencia) || 0,
        precio_hora: parseFloat(professionalData.precio_hora) || 0,
        disponibilidad: professionalData.disponibilidad || 'flexible',
        ubicacion: professionalData.ubicacion || '',
        certificaciones: professionalData.certificaciones || [],
        idiomas: professionalData.idiomas || ['español'],
        ip_address: req?.ip || 'unknown',
        user_agent: req?.get('User-Agent') || 'unknown',
        timestamp: new Date().toISOString()
      };

      console.log('📤 Payload N8N:', JSON.stringify(payload, null, 2));

      // Enviar a webhook N8N
      const response = await axios.post(this.n8nWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MiProfesional-Backend/1.0'
        },
        timeout: 30000 // 30 segundos timeout
      });

      console.log('📥 Respuesta N8N:', response.status, response.data);

      return {
        success: true,
        ...response.data
      };

    } catch (error) {
      console.error('❌ Error comunicando con N8N:', error.message);
      
      // Extraer detalles del error si N8N responde
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Error en procesamiento N8N',
          errors: error.response.data.errors || [],
          suggestions: error.response.data.suggestions || {}
        };
      }
      
      return {
        success: false,
        message: 'Error de comunicación con N8N',
        errors: ['n8n_communication_error']
      };
    }
  }

  // 💾 Guardar profesional en MongoDB con respuesta de N8N
  async saveProfessional(professionalData, n8nResponse) {
    try {
      // Crear nuevo profesional con datos de N8N
      const professional = new Professional({
        // Datos básicos
        nombre: professionalData.nombre.trim(),
        email: professionalData.email.toLowerCase().trim(),
        telefono: professionalData.telefono,
        profesion: professionalData.profesion.trim(),
        categoria: professionalData.categoria.toLowerCase().trim(),
        descripcion: professionalData.descripcion || '',
        experiencia: parseInt(professionalData.experiencia) || 0,
        precio_hora: parseFloat(professionalData.precio_hora) || 0,
        disponibilidad: professionalData.disponibilidad || 'flexible',
        ubicacion: professionalData.ubicacion || '',
        certificaciones: professionalData.certificaciones || [],
        idiomas: professionalData.idiomas || ['español'],

        // Resultados de N8N
        score_calidad: n8nResponse.score_calidad || 0,
        estado: n8nResponse.estado || 'pendiente',

        // Validación y sugerencias de N8N
        validacion_n8n: {
          es_valido: n8nResponse.validacion?.esValido || false,
          errores: n8nResponse.validacion?.errores || [],
          validaciones: n8nResponse.validacion?.validaciones || {},
          fecha_validacion: new Date()
        },
        sugerencias_n8n: {
          precio_hora_sugerido: n8nResponse.sugerencias?.precio_hora_sugerido,
          descripcion_sugerida: n8nResponse.sugerencias?.descripcion_sugerida,
          certificaciones_sugeridas: n8nResponse.sugerencias?.certificaciones_sugeridas || [],
          fecha_sugerencia: new Date()
        },

        // Metadatos
        ip_address: req?.ip || 'unknown',
        user_agent: req?.get('User-Agent') || 'unknown',
        source: 'api'
      });

      // Guardar en MongoDB
      const savedProfessional = await professional.save();
      console.log('✅ Profesional guardado:', savedProfessional._id);

      return savedProfessional;

    } catch (error) {
      console.error('❌ Error guardando profesional:', error);
      throw new Error('Error al guardar en MongoDB: ' + error.message);
    }
  }

  // 📧 Enviar email de confirmación
  async sendConfirmationEmail(professional) {
    try {
      // Aquí podrías integrar un servicio de email como SendGrid, Nodemailer, etc.
      console.log('📧 Enviando email de confirmación a:', professional.email);
      
      // Simulación de envío de email
      const emailData = {
        to: professional.email,
        subject: '✅ Tu registro en MiProfesional ha sido recibido',
        template: 'professional-registration',
        data: {
          nombre: professional.nombre,
          estado: professional.estado_display,
          score_calidad: professional.score_calidad,
          sugerencias: professional.sugerencias_n8n
        }
      };

      // TODO: Implementar servicio de email real
      console.log('📧 Email enviado (simulado):', emailData);

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      // No fallar el registro si el email falla
    }
  }

  // 📋 Obtener próximos pasos según estado
  getNextSteps(estado) {
    const steps = {
      'pendiente': {
        description: 'Tu registro está siendo procesado',
        actions: ['Espera la revisión administrativa', 'Prepara tu documentación'],
        estimated_time: '1-2 días hábiles'
      },
      'aprobado': {
        description: '¡Felicidades! Tu cuenta está aprobada',
        actions: ['Configura tu perfil completo', 'Comienza a recibir solicitudes'],
        estimated_time: 'Inmediato'
      },
      'rechazado': {
        description: 'Tu registro fue rechazado',
        actions: ['Contacta al soporte', 'Revisa los requisitos'],
        estimated_time: 'N/A'
      },
      'requiere_corrección': {
        description: 'Necesitas corregir algunos datos',
        actions: ['Revisa las sugerencias enviadas', 'Actualiza tu información'],
        estimated_time: 'Inmediato'
      }
    };

    return steps[estado] || steps['pendiente'];
  }

  // 📊 Obtener estado de registro
  async getRegistrationStatus(req, res) {
    try {
      const { email } = req.params;
      
      const professional = await Professional.findByEmail(email);
      if (!professional) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          professional_id: professional._id,
          nombre: professional.nombre,
          email: professional.email,
          estado: professional.estado,
          estado_display: professional.estado_display,
          score_calidad: professional.score_calidad,
          fecha_registro: professional.fecha_registro,
          fecha_aprobacion: professional.fecha_aprobacion,
          next_steps: this.getNextSteps(professional.estado)
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estado:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // 🔄 Actualizar estado (admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado, notas_admin } = req.body;

      const professional = await Professional.findById(id);
      if (!professional) {
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado'
        });
      }

      await professional.updateEstado(estado, notas_admin);

      return res.status(200).json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: {
          professional_id: professional._id,
          estado: professional.estado,
          estado_display: professional.estado_display
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
}

module.exports = new RegisterController();
