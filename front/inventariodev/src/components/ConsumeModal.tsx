import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { useTranslations } from '../utils/i18n';
import {
  formatDateToDDMMYYYY,
  parseDateFromDDMMYYYY,
} from '../utils/dateUtils';

interface ConsumeModalProps {
  visible: boolean;
  onClose: () => void;
  onConsume: (quantity: number, newExpiryDate?: string | null) => void;
  productName: string;
  currentStock: number;
  currentExpiryDate?: string | null;
}

export const ConsumeModal: React.FC<ConsumeModalProps> = ({
  visible,
  onClose,
  onConsume,
  productName,
  currentStock,
  currentExpiryDate,
}) => {
  const t = useTranslations();
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  // Establecer la fecha actual como valor por defecto cuando se abre el modal
  React.useEffect(() => {
    if (visible && currentExpiryDate) {
      setExpiryDate(formatDateToDDMMYYYY(currentExpiryDate));
    } else if (visible) {
      setExpiryDate(null);
    }
  }, [visible, currentExpiryDate]);

  const handleConsume = () => {
    const consumeQuantity = parseInt(quantity) || 0;

    if (consumeQuantity <= 0) {
      Alert.alert(t.common.error, 'La cantidad debe ser mayor a 0');
      return;
    }

    if (consumeQuantity > currentStock) {
      Alert.alert(
        t.common.error,
        'No puedes consumir más unidades de las que tienes en stock',
      );
      return;
    }

    // Convertir la fecha al formato ISO si se proporciona
    const isoExpiryDate = expiryDate ? parseDateFromDDMMYYYY(expiryDate) : null;

    onConsume(consumeQuantity, isoExpiryDate);
    onClose();
  };

  const handleClose = () => {
    setQuantity('');
    setExpiryDate(null);
    onClose();
  };

  const handleDateChange = (date: string | undefined) => {
    if (date) {
      // El DatePicker devuelve una fecha ISO, la convertimos a dd/MM/yyyy para mostrar
      setExpiryDate(formatDateToDDMMYYYY(date));
    } else {
      setExpiryDate(null);
    }
  };

  const handleClearDate = () => {
    setExpiryDate(null);
  };

  return (
    <Modal visible={visible} onClose={handleClose} title={t.consume.title}>
      <View style={styles.container}>
        <Text style={styles.productName}>{productName}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.consume.currentStock}:</Text>
            <Text style={styles.infoValue}>
              {currentStock} {t.inventory.units}
            </Text>
          </View>
          {currentExpiryDate && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.inventory.expires}:</Text>
              <Text style={styles.infoValue}>
                {formatDateToDDMMYYYY(currentExpiryDate)}
              </Text>
            </View>
          )}
        </View>

        <Input
          label={t.consume.quantity}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder={t.consume.quantityPlaceholder}
        />

        <DatePicker
          label={t.consume.newExpiryDate}
          value={expiryDate ? parseDateFromDDMMYYYY(expiryDate) : undefined}
          onChange={handleDateChange}
          placeholder={t.consume.expiryDatePlaceholder}
        />

        <Text style={styles.helpText}>{t.consume.description}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title={t.common.cancel}
            onPress={handleClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={t.consume.markConsumed}
            onPress={handleConsume}
            variant="primary"
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    minWidth: 0,
  },
});
