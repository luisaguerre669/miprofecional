import { Request, Response } from 'express';
import { ProvinceAnalytics, UserLocation, SubscriptionAnalytics } from '../models/Analytics';
import { User, Professional } from '../models';

// Get comprehensive analytics for all provinces
export const getProvinceAnalytics = async (req: Request, res: Response) => {
  try {
    const { limit = 24, sortBy = 'totalSubscriptions' } = req.query;
    
    const analytics = await ProvinceAnalytics.getTopProvinces(Number(limit));
    
    res.json({
      success: true,
      data: analytics,
      message: 'Province analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching province analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch province analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get detailed analytics for a specific province
export const getProvinceDetails = async (req: Request, res: Response) => {
  try {
    const { province } = req.params;
    
    const analytics = await ProvinceAnalytics.getProvinceStats(province);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }

    // Get additional user location data
    const userCounts = await UserLocation.getProvinceUserCount(province);
    const subscriptionStats = await SubscriptionAnalytics.getSubscriptionStats(province);
    
    res.json({
      success: true,
      data: {
        analytics,
        userCounts,
        subscriptionStats
      },
      message: 'Province details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching province details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch province details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update province statistics (called when users register/subscribe)
export const updateProvinceStats = async (req: Request, res: Response) => {
  try {
    const { province, updateData } = req.body;
    
    if (!province || !updateData) {
      return res.status(400).json({
        success: false,
        message: 'Province and update data are required'
      });
    }

    const updatedAnalytics = await ProvinceAnalytics.updateProvinceStats(province, updateData);
    
    res.json({
      success: true,
      data: updatedAnalytics,
      message: 'Province statistics updated successfully'
    });
  } catch (error) {
    console.error('Error updating province stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update province statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user distribution by province
export const getUserDistribution = async (req: Request, res: Response) => {
  try {
    const { userType } = req.query; // 'client', 'professional', or undefined for both
    
    const distribution = await UserLocation.aggregate([
      { $match: { isActive: true } },
      ...(userType ? [{ $match: { userType } }] : []),
      {
        $group: {
          _id: '$province',
          totalUsers: { $sum: 1 },
          clients: {
            $sum: { $cond: [{ $eq: ['$userType', 'client'] }, 1, 0] }
          },
          professionals: {
            $sum: { $cond: [{ $eq: ['$userType', 'professional'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalUsers: -1 } }
    ]);

    res.json({
      success: true,
      data: distribution,
      message: 'User distribution retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user distribution',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get subscription analytics by province
export const getSubscriptionAnalytics = async (req: Request, res: Response) => {
  try {
    const { province } = req.query;
    
    const analytics = await SubscriptionAnalytics.getRevenueByProvince();
    
    if (province) {
      const provinceStats = await SubscriptionAnalytics.getSubscriptionStats(province as string);
      return res.json({
        success: true,
        data: provinceStats,
        message: 'Subscription analytics retrieved successfully'
      });
    }

    res.json({
      success: true,
      data: analytics,
      message: 'Subscription analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Track user location registration
export const trackUserLocation = async (req: Request, res: Response) => {
  try {
    const { userId, userType, location } = req.body;
    
    if (!userId || !userType || !location) {
      return res.status(400).json({
        success: false,
        message: 'userId, userType, and location are required'
      });
    }

    const userLocation = await UserLocation.updateUserLocation(userId, {
      userType,
      province: location.province,
      city: location.city,
      neighborhood: location.neighborhood,
      coordinates: location.coordinates,
      address: location.address
    });

    // Update province analytics
    await updateProvinceAnalytics(location.province, userType);

    res.json({
      success: true,
      data: userLocation,
      message: 'User location tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking user location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track user location',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get growth trends by province
export const getGrowthTrends = async (req: Request, res: Response) => {
  try {
    const { province, months = 12 } = req.query;
    
    const matchStage = province ? { province } : {};
    
    const trends = await ProvinceAnalytics.aggregate([
      { $match: matchStage },
      { $unwind: '$monthlyStats' },
      { $sort: { 'monthlyStats.year': -1, 'monthlyStats.month': -1 } },
      { $limit: Number(months) },
      {
        $group: {
          _id: {
            province: '$province',
            month: '$monthlyStats.month',
            year: '$monthlyStats.year'
          },
          clients: { $first: '$monthlyStats.clients' },
          professionals: { $first: '$monthlyStats.professionals' },
          subscriptions: { $first: '$monthlyStats.subscriptions' },
          revenue: { $first: '$monthlyStats.revenue' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({
      success: true,
      data: trends,
      message: 'Growth trends retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching growth trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get top performing provinces
export const getTopPerformingProvinces = async (req: Request, res: Response) => {
  try {
    const { metric = 'totalSubscriptions', limit = 10 } = req.query;
    
    const validMetrics = ['totalClients', 'totalProfessionals', 'totalSubscriptions', 'clientGrowthRate', 'professionalGrowthRate'];
    const sortMetric = validMetrics.includes(metric as string) ? metric as string : 'totalSubscriptions';
    
    const topProvinces = await ProvinceAnalytics.find({})
      .sort({ [sortMetric]: -1 })
      .limit(Number(limit))
      .select(`province provinceCode totalClients totalProfessionals totalSubscriptions clientGrowthRate professionalGrowthRate ${sortMetric}`);

    res.json({
      success: true,
      data: topProvinces,
      message: 'Top performing provinces retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching top performing provinces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performing provinces',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    // Get overall stats
    const totalStats = await ProvinceAnalytics.aggregate([
      {
        $group: {
          _id: null,
          totalClients: { $sum: '$totalClients' },
          totalProfessionals: { $sum: '$totalProfessionals' },
          totalSubscriptions: { $sum: '$totalSubscriptions' },
          activeUsers: { $sum: '$activeUsers' },
          averageClientGrowth: { $avg: '$clientGrowthRate' },
          averageProfessionalGrowth: { $avg: '$professionalGrowthRate' }
        }
      }
    ]);

    // Get top provinces
    const topProvinces = await ProvinceAnalytics.getTopProvinces(5);

    // Get recent growth
    const recentGrowth = await ProvinceAnalytics.aggregate([
      { $unwind: '$monthlyStats' },
      { $sort: { 'monthlyStats.year': -1, 'monthlyStats.month': -1 } },
      { $limit: 1 },
      {
        $group: {
          _id: null,
          recentClients: { $sum: '$monthlyStats.clients' },
          recentProfessionals: { $sum: '$monthlyStats.professionals' },
          recentSubscriptions: { $sum: '$monthlyStats.subscriptions' },
          recentRevenue: { $sum: '$monthlyStats.revenue' }
        }
      }
    ]);

    // Get revenue distribution
    const revenueDistribution = await SubscriptionAnalytics.getRevenueByProvince();

    res.json({
      success: true,
      data: {
        totalStats: totalStats[0] || {},
        topProvinces,
        recentGrowth: recentGrowth[0] || {},
        revenueDistribution
      },
      message: 'Dashboard analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to update province analytics when users register
async function updateProvinceAnalytics(province: string, userType: string) {
  try {
    const userCounts = await UserLocation.getProvinceUserCount(province);
    const clientsCount = userCounts.find(u => u._id === 'client')?.count || 0;
    const professionalsCount = userCounts.find(u => u._id === 'professional')?.count || 0;
    
    const updateData = {
      totalClients: clientsCount,
      totalProfessionals: professionalsCount,
      totalSubscriptions: clientsCount + professionalsCount,
      activeUsers: clientsCount + professionalsCount,
      newClientsThisMonth: userType === 'client' ? 1 : 0,
      newProfessionalsThisMonth: userType === 'professional' ? 1 : 0,
      newSubscriptionsThisMonth: 1,
      monthlyStats: [{
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        clients: clientsCount,
        professionals: professionalsCount,
        subscriptions: clientsCount + professionalsCount,
        revenue: 0 // Calculate based on subscription types
      }]
    };

    await ProvinceAnalytics.updateProvinceStats(province, updateData);
  } catch (error) {
    console.error('Error updating province analytics:', error);
  }
}

export default {
  getProvinceAnalytics,
  getProvinceDetails,
  updateProvinceStats,
  getUserDistribution,
  getSubscriptionAnalytics,
  trackUserLocation,
  getGrowthTrends,
  getTopPerformingProvinces,
  getDashboardAnalytics
};
