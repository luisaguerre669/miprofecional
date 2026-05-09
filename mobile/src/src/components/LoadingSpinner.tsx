import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#3b82f6',
  text,
  overlay = false,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          spinnerSize: 20,
          iconSize: 16,
          fontSize: 12,
        };
      case 'medium':
        return {
          spinnerSize: 30,
          iconSize: 24,
          fontSize: 14,
        };
      case 'large':
        return {
          spinnerSize: 40,
          iconSize: 32,
          fontSize: 16,
        };
      default:
        return {
          spinnerSize: 30,
          iconSize: 24,
          fontSize: 14,
        };
    }
  };

  const sizes = getSize();

  const spin = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const containerStyle = overlay
    ? StyleSheet.compose(styles.overlayContainer, styles.container)
    : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.spinnerContainer}>
        <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
          <MaterialIcons name="refresh" size={sizes.iconSize} color={color} />
        </Animated.View>
        <ActivityIndicator
          size={sizes.spinnerSize}
          color={color}
          style={styles.activityIndicator}
        />
      </View>
      {text && (
        <Text style={[styles.text, { color, fontSize: sizes.fontSize }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  spinnerContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
  },
  activityIndicator: {
    opacity: 0.3,
  },
  text: {
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
