import React from 'react';
import {
  View,
  Animated,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { MaterialIcons } from 'react-native-vector-icons';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: string;
    color: string;
    backgroundColor: string;
  };
  rightAction?: {
    icon: string;
    color: string;
    backgroundColor: string;
  };
  threshold?: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: 'delete',
    color: '#ffffff',
    backgroundColor: '#ef4444',
  },
  rightAction = {
    icon: 'favorite',
    color: '#ffffff',
    backgroundColor: '#10b981',
  },
  threshold = 80,
}) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const lastOffset = React.useRef(0);

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { nativeEvent } = event;
    const { translationX, state } = nativeEvent;

    if (state === State.END) {
      const totalTranslation = translationX + lastOffset.current;

      if (totalTranslation > threshold && onSwipeRight) {
        // Swipe right action
        Animated.spring(translateX, {
          toValue: 300,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start(() => {
          onSwipeRight();
          resetPosition();
        });
      } else if (totalTranslation < -threshold && onSwipeLeft) {
        // Swipe left action
        Animated.spring(translateX, {
          toValue: -300,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start(() => {
          onSwipeLeft();
          resetPosition();
        });
      } else {
        // Snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start();
        lastOffset.current = 0;
      }
    }
  };

  const resetPosition = () => {
    translateX.setValue(0);
    lastOffset.current = 0;
  };

  const leftActionOpacity = translateX.interpolate({
    inputRange: [-100, -threshold, 0],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [0, threshold, 100],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  const leftActionScale = translateX.interpolate({
    inputRange: [-100, -threshold, 0],
    outputRange: [1, 1.1, 0.8],
    extrapolate: 'clamp',
  });

  const rightActionScale = translateX.interpolate({
    inputRange: [0, threshold, 100],
    outputRange: [0.8, 1.1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Left Action Background */}
      {onSwipeLeft && (
        <Animated.View
          style={[
            styles.actionBackground,
            styles.leftAction,
            {
              backgroundColor: leftAction.backgroundColor,
              opacity: leftActionOpacity,
              transform: [{ scale: leftActionScale }],
            },
          ]}
        >
          <MaterialIcons
            name={leftAction.icon as any}
            size={24}
            color={leftAction.color}
          />
        </Animated.View>
      )}

      {/* Right Action Background */}
      {onSwipeRight && (
        <Animated.View
          style={[
            styles.actionBackground,
            styles.rightAction,
            {
              backgroundColor: rightAction.backgroundColor,
              opacity: rightActionOpacity,
              transform: [{ scale: rightActionScale }],
            },
          ]}
        >
          <MaterialIcons
            name={rightAction.icon as any}
            size={24}
            color={rightAction.color}
          />
        </Animated.View>
      )}

      {/* Draggable Card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = {
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#ffffff',
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
};

export default SwipeableCard;
