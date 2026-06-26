import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useTranslations } from '../utils/i18n';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: (quantity: number) => void;
  productName: string;
  needed: number;
  currentStock: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  visible,
  onClose,
  onPurchase,
  productName,
  needed,
  currentStock,
}) => {
  const t = useTranslations();
  const [quantity, setQuantity] = useState('');

  const handlePurchase = () => {
    const purchaseQuantity = parseInt(quantity) || 0;

    if (purchaseQuantity <= 0) {
      Alert.alert(t.common.error, 'La cantidad debe ser mayor a 0');
      return;
    }

    onPurchase(purchaseQuantity);
    onClose();
  };

  const handleClose = () => {
    setQuantity('');
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} title={t.purchase.title}>
      <View style={styles.container}>
        <Text style={styles.productName}>{productName}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.shopping.currentStock}:</Text>
            <Text style={styles.infoValue}>
              {currentStock} {t.inventory.units}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t.shopping.needed}:</Text>
            <Text style={styles.infoValue}>
              {needed} {t.inventory.units}
            </Text>
          </View>
        </View>

        <Input
          label={t.purchase.quantity}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder={t.purchase.quantityPlaceholder}
        />

        <Text style={styles.helpText}>{t.purchase.description}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title={t.common.cancel}
            onPress={handleClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={t.purchase.markPurchased}
            onPress={handlePurchase}
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
