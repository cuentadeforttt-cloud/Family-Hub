import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AppIconProps {
  size?: number;
  style?: any;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 40, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={styles.iconBackground}>
        <View style={styles.box}>
          <View style={styles.checkmark}>
            <View style={styles.checkmarkLeft} />
            <View style={styles.checkmarkRight} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0369a1', // Blue gradient base
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  box: {
    width: 20,
    height: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmark: {
    width: 8,
    height: 6,
    position: 'relative',
  },
  checkmarkLeft: {
    position: 'absolute',
    width: 2,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
    left: 2,
    top: 1,
  },
  checkmarkRight: {
    position: 'absolute',
    width: 2,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
    right: 2,
    top: 0,
  },
});
