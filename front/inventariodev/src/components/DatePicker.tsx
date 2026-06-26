import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

interface DatePickerProps {
  label: string;
  value?: string; // ISO string
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  style,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value) : new Date(),
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      onChange(selectedDate.toISOString());
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const displayValue = value ? formatDateToDDMMYYYY(value) : '';

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.inputText, !value && styles.placeholder]}>
            {displayValue || placeholder}
          </Text>
        </TouchableOpacity>
        {value && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    minHeight: 48,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9ca3af',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
