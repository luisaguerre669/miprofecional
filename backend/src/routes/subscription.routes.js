const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const Professional = require('../models/Professional');
const Payment = require('../models/Payment');
const mpConfig = require('../config/mercadopago.config');

// Configuración Mercado Pago v2
const { MercadoPagoConfig, Preference, Payment: MPPayment } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: mpConfig.accessToken
});

const preferenceClient = new Preference(client);
const paymentClient = new MPPayment(client);

// Validar configuración al iniciar
mpConfig.validateConfig();

// Crear preferencia de pago para suscripción
router.post('/create-preference', requireAuth, async (req, res) => {
  try {
    const { planType } = req.body; // 'monthly' o 'six_months'
    const professional = await Professional.findOne({ userId: req.userId });

    if (!professional) {
      return res.status(404).json({ message: 'Perfil profesional no encontrado' });
    }

    const plans = {
      monthly: { title: 'Suscripción Mensual MiProfesional', price: 5000, duration: 1 },
      six_months: { title: 'Suscripción Semestral MiProfesional (Descuento)', price: 25000, duration: 6 }
    };

    const plan = plans[planType];
    if (!plan) {
      return res.status(400).json({ message: 'Plan no válido' });
    }

    const preference = {
      items: [
        {
          title: plan.title,
          unit_price: plan.price,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      back_urls: mpConfig.backUrls,
      auto_return: 'approved',
      notification_url: mpConfig.notificationUrl,
      external_reference: JSON.stringify({
        professionalId: professional._id,
        planType,
        userId: req.userId
      })
    };

    const response = await preferenceClient.create({ body: preference });
    
    // Guardar registro de pago pendiente
    await Payment.create({
      user: req.userId,
      professional: professional._id,
      booking: new mongoose.Types.ObjectId(), // Placeholder
      amount: plan.price,
      description: plan.title,
      preferenceId: response.id,
      status: 'pending',
      metadata: { planType }
    });

    res.json({ 
      init_point: response.init_point, 
      preferenceId: response.id 
    });
  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    res.status(500).json({ message: 'Error al procesar el pago', error: error.message });
  }
});

// Webhook para notificaciones de Mercado Pago
router.post('/webhook', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  try {
    if (topic === 'payment') {
      const paymentId = query.id || query['data.id'];
      const paymentInfo = await paymentClient.get({ id: paymentId });
      const { status, external_reference } = paymentInfo;

      if (status === 'approved') {
        const ref = JSON.parse(external_reference);
        const { professionalId, planType } = ref;

        const professional = await Professional.findById(professionalId);
        if (professional) {
          const months = planType === 'six_months' ? 6 : 1;
          const currentEndDate = (professional.subscriptionEndDate && professional.subscriptionEndDate > new Date()) 
            ? professional.subscriptionEndDate 
            : new Date();
          
          const newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + months);
          
          professional.subscriptionEndDate = newEndDate;
          professional.subscriptionStatus = 'active';
          professional.planType = planType;
          professional.isActive = true;
          professional.visibilityStatus = 'public';
          await professional.save();

          // Actualizar el registro de pago
          const paymentRecord = await Payment.findOne({ preferenceId: paymentInfo.preference_id });
          if (paymentRecord) {
            paymentRecord.status = 'approved';
            paymentRecord.mercadoPagoId = paymentId;
            paymentRecord.approvedAt = new Date();
            await paymentRecord.save();
          }
          
          console.log(`✅ Suscripción activada para profesional: ${professionalId}`);
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook MP:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
