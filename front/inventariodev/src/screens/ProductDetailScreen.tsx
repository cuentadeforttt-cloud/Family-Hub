import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DatePicker } from '../components/DatePicker';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import {
  parseDateFromDDMMYYYY,
  isValidDDMMYYYY,
  formatDateToDDMMYYYY,
} from '../utils/dateUtils';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Product } from '../types';
import { useTranslations } from '../utils/i18n';

type ProductDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;
type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetail'
>;

interface Props {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

export default function ProductDetailScreen({ navigation, route }: Props) {
  const t = useTranslations();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    expiryDate: undefined as string | undefined,
  });

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const productData = await productsRepository.getById(productId);
      if (productData) {
        setProduct(productData);
        setFormData({
          name: productData.name,
          category: productData.category,
          description: productData.description || '',
          expiryDate: productData.expiryDate,
        });
      } else {
        Alert.alert(t.common.error, 'Producto no encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert(
        t.common.error,
        'No se pudo cargar la información del producto',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    // La fecha ya viene en formato ISO del DatePicker
    const parsedExpiryDate = formData.expiryDate;

    try {
      const updates: Partial<Product> = {
        name: formData.name.trim(),
        category: formData.category ? formData.category.trim() : null,
        description: formData.description.trim() || undefined,
        expiryDate: parsedExpiryDate,
      };

      await productsRepository.update(product.id, updates);
      await loadProductData();
      setEditing(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert(t.common.error, 'No se pudo actualizar el producto');
    }
  };

  const handleCancel = () => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        description: product.description || '',
        expiryDate: product.expiryDate,
      });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (!product) return;

    Alert.alert(
      t.product.delete,
      `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.product.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await productsRepository.delete(product.id);
              Alert.alert(t.common.success, 'Producto eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert(t.common.error, 'No se pudo eliminar el producto');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.common.loading}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Producto no encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{product.name}</Text>
        <View style={styles.headerActions}>
          {editing ? (
            <>
              <Button
                title={t.common.cancel}
                onPress={handleCancel}
                variant="outline"
                size="small"
                style={styles.headerButton}
              />
              <Button
                title={t.common.save}
                onPress={handleSave}
                variant="primary"
                size="small"
                style={styles.headerButton}
              />
            </>
          ) : (
            <Button
              title={t.common.edit}
              onPress={() => setEditing(true)}
              variant="primary"
              size="small"
              style={styles.headerButton}
            />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.product.name}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholder={t.product.namePlaceholder}
              />
            ) : (
              <Text style={styles.fieldValue}>{product.name}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.product.category}</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={text =>
                  setFormData({ ...formData, category: text })
                }
                placeholder="Lácteos, Panadería, Frutas..."
              />
            ) : (
              <Text style={styles.fieldValue}>{product.category}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.product.description}</Text>
            {editing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={text =>
                  setFormData({ ...formData, description: text })
                }
                placeholder={t.product.descriptionPlaceholder}
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {product.description || t.product.noDescription}
              </Text>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Stock y Caducidad</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.product.currentStock}</Text>
            <Text style={styles.stockValue}>
              {product.currentStock} {t.inventory.units}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.product.expiryDate}</Text>
            {editing ? (
              <DatePicker
                value={formData.expiryDate}
                onChange={value =>
                  setFormData({ ...formData, expiryDate: value })
                }
                placeholder={t.product.selectDateOptional}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {product.expiryDate
                  ? formatDateToDDMMYYYY(product.expiryDate)
                  : t.inventory.noExpiryDate}
              </Text>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Sistema</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Creado</Text>
            <Text style={styles.fieldValue}>
              {new Date(product.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Última actualización</Text>
            <Text style={styles.fieldValue}>
              {new Date(product.updatedAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        </Card>

        {editing && (
          <View style={styles.dangerSection}>
            <Button
              title={t.product.delete}
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  stockValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  dangerSection: {
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
});
