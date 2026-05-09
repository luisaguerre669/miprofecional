import { Professional } from '../models';
import { emailService } from './emailService';

// Tipos de notificaciones
export type NotificationType = 
  | 'payment_reminder'
  | 'trial_expiring'
  | 'subscription_expired'
  | 'profile_suspended'
  | 'profile_reactivated'
  | 'payment_received'
  | 'subscription_cancelled';

// Interfaz para datos de notificación
export interface NotificationData {
  professionalId: string;
  type: NotificationType;
  subject: string;
  message: string;
  daysUntilExpiry?: number;
  expiryDate?: Date;
  amount?: number;
  paymentMethod?: string;
}

// Servicio de notificaciones
class NotificationService {
  // Enviar recordatorio de pago
  async sendPaymentReminder(
    professionalId: string, 
    daysUntilExpiry: number, 
    expiryDate: Date
  ): Promise<boolean> {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional || !professional.email) {
        console.error(`Professional not found or no email for ID: ${professionalId}`);
        return false;
      }

      const subject = daysUntilExpiry <= 1 
        ? '¡Urgente! Tu suscripción vence mañana'
        : `Tu suscripción vence en ${daysUntilExpiry} días`;

      const message = this.generatePaymentReminderMessage(daysUntilExpiry, expiryDate);

      // Enviar email
      const emailSent = await emailService.sendEmail({
        to: professional.email,
        subject,
        html: message,
        template: 'payment_reminder',
        data: {
          professionalName: professional.firstName,
          daysUntilExpiry,
          expiryDate: expiryDate.toLocaleDateString('es-AR'),
          amount: 8000,
          paymentLink: 'https://miprofesional.com/pagar'
        }
      });

      if (emailSent) {
        console.log(`Payment reminder sent to professional: ${professionalId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return false;
    }
  }

  // Enviar notificación de fin de prueba
  async sendTrialExpiring(professionalId: string): Promise<boolean> {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional || !professional.email) {
        return false;
      }

      const subject = 'Tu período de prueba está por terminar';
      const message = this.generateTrialExpiringMessage();

      const emailSent = await emailService.sendEmail({
        to: professional.email,
        subject,
        html: message,
        template: 'trial_expiring',
        data: {
          professionalName: professional.firstName,
          trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR'),
          amount: 8000,
          upgradeLink: 'https://miprofesional.com/upgrade'
        }
      });

      return emailSent;
    } catch (error) {
      console.error('Error sending trial expiring notification:', error);
      return false;
    }
  }

  // Enviar notificación de suscripción expirada
  async sendSubscriptionExpired(professionalId: string): Promise<boolean> {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional || !professional.email) {
        return false;
      }

      const subject = 'Tu suscripción ha expirado';
      const message = this.generateSubscriptionExpiredMessage();

      const emailSent = await emailService.sendEmail({
        to: professional.email,
        subject,
        html: message,
        template: 'subscription_expired',
        data: {
          professionalName: professional.firstName,
          expiryDate: new Date().toLocaleDateString('es-AR'),
          amount: 8000,
          renewalLink: 'https://miprofesional.com/renovar'
        }
      });

      return emailSent;
    } catch (error) {
      console.error('Error sending subscription expired notification:', error);
      return false;
    }
  }

  // Enviar notificación de suspensión de perfil
  async sendSubscriptionSuspension(professionalId: string): Promise<boolean> {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional || !professional.email) {
        return false;
      }

      const subject = 'Tu perfil ha sido suspendido';
      const message = this.generateSuspensionMessage();

      const emailSent = await emailService.sendEmail({
        to: professional.email,
        subject,
        html: message,
        template: 'profile_suspended',
        data: {
          professionalName: professional.firstName,
          suspensionDate: new Date().toLocaleDateString('es-AR'),
          gracePeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR'),
          amount: 8000,
          reactivateLink: 'https://miprofesional.com/reactivar'
        }
      });

      return emailSent;
    } catch (error) {
      console.error('Error sending suspension notification:', error);
      return false;
    }
  }

  // Enviar notificación de reactivación de perfil
  async sendSubscriptionReactivation(professionalId: string): Promise<boolean> {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional || !professional.email) {
        return false;
      }

      const subject = '¡Tu perfil ha sido reactivado!';
      const message = this.generateReactivationMessage();

      const emailSent = await emailService.sendEmail({
        to: professional.email,
        subject,
        html: message,
        template: 'profile_reactivated',
        data: {
          professionalName: professional.firstName,
          reactivationDate: new Date().toLocaleDateString('es-AR'),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR'),
          profileLink: 'https://miprofesional.com/perfil'
        }
      });

      return emailSent;
    } catch (error) {
      console.error('Error sending reactivation notification:', error);
      return false;
    }
  }

  // Enviar confirmación de pago recibido
  async sendPaymentReceived(
    professionalId: string, 
    amount: number, 
    paymentMethod: string
  ): Promise<boolean> {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional || !professional.email) {
        return false;
      }

      const subject = '¡Pago recibido! Tu suscripción está activa';
      const message = this.generatePaymentReceivedMessage(amount, paymentMethod);

      const emailSent = await emailService.sendEmail({
        to: professional.email,
        subject,
        html: message,
        template: 'payment_received',
        data: {
          professionalName: professional.firstName,
          amount,
          paymentMethod,
          paymentDate: new Date().toLocaleDateString('es-AR'),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR'),
          receiptLink: 'https://miprofesional.com/recibos'
        }
      });

      return emailSent;
    } catch (error) {
      console.error('Error sending payment received notification:', error);
      return false;
    }
  }

  // Generar mensajes HTML
  private generatePaymentReminderMessage(daysUntilExpiry: number, expiryDate: Date): string {
    const urgency = daysUntilExpiry <= 1 ? 'urgente' : 'importante';
    const expiryDateStr = expiryDate.toLocaleDateString('es-AR');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>Recordatorio de Pago</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e293b;">¡Atención ${urgency}!</h2>
          <p style="color: #64748b; font-size: 16px;">
            Tu suscripción de MiProfesional vence en <strong>${daysUntilExpiry} días</strong>.
          </p>
          
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0;">
              <strong>Fecha de vencimiento:</strong> ${expiryDateStr}<br>
              <strong>Monto a pagar:</strong> $8.000 ARS
            </p>
          </div>
          
          <p style="color: #64748b;">
            Si no realizas el pago, tu perfil será suspendido y ya no aparecerá en los resultados de búsqueda.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://miprofesional.com/pagar" 
               style="background: #3b82f6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Pagar Ahora
            </a>
          </div>
        </div>
        
        <div style="background: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p>Este es un mensaje automático. Por favor no responder a este email.</p>
        </div>
      </div>
    `;
  }

  private generateTrialExpiringMessage(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1>Tu Prueba Gratuita Termina Pronto</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e293b;">¡Es hora de actualizar!</h2>
          <p style="color: #64748b; font-size: 16px;">
            Tu período de prueba de 30 días está por terminar.
          </p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0;">
              <strong>Para continuar usando MiProfesional:</strong><br>
              Suscríbete a nuestro plan profesional por solo $8.000 ARS/mes
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://miprofesional.com/upgrade" 
               style="background: #f59e0b; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Actualizar Ahora
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateSubscriptionExpiredMessage(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1>Suscripción Expirada</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Tu suscripción ha vencido</h2>
          <p style="color: #64748b; font-size: 16px;">
            Tu perfil ya no es visible para los clientes. Reactiva tu suscripción para volver a aparecer en los resultados.
          </p>
          
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0;">
              <strong>Estado actual:</strong> Perfil suspendido<br>
              <strong>Costo de reactivación:</strong> $8.000 ARS
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://miprofesional.com/renovar" 
               style="background: #ef4444; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reactivar Perfil
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateSuspensionMessage(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>Perfil Suspendido</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Tu perfil ha sido suspendido</h2>
          <p style="color: #64748b; font-size: 16px;">
            Debido a la falta de pago, tu perfil ya no es visible para los clientes.
          </p>
          
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0;">
              <strong>Período de gracia:</strong> 7 días<br>
              <strong>Después del período:</strong> Permanecerá suspendido hasta el pago
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://miprofesional.com/reactivar" 
               style="background: #dc2626; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Pagar y Reactivar
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateReactivationMessage(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>¡Perfil Reactivado!</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Bienvenido de vuelta</h2>
          <p style="color: #64748b; font-size: 16px;">
            Tu pago ha sido procesado y tu perfil ya está activo y visible para los clientes.
          </p>
          
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0;">
              <strong>Estado:</strong> Activo<br>
              <strong>Próximo pago:</strong> En 30 días
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://miprofesional.com/perfil" 
               style="background: #10b981; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver Mi Perfil
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generatePaymentReceivedMessage(amount: number, paymentMethod: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>¡Pago Recibido!</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Tu suscripción está activa</h2>
          <p style="color: #64748b; font-size: 16px;">
            Hemos recibido tu pago correctamente. Tu perfil continúa visible para los clientes.
          </p>
          
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0;">
              <strong>Monto pagado:</strong> $${amount.toLocaleString('es-AR')} ARS<br>
              <strong>Método de pago:</strong> ${paymentMethod}<br>
              <strong>Próximo pago:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://miprofesional.com/recibos" 
               style="background: #10b981; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver Recibo
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

export const notificationService = new NotificationService();
