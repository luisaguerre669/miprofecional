import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { Professional } from '../models/Professional';
import { User } from '../models/User';
import { notificationService } from '../services/notificationService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Configuración de Mercado Pago
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-MERCADO_PAGO_ACCESS_TOKEN';
const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'miprofesional-webhook-secret';
const MERCADO_PAGO_API_BASE = 'https://api.mercadopago.com/v1';

// Función para crear preferencia de pago
export const createPaymentPreference = async (req: Request, res: Response) => {
  try {
    const { professionalId, planType = 'professional' } = req.body;
    const userId = req.user?.id;

    // Validar que el profesional exista y pertenezca al usuario
    const professional = await Professional.findOne({ _id: professionalId, userId });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado o no autorizado'
      });
    }

    // Obtener suscripción actual
    let subscription = await Subscription.getActiveSubscription(professionalId);
    
    // Si no hay suscripción, crear una nueva
    if (!subscription) {
      subscription = await Subscription.createTrialSubscription(professionalId);
    }

    // Determinar monto y descripción
    const amount = planType === 'professional' ? 8000 : 0; // $8.000 ARS
    const description = planType === 'professional' 
      ? 'Suscripción mensual MiProfesional - Profesional'
      : 'Suscripción de prueba MiProfesional';

    // Crear preferencia de pago en Mercado Pago
    const preferenceData = {
      items: [{
        title: description,
        quantity: 1,
        unit_price: amount,
        currency_id: 'ARS',
        picture_url: 'https://miprofesional.com/assets/logo.png'
      }],
      payer: {
        name: professional.firstName,
        surname: professional.lastName,
        email: professional.email,
        identification: {
          type: professional.documentType || 'DNI',
          number: professional.documentNumber || '00000000'
        }
      },
      payment_methods: {
        excluded_payment_types: [{
          id: 'ticket'
        }],
        excluded_payment_methods: [],
        installments: 1,
        default_payment_method_id: null,
        default_installments: null
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: `${professionalId}_${Date.now()}`,
      notification_url: `${process.env.BACKEND_URL}/api/v1/mercadopago/webhook`,
      statement_descriptor: 'MiProfesional',
      metadata: {
        professionalId,
        planType,
        userId,
        subscriptionId: subscription._id
      }
    };

    const response = await fetch(`${MERCADO_PAGO_API_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Error creating Mercado Pago preference:', data);
      return res.status(400).json({
        success: false,
        message: 'Error al crear preferencia de pago',
        error: data
      });
    }

    // Guardar el ID de preferencia en la suscripción
    subscription.lastPaymentAmount = amount;
    await subscription.save();

    res.json({
      success: true,
      data: {
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
        amount,
        description
      }
    });

  } catch (error) {
    logger.error('Error in createPaymentPreference:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función para crear suscripción recurrente
export const createRecurringSubscription = async (req: Request, res: Response) => {
  try {
    const { professionalId, paymentMethodId } = req.body;
    const userId = req.user?.id;

    // Validar que el profesional exista y pertenezca al usuario
    const professional = await Professional.findOne({ _id: professionalId, userId });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado o no autorizado'
      });
    }

    // Obtener suscripción actual
    let subscription = await Subscription.getActiveSubscription(professionalId);
    
    if (!subscription) {
      subscription = await Subscription.createTrialSubscription(professionalId);
    }

    // Crear suscripción recurrente en Mercado Pago
    const subscriptionData = {
      reason: 'Suscripción mensual MiProfesional - Profesional',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 8000,
        currency_id: 'ARS',
        start_date: new Date().toISOString(),
        end_date: null, // Sin fecha de fin
        transaction_amount_proportional: false
      },
      payment_method_id: paymentMethodId,
      payer_email: professional.email,
      back_url: `${process.env.FRONTEND_URL}/subscription/success`,
      external_reference: `${professionalId}_recurring_${Date.now()}`,
      metadata: {
        professionalId,
        planType: 'professional',
        userId,
        subscriptionId: subscription._id
      }
    };

    const response = await fetch(`${MERCADO_PAGO_API_BASE}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Error creating Mercado Pago subscription:', data);
      return res.status(400).json({
        success: false,
        message: 'Error al crear suscripción recurrente',
        error: data
      });
    }

    // Actualizar suscripción con ID de Mercado Pago
    subscription.planType = 'professional';
    subscription.status = 'active';
    subscription.amount = 8000;
    subscription.paymentMethod = 'mercadopago';
    subscription.nextPaymentDate = new Date(data.auto_recurring?.start_date || Date.now());
    subscription.subscriptionHistory.push({
      date: new Date(),
      action: 'renewed',
      amount: 8000,
      paymentMethod: 'mercadopago',
      reason: 'Recurring subscription created'
    });
    await subscription.save();

    res.json({
      success: true,
      data: {
        subscriptionId: data.id,
        initPoint: data.init_point,
        amount: 8000,
        nextPaymentDate: subscription.nextPaymentDate
      }
    });

  } catch (error) {
    logger.error('Error in createRecurringSubscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Webhook de Mercado Pago
export const handleMercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    // Verificar firma del webhook
    const signature = req.headers['x-signature'] as string;
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({
        success: false,
        message: 'Firma del webhook inválida'
      });
    }

    logger.info('Mercado Pago webhook received:', { type, data });

    switch (type) {
      case 'payment':
        await handlePaymentWebhook(data);
        break;
      case 'preapproval':
        await handlePreapprovalWebhook(data);
        break;
      case 'merchant_order':
        await handleMerchantOrderWebhook(data);
        break;
      default:
        logger.warn('Unknown webhook type:', type);
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Error handling Mercado Pago webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook'
    });
  }
};

// Manejar webhook de pago
const handlePaymentWebhook = async (paymentData: any) => {
  try {
    const paymentId = paymentData.id;
    
    // Obtener detalles del pago
    const response = await fetch(`${MERCADO_PAGO_API_BASE}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    const payment = await response.json();

    if (payment.status === 'approved') {
      const { professionalId, subscriptionId } = payment.metadata || {};
      
      if (professionalId && subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId);
        if (subscription) {
          await subscription.reactivateProfile({
            amount: payment.transaction_amount,
            method: 'mercadopago'
          });

          // Actualizar estado del profesional
          await Professional.findByIdAndUpdate(professionalId, {
            isVisible: true,
            subscriptionStatus: 'active'
          });

          // Enviar notificación de confirmación
          const professional = await Professional.findById(professionalId).populate('userId');
          if (professional && professional.userId) {
            await notificationService.sendPaymentConfirmation(
              professional.userId,
              payment.transaction_amount,
              new Date()
            );
          }

          logger.info(`Payment processed successfully for professional ${professionalId}`);
        }
      }
    }

  } catch (error) {
    logger.error('Error handling payment webhook:', error);
  }
};

// Manejar webhook de preaprobación (suscripción recurrente)
const handlePreapprovalWebhook = async (preapprovalData: any) => {
  try {
    const { id, status, external_reference } = preapprovalData;
    
    if (status === 'authorized' && external_reference) {
      const [professionalId] = external_reference.split('_');
      
      const subscription = await Subscription.getActiveSubscription(professionalId);
      if (subscription) {
        subscription.status = 'active';
        subscription.isVisible = true;
        subscription.subscriptionHistory.push({
          date: new Date(),
          action: 'renewed',
          amount: 8000,
          paymentMethod: 'mercadopago',
          reason: 'Recurring payment authorized'
        });
        await subscription.save();

        // Actualizar estado del profesional
        await Professional.findByIdAndUpdate(professionalId, {
          isVisible: true,
          subscriptionStatus: 'active'
        });

        logger.info(`Recurring subscription authorized for professional ${professionalId}`);
      }
    }

  } catch (error) {
    logger.error('Error handling preapproval webhook:', error);
  }
};

// Manejar webhook de orden de comerciante
const handleMerchantOrderWebhook = async (orderData: any) => {
  try {
    logger.info('Merchant order webhook received:', orderData);
    // Implementar lógica si es necesario
  } catch (error) {
    logger.error('Error handling merchant order webhook:', error);
  }
};

// Verificar firma del webhook
const verifyWebhookSignature = (body: any, signature: string): boolean => {
  try {
    if (!signature) return false;
    
    const expectedSignature = crypto
      .createHmac('sha256', MERCADO_PAGO_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Obtener estado de suscripción
export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;
    const userId = req.user?.id;

    // Validar que el profesional exista y pertenezca al usuario
    const professional = await Professional.findOne({ _id: professionalId, userId });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado o no autorizado'
      });
    }

    const subscription = await Subscription.getActiveSubscription(professionalId);
    
    if (!subscription) {
      return res.json({
        success: true,
        data: {
          status: 'none',
          message: 'No active subscription'
        }
      });
    }

    const daysUntilExpiry = subscription.getDaysUntilExpiry();
    const isInGracePeriod = subscription.isInGracePeriod();

    res.json({
      success: true,
      data: {
        status: subscription.status,
        planType: subscription.planType,
        isVisible: subscription.isVisible,
        endDate: subscription.endDate,
        nextPaymentDate: subscription.nextPaymentDate,
        daysUntilExpiry,
        isInGracePeriod,
        gracePeriodEnd: subscription.gracePeriodEnd,
        notificationsSent: subscription.notificationsSent,
        amount: subscription.amount,
        lastPaymentDate: subscription.lastPaymentDate,
        lastPaymentAmount: subscription.lastPaymentAmount,
        subscriptionHistory: subscription.subscriptionHistory
      }
    });

  } catch (error) {
    logger.error('Error in getSubscriptionStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cancelar suscripción
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;
    const userId = req.user?.id;

    // Validar que el profesional exista y pertenezca al usuario
    const professional = await Professional.findOne({ _id: professionalId, userId });
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado o no autorizado'
      });
    }

    const subscription = await Subscription.getActiveSubscription(professionalId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No hay suscripción activa'
      });
    }

    // Cancelar suscripción en Mercado Pago si es recurrente
    if (subscription.paymentMethod === 'mercadopago') {
      // Aquí se implementaría la cancelación de la suscripción en Mercado Pago
      // Por ahora solo actualizamos el estado local
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.subscriptionHistory.push({
      date: new Date(),
      action: 'cancelled',
      reason: 'Cancelled by user'
    });
    await subscription.save();

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente'
    });

  } catch (error) {
    logger.error('Error in cancelSubscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
