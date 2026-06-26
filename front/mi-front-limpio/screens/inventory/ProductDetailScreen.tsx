import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useHousehold } from '../../context/HouseholdContext';
import { AppScreen, AppButton, AppText, AppCard, AppInput } from '../../components/ui';
import { useInventoryServices } from '../../hooks/useInventoryServices';
import { formatDateToDDMMYYYY, getExpiryStatus, getDaysUntilExpiry } from '../../utils/dateUtils';
import type { Product, InventoryItem, InventoryTemplate } from '../../types/inventory';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';

type ProductDetailStackParamList = {
  ProductDetail: { productId: string };
};

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<ProductDetailStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<ProductDetailStackParamList, 'ProductDetail'>;

interface ProductDetailScreenProps {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

export function ProductDetailScreen({ navigation, route }: ProductDetailScreenProps) {
  const { currentHousehold } = useHousehold();
  const services = useInventoryServices();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [template, setTemplate] = useState<InventoryTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    unit: 'unidad',
    expiryDate: null as string | null,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!services) return;
    try {
      setLoading(true);
      const [productData, items, tmpl] = await Promise.all([
        services.productsService.getById(productId),
        services.inventoryItemsService.getByProductId(productId),
        services.templatesService.getByProductId(productId),
      ]);
      if (productData) {
        setProduct(productData);
        setFormData({
          name: productData.name,
          category: productData.category || '',
          description: productData.description || '',
          unit: productData.unit || 'unidad',
          expiryDate: productData.expiryDate,
        });
      }
      setInventoryItems(items);
      setTemplate(tmpl);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [productId, services]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!product || !services) return;

    try {
      setSaving(true);
      await services.productsService.update(product.id, {
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        unit: formData.unit,
        expiryDate: formData.expiryDate,
      });
      setEditing(false);
      loadData();
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category || '',
        description: product.description || '',
        unit: product.unit || 'unidad',
        expiryDate: product.expiryDate,
      });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (!product || !services) return;

    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await services.productsService.delete(product.id);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const handleAddStock = async () => {
    if (!product || !services) return;
    const newStock = product.currentStock + 1;
    try {
      await services.productsService.updateStock(product.id, newStock);
      await services.inventoryBusinessLogic.recordStockMovement(
        product.id,
        'add',
        1,
        'Incremento desde detalle'
      );
      loadData();
    } catch (error) {
      console.error('Error adding stock:', error);
      Alert.alert('Error', 'No se pudo agregar stock');
    }
  };

  const handleRemoveStock = async () => {
    if (!product || !services || product.currentStock <= 0) return;
    const newStock = Math.max(0, product.currentStock - 1);
    try {
      await services.productsService.updateStock(product.id, newStock);
      await services.inventoryBusinessLogic.recordStockMovement(
        product.id,
        'remove',
        1,
        'Decremento desde detalle'
      );
      loadData();
    } catch (error) {
      console.error('Error removing stock:', error);
      Alert.alert('Error', 'No se pudo quitar stock');
    }
  };

  const handleSetTemplate = async () => {
    if (!product || !services) return;
    Alert.prompt(
      'Stock ideal',
      'Define la cantidad ideal para generar la lista de compras automáticamente',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (value: string) => {
            const idealQuantity = parseInt(value, 10);
            if (isNaN(idealQuantity) || idealQuantity < 0) {
              Alert.alert('Error', 'Cantidad inválida');
              return;
            }
            try {
              await services.templatesService.upsert({
                productId: product.id,
                idealQuantity,
                priority: 'medium',
              });
              loadData();
            } catch (error) {
              console.error('Error setting template:', error);
              Alert.alert('Error', 'No se pudo guardar la plantilla');
            }
          },
        },
      ],
      'plain-text',
      template?.idealQuantity.toString() || ''
    );
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 Cargando...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!product) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <AppText variant="title3" weight="700">Producto no encontrado</AppText>
        </View>
      </AppScreen>
    );
  }

  const expiryStatus = getExpiryStatus(product.expiryDate);
  const stockStatus = template && services
    ? services.inventoryBusinessLogic.getStockStatus(product.currentStock, template.idealQuantity)
    : { status: 'normal' as const, color: colors.success.base, label: 'OK' };

  const hasExpiry = !!product.expiryDate;
  const isExpired = hasExpiry && getDaysUntilExpiry(product.expiryDate!) < 0;
  const isExpiringSoon = hasExpiry && getDaysUntilExpiry(product.expiryDate!) <= alertDays && getDaysUntilExpiry(product.expiryDate!) >= 0;

  return (
    <AppScreen scroll style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="title2" weight="800" numberOfLines={2}>
            {product.name}
          </AppText>
          {product.category && (
            <AppText variant="bodySmall" tone="tertiary" weight="600" style={styles.categoryBadge}>
              {product.category}
            </AppText>
          )}
        </View>
        <View style={styles.headerActions}>
          {editing ? (
            <>
              <AppButton
                title="Cancelar"
                onPress={handleCancel}
                variant="ghost"
                size="sm"
              />
              <AppButton
                title={saving ? 'Guardando...' : 'Guardar'}
                onPress={handleSave}
                variant="primary"
                size="sm"
                loading={saving}
              />
            </>
          ) : (
            <AppButton
              title="Editar"
              onPress={() => setEditing(true)}
              variant="primary"
              size="sm"
            />
          )}
        </View>
      </View>

      <AppCard variant="default" padding="default" style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="title3" weight="700">Stock</AppText>
          {template && (
            <AppText variant="micro" tone="tertiary" weight="600" style={styles.templateLabel}>
              Ideal: {template.idealQuantity} {product.unit}
            </AppText>
          )}
        </View>

        <View style={styles.stockDisplay}>
          <View style={styles.stockNumberContainer}>
            <AppText
              variant="hero"
              weight="800"
              style={{
                color: stockStatus.status === 'low' ? colors.danger.base :
                       stockStatus.status === 'high' ? colors.warning.base :
                       colors.text.primary,
              }}
            >
              {product.currentStock}
            </AppText>
            <AppText variant="bodySmall" tone="tertiary" style={styles.stockUnit}>
              {product.unit}
            </AppText>
          </View>

          <View style={styles.stockStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: stockStatus.color },
              ]}
            />
            <AppText variant="bodySmall" tone="secondary" weight="600" style={{ color: stockStatus.color }}>
              {stockStatus.label}
            </AppText>
          </View>
        </View>

        <View style={styles.stockControls}>
          <AppButton
            title="−"
            onPress={handleRemoveStock}
            disabled={product.currentStock <= 0}
            variant="ghost"
            size="lg"
            style={styles.stockButton}
          />
          <AppButton
            title="+"
            onPress={handleAddStock}
            variant="primary"
            size="lg"
            style={styles.stockButton}
          />
        </View>
      </AppCard>

      {hasExpiry && (
        <AppCard
          variant={isExpired ? 'danger' : isExpiringSoon ? 'warning' : 'default'}
          padding="default"
          style={styles.expiryCard}
        >
          <View style={styles.expiryContent}>
            <View style={styles.expiryLeft}>
              <Text style={styles.expiryIcon}>
                {isExpired ? '💀' : isExpiringSoon ? '⏰' : '📅'}
              </Text>
              <View>
                <AppText variant="title3" weight="700">
                  {isExpired ? 'Caducado' : isExpiringSoon ? 'Próximo a vencer' : 'Fecha de caducidad'}
                </AppText>
                <AppText variant="body" tone="secondary">
                  {formatDateToDDMMYYYY(product.expiryDate!)}
                </AppText>
              </View>
            </View>
            <View style={styles.expiryBadge}>
              <AppText
                variant="micro"
                weight="700"
                style={{
                  color: isExpired ? colors.danger.text :
                         isExpiringSoon ? colors.warning.text :
                         colors.success.text,
                }}
              >
                {expiryStatus.text}
              </AppText>
            </View>
          </View>
        </AppCard>
      )}

      {editing && (
        <AppCard variant="default" padding="default" style={styles.section}>
          <AppText variant="title3" weight="700" style={styles.sectionHeader}>Editar información</AppText>

          <AppInput
            label="Nombre *"
            placeholder="Nombre del producto"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            autoCapitalize="words"
          />

          <AppInput
            label="Categoría"
            placeholder="Ej: Lácteos, Verduras..."
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
          />

          <AppInput
            label="Descripción"
            placeholder="Detalles adicionales"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
          />

          <AppInput
            label="Unidad"
            placeholder="unidad"
            value={formData.unit}
            onChangeText={(text) => setFormData({ ...formData, unit: text })}
          />

          <View style={styles.datePickerRow}>
            <AppText variant="body" weight="600" style={styles.datePickerLabel}>
              Fecha de caducidad
            </AppText>
            <Pressable
              style={styles.datePickerButton}
              onPress={() => Keyboard.dismiss()}
            >
              <AppText
                variant="body"
                tone={formData.expiryDate ? 'primary' : 'tertiary'}
                weight={formData.expiryDate ? '600' : '400'}
              >
                {formData.expiryDate
                  ? formatDateToDDMMYYYY(formData.expiryDate)
                  : 'Seleccionar fecha (opcional)'}
              </AppText>
            </Pressable>
          </View>
        </AppCard>
      )}

      {!editing && (
        <>
          <AppCard variant="default" padding="default" style={styles.section}>
            <AppText variant="title3" weight="700" style={styles.sectionHeader}>Información</AppText>

            {product.description && (
              <AppText variant="body" tone="secondary" style={styles.description}>
                {product.description}
              </AppText>
            )}

            <View style={styles.infoGrid}>
              <InfoItem label="Unidad" value={product.unit || 'unidad'} />
              <InfoItem label="Creado" value={formatDateToDDMMYYYY(product.createdAt)} />
              <InfoItem label="Actualizado" value={formatDateToDDMMYYYY(product.updatedAt)} />
            </View>
          </AppCard>

          {inventoryItems.length > 0 && (
            <AppCard variant="default" padding="default" style={styles.section}>
              <AppText variant="title3" weight="700" style={styles.sectionHeader}>
                Lotes ({inventoryItems.length})
              </AppText>
              {inventoryItems.map((item, index) => (
                <View key={item.id} style={styles.lotItem}>
                  <View style={styles.lotInfo}>
                    <AppText variant="body" weight="600">
                      Lote #{index + 1}
                    </AppText>
                    <AppText variant="bodySmall" tone="tertiary">
                      {item.quantity} {product.unit} • Comprado: {formatDateToDDMMYYYY(item.purchaseDate || '')}
                    </AppText>
                  </View>
                  {item.expiryDate && (
                    <AppText
                      variant="bodySmall"
                      tone={getDaysUntilExpiry(item.expiryDate) < 0 ? 'danger' : 'secondary'}
                      weight="600"
                    >
                      Vence: {formatDateToDDMMYYYY(item.expiryDate)}
                    </AppText>
                  )}
                </View>
              ))}
            </AppCard>
          )}

          {template && (
            <AppCard variant="success" padding="default" style={styles.templateCard}>
              <View style={styles.templateContent}>
                <Text style={styles.templateIcon}>📋</Text>
                <View style={styles.templateText}>
                  <AppText variant="bodySmall" tone="success" weight="700">
                    Plantilla activa
                  </AppText>
                  <AppText variant="body" tone="secondary">
                    Stock ideal: {template.idealQuantity} {product.unit} • Prioridad: {template.priority}
                  </AppText>
                </View>
                <AppButton
                  title="Modificar"
                  onPress={handleSetTemplate}
                  variant="ghost"
                  size="sm"
                />
              </View>
            </AppCard>
          )}

          {!template && (
            <AppCard variant="quiet" padding="default" style={styles.templateCard}>
              <View style={styles.templateContent}>
                <Text style={styles.templateIcon}>📋</Text>
                <View style={styles.templateText}>
                  <AppText variant="bodySmall" tone="tertiary" weight="700">
                    Sin plantilla
                  </AppText>
                  <AppText variant="body" tone="secondary">
                    Define un stock ideal para generar la lista de compras automáticamente
                  </AppText>
                </View>
                <AppButton
                  title="Crear"
                  onPress={handleSetTemplate}
                  variant="primary"
                  size="sm"
                />
              </View>
            </AppCard>
          )}

          <AppCard variant="danger" padding="default" style={styles.dangerSection}>
            <AppButton
              title="Eliminar producto"
              onPress={handleDelete}
              variant="danger"
              size="lg"
              style={styles.deleteButton}
            />
          </AppCard>
        </>
      )}
    </AppScreen>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <AppText variant="micro" tone="tertiary" weight="600">{label}</AppText>
      <AppText variant="body" tone="secondary">{value}</AppText>
    </View>
  );
}

const alertDays = 3; // TODO: Get from settings

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  categoryBadge: {
    backgroundColor: colors.terracotta[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
    marginTop: spacing[1],
    alignSelf: 'flex-start',
  },
  section: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  templateLabel: {
    fontSize: 12,
  },
  stockDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  stockNumberContainer: {
    alignItems: 'flex-start',
  },
  stockUnit: {
    marginTop: -4,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockControls: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  stockButton: {
    flex: 1,
    minHeight: 52,
  },
  expiryCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  expiryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  expiryIcon: {
    fontSize: 28,
  },
  expiryBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  datePickerLabel: {
    marginBottom: 0,
  },
  datePickerButton: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.soft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'flex-end',
  },
  description: {
    marginBottom: spacing[3],
    lineHeight: typography.body.lineHeight,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  infoItem: {
    flex: 1,
    minWidth: '30%',
  },
  lotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  lotInfo: {
    flex: 1,
  },
  templateCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  templateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  templateIcon: {
    fontSize: 24,
  },
  templateText: {
    flex: 1,
  },
  dangerSection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  deleteButton: {
    width: '100%',
  },
});