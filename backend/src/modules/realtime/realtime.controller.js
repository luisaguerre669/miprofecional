// Real-time Controller - Modular Architecture Preparation
// Handles HTTP requests/responses only - Business logic in service layer

const realtimeService = require('./realtime.service');
const { validationResult } = require('express-validator');

const realtimeController = {
  // Validation middleware
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        errors: errors.array()
      });
    }
    next();
  },

  // GET /api/realtime/stats - Get real-time statistics
  getRealtimeStats: async (req, res) => {
    try {
      const stats = realtimeService.getRealtimeStats();
      
      res.json({
        success: true,
        message: 'Real-time statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve real-time statistics',
        message: error.message
      });
    }
  },

  // GET /api/realtime/clients/:clientId - Get client information
  getClientInfo: async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const clientInfo = realtimeService.getClientInfo(clientId);
      
      if (!clientInfo) {
        return res.status(404).json({
          success: false,
          error: 'Client not found',
          message: 'The specified client is not connected'
        });
      }
      
      res.json({
        success: true,
        message: 'Client information retrieved successfully',
        data: clientInfo
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve client information',
        message: error.message
      });
    }
  },

  // GET /api/realtime/professionals/:professionalId - Get professional connection info
  getProfessionalConnection: async (req, res) => {
    try {
      const { professionalId } = req.params;
      
      const connectionInfo = realtimeService.getProfessionalConnection(professionalId);
      
      if (!connectionInfo) {
        return res.status(404).json({
          success: false,
          error: 'Professional not online',
          message: 'The specified professional is not currently online'
        });
      }
      
      res.json({
        success: true,
        message: 'Professional connection information retrieved successfully',
        data: connectionInfo
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to retrieve professional connection',
        message: error.message
      });
    }
  },

  // POST /api/realtime/broadcast - Broadcast message to all connected clients
  broadcastMessage: async (req, res) => {
    try {
      const { event, data } = req.body;
      
      if (!event || !data) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Both event and data are required'
        });
      }

      // This would be implemented with the IO instance
      // For now, we'll just acknowledge the request
      res.json({
        success: true,
        message: 'Broadcast message acknowledged',
        data: {
          event,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.errorType || 'Failed to broadcast message',
        message: error.message
      });
    }
  }
};

module.exports = realtimeController;
