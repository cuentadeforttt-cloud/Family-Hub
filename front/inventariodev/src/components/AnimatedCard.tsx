import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Card } from './Card';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  borderRadius?: keyof typeof import('../constants/theme').theme.borderRadius;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  variant = 'default',
  borderRadius = 'lg',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
  }, [fadeAnim, scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Card variant={variant} borderRadius={borderRadius}>
        {children}
      </Card>
    </Animated.View>
  );
};
