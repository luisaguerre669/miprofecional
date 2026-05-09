// Real-time Routes - Modular Architecture Preparation
// Defines all real-time routes with proper middleware

const express = require('express');
const { param, body } = require('express-validator');
const realtimeController = require('./realtime.controller');

const router = express.Router();

// Validation rules
const clientIdValidation = [
  param('clientId').notEmpty().withMessage('Client ID is required')
];

const professionalIdValidation = [
  param('professionalId').isMongoId().withMessage('Invalid professional ID')
];

const broadcastValidation = [
  body('event').notEmpty().withMessage('Event name is required'),
  body('data').notEmpty().withMessage('Data is required')
];

// Real-time monitoring routes (all public for now, could add auth later)
router.get('/stats', realtimeController.getRealtimeStats);
router.get('/clients/:clientId', clientIdValidation, realtimeController.handleValidationErrors, realtimeController.getClientInfo);
router.get('/professionals/:professionalId', professionalIdValidation, realtimeController.handleValidationErrors, realtimeController.getProfessionalConnection);
router.post('/broadcast', broadcastValidation, realtimeController.handleValidationErrors, realtimeController.broadcastMessage);

module.exports = router;
