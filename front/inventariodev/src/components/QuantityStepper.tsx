import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface QuantityStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 999,
  step = 1,
  unit = '',
  disabled = false,
}) => {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onValueChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onValueChange(newValue);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={handleDecrease}
        disabled={disabled || value <= min}
      >
        <Text style={styles.buttonText}>-</Text>
      </TouchableOpacity>
      
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>
          {value}{unit && ` ${unit}`}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={handleIncrease}
        disabled={disabled || value >= max}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0369a1',
    borderRadius: 6,
  },
  disabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  valueContainer: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
