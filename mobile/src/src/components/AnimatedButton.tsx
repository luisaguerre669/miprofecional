import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const animatedValue = React.useRef(new Animated.Value(1)).current;
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
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
    if (disabled || loading) return;
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      // @ts-ignore
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
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

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#94a3b8' : '#3b82f6',
          borderColor: '#3b82f6',
          textColor: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? '#e2e8f0' : '#f1f5f9',
          borderColor: '#e2e8f0',
          textColor: disabled ? '#94a3b8' : '#475569',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? '#e2e8f0' : '#3b82f6',
          textColor: disabled ? '#94a3b8' : '#3b82f6',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: disabled ? '#94a3b8' : '#3b82f6',
        };
      default:
        return {
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          textColor: '#ffffff',
        };
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 16,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 18,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18,
          iconSize: 20,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 18,
        };
    }
  };

  const colors = getButtonColors();
  const sizes = getButtonSize();

  const buttonStyle: ViewStyle = Object.assign(
    {},
    styles.button,
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      borderWidth: variant === 'outline' ? 1 : 0,
      paddingVertical: sizes.paddingVertical,
      paddingHorizontal: sizes.paddingHorizontal,
      opacity: animatedValue,
      transform: [{ scale: scaleValue }],
    },
    fullWidth && styles.fullWidth,
    style
  );

  const buttonTextStyle: TextStyle = Object.assign(
    {},
    styles.text,
    {
      color: colors.textColor,
      fontSize: sizes.fontSize,
      opacity: loading ? 0.7 : opacityValue,
    },
    textStyle
  );

  const renderIcon = () => {
    if (!icon && !loading) return null;

    if (loading) {
      return (
        <Animated.View style={[styles.icon, { opacity: opacityValue }]}>
          <MaterialIcons name="refresh" size={sizes.iconSize} color={colors.textColor} />
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[styles.icon, { opacity: opacityValue }]}>
        <MaterialIcons name={icon} size={sizes.iconSize} color={colors.textColor} />
      </Animated.View>
    );
  };

  const content = (
    <>
      {iconPosition === 'left' && renderIcon()}
      <Text style={buttonTextStyle}>{title}</Text>
      {iconPosition === 'right' && renderIcon()}
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginHorizontal: 4,
  },
});

export default AnimatedButton;
