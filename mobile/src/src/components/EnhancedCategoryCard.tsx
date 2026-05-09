import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ImageBackground,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';

interface EnhancedCategoryCardProps {
  id: string;
  title: string;
  image: any;
  professionalCount: number;
  onPress: () => void;
  featured?: boolean;
  color?: string;
}

const EnhancedCategoryCard: React.FC<EnhancedCategoryCardProps> = ({
  id,
  title,
  image,
  professionalCount,
  onPress,
  featured = false,
  color = '#3b82f6',
}) => {
  const animatedValue = React.useRef(new Animated.Value(1)).current;
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.elastic(1.2),
      }),
    ]).start();
  };

  const handlePress = () => {
    onPress();
    
    // Success animation
    Animated.sequence([
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cardStyle = {
    opacity: animatedValue,
    transform: [{ scale: scaleValue }],
  };

  const badgeOpacity = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (featured) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(badgeOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [featured]);

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <ImageBackground source={image} style={styles.imageBackground} imageStyle={styles.image}>
          <View style={[styles.overlay, { backgroundColor: color }]}>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <View style={styles.footer}>
                <View style={styles.countContainer}>
                  <MaterialIcons name="people" size={14} color="#ffffff" />
                  <Text style={styles.count}>{professionalCount}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <MaterialIcons name="arrow-forward" size={16} color="#ffffff" />
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
        
        {featured && (
          <Animated.View style={[styles.featuredBadge, { opacity: badgeOpacity }]}>
            <MaterialIcons name="star" size={12} color="#fbbf24" />
            <Text style={styles.featuredText}>Destacado</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  card: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  count: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  arrowContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default EnhancedCategoryCard;
