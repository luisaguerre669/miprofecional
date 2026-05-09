import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { Professional } from '../models';
import { notificationService } from '../services/notificationService';

// Crear suscripción de prueba para profesional
export const createTrialSubscription = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.body;

    if (!professionalId) {
      return res.status(400).json({
        success: false,
        message: 'Professional ID is required'
      });
    }

    // Verificar si ya existe una suscripción activa
    const existingSubscription = await Subscription.getActiveSubscription(professionalId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Professional already has an active subscription'
      });
    }

    // Verificar que el profesional exista
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    // Crear suscripción de prueba
    const trialSubscription = await Subscription.createTrialSubscription(professionalId);

    res.status(201).json({
      success: true,
      data: trialSubscription,
      message: 'Trial subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trial subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener suscripción activa de un profesional
export const getActiveSubscription = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;

    const subscription = await Subscription.getActiveSubscription(professionalId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: subscription,
      message: 'Active subscription retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting active subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Iniciar suscripción paga
export const startPaidSubscription = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;
    const { paymentMethod, amount, transactionId } = req.body;

    // Obtener suscripción activa
    const subscription = await Subscription.getActiveSubscription(professionalId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Iniciar suscripción paga
    const updatedSubscription = await subscription.startPaidSubscription({
      method: paymentMethod,
      amount: amount || 8000,
      transactionId
    });

    // Actualizar estado del profesional
    await Professional.findByIdAndUpdate(professionalId, {
      subscriptionStatus: 'active',
      subscriptionType: 'professional',
      isVisible: true
    });

    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Paid subscription started successfully'
    });
  } catch (error) {
    console.error('Error starting paid subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start paid subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Suspender perfil por falta de pago
export const suspendProfile = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;

    const subscription = await Subscription.getActiveSubscription(professionalId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Suspender perfil
    const updatedSubscription = await subscription.suspendProfile();

    // Actualizar estado del profesional
    await Professional.findByIdAndUpdate(professionalId, {
      subscriptionStatus: 'suspended',
      isVisible: false
    });

    // Enviar notificación de suspensión
    await notificationService.sendSubscriptionSuspension(professionalId);

    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Profile suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Reactivar perfil después del pago
export const reactivateProfile = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;
    const { paymentMethod, amount, transactionId } = req.body;

    // Buscar suscripción suspendida
    const subscription = await Subscription.findOne({
      professionalId,
      status: 'suspended',
      isVisible: false
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No suspended subscription found'
      });
    }

    // Reactivar perfil
    const updatedSubscription = await subscription.reactivateProfile({
      method: paymentMethod,
      amount: amount || 8000,
      transactionId
    });

    // Actualizar estado del profesional
    await Professional.findByIdAndUpdate(professionalId, {
      subscriptionStatus: 'active',
      subscriptionType: 'professional',
      isVisible: true
    });

    // Enviar notificación de reactivación
    await notificationService.sendSubscriptionReactivation(professionalId);

    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Profile reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener suscripciones que vencen pronto
export const getExpiringSoon = async (req: Request, res: Response) => {
  try {
    const { days = 5 } = req.query;

    const subscriptions = await Subscription.getExpiringSoon(Number(days));

    res.json({
      success: true,
      data: subscriptions,
      message: 'Expiring subscriptions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting expiring subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring subscriptions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener perfiles para suspender (vencidos)
export const getExpiredForSuspension = async (req: Request, res: Response) => {
  try {
    const subscriptions = await Subscription.getExpiredForSuspension();

    res.json({
      success: true,
      data: subscriptions,
      message: 'Expired subscriptions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting expired subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expired subscriptions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Enviar notificaciones de vencimiento
export const sendExpiryNotifications = async (req: Request, res: Response) => {
  try {
    const { days = 5 } = req.query;

    const subscriptions = await Subscription.getExpiringSoon(Number(days));
    let notificationsSent = 0;

    for (const subscription of subscriptions) {
      try {
        await notificationService.sendPaymentReminder(
          subscription.professionalId._id,
          subscription.getDaysUntilExpiry(),
          subscription.endDate
        );

        await subscription.sendNotification('fiveDaysWarning');
        notificationsSent++;
      } catch (notificationError) {
        console.error(`Error sending notification to ${subscription.professionalId._id}:`, notificationError);
      }
    }

    res.json({
      success: true,
      data: {
        notificationsSent,
        totalProcessed: subscriptions.length
      },
      message: 'Expiry notifications sent successfully'
    });
  } catch (error) {
    console.error('Error sending expiry notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send expiry notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Procesar suspensiones automáticas
export const processAutomaticSuspensions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await Subscription.getExpiredForSuspension();
    let suspensionsProcessed = 0;

    for (const subscription of subscriptions) {
      try {
        // Suspender perfil
        await subscription.suspendProfile();

        // Actualizar estado del profesional
        await Professional.findByIdAndUpdate(subscription.professionalId._id, {
          subscriptionStatus: 'suspended',
          isVisible: false
        });

        // Enviar notificación de suspensión
        await notificationService.sendSubscriptionSuspension(subscription.professionalId._id);

        suspensionsProcessed++;
      } catch (suspensionError) {
        console.error(`Error suspending ${subscription.professionalId._id}:`, suspensionError);
      }
    }

    res.json({
      success: true,
      data: {
        suspensionsProcessed,
        totalProcessed: subscriptions.length
      },
      message: 'Automatic suspensions processed successfully'
    });
  } catch (error) {
    console.error('Error processing automatic suspensions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process automatic suspensions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener historial de suscripciones de un profesional
export const getSubscriptionHistory = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;

    const subscriptions = await Subscription.find({ professionalId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: subscriptions,
      message: 'Subscription history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting subscription history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verificar estado de suscripción
export const checkSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;

    const subscription = await Subscription.getActiveSubscription(professionalId);
    
    if (!subscription) {
      return res.json({
        success: true,
        data: {
          hasActiveSubscription: false,
          status: 'none',
          isVisible: false,
          daysUntilExpiry: 0,
          isInGracePeriod: false
        },
        message: 'No active subscription found'
      });
    }

    const daysUntilExpiry = subscription.getDaysUntilExpiry();
    const isInGracePeriod = subscription.isInGracePeriod();

    res.json({
      success: true,
      data: {
        hasActiveSubscription: true,
        status: subscription.status,
        planType: subscription.planType,
        isVisible: subscription.isVisible,
        endDate: subscription.endDate,
        trialEndDate: subscription.trialEndDate,
        daysUntilExpiry,
        isInGracePeriod,
        gracePeriodEnd: subscription.gracePeriodEnd,
        nextPaymentDate: subscription.nextPaymentDate,
        notificationsSent: subscription.notificationsSent
      },
      message: 'Subscription status retrieved successfully'
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Dashboard de suscripciones para admin
export const getSubscriptionDashboard = async (req: Request, res: Response) => {
  try {
    const totalActive = await Subscription.countDocuments({ status: 'active' });
    const totalExpired = await Subscription.countDocuments({ status: 'expired' });
    const totalSuspended = await Subscription.countDocuments({ status: 'suspended' });
    const totalTrial = await Subscription.countDocuments({ planType: 'trial', status: 'active' });
    const totalProfessional = await Subscription.countDocuments({ planType: 'professional', status: 'active' });

    const expiringSoon = await Subscription.getExpiringSoon(5);
    const expiredForSuspension = await Subscription.getExpiredForSuspension();

    // Ingresos del mes actual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          lastPaymentDate: { $gte: currentMonth },
          planType: 'professional'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$lastPaymentAmount' },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalActive,
          totalExpired,
          totalSuspended,
          totalTrial,
          totalProfessional
        },
        alerts: {
          expiringSoon: expiringSoon.length,
          expiredForSuspension: expiredForSuspension.length
        },
        revenue: monthlyRevenue[0] || { totalRevenue: 0, totalPayments: 0 },
        expiringSoon: expiringSoon.slice(0, 10), // Limitar a 10 para dashboard
        expiredForSuspension: expiredForSuspension.slice(0, 10)
      },
      message: 'Subscription dashboard retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting subscription dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  createTrialSubscription,
  getActiveSubscription,
  startPaidSubscription,
  suspendProfile,
  reactivateProfile,
  getExpiringSoon,
  getExpiredForSuspension,
  sendExpiryNotifications,
  processAutomaticSuspensions,
  getSubscriptionHistory,
  checkSubscriptionStatus,
  getSubscriptionDashboard
};
