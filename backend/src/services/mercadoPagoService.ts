import { logger } from '../utils/logger';
import crypto from 'crypto';

// Configuración de Mercado Pago
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-MERCADO_PAGO_ACCESS_TOKEN';
const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'miprofesional-webhook-secret';
const MERCADO_PAGO_API_BASE = 'https://api.mercadopago.com/v1';

export class MercadoPagoService {
  // Crear preferencia de pago única
  static async createPaymentPreference(paymentData: {
    title: string;
    amount: number;
    professionalId: string;
    professionalName: string;
    professionalEmail: string;
    returnUrl: string;
  }) {
    try {
      const preference = {
        items: [{
          title: paymentData.title,
          quantity: 1,
          unit_price: paymentData.amount,
          currency_id: 'ARS',
          picture_url: 'https://miprofesional.com/assets/logo.png'
        }],
        payer: {
          name: paymentData.professionalName.split(' ')[0],
          surname: paymentData.professionalName.split(' ').slice(1).join(' '),
          email: paymentData.professionalEmail
        },
        back_urls: {
          success: `${paymentData.returnUrl}/success`,
          failure: `${paymentData.returnUrl}/failure`,
          pending: `${paymentData.returnUrl}/pending`
        },
        auto_return: 'approved',
        external_reference: `${paymentData.professionalId}_${Date.now()}`,
        notification_url: `${process.env.BACKEND_URL}/api/v1/mercadopago/webhook`,
        statement_descriptor: 'MiProfesional',
        metadata: {
          professionalId: paymentData.professionalId,
          type: 'subscription_payment'
        }
      };

      const response = await fetch(`${MERCADO_PAGO_API_BASE}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preference)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data: {
          preferenceId: data.id,
          initPoint: data.init_point,
          sandboxInitPoint: data.sandbox_init_point,
          amount: paymentData.amount
        }
      };

    } catch (error) {
      logger.error('Error creating Mercado Pago preference:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Crear suscripción recurrente
  static async createRecurringSubscription(subscriptionData: {
    professionalId: string;
    professionalName: string;
    professionalEmail: string;
    returnUrl: string;
  }) {
    try {
      const subscription = {
        reason: 'Suscripción mensual MiProfesional - Profesional',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 8000,
          currency_id: 'ARS',
          start_date: new Date().toISOString(),
          end_date: null,
          transaction_amount_proportional: false
        },
        payer_email: subscriptionData.professionalEmail,
        back_url: subscriptionData.returnUrl,
        external_reference: `${subscriptionData.professionalId}_recurring_${Date.now()}`,
        metadata: {
          professionalId: subscriptionData.professionalId,
          type: 'recurring_subscription'
        }
      };

      const response = await fetch(`${MERCADO_PAGO_API_BASE}/preapproval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data: {
          subscriptionId: data.id,
          initPoint: data.init_point,
          amount: 8000,
          nextPaymentDate: data.auto_recurring?.start_date
        }
      };

    } catch (error) {
      logger.error('Error creating Mercado Pago subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Obtener detalles de un pago
  static async getPaymentDetails(paymentId: string) {
    try {
      const response = await fetch(`${MERCADO_PAGO_API_BASE}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      logger.error('Error getting payment details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Obtener detalles de suscripción
  static async getSubscriptionDetails(subscriptionId: string) {
    try {
      const response = await fetch(`${MERCADO_PAGO_API_BASE}/preapproval/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      logger.error('Error getting subscription details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Cancelar suscripción recurrente
  static async cancelSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`${MERCADO_PAGO_API_BASE}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      logger.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Pausar suscripción recurrente
  static async pauseSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`${MERCADO_PAGO_API_BASE}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'paused'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      logger.error('Error pausing subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Reanudar suscripción recurrente
  static async resumeSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`${MERCADO_PAGO_API_BASE}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'authorized'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      logger.error('Error resuming subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Verificar firma del webhook
  static verifyWebhookSignature(body: any, signature: string): boolean {
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
  }

  // Procesar webhook de pago
  static async processPaymentWebhook(paymentData: any) {
    try {
      const paymentId = paymentData.id;
      
      // Obtener detalles del pago
      const paymentResult = await this.getPaymentDetails(paymentId);
      
      if (!paymentResult.success) {
        throw new Error('Failed to get payment details');
      }

      const payment = paymentResult.data;
      
      return {
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          paymentMethodId: payment.payment_method_id,
          paymentTypeId: payment.payment_type_id,
          transactionAmount: payment.transaction_amount,
          dateApproved: payment.date_approved,
          metadata: payment.metadata,
          externalReference: payment.external_reference
        }
      };

    } catch (error) {
      logger.error('Error processing payment webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Procesar webhook de suscripción
  static async processSubscriptionWebhook(subscriptionData: any) {
    try {
      const subscriptionId = subscriptionData.id;
      
      // Obtener detalles de la suscripción
      const subscriptionResult = await this.getSubscriptionDetails(subscriptionId);
      
      if (!subscriptionResult.success) {
        throw new Error('Failed to get subscription details');
      }

      const subscription = subscriptionResult.data;
      
      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          reason: subscription.reason,
          externalReference: subscription.external_reference,
          dateCreated: subscription.date_created,
          lastModified: subscription.last_modified,
          autoRecurring: subscription.auto_recurring,
          payerEmail: subscription.payer_email,
          backUrl: subscription.back_url,
          metadata: subscription.metadata
        }
      };

    } catch (error) {
      logger.error('Error processing subscription webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Obtener métodos de pago disponibles
  static async getPaymentMethods() {
    try {
      const response = await fetch(`${MERCADO_PAGO_API_BASE}/payment_methods`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data: data.filter((method: any) => 
          method.status === 'active' && 
          method.allowed_payment_type === 'ticket' || 
          method.allowed_payment_type === 'atm' ||
          method.allowed_payment_type === 'credit_card'
        )
      };

    } catch (error) {
      logger.error('Error getting payment methods:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Crear pago con tarjeta de crédito
  static async createCardPayment(cardData: {
    token: string;
    paymentMethodId: string;
    amount: number;
    description: string;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
  }) {
    try {
      const payment = {
        token: cardData.token,
        payment_method_id: cardData.paymentMethodId,
        transaction_amount: cardData.amount,
        description: cardData.description,
        installments: 1,
        payment_type_id: 'credit_card',
        payer: cardData.payer
      };

      const response = await fetch(`${MERCADO_PAGO_API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payment)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Mercado Pago API error: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      logger.error('Error creating card payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default MercadoPagoService;
