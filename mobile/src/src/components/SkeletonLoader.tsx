import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';

interface SkeletonLoaderProps {
  variant?: 'text' | 'avatar' | 'card' | 'list' | 'button';
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  borderRadius,
  style,
  children,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const getSkeletonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: '#e2e8f0',
      overflow: 'hidden',
    };

    switch (variant) {
      case 'text':
        return {
          ...baseStyle,
          width: width || 200,
          height: height || 16,
          borderRadius: borderRadius || 4,
        };
      case 'avatar':
        return {
          ...baseStyle,
          width: width || 40,
          height: height || 40,
          borderRadius: borderRadius || 20,
        };
      case 'card':
        return {
          ...baseStyle,
          width: width || 350,
          height: height || 120,
          borderRadius: borderRadius || 12,
        };
      case 'list':
        return {
          ...baseStyle,
          width: width || 350,
          height: height || 60,
          borderRadius: borderRadius || 8,
        };
      case 'button':
        return {
          ...baseStyle,
          width: width || 120,
          height: height || 40,
          borderRadius: borderRadius || 20,
        };
      default:
        return {
          ...baseStyle,
          width: width || 350,
          height: height || 20,
          borderRadius: borderRadius || 4,
        };
    }
  };

  const shimmerStyle = {
    transform: [
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-200, 200],
        }),
      },
    ],
  };

  if (children) {
    return (
      <View style={[styles.container, style]}>
        <View style={[getSkeletonStyle(), styles.skeleton]}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={[getSkeletonStyle(), style]}>
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
};

// Componentes específicos para diferentes casos de uso
export const TextSkeleton: React.FC<{ width?: number; lines?: number }> = ({
  width,
  lines = 1,
}) => {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonLoader
          key={index}
          variant="text"
          width={index === lines - 1 ? 120 : width}
          style={index > 0 ? { marginTop: 4 } : undefined}
        />
      ))}
    </View>
  );
};

export const AvatarSkeleton: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return <SkeletonLoader variant="avatar" width={size} height={size} />;
};

export const CardSkeleton: React.FC<{ width?: number; height?: number }> = ({
  width,
  height,
}) => {
  return (
    <View style={styles.cardContainer}>
      <SkeletonLoader variant="card" width={width} height={height} />
    </View>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.listItem}>
          <AvatarSkeleton size={40} />
          <View style={styles.listContent}>
            <TextSkeleton width={120} />
            <TextSkeleton width={200} lines={2} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const ButtonSkeleton: React.FC<{ width?: number }> = ({ width }) => {
  return <SkeletonLoader variant="button" width={width} />;
};

export const CategoryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.categoryCard}>
      <SkeletonLoader variant="card" height={80} />
      <TextSkeleton width={160} style={styles.categoryText} />
    </View>
  );
};

export const ProfessionalCardSkeleton: React.FC = () => {
  return (
    <View style={styles.professionalCard}>
      <View style={styles.professionalHeader}>
        <AvatarSkeleton size={50} />
        <View style={styles.professionalInfo}>
          <TextSkeleton width="50%" />
          <TextSkeleton width="70%" />
        </View>
      </View>
      <View style={styles.professionalContent}>
        <TextSkeleton lines={2} />
      </View>
      <View style={styles.professionalFooter}>
        <SkeletonLoader variant="button" width={80} height={30} />
        <SkeletonLoader variant="button" width={80} height={30} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  skeleton: {
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    transform: [{ translateX: -200 }],
  },
  textContainer: {
    gap: 4,
  },
  cardContainer: {
    margin: 8,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
  },
  categoryCard: {
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    marginTop: 8,
  },
  professionalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalContent: {
    marginBottom: 12,
  },
  professionalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SkeletonLoader;
