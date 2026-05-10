import mongoose, { Schema, Document } from 'mongoose';

// Interface for Province Analytics
export interface IProvinceAnalytics extends Document {
  province: string;
  provinceCode: string;
  totalClients: number;
  totalProfessionals: number;
  totalSubscriptions: number;
  activeUsers: number;
  newClientsThisMonth: number;
  newProfessionalsThisMonth: number;
  newSubscriptionsThisMonth: number;
  clientGrowthRate: number;
  professionalGrowthRate: number;
  subscriptionGrowthRate: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  topCities: Array<{
    city: string;
    clients: number;
    professionals: number;
    total: number;
  }>;
  monthlyStats: Array<{
    month: string;
    year: number;
    clients: number;
    professionals: number;
    subscriptions: number;
    revenue: number;
  }>;
  lastUpdated: Date;
}

// Interface for User Location Tracking
export interface IUserLocation extends Document {
  userId: string;
  userType: 'client' | 'professional';
  province: string;
  city: string;
  neighborhood?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  isActive: boolean;
  lastSeen: Date;
  registrationDate: Date;
}

// Interface for Subscription Analytics
export interface ISubscriptionAnalytics extends Document {
  province: string;
  subscriptionType: 'free' | 'basic' | 'premium' | 'professional';
  count: number;
  revenue: number;
  growthRate: number;
  churnRate: number;
  averageLifetime: number;
  monthlyRecurring: number;
  lastUpdated: Date;
}

// Province Analytics Schema
const ProvinceAnalyticsSchema = new Schema<IProvinceAnalytics>({
  province: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  provinceCode: {
    type: String,
    required: true,
    uppercase: true
  },
  totalClients: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfessionals: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSubscriptions: {
    type: Number,
    default: 0,
    min: 0
  },
  activeUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  newClientsThisMonth: {
    type: Number,
    default: 0,
    min: 0
  },
  newProfessionalsThisMonth: {
    type: Number,
    default: 0,
    min: 0
  },
  newSubscriptionsThisMonth: {
    type: Number,
    default: 0,
    min: 0
  },
  clientGrowthRate: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  professionalGrowthRate: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  subscriptionGrowthRate: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  topCategories: [{
    category: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  topCities: [{
    city: {
      type: String,
      required: true
    },
    clients: {
      type: Number,
      required: true,
      min: 0
    },
    professionals: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  monthlyStats: [{
    month: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    clients: {
      type: Number,
      required: true,
      min: 0
    },
    professionals: {
      type: Number,
      required: true,
      min: 0
    },
    subscriptions: {
      type: Number,
      required: true,
      min: 0
    },
    revenue: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'province_analytics'
});

// User Location Schema
const UserLocationSchema = new Schema<IUserLocation>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['client', 'professional'],
    index: true
  },
  province: {
    type: String,
    required: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    index: true
  },
  neighborhood: {
    type: String,
    index: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  address: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  registrationDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'user_locations'
});

// Subscription Analytics Schema
const SubscriptionAnalyticsSchema = new Schema<ISubscriptionAnalytics>({
  province: {
    type: String,
    required: true,
    index: true
  },
  subscriptionType: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'premium', 'professional'],
    index: true
  },
  count: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  revenue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  growthRate: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  churnRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageLifetime: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyRecurring: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'subscription_analytics'
});

// Compound indexes for better query performance
ProvinceAnalyticsSchema.index({ province: 1, lastUpdated: -1 });
ProvinceAnalyticsSchema.index({ totalClients: -1 });
ProvinceAnalyticsSchema.index({ totalProfessionals: -1 });
ProvinceAnalyticsSchema.index({ totalSubscriptions: -1 });

UserLocationSchema.index({ province: 1, city: 1, userType: 1 });
UserLocationSchema.index({ province: 1, userType: 1, isActive: 1 });
UserLocationSchema.index({ registrationDate: -1 });
UserLocationSchema.index({ lastSeen: -1 });

SubscriptionAnalyticsSchema.index({ province: 1, subscriptionType: 1 });
SubscriptionAnalyticsSchema.index({ province: 1, revenue: -1 });
SubscriptionAnalyticsSchema.index({ subscriptionType: 1, count: -1 });

// Static methods for Province Analytics
ProvinceAnalyticsSchema.statics.getTopProvinces = function(limit = 10) {
  return this.find({})
    .sort({ totalSubscriptions: -1 })
    .limit(limit)
    .select('province provinceCode totalClients totalProfessionals totalSubscriptions clientGrowthRate professionalGrowthRate');
};

ProvinceAnalyticsSchema.statics.getProvinceStats = function(province: string) {
  return this.findOne({ province })
    .populate('topCategories')
    .populate('topCities');
};

ProvinceAnalyticsSchema.statics.updateProvinceStats = function(province: string, updateData: any) {
  return this.findOneAndUpdate(
    { province },
    { 
      $set: updateData,
      $inc: { 
        newClientsThisMonth: updateData.newClients || 0,
        newProfessionalsThisMonth: updateData.newProfessionals || 0,
        newSubscriptionsThisMonth: updateData.newSubscriptions || 0
      },
      $push: {
        monthlyStats: {
          $each: updateData.monthlyStats || [],
          $slice: -24 // Keep only last 24 months
        }
      }
    },
    { upsert: true, new: true }
  );
};

// Static methods for User Location
UserLocationSchema.statics.getUsersByProvince = function(province: string, userType?: string) {
  const query: any = { province, isActive: true };
  if (userType) {
    query.userType = userType;
  }
  return this.find(query).sort({ registrationDate: -1 });
};

UserLocationSchema.statics.getProvinceUserCount = function(province: string) {
  return this.aggregate([
    { $match: { province, isActive: true } },
    { $group: { _id: '$userType', count: { $sum: 1 } } }
  ]);
};

UserLocationSchema.statics.updateUserLocation = function(userId: string, locationData: any) {
  return this.findOneAndUpdate(
    { userId },
    { 
      $set: { 
        ...locationData,
        lastSeen: new Date()
      }
    },
    { upsert: true, new: true }
  );
};

// Static methods for Subscription Analytics
SubscriptionAnalyticsSchema.statics.getSubscriptionStats = function(province?: string) {
  const query = province ? { province } : {};
  return this.find(query).sort({ revenue: -1 });
};

SubscriptionAnalyticsSchema.statics.getRevenueByProvince = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$province',
        totalRevenue: { $sum: '$revenue' },
        totalSubscriptions: { $sum: '$count' },
        averageRevenue: { $avg: '$revenue' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
};

// Export models
export const ProvinceAnalytics = mongoose.model<IProvinceAnalytics>('ProvinceAnalytics', ProvinceAnalyticsSchema);
export const UserLocation = mongoose.model<IUserLocation>('UserLocation', UserLocationSchema);
export const SubscriptionAnalytics = mongoose.model<ISubscriptionAnalytics>('SubscriptionAnalytics', SubscriptionAnalyticsSchema);

export default {
  ProvinceAnalytics,
  UserLocation,
  SubscriptionAnalytics
};
