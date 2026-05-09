import cron from 'node-cron';
import { Subscription } from '../models/Subscription';
import { Professional } from '../models';
import { notificationService } from '../services/notificationService';

// Clase para manejar jobs automáticos de suscripciones
class SubscriptionCronJob {
  private isRunning = false;

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // Job diario a las 9 AM para verificar suscripciones que vencen en 5 días
    cron.schedule('0 9 * * *', async () => {
      await this.checkExpiringSoon();
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    // Job diario a las 10 AM para verificar suscripciones vencidas y suspender perfiles
    cron.schedule('0 10 * * *', async () => {
      await this.processExpiredSubscriptions();
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    // Job diario a las 11 AM para verificar reactivaciones automáticas
    cron.schedule('0 11 * * *', async () => {
      await this.checkPendingPayments();
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    // Job semanal los lunes a las 8 AM para reportes
    cron.schedule('0 8 * * 1', async () => {
      await this.generateWeeklyReport();
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    console.log('Subscription cron jobs initialized');
  }

  // Verificar suscripciones que vencen en 5 días
  private async checkExpiringSoon() {
    if (this.isRunning) return;
    
    try {
      this.isRunning = true;
      console.log('Checking expiring subscriptions...');

      const subscriptions = await Subscription.getExpiringSoon(5);
      let notificationsSent = 0;

      for (const subscription of subscriptions) {
        try {
          const daysUntilExpiry = subscription.getDaysUntilExpiry();
          
          // Enviar notificación según los días restantes
          if (daysUntilExpiry <= 5 && !subscription.notificationsSent.fiveDaysWarning) {
            await notificationService.sendPaymentReminder(
              subscription.professionalId._id,
              daysUntilExpiry,
              subscription.endDate
            );
            
            await subscription.sendNotification('fiveDaysWarning');
            notificationsSent++;
          }

          // Si falta 1 día, enviar recordatorio urgente
          if (daysUntilExpiry <= 1 && !subscription.notificationsSent.oneDayWarning) {
            await notificationService.sendPaymentReminder(
              subscription.professionalId._id,
              daysUntilExpiry,
              subscription.endDate
            );
            
            await subscription.sendNotification('oneDayWarning');
          }

          console.log(`Processed expiring subscription for professional: ${subscription.professionalId._id}`);
        } catch (error) {
          console.error(`Error processing subscription ${subscription._id}:`, error);
        }
      }

      console.log(`Expiring subscriptions check completed. Notifications sent: ${notificationsSent}`);
    } catch (error) {
      console.error('Error in checkExpiringSoon job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Procesar suscripciones vencidas y suspender perfiles
  private async processExpiredSubscriptions() {
    if (this.isRunning) return;
    
    try {
      this.isRunning = true;
      console.log('Processing expired subscriptions...');

      const subscriptions = await Subscription.getExpiredForSuspension();
      let profilesSuspended = 0;

      for (const subscription of subscriptions) {
        try {
          // Suspender perfil
          await subscription.suspendProfile();

          // Actualizar estado del profesional
          await Professional.findByIdAndUpdate(subscription.professionalId._id, {
            subscriptionStatus: 'suspended',
            isVisible: false,
            suspendedAt: new Date()
          });

          // Enviar notificación de suspensión
          await notificationService.sendSubscriptionSuspension(subscription.professionalId._id);

          profilesSuspended++;
          console.log(`Suspended profile for professional: ${subscription.professionalId._id}`);
        } catch (error) {
          console.error(`Error suspending professional ${subscription.professionalId._id}:`, error);
        }
      }

      console.log(`Expired subscriptions processed. Profiles suspended: ${profilesSuspended}`);
    } catch (error) {
      console.error('Error in processExpiredSubscriptions job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Verificar pagos pendientes y reactivar perfiles
  private async checkPendingPayments() {
    if (this.isRunning) return;
    
    try {
      this.isRunning = true;
      console.log('Checking pending payments...');

      // Buscar profesionales con pagos recientes (simulado)
      const recentPayments = await this.getRecentPayments();
      let profilesReactivated = 0;

      for (const payment of recentPayments) {
        try {
          // Buscar suscripción suspendida
          const subscription = await Subscription.findOne({
            professionalId: payment.professionalId,
            status: 'suspended',
            isVisible: false
          });

          if (subscription && subscription.isInGracePeriod()) {
            // Reactivar perfil
            await subscription.reactivateProfile({
              method: payment.method,
              amount: payment.amount,
              transactionId: payment.transactionId
            });

            // Actualizar estado del profesional
            await Professional.findByIdAndUpdate(payment.professionalId, {
              subscriptionStatus: 'active',
              subscriptionType: 'professional',
              isVisible: true,
              reactivatedAt: new Date()
            });

            // Enviar notificación de reactivación
            await notificationService.sendSubscriptionReactivation(payment.professionalId);

            profilesReactivated++;
            console.log(`Reactivated profile for professional: ${payment.professionalId}`);
          }
        } catch (error) {
          console.error(`Error reactivating professional ${payment.professionalId}:`, error);
        }
      }

      console.log(`Pending payments checked. Profiles reactivated: ${profilesReactivated}`);
    } catch (error) {
      console.error('Error in checkPendingPayments job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Generar reporte semanal
  private async generateWeeklyReport() {
    try {
      console.log('Generating weekly subscription report...');

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Estadísticas de la semana
      const weeklyStats = await Subscription.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo, $lte: now }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              week: { $week: '$createdAt' }
            },
            newSubscriptions: { $sum: 1 },
            trialSubscriptions: {
              $sum: { $cond: [{ $eq: ['$planType', 'trial'] }, 1, 0] }
            },
            paidSubscriptions: {
              $sum: { $cond: [{ $eq: ['$planType', 'professional'] }, 1, 0] }
            },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      // Suscripciones activas vs suspendidas
      const activeVsSuspended = await Subscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Profesionales por estado
      const professionalsByStatus = await Professional.aggregate([
        {
          $group: {
            _id: '$subscriptionStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const report = {
        week: weeklyStats[0] || {},
        activeVsSuspended,
        professionalsByStatus,
        generatedAt: now
      };

      console.log('Weekly subscription report:', JSON.stringify(report, null, 2));

      // Aquí podrías enviar el reporte por email a los administradores
      // await emailService.sendWeeklyReport(report);

    } catch (error) {
      console.error('Error generating weekly report:', error);
    }
  }

  // Simular obtención de pagos recientes (integrar con pasarela de pagos real)
  private async getRecentPayments(): Promise<Array<{
    professionalId: string;
    amount: number;
    method: string;
    transactionId: string;
  }>> {
    // Simulación - en producción esto vendría de webhooks de Stripe/Mercado Pago
    return [];
  }

  // Método para ejecutar jobs manualmente (para testing)
  async runAllJobsManually() {
    console.log('Running all subscription jobs manually...');
    
    await this.checkExpiringSoon();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.processExpiredSubscriptions();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.checkPendingPayments();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.generateWeeklyReport();
    
    console.log('All manual jobs completed');
  }

  // Obtener estado de los jobs
  getJobStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: new Date(),
      jobs: [
        { name: 'Expiring Soon Check', schedule: '0 9 * * *', timezone: 'America/Argentina/Buenos_Aires' },
        { name: 'Expired Subscriptions', schedule: '0 10 * * *', timezone: 'America/Argentina/Buenos_Aires' },
        { name: 'Pending Payments', schedule: '0 11 * * *', timezone: 'America/Argentina/Buenos_Aires' },
        { name: 'Weekly Report', schedule: '0 8 * * 1', timezone: 'America/Argentina/Buenos_Aires' }
      ]
    };
  }
}

// Exportar instancia única
export const subscriptionCronJob = new SubscriptionCronJob();

export default subscriptionCronJob;
