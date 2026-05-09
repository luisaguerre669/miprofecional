// Notification Controller - Sistema de notificaciones push
// Controlador para gestionar notificaciones push a dispositivos móviles

const User = require('../models/User');
const Professional = require('../models/Professional');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

class NotificationController {
  /**
   * Enviar notificación push a usuario
   */
  async sendPushNotification(req, res) {
    try {
      const { 
        userId, 
        title, 
        message, 
        type = 'general',
        data = {},
        tokens = []
      } = req.body;
      
      console.log(`🔔 Sending push notification to user ${userId}: ${title}`);
      
      // Validar datos
      if (!userId || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'User ID, title, and message are required'
        });
      }
      
      // Obtener tokens del usuario
      const user = await User.findById(userId).select('pushTokens');
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const userTokens = user.pushTokens || [];
      const targetTokens = tokens.length > 0 ? tokens : userTokens;
      
      if (targetTokens.length === 0) {
        console.log(`🔔 No push tokens available for user ${userId}`);
        return res.status(200).json({
          success: true,
          message: 'No push tokens available',
          deliveredCount: 0
        });
      }
      
      // Simular envío de notificaciones push
      const results = await this.simulatePushSend(targetTokens, {
        title,
        message,
        type,
        data,
        userId
      });
      
      // Guardar notificación en base de datos
      const notification = new this.NotificationModel({
        user: userId,
        title,
        message,
        type,
        data,
        tokens: targetTokens,
        results,
        status: results.successCount > 0 ? 'sent' : 'failed',
        sentAt: new Date()
      });
      
      await notification.save();
      
      res.status(200).json({
        success: true,
        data: {
          notificationId: notification._id,
          deliveredCount: results.successCount,
          failedCount: results.failedCount,
          totalTokens: targetTokens.length
        },
        message: 'Push notification sent successfully'
      });
      
    } catch (error) {
      console.error('❌ Send push notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send push notification'
      });
    }
  }

  /**
   * Enviar notificación a profesional
   */
  async sendProfessionalNotification(req, res) {
    try {
      const { 
        professionalId, 
        title, 
        message, 
        type = 'booking',
        data = {},
        tokens = []
      } = req.body;
      
      console.log(`🔔 Sending push notification to professional ${professionalId}: ${title}`);
      
      if (!professionalId || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Professional ID, title, and message are required'
        });
      }
      
      const professional = await Professional.findById(professionalId).select('pushTokens');
      if (!professional) {
        return res.status(404).json({
          success: false,
          error: 'Professional not found'
        });
      }
      
      const professionalTokens = professional.pushTokens || [];
      const targetTokens = tokens.length > 0 ? tokens : professionalTokens;
      
      if (targetTokens.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No push tokens available',
          deliveredCount: 0
        });
      }
      
      const results = await this.simulatePushSend(targetTokens, {
        title,
        message,
        type,
        data,
        professionalId
      });
      
      const notification = new this.NotificationModel({
        professional: professionalId,
        title,
        message,
        type,
        data,
        tokens: targetTokens,
        results,
        status: results.successCount > 0 ? 'sent' : 'failed',
        sentAt: new Date()
      });
      
      await notification.save();
      
      res.status(200).json({
        success: true,
        data: {
          notificationId: notification._id,
          deliveredCount: results.successCount,
          failedCount: results.failedCount,
          totalTokens: targetTokens.length
        },
        message: 'Professional push notification sent successfully'
      });
      
    } catch (error) {
      console.error('❌ Send professional notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send professional notification'
      });
    }
  }

  /**
   * Obtener notificaciones de usuario
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.usuario.id;
      const { limit = 20, skip = 0, unread = false } = req.query;
      
      console.log(`🔔 Getting notifications for user ${userId}`);
      
      const query = { user: userId };
      if (unread === 'true') {
        query.readAt = { $exists: false };
      }
      
      const notifications = await this.NotificationModel.find(query)
        .sort({ sentAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .lean();
      
      const total = await this.NotificationModel.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + parseInt(limit) < total
        },
        filters: { unread }
      });
      
    } catch (error) {
      console.error('❌ Get user notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications'
      });
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.usuario.id;
      
      console.log(`🔔 Marking notification ${notificationId} as read for user ${userId}`);
      
      const notification = await this.NotificationModel.findOne({
        _id: notificationId,
        user: userId
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
      
      notification.readAt = new Date();
      await notification.save();
      
      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
      
    } catch (error) {
      console.error('❌ Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  }

  /**
   * Obtener notificaciones de profesional
   */
  async getProfessionalNotifications(req, res) {
    try {
      const professionalId = req.usuario.id;
      const { limit = 20, skip = 0, unread = false } = req.query;
      
      console.log(`🔔 Getting notifications for professional ${professionalId}`);
      
      const query = { professional: professionalId };
      if (unread === 'true') {
        query.readAt = { $exists: false };
      }
      
      const notifications = await this.NotificationModel.find(query)
        .sort({ sentAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .lean();
      
      const total = await this.NotificationModel.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + parseInt(limit) < total
        },
        filters: { unread }
      });
      
    } catch (error) {
      console.error('❌ Get professional notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get professional notifications'
      });
    }
  }

  /**
   * Enviar notificación masiva
   */
  async sendBulkNotification(req, res) {
    try {
      const { 
        userIds = [], 
        professionalIds = [],
        title, 
        message, 
        type = 'announcement',
        data = {}
      } = req.body;
      
      console.log(`🔔 Sending bulk notification: ${title}`);
      
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Title and message are required'
        });
      }
      
      const allIds = [...(userIds || []), ...(professionalIds || [])];
      if (allIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one user or professional ID is required'
        });
      }
      
      // Obtener tokens de todos los usuarios
      const users = await User.find({ _id: { $in: userIds } }).select('pushTokens');
      const professionals = await Professional.find({ _id: { $in: professionalIds } }).select('pushTokens');
      
      const allTokens = [
        ...users.flatMap(u => u.pushTokens || []),
        ...professionals.flatMap(p => p.pushTokens || [])
      ];
      
      if (allTokens.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No push tokens available',
          deliveredCount: 0
        });
      }
      
      const results = await this.simulatePushSend(allTokens, {
        title,
        message,
        type,
        data
      });
      
      // Guardar notificación masiva
      const notifications = allIds.map(id => ({
        user: userIds.includes(id) ? id : null,
        professional: professionalIds.includes(id) ? id : null,
        title,
        message,
        type,
        data,
        status: results.successCount > 0 ? 'sent' : 'failed',
        sentAt: new Date()
      }));
      
      await this.NotificationModel.insertMany(notifications);
      
      res.status(200).json({
        success: true,
        data: {
          deliveredCount: results.successCount,
          failedCount: results.failedCount,
          totalTokens: allTokens.length,
          totalRecipients: allIds.length
        },
        message: 'Bulk notification sent successfully'
      });
      
    } catch (error) {
      console.error('❌ Send bulk notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk notification'
      });
    }
  }

  /**
   * Simular envío de notificaciones push
   */
  async simulatePushSend(tokens, payload) {
    const results = {
      successCount: 0,
      failedCount: 0,
      results: []
    };
    
    for (const token of tokens) {
      try {
        // Simular envío a Firebase Cloud Messaging
        console.log(`🔔 Simulating push to token: ${token.substring(0, 20)}...`);
        
        // Simular éxito/fracaso (90% éxito)
        const success = Math.random() > 0.1;
        
        if (success) {
          results.successCount++;
          results.results.push({
            token: token,
            status: 'success',
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          results.failedCount++;
          results.results.push({
            token: token,
            status: 'failed',
            error: 'Device not reachable'
          });
        }
        
        // Pequeña demora para simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        results.failedCount++;
        results.results.push({
          token: token,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log(`🔔 Push simulation completed: ${results.successCount}/${tokens.length} successful`);
    
    return results;
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(req, res) {
    try {
      console.log(`🔔 Getting notification stats`);
      
      const [
        totalNotifications,
        sentNotifications,
        readNotifications,
        unreadNotifications,
        todayNotifications
      ] = await Promise.all([
        this.NotificationModel.countDocuments(),
        this.NotificationModel.countDocuments({ status: 'sent' }),
        this.NotificationModel.countDocuments({ readAt: { $exists: true } }),
        this.NotificationModel.countDocuments({ readAt: { $exists: false } }),
        this.NotificationModel.countDocuments({
          sentAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        })
      ]);
      
      const stats = {
        total: totalNotifications,
        sent: sentNotifications,
        read: readNotifications,
        unread: unreadNotifications,
        today: todayNotifications,
        readRate: sentNotifications > 0 ? ((readNotifications / sentNotifications) * 100).toFixed(1) : '0',
        deliveryRate: sentNotifications > 0 ? ((sentNotifications / totalNotifications) * 100).toFixed(1) : '0'
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Get notification stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification stats'
      });
    }
  }

  /**
   * Configurar preferencias de notificación
   */
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.usuario.id;
      const { 
        pushEnabled = true,
        emailEnabled = true,
        smsEnabled = false,
        categories = {
          bookings: true,
          messages: true,
          promotions: false,
          system: true
        }
      } = req.body;
      
      console.log(`🔔 Updating notification preferences for user ${userId}`);
      
      const user = await User.findByIdAndUpdate(
        userId,
        {
          notificationPreferences: {
            pushEnabled,
            emailEnabled,
            smsEnabled,
            categories
          }
        },
        { new: true }
      );
      
      res.status(200).json({
        success: true,
        data: {
          pushEnabled,
          emailEnabled,
          smsEnabled,
          categories
        },
        message: 'Notification preferences updated successfully'
      });
      
    } catch (error) {
      console.error('❌ Update notification preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences'
      });
    }
  }
}

module.exports = new NotificationController();
