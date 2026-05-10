import { Router } from 'express';
import {
  getProvinceAnalytics,
  getProvinceDetails,
  updateProvinceStats,
  getUserDistribution,
  getSubscriptionAnalytics,
  trackUserLocation,
  getGrowthTrends,
  getTopPerformingProvinces,
  getDashboardAnalytics
} from '../controllers/analyticsController';

const router = Router();

// GET /api/analytics/provinces - Get analytics for all provinces
router.get('/provinces', getProvinceAnalytics);

// GET /api/analytics/provinces/:province - Get detailed analytics for specific province
router.get('/provinces/:province', getProvinceDetails);

// PUT /api/analytics/provinces/:province/stats - Update province statistics
router.put('/provinces/:province/stats', updateProvinceStats);

// GET /api/analytics/users/distribution - Get user distribution by province
router.get('/users/distribution', getUserDistribution);

// GET /api/analytics/subscriptions - Get subscription analytics
router.get('/subscriptions', getSubscriptionAnalytics);

// POST /api/analytics/users/track - Track user location registration
router.post('/users/track', trackUserLocation);

// GET /api/analytics/growth/trends - Get growth trends by province
router.get('/growth/trends', getGrowthTrends);

// GET /api/analytics/top-performing - Get top performing provinces
router.get('/top-performing', getTopPerformingProvinces);

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

export default router;
