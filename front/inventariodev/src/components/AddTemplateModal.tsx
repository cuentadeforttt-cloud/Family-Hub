import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { Product } from '../types';

interface AddTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onTemplateAdded: () => void;
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
  visible,
  onClose,
  onTemplateAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formData, setFormData] = useState({
    idealQuantity: '1',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    try {
      const productsList = await productsRepository.getAll();
      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedProductId) {
      Alert.alert('Error', 'Debes seleccionar un producto');
      return;
    }

    if (!formData.idealQuantity || parseInt(formData.idealQuantity) <= 0) {
      Alert.alert('Error', 'La cantidad ideal debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);

      // Verificar si ya existe en la plantilla
      const existing = await templateRepository.getByProductId(
        selectedProductId,
      );
      if (existing) {
        Alert.alert('Error', 'Este producto ya está en la plantilla');
        return;
      }

      // Agregar a la plantilla
      await templateRepository.create({
        productId: selectedProductId,
        idealQuantity: parseInt(formData.idealQuantity),
        priority: formData.priority,
      });

      Alert.alert('Éxito', 'Producto agregado a la plantilla');
      onTemplateAdded();
      onClose();

      // Reset form
      setSelectedProductId('');
      setFormData({
        idealQuantity: '1',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error adding to template:', error);
      Alert.alert('Error', 'No se pudo agregar el producto a la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <Modal visible={visible} onClose={onClose} title="Agregar a Plantilla">
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seleccionar Producto</Text>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay productos disponibles. Primero agrega productos al
              inventario.
            </Text>
          ) : (
            <View style={styles.productList}>
              {products.map(product => (
                <Button
                  key={product.id}
                  title={`${product.name} (${product.category})`}
                  onPress={() => setSelectedProductId(product.id)}
                  variant={
                    selectedProductId === product.id ? 'primary' : 'outline'
                  }
                  style={styles.productButton}
                />
              ))}
            </View>
          )}
        </View>

        {selectedProduct && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configurar Plantilla</Text>

            <View style={styles.productInfo}>
              <Text style={styles.productName}>{selectedProduct.name}</Text>
              <Text style={styles.productCategory}>
                📂 {selectedProduct.category}
              </Text>
              <Text style={styles.productUnit}>📏 {selectedProduct.unit}</Text>
            </View>

            <Input
              label="Cantidad Ideal *"
              value={formData.idealQuantity}
              onChangeText={value => handleInputChange('idealQuantity', value)}
              keyboardType="number-pad"
              placeholder="5"
            />

            <View style={styles.prioritySection}>
              <Text style={styles.priorityLabel}>Prioridad</Text>
              <View style={styles.priorityButtons}>
                <Button
                  title="Alta"
                  onPress={() => handleInputChange('priority', 'high')}
                  variant={formData.priority === 'high' ? 'primary' : 'outline'}
                  size="small"
                  style={styles.priorityButton}
                />
                <Button
                  title="Media"
                  onPress={() => handleInputChange('priority', 'medium')}
                  variant={
                    formData.priority === 'medium' ? 'primary' : 'outline'
                  }
                  size="small"
                  style={styles.priorityButton}
                />
                <Button
                  title="Baja"
                  onPress={() => handleInputChange('priority', 'low')}
                  variant={formData.priority === 'low' ? 'primary' : 'outline'}
                  size="small"
                  style={styles.priorityButton}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={onClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={loading ? 'Agregando...' : 'Agregar a Plantilla'}
            onPress={handleSubmit}
            variant="primary"
            style={styles.button}
            disabled={loading || !selectedProductId}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  productList: {
    gap: 8,
  },
  productButton: {
    marginBottom: 4,
  },
  productInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  prioritySection: {
    gap: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});
