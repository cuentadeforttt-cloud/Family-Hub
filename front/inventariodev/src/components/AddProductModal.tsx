import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { productsRepository } from '../services/repositories/products';
import { parseDateFromDDMMYYYY, isValidDDMMYYYY } from '../utils/dateUtils';
import { useTranslations } from '../utils/i18n';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onProductAdded,
}) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    initialStock: '',
    expiryDate: undefined as string | undefined,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert(t.common.error, 'El nombre del producto es obligatorio');
      return;
    }

    // Categoría es opcional, usar null si está vacía para que se traduzca en la UI
    const category = formData.category.trim() || null;

    const initialStock = parseInt(formData.initialStock) || 0;
    if (initialStock < 0) {
      Alert.alert(t.common.error, 'El stock inicial no puede ser negativo');
      return;
    }

    // La fecha ya viene en formato ISO del DatePicker
    const parsedExpiryDate = formData.expiryDate;

    try {
      setLoading(true);

      // Crear el producto con stock inicial
      await productsRepository.create({
        name: formData.name.trim(),
        category: category,
        description: formData.description.trim() || undefined,
        currentStock: initialStock,
        expiryDate: parsedExpiryDate,
      });

      onProductAdded();
      onClose();

      // Reset form
      setFormData({
        name: '',
        category: '',
        description: '',
        initialStock: '',
        expiryDate: undefined,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert(t.common.error, 'No se pudo agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t.addProduct.title}>
      <View style={styles.form}>
        <Input
          label={`${t.addProduct.name} *`}
          value={formData.name}
          onChangeText={value => handleInputChange('name', value)}
          placeholder={t.addProduct.namePlaceholder}
        />

        <Input
          label={`${t.addProduct.description} (${t.addProduct.optional})`}
          value={formData.description}
          onChangeText={value => handleInputChange('description', value)}
          placeholder={t.addProduct.descriptionPlaceholder}
          multiline
          numberOfLines={2}
        />

        <Input
          label={`${t.addProduct.category} (${t.addProduct.optional})`}
          value={formData.category}
          onChangeText={value => handleInputChange('category', value)}
          placeholder={t.addProduct.categoryPlaceholder}
        />

        <Input
          label={`${t.addProduct.initialStock} (${t.inventory.units})`}
          value={formData.initialStock}
          onChangeText={value => handleInputChange('initialStock', value)}
          keyboardType="number-pad"
          placeholder="10"
        />

        <DatePicker
          label={`${t.addProduct.expiryDate} (${t.addProduct.optional})`}
          value={formData.expiryDate}
          onChange={value =>
            setFormData(prev => ({ ...prev, expiryDate: value }))
          }
          placeholder={t.addProduct.selectDate}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={t.common.cancel}
            onPress={onClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={loading ? t.addProduct.adding : t.addProduct.add}
            onPress={handleSubmit}
            variant="primary"
            style={styles.button}
            disabled={loading}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  button: {
    flex: 1,
    minWidth: 0,
  },
});
