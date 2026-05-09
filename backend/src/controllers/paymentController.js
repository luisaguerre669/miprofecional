// Payment Controller - Sistema de pagos móviles
// Controlador para gestionar pagos con Mercado Pago y otros métodos

const Booking = require('../models/Booking');
const User = require('../models/User');
const Professional = require('../models/Professional');

class PaymentController {
  /**
   * Crear pago para reserva
   */
  async createPayment(req, res) {
    try {
      const { 
        bookingId, 
        paymentMethod = 'mercadopago',
        amount,
        currency = 'ARS',
        description = 'Reserva de servicio profesional'
      } = req.body;
      
      const userId = req.usuario.id;
      
      console.log(`💳 Creating payment: user=${userId}, booking=${bookingId}, amount=${amount}`);
      
      // Validar datos
      if (!bookingId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Booking ID and amount are required'
        });
      }
      
      // Verificar que la reserva existe y pertenece al usuario
      const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found or not in valid status'
        });
      }
      
      // Verificar que el profesional existe
      const professional = await Professional.findById(booking.professional);
      if (!professional) {
        return res.status(404).json({
          success: false,
          error: 'Professional not found'
        });
      }
      
      // Crear preferencia de pago con Mercado Pago
      const paymentPreference = await this.createMercadoPagoPreference({
        booking,
        professional,
        amount: parseFloat(amount),
        description,
        userId
      });
      
      // Guardar información del pago
      const payment = await this.savePayment({
        bookingId,
        userId,
        professionalId: booking.professional,
        paymentMethod,
        amount: parseFloat(amount),
        currency,
        description,
        preferenceId: paymentPreference.id,
        status: 'pending',
        createdAt: new Date()
      });
      
      res.status(201).json({
        success: true,
        data: {
          paymentId: payment._id,
          preferenceId: paymentPreference.id,
          initPoint: paymentPreference.init_point,
          sandboxMode: process.env.MERCADOPAGO_SANDBOX === 'true',
          paymentUrl: paymentPreference.init_point,
          qrCode: paymentPreference.qr_code,
          amount: parseFloat(amount),
          currency,
          description,
          expiresAt: paymentPreference.date_of_expiration,
          booking: {
            id: booking._id,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            professional: {
              businessName: professional.businessName,
              profession: professional.profession
            }
          }
        },
        message: 'Payment created successfully'
      });
      
    } catch (error) {
      console.error('❌ Create payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment'
      });
    }
  }

  /**
   * Obtener estado del pago
   */
  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.usuario.id;
      
      console.log(`💳 Getting payment status: ${paymentId} for user ${userId}`);
      
      // Obtener pago de la base de datos
      const payment = await this.PaymentModel.findOne({
        _id: paymentId,
        user: userId
      }).populate('booking');
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      
      // Consultar estado en Mercado Pago
      const mercadoPagoStatus = await this.getMercadoPagoStatus(payment.preferenceId);
      
      // Actualizar estado del pago
      if (mercadoPagoStatus.status !== payment.status) {
        payment.status = mercadoPagoStatus.status;
        payment.statusDetail = mercadoPagoStatus.status_detail;
        payment.updatedAt = new Date();
        await payment.save();
        
        // Si el pago fue aprobado, actualizar estado de la reserva
        if (mercadoPagoStatus.status === 'approved') {
          await Booking.findByIdAndUpdate(payment.bookingId, {
            status: 'confirmed',
            paymentStatus: 'paid',
            paidAt: new Date()
          });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          paymentId: payment._id,
          status: payment.status,
          statusDetail: payment.statusDetail,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          mercadoPagoStatus,
          booking: {
            id: payment.booking._id,
            service: payment.booking.service,
            status: payment.booking.status,
            paymentStatus: payment.booking.paymentStatus
          }
        },
        message: 'Payment status retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Get payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment status'
      });
    }
  }

  /**
   * Webhook de Mercado Pago
   */
  async mercadopagoWebhook(req, res) {
    try {
      const { type, data } = req.body;
      
      console.log(`💳 Mercado Pago webhook: ${type}`);
      
      if (type === 'payment') {
        const paymentId = data.id;
        
        // Obtener pago de nuestra base de datos
        const payment = await this.PaymentModel.findOne({
          preferenceId: paymentId
        });
        
        if (!payment) {
          console.log(`💳 Payment not found for preference ID: ${paymentId}`);
          return res.status(200).send('OK');
        }
        
        // Actualizar estado del pago
        payment.status = data.status;
        payment.statusDetail = data.status_detail;
        payment.mercadoPagoId = paymentId;
        payment.updatedAt = new Date();
        
        if (data.status === 'approved') {
          payment.approvedAt = new Date();
          
          // Actualizar estado de la reserva
          await Booking.findByIdAndUpdate(payment.bookingId, {
            status: 'confirmed',
            paymentStatus: 'paid',
            paidAt: new Date()
          });
          
          console.log(`💳 Payment approved: ${payment._id}`);
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          payment.rejectedAt = new Date();
          
          // Actualizar estado de la reserva
          await Booking.findByIdAndUpdate(payment.bookingId, {
            status: 'cancelled',
            paymentStatus: 'failed',
            cancelledAt: new Date()
          });
          
          console.log(`💳 Payment rejected/cancelled: ${payment._id}`);
        }
        
        await payment.save();
        
        // Enviar notificación al usuario
        await this.sendPaymentNotification(payment, data.status);
      }
      
      res.status(200).send('OK');
      
    } catch (error) {
      console.error('❌ Mercado Pago webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }
  }

  /**
   * Obtener métodos de pago disponibles
   */
  async getPaymentMethods(req, res) {
    try {
      console.log(`💳 Getting available payment methods`);
      
      const paymentMethods = [
        {
          id: 'mercadopago',
          name: 'Mercado Pago',
          description: 'Paga con tarjeta de crédito, débito o dinero en cuenta',
          icon: 'https://img.mercadopago.com/logo/mp.png',
          enabled: true,
          fees: {
            credit: { percentage: 5.99, fixed: 0 },
            debit: { percentage: 1.99, fixed: 0 },
            account_money: { percentage: 0, fixed: 0 }
          }
        },
        {
          id: 'transferencia',
          name: 'Transferencia Bancaria',
          description: 'Transferencia directa a cuenta bancaria',
          icon: 'https://example.com/icons/bank.png',
          enabled: true,
          fees: { percentage: 0, fixed: 0 }
        },
        {
          id: 'efectivo',
          name: 'Efectivo',
          description: 'Pago en efectivo al profesional',
          icon: 'https://example.com/icons/cash.png',
          enabled: true,
          fees: { percentage: 0, fixed: 0 }
        }
      ];
      
      res.status(200).json({
        success: true,
        data: paymentMethods,
        message: 'Payment methods retrieved successfully'
      });
      
    } catch (error) {
      console.error('❌ Get payment methods error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment methods'
      });
    }
  }

  /**
   * Obtener historial de pagos del usuario
   */
  async getUserPayments(req, res) {
    try {
      const userId = req.usuario.id;
      const { limit = 20, skip = 0, status = null } = req.query;
      
      console.log(`💳 Getting user payments: ${userId}`);
      
      const query = { user: userId };
      if (status) {
        query.status = status;
      }
      
      const payments = await this.PaymentModel.find(query)
        .populate('booking', 'service date time')
        .populate('professional', 'businessName profession')
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .lean();
      
      const total = await this.PaymentModel.countDocuments(query);
      
      // Formatear para móvil
      const mobilePayments = payments.map(payment => ({
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        statusDetail: payment.statusDetail,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        createdAt: payment.createdAt,
        formattedDate: new Date(payment.createdAt).toLocaleDateString('es-AR'),
        formattedAmount: this.formatCurrency(payment.amount, payment.currency),
        booking: {
          service: payment.booking?.service,
          date: payment.booking?.date,
          time: payment.booking?.time
        },
        professional: {
          businessName: payment.professional?.businessName,
          profession: payment.professional?.profession
        },
        statusColor: this.getPaymentStatusColor(payment.status)
      }));
      
      res.status(200).json({
        success: true,
        data: mobilePayments,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: parseInt(skip) + parseInt(limit) < total
        },
        filters: { status }
      });
      
    } catch (error) {
      console.error('❌ Get user payments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user payments'
      });
    }
  }

  /**
   * Crear preferencia de pago en Mercado Pago
   */
  async createMercadoPagoPreference({ booking, professional, amount, description, userId }) {
    try {
      // Simular creación de preferencia (integrar con SDK real)
      const preference = {
        id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_${Date.now()}`,
        qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
        date_of_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items: [{
          title: description,
          description: `${booking.service} con ${professional.businessName}`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS'
        }],
        payer: {
          name: 'Usuario MiProfesional',
          email: 'user@miprofesional.com',
          identification: {
            type: 'DNI',
            number: '12345678'
          }
        },
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: null
        },
        back_urls: {
          success: `${process.env.API_BASE_URL}/api/payments/success`,
          failure: `${process.env.API_BASE_URL}/api/payments/failure`,
          pending: `${process.env.API_BASE_URL}/api/payments/pending`
        },
        auto_return: 'approved',
        notification_url: `${process.env.API_BASE_URL}/api/payments/webhook`,
        external_reference: booking._id
      };
      
      console.log(`💳 Mercado Pago preference created: ${preference.id}`);
      
      return preference;
      
    } catch (error) {
      console.error('❌ Create Mercado Pago preference error:', error);
      throw error;
    }
  }

  /**
   * Obtener estado del pago en Mercado Pago
   */
  async getMercadoPagoStatus(preferenceId) {
    try {
      // Simular consulta de estado (integrar con SDK real)
      const mockStatuses = ['approved', 'pending', 'rejected', 'cancelled'];
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
      
      const status = {
        id: preferenceId,
        status: randomStatus,
        status_detail: randomStatus === 'approved' ? 'accredited' : randomStatus,
        date_created: new Date().toISOString(),
        date_last_updated: new Date().toISOString(),
        money_release_date: randomStatus === 'approved' ? new Date().toISOString() : null,
        transaction_amount: 1000,
        currency_id: 'ARS',
        payment_type_id: 'credit_card',
        payment_method_id: 'master',
        installments: 1,
        issuer_id: '123',
        operation_type: 'regular_payment'
      };
      
      console.log(`💳 Mercado Pago status: ${status.status} for ${preferenceId}`);
      
      return status;
      
    } catch (error) {
      console.error('❌ Get Mercado Pago status error:', error);
      throw error;
    }
  }

  /**
   * Guardar información del pago
   */
  async savePayment(paymentData) {
    const Payment = require('../models/Payment');
    
    const payment = new Payment(paymentData);
    await payment.save();
    
    return payment;
  }

  /**
   * Enviar notificación de pago
   */
  async sendPaymentNotification(payment, status) {
    try {
      const NotificationModel = require('../models/Notification');
      
      let title, message, type;
      
      switch (status) {
        case 'approved':
          title = 'Pago Aprobado';
          message = 'Tu pago ha sido procesado exitosamente';
          type = 'payment_success';
          break;
        case 'rejected':
          title = 'Pago Rechazado';
          message = 'Tu pago ha sido rechazado. Por favor intenta con otro método';
          type = 'payment_failed';
          break;
        case 'cancelled':
          title = 'Pago Cancelado';
          message = 'Has cancelado el pago';
          type = 'payment_cancelled';
          break;
        default:
          title = 'Actualización de Pago';
          message = `El estado de tu pago es: ${status}`;
          type = 'payment_update';
      }
      
      const notification = new NotificationModel({
        user: payment.user,
        title,
        message,
        type,
        data: {
          paymentId: payment._id,
          bookingId: payment.bookingId,
          status
        },
        status: 'sent',
        sentAt: new Date()
      });
      
      await notification.save();
      
      console.log(`💳 Payment notification sent: ${title}`);
      
    } catch (error) {
      console.error('❌ Send payment notification error:', error);
    }
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount, currency = 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Obtener color de estado de pago
   */
  getPaymentStatusColor(status) {
    const colors = {
      approved: '#10b981',
      pending: '#f59e0b',
      rejected: '#ef4444',
      cancelled: '#6b7280',
      refunded: '#3b82f6'
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtener estadísticas de pagos
   */
  async getPaymentStats(req, res) {
    try {
      console.log(`💳 Getting payment stats`);
      
      const [
        totalPayments,
        approvedPayments,
        pendingPayments,
        rejectedPayments,
        totalAmount,
        todayPayments,
        todayAmount
      ] = await Promise.all([
        this.PaymentModel.countDocuments(),
        this.PaymentModel.countDocuments({ status: 'approved' }),
        this.PaymentModel.countDocuments({ status: 'pending' }),
        this.PaymentModel.countDocuments({ status: 'rejected' }),
        this.PaymentModel.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        this.PaymentModel.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }),
        this.PaymentModel.aggregate([
          {
            $match: {
              status: 'approved',
              createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);
      
      const stats = {
        total: totalPayments,
        approved: approvedPayments,
        pending: pendingPayments,
        rejected: rejectedPayments,
        totalAmount: totalAmount[0]?.total || 0,
        today: {
          count: todayPayments,
          amount: todayAmount[0]?.total || 0
        },
        approvalRate: totalPayments > 0 ? ((approvedPayments / totalPayments) * 100).toFixed(1) : '0',
        averageAmount: approvedPayments > 0 ? ((totalAmount[0]?.total || 0) / approvedPayments).toFixed(2) : '0'
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment stats'
      });
    }
  }
}

module.exports = new PaymentController();
