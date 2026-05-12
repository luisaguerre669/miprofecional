const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, PreApproval } = require('mercadopago');
const Subscription = require('../models/Subscription');

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

const preApproval = new PreApproval(client);

// Planes disponibles
const PLANS = {
  basic: { name: 'Básico', price: 9990 },
  premium: { name: 'Premium', price: 19990 },
  enterprise: { name: 'Empresarial', price: 49990 }
};

// Obtener planes
router.get('/plans', (req, res) => {
  res.json({ success: true, data: PLANS });
});

// Crear suscripción
router.post('/create', async (req, res) => {
  try {
    const { planId, payerEmail, professionalId } = req.body;
    const plan = PLANS[planId];
    
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan no válido' });
    }

    const preApprovalData = {
      reason: `MiProfesional - Plan ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price,
        currency_id: 'ARS'
      },
      payer_email: payerEmail,
      back_url: `${process.env.FRONTEND_URL}/subscription/success`,
      status: 'pending'
    };

    const mpSubscription = await preApproval.create({ body: preApprovalData });

    const subscription = new Subscription({
      professionalId,
      plan: planId,
      status: 'pending',
      mercadoPagoSubscriptionId: mpSubscription.id,
      features: { maxServices: 10, featuredListings: 2, prioritySupport: false, analytics: true }
    });

    await subscription.save();

    res.json({
      success: true,
      data: {
        checkoutUrl: mpSubscription.init_point,
        subscription
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al crear suscripción' });
  }
});

// Webhook
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'subscription_authorized_payment') {
      const payment = await preApproval.get({ id: data.id });
      
      const subscription = await Subscription.findOne({
        mercadoPagoSubscriptionId: payment.id
      });

      if (subscription) {
        subscription.status = 'active';
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await subscription.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
