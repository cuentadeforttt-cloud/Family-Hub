import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ConsumeModal } from '../components/ConsumeModal';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { settingsRepository } from '../services/repositories/settings';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { businessLogicService } from '../services/businessLogic';
import { Product } from '../types';
import { useTranslations } from '../utils/i18n';

const ExpiryScreenSimplified: React.FC = () => {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const [expiringItems, setExpiringItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryAlertDays, setExpiryAlertDays] = useState(7);
  const [consumeModalVisible, setConsumeModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadExpiringItems();
    }, []),
  );

  const loadExpiringItems = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const [allProducts, expiryAlertDays] = await Promise.all([
        productsRepository.getAll(),
        settingsRepository.get('expiryAlertDays'),
      ]);

      // Obtener días de anticipación configurados (por defecto 7)
      const alertDays = expiryAlertDays ? parseInt(expiryAlertDays, 10) : 7;
      setExpiryAlertDays(alertDays);

      // Filtrar productos que caducan en los próximos X días (configurable) o ya caducados
      // Excluir productos con stock 0
      const expiring = allProducts.filter(product => {
        // Excluir productos sin stock
        if (product.currentStock <= 0) return false;

        if (!product.expiryDate) return true; // Incluir productos sin fecha
        const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(
          product.expiryDate,
        );
        // Incluir productos caducados (días negativos) y próximos a caducar
        return daysUntilExpiry <= alertDays;
      });

      // Ordenar por días hasta caducidad (más caducados primero, sin fecha al final)
      expiring.sort((a, b) => {
        // Productos sin fecha van al final
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;

        const daysA = businessLogicService.getDaysUntilExpiry(a.expiryDate);
        const daysB = businessLogicService.getDaysUntilExpiry(b.expiryDate);
        return daysA - daysB; // Orden ascendente: más caducados primero
      });

      setExpiringItems(expiring);
    } catch (error) {
      console.error('Error loading expiring items:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los productos próximos a caducar',
      );
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) {
      return { text: t.expiry.noDate, variant: 'secondary' as const };
    }

    const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(expiryDate);

    if (daysUntilExpiry < 0)
      return { text: t.expiry.expired, variant: 'danger' as const };
    if (daysUntilExpiry === 0)
      return { text: t.expiry.today, variant: 'danger' as const };
    if (daysUntilExpiry <= 3)
      return { text: `${daysUntilExpiry}d`, variant: 'warning' as const };
    return { text: `${daysUntilExpiry}d`, variant: 'info' as const };
  };

  const handleConsumeProduct = (product: Product) => {
    setSelectedProduct(product);
    setConsumeModalVisible(true);
  };

  const handleConsume = async (
    quantity: number,
    newExpiryDate?: string | null,
  ) => {
    if (!selectedProduct) return;

    try {
      const newStock = selectedProduct.currentStock - quantity;

      // Actualizar el producto con el nuevo stock y fecha de caducidad
      const updatedProduct = {
        ...selectedProduct,
        currentStock: newStock,
        expiryDate:
          newExpiryDate !== undefined
            ? newExpiryDate
            : selectedProduct.expiryDate,
      };

      await productsRepository.update(selectedProduct.id, updatedProduct);

      // Recargar la lista
      await loadExpiringItems();

      Alert.alert(
        t.common.success,
        `${quantity} ${
          t.inventory.units
        } ${t.consume.markConsumed.toLowerCase()}`,
      );
    } catch (error) {
      console.error('Error consuming product:', error);
      Alert.alert(t.common.error, 'No se pudo consumir el producto');
    }
  };

  const handleCloseConsumeModal = () => {
    setConsumeModalVisible(false);
    setSelectedProduct(null);
  };

  const renderExpiringItem = ({ item }: { item: Product }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);

    return (
      <TouchableOpacity onPress={() => handleConsumeProduct(item)}>
        <Card style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Badge text={expiryStatus.text} variant={expiryStatus.variant} />
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemCategory}>
              📂 {item.category || t.templates.noCategory}
            </Text>
            <Text style={styles.itemStock}>
              Stock: {item.currentStock} {t.inventory.units}
            </Text>
            {item.description && (
              <Text style={styles.itemDescription}>{item.description}</Text>
            )}
          </View>
          <View style={styles.itemFooter}>
            <Text style={styles.itemExpiry}>
              {t.expiry.expires}:{' '}
              {item.expiryDate
                ? item.expiryDate.includes('T') || item.expiryDate.includes('-')
                  ? formatDateToDDMMYYYY(item.expiryDate)
                  : item.expiryDate
                : t.expiry.noDate}
            </Text>
            <Text style={styles.consumeHint}>{t.consume.title} →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{t.expiry.excellent}</Text>
      <Text style={styles.emptyDescription}>{t.expiry.noExpiring}</Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.expiry.title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.expiry.title}</Text>
        <Text style={styles.subtitle}>
          {expiringItems.length}{' '}
          {t.expiry.subtitle.replace('{days}', expiryAlertDays.toString())}
        </Text>
      </View>

      <FlatList
        data={expiringItems}
        renderItem={renderExpiringItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <ConsumeModal
        visible={consumeModalVisible}
        onClose={handleCloseConsumeModal}
        onConsume={handleConsume}
        productName={selectedProduct?.name || ''}
        currentStock={selectedProduct?.currentStock || 0}
        currentExpiryDate={selectedProduct?.expiryDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
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
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  itemDetails: {
    marginBottom: 12,
  },
  itemCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemExpiry: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  consumeHint: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ExpiryScreenSimplified;
