import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { PurchaseModal } from '../components/PurchaseModal';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { Product, TemplateItem } from '../types';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { theme } from '../constants/theme';
import { useTranslations } from '../utils/i18n';

interface ShoppingItem {
  product: Product;
  template: TemplateItem;
  needed: number;
  urgency: 'high' | 'medium' | 'low' | 'none';
}

const ShoppingScreenSimplified: React.FC = () => {
  const t = useTranslations();
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseModal, setPurchaseModal] = useState<{
    visible: boolean;
    item: ShoppingItem | null;
  }>({ visible: false, item: null });

  useFocusEffect(
    React.useCallback(() => {
      loadShoppingList();
    }, []),
  );

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const [products, templates] = await Promise.all([
        productsRepository.getAll(),
        templateRepository.getAll(),
      ]);

      // Generar lista de compra
      const items: ShoppingItem[] = products
        .map(product => {
          const template = templates.find(t => t.productId === product.id);
          if (!template) return null;

          const needed = template.idealQuantity - product.currentStock;
          if (needed <= 0) return null;

          return {
            product,
            template,
            needed,
          };
        })
        .filter(Boolean) as ShoppingItem[];

      // Calcular urgencia y ordenar por urgencia (de más urgente a menos)
      items.forEach(item => {
        item.urgency = calculateUrgency(
          item.product,
          item.template.idealQuantity,
        );
      });

      items.sort((a, b) => {
        const urgencyOrder = { high: 4, medium: 3, low: 2, none: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

      setShoppingItems(items);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (quantity: number) => {
    if (!purchaseModal.item) return;

    try {
      const { product } = purchaseModal.item;
      const newStock = product.currentStock + quantity;

      await productsRepository.update(product.id, {
        currentStock: newStock,
      });

      // Recargar la lista para actualizar los datos
      await loadShoppingList();
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert(
        t.common.error,
        'No se pudo actualizar el stock del producto',
      );
    }
  };

  const handleItemPress = (item: ShoppingItem) => {
    setPurchaseModal({ visible: true, item });
  };

  const calculateUrgency = (
    product: Product,
    idealQuantity: number,
  ): 'high' | 'medium' | 'low' | 'none' => {
    const stockRatio = product.currentStock / idealQuantity;

    if (stockRatio <= 0.25) return 'high'; // ≤ 25% del ideal (rojo)
    if (stockRatio <= 0.5) return 'medium'; // 26-50% del ideal (amarillo)
    if (stockRatio <= 0.75) return 'low'; // 51-75% del ideal (azul)
    return 'none'; // >75% del ideal (gris)
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '#dc2626'; // Rojo
      case 'medium':
        return '#f59e0b'; // Amarillo
      case 'low':
        return '#3b82f6'; // Azul
      case 'none':
        return '#6b7280'; // Gris
      default:
        return '#6b7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return t.shopping.urgency.high;
      case 'medium':
        return t.shopping.urgency.medium;
      case 'low':
        return t.shopping.urgency.low;
      case 'none':
        return t.shopping.urgency.none;
      default:
        return t.shopping.urgency.none;
    }
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => {
    const { product, template, needed } = item;

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.itemCard} variant="elevated">
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleContainer}>
              <Text style={styles.itemName}>{product.name}</Text>
              <Text style={styles.itemCategory}>
                📂{' '}
                {product.category && product.category !== 'Sin categoría'
                  ? product.category
                  : t.templates.noCategory}
              </Text>
            </View>
            <Badge
              text={getUrgencyText(item.urgency)}
              variant={
                item.urgency === 'high'
                  ? 'danger'
                  : item.urgency === 'medium'
                  ? 'warning'
                  : item.urgency === 'low'
                  ? 'info'
                  : 'secondary'
              }
              icon={
                item.urgency === 'high'
                  ? '🚨'
                  : item.urgency === 'medium'
                  ? '⚠️'
                  : item.urgency === 'low'
                  ? 'ℹ️'
                  : '✅'
              }
            />
          </View>

          <View style={styles.itemDetails}>
            {product.description && (
              <Text style={styles.itemDescription}>{product.description}</Text>
            )}
          </View>

          <View style={styles.stockInfo}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t.shopping.currentStock}</Text>
              <Text style={styles.stockValue}>{product.currentStock}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t.shopping.idealStock}</Text>
              <Text style={styles.stockValue}>{template.idealQuantity}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t.shopping.needed}</Text>
              <Text style={[styles.stockValue, styles.neededValue]}>
                {needed}
              </Text>
            </View>
          </View>

          {product.expiryDate && (
            <View style={styles.itemFooter}>
              <Text style={styles.itemExpiry}>
                🗓️ {t.shopping.expires}:{' '}
                {formatDateToDDMMYYYY(product.expiryDate)}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard} variant="filled">
      <Text style={styles.emptyIcon}>🎉</Text>
      <Text style={styles.emptyTitle}>{t.shopping.noItems}</Text>
      <Text style={styles.emptyDescription}>
        {t.shopping.inventoryUpToDate}
      </Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🛒 {t.shopping.title}</Text>
          <Text style={styles.subtitle}>Tu lista inteligente de compras</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 {t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 {t.shopping.title}</Text>
        <Text style={styles.subtitle}>{t.shopping.subtitle}</Text>
      </View>

      <FlatList
        data={shoppingItems}
        renderItem={renderShoppingItem}
        keyExtractor={item => item.product.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <PurchaseModal
        visible={purchaseModal.visible}
        onClose={() => setPurchaseModal({ visible: false, item: null })}
        onPurchase={handlePurchase}
        productName={purchaseModal.item?.product.name || ''}
        needed={purchaseModal.item?.needed || 0}
        currentStock={purchaseModal.item?.product.currentStock || 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  itemCard: {
    marginBottom: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  itemCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  itemDetails: {
    marginBottom: theme.spacing.md,
  },
  itemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight:
      theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  stockValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  neededValue: {
    color: theme.colors.error,
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  itemExpiry: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing['2xl'],
    marginTop: theme.spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight:
      theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
});

export default ShoppingScreenSimplified;
