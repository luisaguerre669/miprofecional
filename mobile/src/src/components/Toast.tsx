import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onHide,
}) => {
  const animatedValue = React.useRef(new Animated.Value(-100)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Show toast
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();

    // Hide toast after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          icon: 'check-circle',
        };
      case 'error':
        return {
          backgroundColor: '#ef4444',
          icon: 'error',
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          icon: 'warning',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#3b82f6',
          icon: 'info',
        };
    }
  };

  const toastStyle = getToastStyle();

  const containerStyle = {
    transform: [{ translateY: animatedValue }],
    opacity: opacityValue,
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor }]}>
        <MaterialIcons
          name={toastStyle.icon as any}
          size={20}
          color="#ffffff"
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default Toast;
