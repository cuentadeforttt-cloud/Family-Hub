import React from 'react';
import { Image, StyleSheet, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, style }) => {
  return (
    <Image
      source={require('../../assets/stockly-logo.png')}
      style={[styles.logo, { width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
