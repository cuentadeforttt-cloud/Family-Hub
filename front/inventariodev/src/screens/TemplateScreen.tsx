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

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { AddProductModal } from '../components/AddProductModal';
import { SearchInput } from '../components/SearchInput';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { Product, TemplateItem } from '../types';
import { useTranslations } from '../utils/i18n';

const TemplateScreenSimplified: React.FC = () => {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [idealQuantities, setIdealQuantities] = useState<
    Record<string, string>
  >({});
  const [simpleView, setSimpleView] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // Guardar cambios al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        saveAllChangesOnExit();
      };
    }, [idealQuantities]),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const allProducts = await productsRepository.getAll();
      // Ordenar por fecha de creación (más nuevos primero)
      const sortedProducts = allProducts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);

      // Cargar plantillas existentes
      const existingTemplates = await templateRepository.getAll();
      setTemplates(existingTemplates);

      // Inicializar estados de edición con datos de plantillas o valores por defecto
      const quantities: Record<string, string> = {};
      allProducts.forEach(product => {
        const template = existingTemplates.find(
          t => t.productId === product.id,
        );
        // Stock ideal es para alertas, no se inicializa con el stock actual
        quantities[product.id] = template?.idealQuantity
          ? template.idealQuantity.toString()
          : '';
      });

      setIdealQuantities(quantities);
    } catch (error) {
      console.error('Error loading template data:', error);
      Alert.alert(t.common.error, 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    loadData();
    setShowAddModal(false);
    setSearchQuery('');
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

  const saveAllChangesOnExit = async () => {
    try {
      for (const productId of Object.keys(idealQuantities)) {
        const quantityString = idealQuantities[productId] || '';
        const idealQuantity =
          quantityString === '' ? 0 : parseInt(quantityString) || 0;
        await templateRepository.upsert({
          productId,
          idealQuantity,
          priority: 'medium', // Prioridad por defecto
        });
      }
      console.log('All changes saved on exit');
    } catch (error) {
      console.error('Error saving changes on exit:', error);
    }
  };

  const handleQuantityChange = (productId: string, quantity: string) => {
    // No convertir a número aquí, mantener como string para permitir vacío
    setIdealQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleQuantityBlur = async (productId: string) => {
    const quantityString = idealQuantities[productId] || '';
    const idealQuantity =
      quantityString === '' ? 0 : parseInt(quantityString) || 0;
    console.log('Saving template on blur:', {
      productId,
      idealQuantity,
      originalString: quantityString,
    });

    try {
      await templateRepository.upsert({
        productId,
        idealQuantity,
      });
      console.log('Template saved automatically for product:', productId);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const renderTemplateItem = ({ item }: { item: Product }) => {
    const idealQuantityString = idealQuantities[item.id] || '';
    const idealQuantity =
      idealQuantityString === '' ? 0 : parseInt(idealQuantityString) || 0;
    const isLowStock = item.currentStock < idealQuantity;

    if (simpleView) {
      return (
        <Card style={styles.simpleItemCard}>
          <View style={styles.simpleItemContent}>
            <Text style={styles.simpleItemName}>{item.name}</Text>
            <View style={styles.simpleQuantitySection}>
              <Text style={styles.simpleQuantityLabel}>Ideal:</Text>
              <Input
                value={idealQuantityString}
                onChangeText={text => handleQuantityChange(item.id, text)}
                onBlur={() => handleQuantityBlur(item.id)}
                keyboardType="number-pad"
                style={styles.simpleQuantityInput}
                placeholder=""
              />
            </View>
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {isLowStock && (
            <Badge text={t.dashboard.lowStock} variant="warning" />
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemCategory}>
            📂 {item.category || t.templates.noCategory}
          </Text>
          <Text style={styles.stockInfo}>
            {t.templates.currentStock}: {item.currentStock} {t.inventory.units}
          </Text>
        </View>

        <View style={styles.templateControls}>
          <View style={styles.quantitySection}>
            <Text style={styles.controlLabel}>
              {t.templates.idealQuantity}:
            </Text>
            <Input
              value={idealQuantityString}
              onChangeText={text => handleQuantityChange(item.id, text)}
              onBlur={() => handleQuantityBlur(item.id)}
              keyboardType="number-pad"
              style={styles.quantityInput}
              placeholder="5"
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>
        {searchQuery ? t.templates.noSearchResults : t.templates.noProducts}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? t.templates.tryOtherSearchTerms
          : t.templates.addProductsToConfigure}
      </Text>
      {!searchQuery && (
        <Button
          title={t.templates.addProduct}
          onPress={() => setShowAddModal(true)}
          style={styles.emptyButton}
        />
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.templates.title}</Text>
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
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{t.templates.simpleView}</Text>
          <Switch
            value={simpleView}
            onValueChange={setSimpleView}
            trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
            thumbColor={simpleView ? '#ffffff' : '#ffffff'}
          />
        </View>
        <Button
          title={t.templates.addProduct}
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="small"
        />
      </View>
      <SearchInput
        value={searchQuery}
        onChangeText={filterProducts}
        placeholder={t.templates.searchPlaceholder}
      />
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>{t.templates.subtitle}</Text>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderTemplateItem}
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
};

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
    paddingVertical: 8,
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
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
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
  stockInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
  },
  templateControls: {
    marginBottom: 12,
    gap: 12,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  quantityInput: {
    width: 80,
    textAlign: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
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
  // Simple view styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  simpleItemCard: {
    marginBottom: 8,
    padding: 12,
  },
  simpleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  simpleItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  simpleQuantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  simpleQuantityLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  simpleQuantityInput: {
    width: 80,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    textAlignVertical: 'center',
    paddingVertical: 0,
    marginVertical: 0,
  },
});

export default TemplateScreenSimplified;
