import { Request, Response } from 'express';
import { Config } from '../models/Config';
import { Professional } from '../models';
import { Subscription } from '../models/Subscription';
import { User } from '../models';

// Obtener todas las configuraciones (solo admin)
export const getAllConfigs = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let configs;
    if (category) {
      configs = await Config.getCategoryConfigs(category as string);
    } else {
      configs = await Config.find({}).sort({ category: 1, section: 1, key: 1 });
    }

    res.json({
      success: true,
      data: configs,
      message: 'Configurations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener configuraciones públicas (para frontend)
export const getPublicConfigs = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    const configs = await Config.getPublicConfigs(category as string);

    res.json({
      success: true,
      data: configs,
      message: 'Public configurations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting public configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Actualizar configuración
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { section, key } = req.params;
    const { value } = req.body;

    // Obtener la configuración existente para validar
    const existingConfig = await Config.findOne({ section, key });
    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Validar que sea editable
    if (!existingConfig.isEditable) {
      return res.status(403).json({
        success: false,
        message: 'This configuration cannot be edited'
      });
    }

    // Validar el valor
    const validation = existingConfig.validateValue(value);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Actualizar configuración
    const updatedConfig = await Config.findOneAndUpdate(
      { section, key },
      { 
        value, 
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Crear nueva configuración
export const createConfig = async (req: Request, res: Response) => {
  try {
    const {
      section,
      key,
      value,
      type,
      description,
      category,
      isPublic = false,
      isEditable = true,
      validation
    } = req.body;

    // Verificar que no exista
    const existing = await Config.findOne({ section, key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Configuration with this section and key already exists'
      });
    }

    // Crear nueva configuración
    const newConfig = new Config({
      section,
      key,
      value,
      type,
      description,
      category,
      isPublic,
      isEditable,
      validation
    });

    await newConfig.save();

    res.status(201).json({
      success: true,
      data: newConfig,
      message: 'Configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Eliminar configuración
export const deleteConfig = async (req: Request, res: Response) => {
  try {
    const { section, key } = req.params;

    const deletedConfig = await Config.findOneAndDelete({ section, key });
    if (!deletedConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.json({
      success: true,
      data: deletedConfig,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener valor específico de configuración
export const getConfigValue = async (req: Request, res: Response) => {
  try {
    const { section, key } = req.params;
    const { defaultValue } = req.query;

    const config = await Config.findOne({ section, key });
    const value = config ? config.value : defaultValue;

    res.json({
      success: true,
      data: { value },
      message: 'Configuration value retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting config value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configuration value',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Dashboard completo de administración
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    // Estadísticas de usuarios
    const totalUsers = await User.countDocuments({ userType: 'client' });
    const totalProfessionals = await Professional.countDocuments();
    const activeProfessionals = await Professional.countDocuments({ isVisible: true });
    const suspendedProfessionals = await Professional.countDocuments({ isVisible: false });

    // Estadísticas de suscripciones
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const trialSubscriptions = await Subscription.countDocuments({ 
      planType: 'trial', 
      status: 'active' 
    });
    const paidSubscriptions = await Subscription.countDocuments({ 
      planType: 'professional', 
      status: 'active' 
    });
    const suspendedSubscriptions = await Subscription.countDocuments({ status: 'suspended' });

    // Ingresos del mes
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

    // Configuraciones importantes
    const paymentConfigs = await Config.getCategoryConfigs('payment');
    const subscriptionConfigs = await Config.getCategoryConfigs('subscription');

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          professionals: {
            total: totalProfessionals,
            active: activeProfessionals,
            suspended: suspendedProfessionals,
            activePercentage: totalProfessionals > 0 ? (activeProfessionals / totalProfessionals * 100).toFixed(1) : 0
          }
        },
        subscriptions: {
          total: activeSubscriptions,
          trial: trialSubscriptions,
          paid: paidSubscriptions,
          suspended: suspendedSubscriptions,
          revenue: monthlyRevenue[0] || { totalRevenue: 0, totalPayments: 0 }
        },
        configs: {
          payment: paymentConfigs,
          subscription: subscriptionConfigs
        },
        lastUpdated: new Date()
      },
      message: 'Admin dashboard retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Configuraciones de pago (Mercado Pago)
export const getPaymentConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await Config.getCategoryConfigs('payment');
    
    res.json({
      success: true,
      data: configs,
      message: 'Payment configurations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Actualizar configuraciones de pago
export const updatePaymentConfigs = async (req: Request, res: Response) => {
  try {
    const { configs } = req.body;
    
    const updatedConfigs = [];
    
    for (const config of configs) {
      const { section, key, value } = config;
      
      const updated = await Config.findOneAndUpdate(
        { section, key, category: 'payment' },
        { value, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      
      updatedConfigs.push(updated);
    }

    res.json({
      success: true,
      data: updatedConfigs,
      message: 'Payment configurations updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Configuraciones de suscripción
export const getSubscriptionConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await Config.getCategoryConfigs('subscription');
    
    res.json({
      success: true,
      data: configs,
      message: 'Subscription configurations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting subscription configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Actualizar configuraciones de suscripción
export const updateSubscriptionConfigs = async (req: Request, res: Response) => {
  try {
    const { configs } = req.body;
    
    const updatedConfigs = [];
    
    for (const config of configs) {
      const { section, key, value } = config;
      
      const updated = await Config.findOneAndUpdate(
        { section, key, category: 'subscription' },
        { value, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      
      updatedConfigs.push(updated);
    }

    res.json({
      success: true,
      data: updatedConfigs,
      message: 'Subscription configurations updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  getAllConfigs,
  getPublicConfigs,
  updateConfig,
  createConfig,
  deleteConfig,
  getConfigValue,
  getAdminDashboard,
  getPaymentConfigs,
  updatePaymentConfigs,
  getSubscriptionConfigs,
  updateSubscriptionConfigs
};
