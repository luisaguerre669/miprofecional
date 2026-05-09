import { Subscription } from '../models/Subscription';
import { Professional } from '../models/Professional';
import { User } from '../models/User';
import { notificationService } from './notificationService';
import { logger } from '../utils/logger';
import cron from 'node-cron';

// Servicio de gestión de suscripciones automáticas
export class SubscriptionService {
  // Iniciar cron job diario para verificar suscripciones
  static startSubscriptionCron() {
    // Ejecutar todos los días a las 00:00
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running daily subscription check...');
      await this.checkExpiringSubscriptions();
      await this.checkExpiredSubscriptions();
      await this.checkPendingPayments();
      logger.info('Daily subscription check completed');
    });

    // Ejecutar cada hora para pagos pendientes
    cron.schedule('0 * * * *', async () => {
      logger.info('Running hourly payment check...');
      await this.checkPendingPayments();
    });

    logger.info('Subscription cron jobs started');
  }

  // Verificar suscripciones que vencen en 5 días
  static async checkExpiringSubscriptions() {
    try {
      const expiringSubscriptions = await Subscription.getExpiringSoon(5);
      
      for (const subscription of expiringSubscriptions) {
        const professional = subscription.professionalId as any;
        
        if (!subscription.notificationsSent.fiveDaysWarning) {
          // Enviar notificación 5 días antes
          await this.sendExpiringSoonNotification(subscription, professional);
          await subscription.sendNotification('fiveDaysWarning');
          
          logger.info(`Sent 5-day warning to professional ${professional._id}`);
        }
      }
    } catch (error) {
      logger.error('Error checking expiring subscriptions:', error);
    }
  }

  // Verificar suscripciones vencidas
  static async checkExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await Subscription.getExpiredForSuspension();
      
      for (const subscription of expiredSubscriptions) {
        const professional = subscription.professionalId as any;
        
        // Suspender perfil si está vencido
        await this.suspendProfile(subscription, professional);
        
        logger.info(`Suspended profile for professional ${professional._id}`);
      }
    } catch (error) {
      logger.error('Error checking expired subscriptions:', error);
    }
  }

  // Verificar pagos pendientes
  static async checkPendingPayments() {
    try {
      const pendingPayments = await Subscription.getSubscriptionsNeedingPayment();
      
      for (const subscription of pendingPayments) {
        const professional = subscription.professionalId as any;
        
        // Intentar procesar pago automático
        await this.processAutomaticPayment(subscription, professional);
      }
    } catch (error) {
      logger.error('Error checking pending payments:', error);
    }
  }

  // Enviar notificación de vencimiento próximo
  static async sendExpiringSoonNotification(subscription: any, professional: any) {
    try {
      const daysUntilExpiry = subscription.getDaysUntilExpiry();
      const expiryDate = subscription.endDate.toLocaleDateString('es-AR');
      
      // Enviar email
      await notificationService.sendEmail({
        to: professional.email,
        subject: 'Tu suscripción MiProfesional está por vencer',
        template: 'subscription-expiring',
        data: {
          firstName: professional.firstName,
          daysUntilExpiry,
          expiryDate,
          amount: subscription.amount,
          renewalUrl: `${process.env.FRONTEND_URL}/subscription/renew/${professional._id}`
        }
      });

      // Enviar WhatsApp si está configurado
      if (professional.phone) {
        await notificationService.sendWhatsApp({
          to: professional.phone,
          message: `Hola ${professional.firstName}, tu suscripción MiProfesional vence en ${daysUntilExpiry} días (${expiryDate}). Renueva ahora para seguir apareciendo en la app. Link: ${process.env.FRONTEND_URL}/subscription/renew/${professional._id}`
        });
      }

      // Enviar notificación push si tiene token
      if (professional.pushToken) {
        await notificationService.sendPushNotification({
          token: professional.pushToken,
          title: 'Tu suscripción está por vencer',
          body: `Tu suscripción vence en ${daysUntilExpiry} días. Renueva ahora para mantener tu perfil activo.`,
          data: {
            type: 'subscription_expiring',
            professionalId: professional._id,
            daysUntilExpiry
          }
        });
      }

    } catch (error) {
      logger.error('Error sending expiring soon notification:', error);
    }
  }

  // Suspender perfil
  static async suspendProfile(subscription: any, professional: any) {
    try {
      // Suspender suscripción
      await subscription.suspendProfile();

      // Ocultar perfil del profesional
      await Professional.findByIdAndUpdate(professional._id, {
        isVisible: false,
        subscriptionStatus: 'suspended'
      });

      // Enviar notificación de suspensión
      await this.sendSuspensionNotification(professional);

    } catch (error) {
      logger.error('Error suspending profile:', error);
    }
  }

  // Enviar notificación de suspensión
  static async sendSuspensionNotification(professional: any) {
    try {
      // Enviar email
      await notificationService.sendEmail({
        to: professional.email,
        subject: 'Tu perfil MiProfesional ha sido suspendido',
        template: 'profile-suspended',
        data: {
          firstName: professional.firstName,
          reactivateUrl: `${process.env.FRONTEND_URL}/subscription/reactivate/${professional._id}`,
          supportEmail: 'soporte@miprofesional.com'
        }
      });

      // Enviar WhatsApp
      if (professional.phone) {
        await notificationService.sendWhatsApp({
          to: professional.phone,
          message: `Hola ${professional.firstName}, tu perfil ha sido suspendido por falta de pago. Para reactivarlo, realiza el pago desde: ${process.env.FRONTEND_URL}/subscription/reactivate/${professional._id}`
        });
      }

      // Enviar notificación push
      if (professional.pushToken) {
        await notificationService.sendPushNotification({
          token: professional.pushToken,
          title: 'Tu perfil ha sido suspendido',
          body: 'Realiza el pago para reactivar tu perfil y volver a aparecer en la app.',
          data: {
            type: 'profile_suspended',
            professionalId: professional._id
          }
        });
      }

    } catch (error) {
      logger.error('Error sending suspension notification:', error);
    }
  }

  // Procesar pago automático
  static async processAutomaticPayment(subscription: any, professional: any) {
    try {
      // Aquí se implementaría la lógica de pago automático con Mercado Pago
      // Por ahora, simulamos el proceso
      
      const paymentData = {
        amount: subscription.amount,
        method: 'mercadopago',
        transactionId: `auto_${Date.now()}`
      };

      // Reactivar perfil con el pago
      await subscription.reactivateProfile(paymentData);

      // Actualizar estado del profesional
      await Professional.findByIdAndUpdate(professional._id, {
        isVisible: true,
        subscriptionStatus: 'active'
      });

      // Enviar confirmación de pago
      await this.sendPaymentConfirmationNotification(professional, paymentData);

      logger.info(`Automatic payment processed for professional ${professional._id}`);

    } catch (error) {
      logger.error('Error processing automatic payment:', error);
      
      // Si falla el pago, marcar como intento fallido
      subscription.subscriptionHistory.push({
        date: new Date(),
        action: 'payment_failed',
        reason: 'Automatic payment failed'
      });
      await subscription.save();
    }
  }

  // Enviar confirmación de pago
  static async sendPaymentConfirmationNotification(professional: any, paymentData: any) {
    try {
      // Enviar email
      await notificationService.sendEmail({
        to: professional.email,
        subject: 'Pago recibido - MiProfesional',
        template: 'payment-confirmation',
        data: {
          firstName: professional.firstName,
          amount: paymentData.amount,
          paymentMethod: paymentData.method,
          transactionId: paymentData.transactionId,
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')
        }
      });

      // Enviar WhatsApp
      if (professional.phone) {
        await notificationService.sendWhatsApp({
          to: professional.phone,
          message: `Hola ${professional.firstName}, hemos recibido tu pago de $${paymentData.amount}. Tu perfil está activo por 30 días más. ¡Gracias por confiar en MiProfesional!`
        });
      }

      // Enviar notificación push
      if (professional.pushToken) {
        await notificationService.sendPushNotification({
          token: professional.pushToken,
          title: '¡Pago recibido!',
          body: 'Tu perfil está activo por 30 días más. Gracias por tu pago.',
          data: {
            type: 'payment_received',
            professionalId: professional._id,
            amount: paymentData.amount
          }
        });
      }

    } catch (error) {
      logger.error('Error sending payment confirmation notification:', error);
    }
  }

  // Reactivar perfil manualmente
  static async reactivateProfile(professionalId: string, paymentData: any) {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      const subscription = await Subscription.findOne({
        professionalId,
        status: { $in: ['suspended', 'expired'] }
      });

      if (!subscription) {
        throw new Error('No hay suscripción suspendida');
      }

      // Reactivar suscripción
      await subscription.reactivateProfile(paymentData);

      // Reactivar perfil
      await Professional.findByIdAndUpdate(professionalId, {
        isVisible: true,
        subscriptionStatus: 'active'
      });

      // Enviar notificación
      await this.sendReactivationNotification(professional, paymentData);

      logger.info(`Profile reactivated for professional ${professionalId}`);

      return {
        success: true,
        message: 'Perfil reactivado exitosamente',
        data: {
          subscription,
          professional
        }
      };

    } catch (error) {
      logger.error('Error reactivating profile:', error);
      throw error;
    }
  }

  // Enviar notificación de reactivación
  static async sendReactivationNotification(professional: any, paymentData: any) {
    try {
      // Enviar email
      await notificationService.sendEmail({
        to: professional.email,
        subject: '¡Tu perfil está activo nuevamente! - MiProfesional',
        template: 'profile-reactivated',
        data: {
          firstName: professional.firstName,
          amount: paymentData.amount,
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')
        }
      });

      // Enviar WhatsApp
      if (professional.phone) {
        await notificationService.sendWhatsApp({
          to: professional.phone,
          message: `¡Hola ${professional.firstName}! Tu perfil está activo nuevamente. Gracias por tu pago y bienvenido de vuelta a MiProfesional.`
        });
      }

      // Enviar notificación push
      if (professional.pushToken) {
        await notificationService.sendPushNotification({
          token: professional.pushToken,
          title: '¡Bienvenido de vuelta!',
          body: 'Tu perfil está activo y visible para todos los clientes.',
          data: {
            type: 'profile_reactivated',
            professionalId: professional._id
          }
        });
      }

    } catch (error) {
      logger.error('Error sending reactivation notification:', error);
    }
  }

  // Obtener estadísticas de suscripciones
  static async getSubscriptionStats() {
    try {
      const stats = await Subscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalActive = await Subscription.countDocuments({ 
        status: 'active', 
        isVisible: true 
      });

      const totalSuspended = await Subscription.countDocuments({ 
        status: 'suspended' 
      });

      const expiringThisWeek = await Subscription.countDocuments({
        status: 'active',
        endDate: {
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          $gte: new Date()
        }
      });

      return {
        totalActive,
        totalSuspended,
        expiringThisWeek,
        stats,
        totalRevenue: stats.reduce((acc, stat) => acc + (stat.totalAmount || 0), 0)
      };

    } catch (error) {
      logger.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  // Obtener suscripciones por vencer
  static async getExpiringSubscriptions(days = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const subscriptions = await Subscription.find({
        status: 'active',
        endDate: { $lte: futureDate },
        isVisible: true
      })
      .populate('professionalId')
      .sort({ endDate: 1 });

      return subscriptions;

    } catch (error) {
      logger.error('Error getting expiring subscriptions:', error);
      throw error;
    }
  }

  // Procesar pago manual
  static async processManualPayment(professionalId: string, paymentData: any) {
    try {
      const professional = await Professional.findById(professionalId);
      if (!professional) {
        throw new Error('Profesional no encontrado');
      }

      let subscription = await Subscription.getActiveSubscription(professionalId);

      if (!subscription) {
        // Crear nueva suscripción si no existe
        subscription = await Subscription.createTrialSubscription(professionalId);
      }

      // Iniciar suscripción pagada
      await subscription.startPaidSubscription(paymentData);

      // Actualizar estado del profesional
      await Professional.findByIdAndUpdate(professionalId, {
        isVisible: true,
        subscriptionStatus: 'active'
      });

      // Enviar confirmación
      await this.sendPaymentConfirmationNotification(professional, paymentData);

      logger.info(`Manual payment processed for professional ${professionalId}`);

      return {
        success: true,
        message: 'Pago procesado exitosamente',
        data: {
          subscription,
          professional
        }
      };

    } catch (error) {
      logger.error('Error processing manual payment:', error);
      throw error;
    }
  }
}

export default SubscriptionService;
