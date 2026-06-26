import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHousehold } from '../../context/HouseholdContext';
import { AppScreen, AppButton, AppText, AppCard, AppInput } from '../../components/ui';
import { InventoryCard, AddProductModal } from '../../components/inventory';
import { useInventoryServices } from '../../hooks/useInventoryServices';
import { formatDateToDDMMYYYY, getExpiryStatus } from '../../utils/dateUtils';
import type { Product, DashboardStats } from '../../types/inventory';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';

type InventoryStackParamList = {
  Inventory: undefined;
  ProductDetail: { productId: string };
  AddProduct: undefined;
  ShoppingList: undefined;
};

type InventoryScreenNavigationProp = NativeStackNavigationProp<InventoryStackParamList, 'Inventory'>;

interface ProductItemProps {
  item: Product;
  index: number;
}

export function InventoryScreen({ navigation }: { navigation: InventoryScreenNavigationProp }) {
  const { currentHousehold } = useHousehold();
  const services = useInventoryServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alertDays, setAlertDays] = useState(3);
  const flatListRef = useRef<FlatList<Product>>(null);

  const loadData = useCallback(async () => {
    if (!currentHousehold || !services) return;
    try {
      setLoading(true);
      const [allProducts, dashboardStats, alertDaysSetting] = await Promise.all([
        services.productsService.getAll(),
        services.inventoryBusinessLogic.getDashboardStats(),
        services.inventorySettingsService.getExpiryAlertDays(),
      ]);
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setStats(dashboardStats);
      setAlertDays(alertDaysSetting);
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'No se pudo cargar el inventario');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentHousehold, services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const filterProducts = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(query.toLowerCase())) ||
        (product.description &&
          product.description.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredProducts(filtered);
  };

  const handleAddStock = async (product: Product) => {
    if (!services) return;
    try {
      const newStock = product.currentStock + 1;
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, currentStock: newStock } : p))
      );
      setFilteredProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, currentStock: newStock } : p))
      );
      await services.productsService.updateStock(product.id, newStock);
      await services.inventoryBusinessLogic.recordStockMovement(
        product.id,
        'add',
        1,
        'Incremento manual'
      );
      loadData();
    } catch (error) {
      console.error('Error adding stock:', error);
      loadData();
      Alert.alert('Error', 'No se pudo agregar stock');
    }
  };

  const handleRemoveStock = async (product: Product) => {
    if (!services) return;
    if (product.currentStock <= 0) return;

    try {
      const newStock = Math.max(0, product.currentStock - 1);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, currentStock: newStock } : p))
      );
      setFilteredProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, currentStock: newStock } : p))
      );
      await services.productsService.updateStock(product.id, newStock);
      await services.inventoryBusinessLogic.recordStockMovement(
        product.id,
        'remove',
        1,
        'Decremento manual'
      );
      loadData();
    } catch (error) {
      console.error('Error removing stock:', error);
      loadData();
      Alert.alert('Error', 'No se pudo quitar stock');
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleProductAdded = () => {
    loadData();
    setShowAddModal(false);
    setSearchQuery('');
  };

  const renderProductItem = ({ item }: ProductItemProps) => (
    <InventoryCard
      product={item}
      onPress={() => handleProductPress(item)}
      onAddStock={() => handleAddStock(item)}
      onRemoveStock={() => handleRemoveStock(item)}
    />
  );

  const renderEmptyState = () => (
    <AppCard variant="quiet" padding="generous" style={styles.emptyCard}>
      <View style={styles.emptyContent}>
        <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '📦'}</Text>
        <AppText variant="title3" weight="700" style={styles.emptyTitle}>
          {searchQuery ? 'Sin resultados' : 'Inventario vacío'}
        </AppText>
        <AppText variant="bodySmall" tone="tertiary" style={styles.emptyDescription}>
          {searchQuery
            ? 'Intenta con otros términos de búsqueda'
            : 'Agrega tu primer producto para comenzar'}
        </AppText>
        {!searchQuery && (
          <AppButton
            title="Agregar producto"
            onPress={handleAddProduct}
            variant="primary"
            size="lg"
            leftSlot={<Text style={{ marginRight: 4 }}>➕</Text>}
            style={styles.emptyButton}
          />
        )}
      </View>
    </AppCard>
  );

  const renderStatsHeader = () => {
    if (!stats || loading) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <StatItem
            icon="⏰"
            value={stats.expiringSoon}
            label="Por vencer"
            color={stats.expiringSoon > 0 ? colors.warning.base : colors.success.base}
          />
          <StatItem
            icon="📦"
            value={stats.lowStock}
            label="Stock bajo"
            color={stats.lowStock > 0 ? colors.danger.base : colors.success.base}
          />
          <StatItem
            icon="💀"
            value={stats.expired}
            label="Caducados"
            color={stats.expired > 0 ? colors.danger.base : colors.success.base}
          />
          <StatItem
            icon="📊"
            value={stats.totalProducts}
            label="Productos"
            color={colors.terracotta[500]}
          />
        </View>

        {(stats.expiringSoon > 0 || stats.lowStock > 0 || stats.expired > 0) && (
          <AppCard variant="warning" padding="default" style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AppText variant="micro" tone="warning" weight="700">
                ⚠️ ACCIONES REQUERIDAS
              </AppText>
            </View>
            <View style={styles.alertItems}>
              {stats.expiringSoon > 0 && (
                <AlertItem
                  icon="⏰"
                  text={`${stats.expiringSoon} producto${stats.expiringSoon !== 1 ? 's' : ''} por vencer en ${alertDays} días`}
                  color={colors.warning.base}
                />
              )}
              {stats.lowStock > 0 && (
                <AlertItem
                  icon="📦"
                  text={`${stats.lowStock} producto${stats.lowStock !== 1 ? 's' : ''} con stock bajo`}
                  color={colors.danger.base}
                />
              )}
              {stats.expired > 0 && (
                <AlertItem
                  icon="💀"
                  text={`${stats.expired} producto${stats.expired !== 1 ? 's' : ''} caducado${stats.expired !== 1 ? 's' : ''}`}
                  color={colors.danger.base}
                />
              )}
            </View>
            <AppButton
              title="Ver lista de compras"
              onPress={() => navigation.navigate('InventoryStack', { screen: 'ShoppingList' })}
              variant="secondary"
              size="sm"
              style={styles.alertActionButton}
            />
          </AppCard>
        )}
      </View>
    );
  };

  if (!currentHousehold) {
    return (
      <AppScreen>
        <View style={styles.noHousehold}>
          <Text style={styles.noHouseholdIcon}>🏠</Text>
          <AppText variant="title2" weight="700">Sin hogar activo</AppText>
          <AppText variant="body" tone="secondary">
            Selecciona o crea un hogar para usar el inventario
          </AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll style={styles.screen}>
      <View style={styles.header}>
        <View>
          <AppText variant="title2" weight="800">Inventario</AppText>
          <AppText variant="bodySmall" tone="tertiary">
            {currentHousehold.nombre}
          </AppText>
        </View>
        <AppButton
          title=""
          onPress={handleAddProduct}
          variant="icon"
          size="lg"
          leftSlot={<Text style={styles.fabIcon}>+</Text>}
        />
      </View>

      <AppInput
        label="Buscar"
        placeholder="Buscar productos..."
        value={searchQuery}
        onChangeText={filterProducts}
        leftSlot={<Text style={styles.searchIcon}>🔍</Text>}
        rightSlot={
          searchQuery && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )
        }
        containerStyle={styles.searchInput}
      />

      {renderStatsHeader()}

      <FlatList
        ref={flatListRef}
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.terracotta[500]]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />
    </AppScreen>
  );
}

function StatItem({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <AppCard variant="default" padding="default" style={styles.statCard}>
      <View style={styles.statContent}>
        <View
          style={[
            styles.statIconBg,
            { backgroundColor: `${color}20` },
          ]}
        >
          <Text style={styles.statIcon}>{icon}</Text>
        </View>
        <View style={styles.statText}>
          <AppText variant="title2" weight="800" style={{ color }}>
            {value}
          </AppText>
          <AppText variant="micro" tone="tertiary" weight="600">
            {label}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

function AlertItem({
  icon,
  text,
  color,
}: {
  icon: string;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.alertItem}>
      <View
        style={[
          styles.alertIconBg,
          { backgroundColor: `${color}20` },
        ]}
      >
        <Text style={styles.alertIcon}>{icon}</Text>
      </View>
      <AppText variant="bodySmall" tone="secondary" style={styles.alertText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  searchInput: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing[2],
  },
  clearIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
    padding: spacing[1],
  },
  statsContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 20,
  },
  statText: {
    flex: 1,
  },
  alertCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  alertHeader: {
    marginBottom: spacing[2],
  },
  alertItems: {
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
    backgroundColor: colors.surface.soft,
    borderRadius: radius.md,
  },
  alertIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    fontSize: 14,
  },
  alertText: {
    flex: 1,
    fontWeight: '600',
  },
  alertActionButton: {
    width: '100%',
  },
  listContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
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