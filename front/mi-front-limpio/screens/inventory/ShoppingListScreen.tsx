import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHousehold } from '../../context/HouseholdContext';
import { AppScreen, AppButton, AppText, AppCard } from '../../components/ui';
import { useInventoryServices } from '../../hooks/useInventoryServices';
import { formatDateToDDMMYYYY, getExpiryStatus } from '../../utils/dateUtils';
import type { ShoppingListItem, Product } from '../../types/inventory';
import { colors, spacing, radius, typography } from '../../constants/theme';

type ShoppingStackParamList = {
  ShoppingList: undefined;
};

type ShoppingListScreenNavigationProp = NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingList'>;

interface ShoppingListItemProps {
  item: ShoppingListItem;
  index: number;
}

export function ShoppingListScreen({ navigation }: { navigation: ShoppingListScreenNavigationProp }) {
  const { currentHousehold } = useHousehold();
  const services = useInventoryServices();
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!currentHousehold || !services) return;
    try {
      setLoading(true);
      const [list, allProducts] = await Promise.all([
        services.inventoryBusinessLogic.generateShoppingList(),
        services.productsService.getAll(),
      ]);
      setShoppingList(list);
      setProducts(allProducts);
      setCheckedItems(new Set());
    } catch (error) {
      console.error('Error loading shopping list:', error);
      Alert.alert('Error', 'No se pudo cargar la lista de compras');
    } finally {
      setLoading(false);
    }
  }, [currentHousehold, services]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCheck = (productId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleMarkAsBought = async (item: ShoppingListItem) => {
    if (!services) return;
    try {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      const newStock = product.currentStock + item.neededQuantity;
      await services.productsService.updateStock(product.id, newStock);
      await services.inventoryBusinessLogic.recordStockMovement(
        product.id,
        'add',
        item.neededQuantity,
        'Compra desde lista de compras'
      );
      loadData();
    } catch (error) {
      console.error('Error marking as bought:', error);
      Alert.alert('Error', 'No se pudo actualizar el stock');
    }
  };

  const renderItem = ({ item, index }: ShoppingListItemProps) => {
    const isChecked = checkedItems.has(item.productId);
    const product = products.find(p => p.id === item.productId);
    const expiryStatus = product?.expiryDate ? getExpiryStatus(product.expiryDate) : null;

    return (
      <AppCard
        variant={isChecked ? 'success' : 'default'}
        padding="default"
        style={styles.itemCard}
      >
        <View style={styles.itemContent}>
          <Pressable
            style={styles.checkbox}
            onPress={() => toggleCheck(item.productId)}
          >
            <View
              style={[
                styles.checkboxInner,
                isChecked && styles.checkboxChecked,
              ]}
            >
              {isChecked && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </Pressable>

          <View style={[styles.itemInfo, { flex: 1 }]}>
            <View style={styles.itemTopRow}>
              <AppText variant="body" weight="700" tone={isChecked ? "tertiary" : "primary"} style={styles.itemName}>
                {item.productName}
              </AppText>
              {expiryStatus && (
                <View style={[styles.expiryBadge, { backgroundColor: getExpiryBg(expiryStatus.variant) }]}>
                  <AppText variant="micro" weight="700" style={{ color: getExpiryColor(expiryStatus.variant) }}>
                    {expiryStatus.text}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.itemBottomRow}>
              {item.category && (
                <AppText variant="micro" tone="tertiary" weight="600" style={styles.categoryBadge}>
                  {item.category}
                </AppText>
              )}
              <AppText variant="micro" tone="secondary" style={styles.quantityText}>
                Necesitas: {item.neededQuantity} {product?.unit || 'unid'} (tenés {product?.currentStock || 0})
              </AppText>
              <AppText variant="micro" tone="secondary" weight="700" style={[styles.priorityBadge, { color: priorityColor(item.priority) }]}>
                Prioridad: {priorityLabel(item.priority)}
              </AppText>
            </View>
          </View>

          {!isChecked && product && (
            <AppButton
              title="Comprado"
              onPress={() => handleMarkAsBought(item)}
              variant="primary"
              size="sm"
              style={styles.boughtButton}
            />
          )}
        </View>
      </AppCard>
    );
  };

  const renderEmptyState = () => (
    <AppCard variant="quiet" padding="generous" style={styles.emptyCard}>
      <View style={styles.emptyContent}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <AppText variant="title3" weight="700" style={styles.emptyTitle}>
          Lista de compras vacía
        </AppText>
        <AppText variant="bodySmall" tone="tertiary" style={styles.emptyDescription}>
          ¡Genial! Tenés todo lo que necesitás según tus plantillas
        </AppText>
        <AppButton
          title="Ver plantillas"
          onPress={() => navigation.navigate('InventoryStack', { screen: 'Inventory' })}
          variant="primary"
          size="lg"
          style={styles.emptyButton}
        />
      </View>
    </AppCard>
  );

  if (!currentHousehold) {
    return (
      <AppScreen>
        <View style={styles.noHousehold}>
          <Text style={styles.noHouseholdIcon}>🏠</Text>
          <AppText variant="title2" weight="700">Sin hogar activo</AppText>
          <AppText variant="body" tone="secondary">
            Selecciona o crea un hogar para usar la lista de compras
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 Cargando lista...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll style={styles.screen}>
      <View style={styles.header}>
        <View>
          <AppText variant="title2" weight="800">Lista de compras</AppText>
          <AppText variant="bodySmall" tone="tertiary">
            {shoppingList.length} producto{shoppingList.length !== 1 ? 's' : ''}
          </AppText>
        </View>
      </View>

      {shoppingList.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.summaryBar}>
            <AppText variant="bodySmall" tone="secondary" weight="600">
              {checkedItems.size} de {shoppingList.length} marcados
            </AppText>
            <AppButton
              title="Limpiar lista"
              onPress={() => setCheckedItems(new Set())}
              variant="ghost"
              size="sm"
            />
          </View>

          <FlatList
            data={shoppingList}
            renderItem={renderItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </AppScreen>
  );
}

function priorityLabel(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return 'Alta';
    case 'medium': return 'Media';
    case 'low': return 'Baja';
  }
}

function priorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return colors.danger.base;
    case 'medium': return colors.warning.base;
    case 'low': return colors.success.base;
    default: return colors.text.tertiary;
  }
}

function getExpiryColor(variant: 'success' | 'info' | 'warning' | 'danger' | 'default'): string {
  switch (variant) {
    case 'danger': return colors.danger.text;
    case 'warning': return colors.warning.text;
    case 'info': return colors.info.text;
    case 'success': return colors.success.text;
    default: return colors.text.tertiary;
  }
}

function getExpiryBg(variant: 'success' | 'info' | 'warning' | 'danger' | 'default'): string {
  switch (variant) {
    case 'danger': return colors.danger.soft;
    case 'warning': return colors.warning.soft;
    case 'info': return colors.info.soft;
    case 'success': return colors.success.soft;
    default: return colors.surface.soft;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  listContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
  itemCard: {
    marginBottom: spacing[3],
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success.base,
    borderColor: colors.success.base,
  },
  checkMark: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  itemName: {
    flex: 1,
    marginRight: spacing[2],
    textDecorationLine: 'none',
  },
  expiryBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: colors.surface.soft,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  quantityText: {
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
    backgroundColor: colors.surface.soft,
  },
  boughtButton: {
    marginLeft: spacing[2],
    minWidth: 100,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  emptyCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  emptyButton: {
    minWidth: 200,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  noHousehold: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  noHouseholdIcon: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
});