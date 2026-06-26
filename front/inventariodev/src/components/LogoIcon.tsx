import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface LogoIconProps {
  size?: number;
  style?: ViewStyle;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ size = 40, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={styles.box}>
        <View style={styles.checkmark}>
          <View style={styles.checkmarkLeft} />
          <View style={styles.checkmarkRight} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  box: {
    width: '80%',
    height: '70%',
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmark: {
    width: '60%',
    height: '50%',
    position: 'relative',
  },
  checkmarkLeft: {
    position: 'absolute',
    width: 3,
    height: '60%',
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
    left: '15%',
    top: '10%',
  },
  checkmarkRight: {
    position: 'absolute',
    width: 3,
    height: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    transform: [{ rotate: '-45deg' }],
    right: '15%',
    top: '0%',
  },
});
