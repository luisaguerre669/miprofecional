import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';

interface ProvinceStatsCardProps {
  province: string;
  provinceCode: string;
  totalClients: number;
  totalProfessionals: number;
  totalSubscriptions: number;
  clientGrowthRate: number;
  professionalGrowthRate: number;
  onPress?: () => void;
  compact?: boolean;
}

const ProvinceStatsCard: React.FC<ProvinceStatsCardProps> = ({
  province,
  provinceCode,
  totalClients,
  totalProfessionals,
  totalSubscriptions,
  clientGrowthRate,
  professionalGrowthRate,
  onPress,
  compact = false,
}) => {
  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return 'trending-up';
    if (rate < 0) return 'trending-down';
    return 'trending-flat';
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return '#10b981'; // green
    if (rate < 0) return '#ef4444'; // red
    return '#64748b'; // gray
  };

  const getProvinceColor = (provinceCode: string) => {
    const colors: { [key: string]: string } = {
      'CABA': '#3b82f6', // blue
      'BA': '#10b981', // green
      'CB': '#f59e0b', // amber
      'SF': '#ef4444', // red
      'MZ': '#8b5cf6', // purple
      'TM': '#ec4899', // pink
    };
    return colors[provinceCode] || '#64748b';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { borderLeftColor: getProvinceColor(provinceCode) }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactProvinceName}>{province}</Text>
          <Text style={styles.compactProvinceCode}>{provinceCode}</Text>
        </View>
        
        <View style={styles.compactStats}>
          <View style={styles.compactStatItem}>
            <MaterialIcons name="people" size={16} color="#64748b" />
            <Text style={styles.compactStatText}>{formatNumber(totalSubscriptions)}</Text>
          </View>
          
          <View style={styles.compactGrowth}>
            <MaterialIcons 
              name={getGrowthIcon(clientGrowthRate)} 
              size={14} 
              color={getGrowthColor(clientGrowthRate)} 
            />
            <Text style={[styles.compactGrowthText, { color: getGrowthColor(clientGrowthRate) }]}>
              {clientGrowthRate > 0 ? '+' : ''}{clientGrowthRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
        style={styles.card}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.header, { backgroundColor: getProvinceColor(provinceCode) }]}>
          <View style={styles.provinceInfo}>
            <Text style={styles.provinceName}>{province}</Text>
            <Text style={styles.provinceCode}>{provinceCode}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ffffff" />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="people" size={20} color="#3b82f6" />
              </View>
              <View style={styles.statDetails}>
                <Text style={styles.statNumber}>{formatNumber(totalClients)}</Text>
                <Text style={styles.statLabel}>Clientes</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="business-center" size={20} color="#10b981" />
              </View>
              <View style={styles.statDetails}>
                <Text style={styles.statNumber}>{formatNumber(totalProfessionals)}</Text>
                <Text style={styles.statLabel}>Profesionales</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="subscriptions" size={20} color="#f59e0b" />
              </View>
              <View style={styles.statDetails}>
                <Text style={styles.statNumber}>{formatNumber(totalSubscriptions)}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>

          <View style={styles.growthRow}>
            <View style={styles.growthItem}>
              <MaterialIcons 
                name={getGrowthIcon(clientGrowthRate)} 
                size={16} 
                color={getGrowthColor(clientGrowthRate)} 
              />
              <Text style={styles.growthLabel}>Clientes</Text>
              <Text style={[styles.growthValue, { color: getGrowthColor(clientGrowthRate) }]}>
                {clientGrowthRate > 0 ? '+' : ''}{clientGrowthRate.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.growthItem}>
              <MaterialIcons 
                name={getGrowthIcon(professionalGrowthRate)} 
                size={16} 
                color={getGrowthColor(professionalGrowthRate)} 
              />
              <Text style={styles.growthLabel}>Profesionales</Text>
              <Text style={[styles.growthValue, { color: getGrowthColor(professionalGrowthRate) }]}>
                {professionalGrowthRate > 0 ? '+' : ''}{professionalGrowthRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  provinceInfo: {
    flex: 1,
  },
  provinceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  provinceCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statsContainer: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statDetails: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  growthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  growthItem: {
    alignItems: 'center',
    gap: 4,
  },
  growthLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  growthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactProvinceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  compactProvinceCode: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  compactGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactGrowthText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProvinceStatsCard;
