import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AddProductModal } from '../components/AddProductModal';
import { SearchInput } from '../components/SearchInput';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Product } from '../types';
import { theme } from '../constants/theme';
import { useTranslations } from '../utils/i18n';

type InventoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Inventory'
>;

interface Props {
  navigation: InventoryScreenNavigationProp;
}

export default function InventoryScreen({ navigation }: Props) {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [simpleView, setSimpleView] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, []),
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await productsRepository.getAll();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert(t.common.error, 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(query.toLowerCase())) ||
        (product.description &&
          product.description.toLowerCase().includes(query.toLowerCase())),
    );
    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleProductAdded = () => {
    loadProducts();
    setShowAddModal(false);
    setSearchQuery('');
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddStock = async (product: Product) => {
    try {
      const newStock = product.currentStock + 1;

      // Actualizar inmediatamente la UI para evitar parpadeo
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, currentStock: newStock } : p,
        ),
      );
      setFilteredProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, currentStock: newStock } : p,
        ),
      );

      // Actualizar en la base de datos en segundo plano
      await productsRepository.updateStock(product.id, newStock);
    } catch (error) {
      console.error('Error adding stock:', error);
      // Revertir cambios en caso de error
      await loadProducts();
      Alert.alert(t.common.error, 'No se pudo agregar stock');
    }
  };

  const handleRemoveStock = async (product: Product) => {
    if (product.currentStock <= 0) return;

    try {
      const newStock = Math.max(0, product.currentStock - 1);

      // Actualizar inmediatamente la UI para evitar parpadeo
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, currentStock: newStock } : p,
        ),
      );
      setFilteredProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, currentStock: newStock } : p,
        ),
      );

      // Actualizar en la base de datos en segundo plano
      await productsRepository.updateStock(product.id, newStock);
    } catch (error) {
      console.error('Error removing stock:', error);
      // Revertir cambios en caso de error
      await loadProducts();
      Alert.alert(t.common.error, 'No se pudo quitar stock');
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) {
      return { text: t.inventory.noExpiryDate, variant: 'default' as const };
    }
    const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry < 0)
      return { text: t.inventory.expired, variant: 'danger' as const };
    if (daysUntilExpiry <= 3)
      return { text: `${daysUntilExpiry}d`, variant: 'warning' as const };
    if (daysUntilExpiry <= 7)
      return { text: `${daysUntilExpiry}d`, variant: 'info' as const };
    return { text: `${daysUntilExpiry}d`, variant: 'success' as const };
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);

    if (simpleView) {
      return (
        <TouchableOpacity
          onPress={() => handleProductPress(item)}
          style={styles.itemContainer}
          activeOpacity={0.7}
        >
          <Card style={styles.simpleItemCard} variant="elevated">
            <View style={styles.simpleItemContent}>
              <Text style={styles.simpleItemName}>{item.name}</Text>
              <View style={styles.simpleStockControls}>
                <TouchableOpacity
                  onPress={() => handleRemoveStock(item)}
                  style={styles.simpleStockButton}
                  disabled={item.currentStock <= 0}
                >
                  <Text style={styles.simpleStockButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.simpleStockDisplay}>
                  <Text style={styles.simpleStockNumber}>
                    {item.currentStock}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleAddStock(item)}
                  style={styles.simpleStockButton}
                >
                  <Text style={styles.simpleStockButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => handleProductPress(item)}
        style={styles.itemContainer}
        activeOpacity={0.7}
      >
        <Card style={styles.itemCard} variant="elevated">
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleContainer}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>
                📂{' '}
                {item.category && item.category !== 'Sin categoría'
                  ? item.category
                  : t.templates.noCategory}
              </Text>
            </View>
            <Badge
              text={expiryStatus.text}
              variant={expiryStatus.variant}
              icon={
                expiryStatus.variant === 'danger'
                  ? '⚠️'
                  : expiryStatus.variant === 'warning'
                  ? '⏰'
                  : expiryStatus.variant === 'default'
                  ? undefined
                  : '✅'
              }
            />
          </View>

          <View style={styles.itemDetails}>
            <Text style={styles.itemDescription}>
              {item.description || t.inventory.noDescription}
            </Text>
          </View>

          <View style={styles.stockControls}>
            <TouchableOpacity
              onPress={() => handleRemoveStock(item)}
              disabled={item.currentStock <= 0}
              style={[
                styles.stockButton,
                styles.stockButtonOutline,
                item.currentStock <= 0 && styles.stockButtonDisabled,
              ]}
            >
              <Text
                style={[styles.stockButtonText, styles.stockButtonTextOutline]}
              >
                −
              </Text>
            </TouchableOpacity>
            <View style={styles.stockDisplay}>
              <Text style={styles.stockNumber}>{item.currentStock}</Text>
              <Text style={styles.stockLabel}>{t.inventory.units}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleAddStock(item)}
              style={[styles.stockButton, styles.stockButtonPrimary]}
            >
              <Text
                style={[styles.stockButtonText, styles.stockButtonTextPrimary]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>

          {item.expiryDate && (
            <View style={styles.itemFooter}>
              <Text style={styles.itemExpiry}>
                🗓️ {t.inventory.expires}:{' '}
                {formatDateToDDMMYYYY(item.expiryDate)}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard} variant="filled">
      <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '📦'}</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? t.inventory.noSearchResults : t.inventory.noProducts}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? t.inventory.tryOtherSearchTerms
          : t.inventory.addFirstProduct}
      </Text>
      {!searchQuery && (
        <Button
          title={t.inventory.addProduct}
          onPress={handleAddProduct}
          variant="primary"
          size="large"
          icon="➕"
          style={styles.emptyButton}
        />
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>📦 {t.inventory.title}</Text>
          <Text style={styles.subtitle}>{t.inventory.subtitle}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 {t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{t.inventory.simpleView}</Text>
          <Switch
            value={simpleView}
            onValueChange={setSimpleView}
            trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
            thumbColor={simpleView ? '#ffffff' : '#ffffff'}
          />
        </View>
        <Button
          title={t.inventory.addProduct}
          onPress={handleAddProduct}
          variant="primary"
          size="small"
        />
      </View>
      <SearchInput
        value={searchQuery}
        onChangeText={filterProducts}
        placeholder={t.inventory.searchPlaceholder}
        icon="🔍"
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
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
    flexGrow: 1,
  },
  itemContainer: {
    marginBottom: theme.spacing.md,
  },
  itemCard: {
    padding: theme.spacing.lg,
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
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
  },
  stockButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
  },
  stockButtonPrimary: {
    backgroundColor: theme.colors.primary[500],
  },
  stockButtonDisabled: {
    opacity: 0.5,
  },
  stockButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  stockButtonTextOutline: {
    color: theme.colors.primary[600],
  },
  stockButtonTextPrimary: {
    color: theme.colors.text.inverse,
  },
  stockDisplay: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    minWidth: 80,
  },
  stockNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  stockLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  itemExpiry: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
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
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight:
      theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  // Simple view styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  simpleItemCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  simpleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simpleItemName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  simpleStockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  simpleStockButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleStockButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  simpleStockDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  simpleStockNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
});
