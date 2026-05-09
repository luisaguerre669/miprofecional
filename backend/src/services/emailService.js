const sgMail = require('@sendgrid/mail');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.apiKey = process.env.SMTP_PASS;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@miprofesional.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'MiProfesional';
    
    // Configurar SendGrid
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  // Enviar email de bienvenida a profesional
  async sendProfessionalWelcome(professional) {
    try {
      const msg = {
        to: professional.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '✅ Bienvenido a MiProfesional - Tu registro ha sido recibido',
        html: this.getProfessionalWelcomeTemplate(professional),
        text: this.getProfessionalWelcomeText(professional)
      };

      await sgMail.send(msg);
      logger.info('Email de bienvenida enviado', { email: professional.email });
      
      return { success: true };
    } catch (error) {
      logger.error('Error enviando email de bienvenida', { 
        error: error.message,
        email: professional.email 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Enviar email de aprobación
  async sendProfessionalApproval(professional) {
    try {
      const msg = {
        to: professional.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '🎉 ¡Felicidades! Tu cuenta en MiProfesional ha sido aprobada',
        html: this.getProfessionalApprovalTemplate(professional),
        text: this.getProfessionalApprovalText(professional)
      };

      await sgMail.send(msg);
      logger.info('Email de aprobación enviado', { email: professional.email });
      
      return { success: true };
    } catch (error) {
      logger.error('Error enviando email de aprobación', { 
        error: error.message,
        email: professional.email 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Enviar email de rechazo
  async sendProfessionalRejection(professional, reasons = []) {
    try {
      const msg = {
        to: professional.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '📋 Tu registro en MiProfesional requiere corrección',
        html: this.getProfessionalRejectionTemplate(professional, reasons),
        text: this.getProfessionalRejectionText(professional, reasons)
      };

      await sgMail.send(msg);
      logger.info('Email de rechazo enviado', { email: professional.email });
      
      return { success: true };
    } catch (error) {
      logger.error('Error enviando email de rechazo', { 
        error: error.message,
        email: professional.email 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Enviar email de contacto
  async sendContactEmail(data) {
    try {
      const msg = {
        to: 'contacto@miprofesional.com',
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `📧 Nuevo contacto de ${data.name}`,
        html: this.getContactTemplate(data),
        text: this.getContactText(data)
      };

      await sgMail.send(msg);
      logger.info('Email de contacto enviado', { from: data.email });
      
      return { success: true };
    } catch (error) {
      logger.error('Error enviando email de contacto', { 
        error: error.message,
        from: data.email 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Template HTML para email de bienvenida
  getProfessionalWelcomeTemplate(professional) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bienvenido a MiProfesional</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bienvenido a MiProfesional</h1>
        </div>
        <div class="content">
            <h2>Hola ${professional.nombre},</h2>
            <p>Tu registro como profesional ha sido recibido exitosamente y está siendo procesado por nuestro equipo.</p>
            
            <h3>📋 Detalles de tu registro:</h3>
            <ul>
                <li><strong>Profesión:</strong> ${professional.profesion}</li>
                <li><strong>Categoría:</strong> ${professional.categoria}</li>
                <li><strong>Email:</strong> ${professional.email}</li>
                <li><strong>Teléfono:</strong> ${professional.telefono}</li>
                ${professional.precio_hora ? `<li><strong>Precio por hora:</strong> $${professional.precio_hora}</li>` : ''}
            </ul>

            <h3>🔄 Próximos pasos:</h3>
            <ol>
                <li>Revisión de tu información por nuestro equipo</li>
                <li>Validación de documentos y certificaciones</li>
                <li>Aprobación final y activación de tu cuenta</li>
            </ol>

            <p><strong>Estado actual:</strong> <span style="color: #f59e0b;">⏳ Pendiente de revisión</span></p>
            
            <p>Te notificaremos por email cuando haya actualizaciones sobre tu registro.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://miprofesional.com" class="btn">Visitar MiProfesional</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 MiProfesional. Todos los derechos reservados.</p>
            <p>Si no solicitaste este registro, por favor contacta a soporte@miprofesional.com</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Template HTML para email de aprobación
  getProfessionalApprovalTemplate(professional) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>¡Cuenta Aprobada!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ¡Felicidades! Tu cuenta ha sido aprobada</h1>
        </div>
        <div class="content">
            <h2>Hola ${professional.nombre},</h2>
            <p>¡Excelente noticia! Tu cuenta profesional en MiProfesional ha sido aprobada y ahora está activa.</p>
            
            <h3>✅ ¿Qué significa esto?</h3>
            <ul>
                <li>Tu perfil es visible para todos los clientes</li>
                <li>Puedes comenzar a recibir solicitudes de servicio</li>
                <li>Tienes acceso a todas las herramientas profesionales</li>
            </ul>

            <h3>🚀 Próximos pasos:</h3>
            <ol>
                <li>Completa tu perfil con información detallada</li>
                <li>Sube tu foto de perfil profesional</li>
                <li>Configura tu disponibilidad y horarios</li>
                <li>Prepárate para recibir tus primeros clientes</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://miprofesional.com/login" class="btn">Iniciar Sesión</a>
            </div>
            
            <p>¡Gracias por confiar en MiProfesional! Estamos emocionados de ver tu éxito.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 MiProfesional. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Template HTML para email de rechazo
  getProfessionalRejectionTemplate(professional, reasons) {
    const reasonsList = reasons.map(reason => `<li>${reason}</li>`).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Revisión de Registro</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Tu registro requiere corrección</h1>
        </div>
        <div class="content">
            <h2>Hola ${professional.nombre},</h2>
            <p>Hemos revisado tu registro y necesitamos que realices algunas correcciones antes de poder aprobar tu cuenta.</p>
            
            <h3>⚠️ Aspectos a corregir:</h3>
            <ul>
                ${reasonsList}
            </ul>

            <h3>📝 Qué hacer:</h3>
            <ol>
                <li>Corrige los aspectos mencionados</li>
                <li>Actualiza tu información en tu perfil</li>
                <li>Envía nuevamente tu registro para revisión</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://miprofesional.com/login" class="btn">Actualizar Mi Perfil</a>
            </div>
            
            <p>Si tienes dudas o necesitas ayuda, no dudes en contactarnos.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 MiProfesional. Todos los derechos reservados.</p>
            <p>Soporte: soporte@miprofesional.com</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Template HTML para email de contacto
  getContactTemplate(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nuevo Contacto</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Nuevo Contacto</h1>
        </div>
        <div class="content">
            <h3>Información de Contacto:</h3>
            <ul>
                <li><strong>Nombre:</strong> ${data.name}</li>
                <li><strong>Email:</strong> ${data.email}</li>
                <li><strong>Teléfono:</strong> ${data.phone || 'No proporcionado'}</li>
            </ul>
            
            <h3>Mensaje:</h3>
            <p>${data.message}</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 MiProfesional. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Versiones text de los templates
  getProfessionalWelcomeText(professional) {
    return `
Bienvenido a MiProfesional

Hola ${professional.nombre},

Tu registro como profesional ha sido recibido exitosamente y está siendo procesado.

Detalles de tu registro:
- Profesión: ${professional.profesion}
- Categoría: ${professional.categoria}
- Email: ${professional.email}
- Teléfono: ${professional.telefono}
${professional.precio_hora ? `- Precio por hora: $${professional.precio_hora}` : ''}

Próximos pasos:
1. Revisión de tu información
2. Validación de documentos
3. Aprobación final

Estado actual: Pendiente de revisión

Te notificaremos cuando haya actualizaciones.

© 2026 MiProfesional
`;
  }

  getProfessionalApprovalText(professional) {
    return `
¡Felicidades! Tu cuenta ha sido aprobada

Hola ${professional.nombre},

¡Excelente noticia! Tu cuenta profesional en MiProfesional ha sido aprobada y ahora está activa.

¿Qué significa esto?
- Tu perfil es visible para clientes
- Puedes recibir solicitudes de servicio
- Tienes acceso a todas las herramientas

Próximos pasos:
1. Completa tu perfil
2. Sube tu foto profesional
3. Configura tu disponibilidad
4. Prepárate para recibir clientes

¡Gracias por confiar en MiProfesional!

© 2026 MiProfesional
`;
  }

  getProfessionalRejectionText(professional, reasons) {
    const reasonsText = reasons.join('\n- ');
    
    return `
Tu registro requiere corrección

Hola ${professional.nombre},

Hemos revisado tu registro y necesitamos que realices algunas correcciones.

Aspectos a corregir:
- ${reasonsText}

Qué hacer:
1. Corrige los aspectos mencionados
2. Actualiza tu información
3. Envía nuevamente para revisión

Si tienes dudas, contáctanos.

© 2026 MiProfesional
Soporte: soporte@miprofesional.com
`;
  }

  getContactText(data) {
    return `
Nuevo Contacto

Información de Contacto:
- Nombre: ${data.name}
- Email: ${data.email}
- Teléfono: ${data.phone || 'No proporcionado'}

Mensaje:
${data.message}

© 2026 MiProfesional
`;
  }

  // Validar configuración
  validateConfig() {
    const errors = [];

    if (!this.apiKey) {
      errors.push('SMTP_PASS (SendGrid API Key) no configurado');
    }

    if (!this.fromEmail) {
      errors.push('EMAIL_FROM no configurado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Exportar singleton
module.exports = new EmailService();
