import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Keyboard } from 'react-native';
import { Modal, Pressable, ScrollView } from 'react-native';
import { AppButton, AppText, AppInput } from '../ui';
import { colors, radius, spacing } from '../../constants/theme';
import type { ProductFormData } from '../../types/inventory';
import { PRODUCT_CATEGORIES, DEFAULT_UNITS } from '../../types/inventory';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  initialData?: Partial<ProductFormData>;
}

function CategoryPicker({
  categories,
  selected,
  onSelect,
  onClose,
}: {
  categories: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.pickerModal}>
      <View style={styles.pickerHeader}>
        <AppText variant="title3" weight="700">Seleccionar</AppText>
        <Pressable onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.pickerList}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.pickerItem,
              selected === cat && styles.pickerItemSelected,
            ]}
            onPress={() => onSelect(cat)}
          >
            <AppText
              variant="body"
              tone={selected === cat ? "inverse" : "primary"}
              weight={selected === cat ? "700" : "400"}
            >
              {cat}
            </AppText>
            {selected === cat && (
              <Text style={styles.checkMark}>✓</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function DatePickerModal({
  visible,
  onClose,
  onSelect,
  initialDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string | null) => void;
  initialDate?: string;
}) {
  const [date, setDate] = useState<string | null>(initialDate || null);

  useEffect(() => {
    setDate(initialDate || null);
  }, [initialDate]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.datePickerContainer}>
          <View style={styles.handle} />
          <View style={styles.pickerHeader}>
            <AppText variant="title3" weight="700">Fecha de caducidad</AppText>
            <Pressable onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.datePickerWrapper}>
            <Text
              style={{
                fontSize: 100,
                color: colors.terracotta[500],
                fontWeight: '800',
              }}
            >
              📅
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <AppButton
              title="Quitar fecha"
              onPress={() => { onSelect(null); onClose(); }}
              variant="ghost"
              size="lg"
            />
            <AppButton
              title="Seleccionar hoy"
              onPress={() => {
                const today = new Date().toISOString().split('T')[0];
                onSelect(today);
                onClose();
              }}
              variant="primary"
              size="lg"
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export function AddProductModal({
  visible,
  onClose,
  onProductAdded,
  initialData,
}: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    description: '',
    initialStock: 0,
    unit: 'unidad',
    expiryDate: null,
    ...initialData,
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData({
        name: '',
        category: '',
        description: '',
        initialStock: 0,
        unit: 'unidad',
        expiryDate: null,
        ...initialData,
      });
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }

    Keyboard.dismiss();

    try {
      setLoading(true);

      const { productsService } = await import('../../services/inventory');
      const { inventoryItemsService } = await import('../../services/inventory');

      const product = await productsService.create({
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        currentStock: formData.initialStock,
        unit: formData.unit,
        expiryDate: formData.expiryDate,
      });

      if (formData.initialStock > 0) {
        await inventoryItemsService.create({
          productId: product.id,
          quantity: formData.initialStock,
          expiryDate: formData.expiryDate,
          purchaseDate: new Date().toISOString().split('T')[0],
        });
      }

      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable
        style={styles.overlay}
        onPress={() => { Keyboard.dismiss(); onClose(); }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="title3" weight="700">
              {initialData ? 'Editar Producto' : 'Nuevo Producto'}
            </AppText>
            <Pressable onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <AppInput
              label="Nombre *"
              placeholder="Ej: Leche entera, Pan integral..."
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
            />

            <AppInput
              label="Descripción"
              placeholder="Detalles opcionales..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={2}
            />

            <View style={styles.pickerRow}>
              <Pressable
                style={[
                  styles.pickerButton,
                  { backgroundColor: formData.category ? colors.surface.card : colors.surface.soft },
                ]}
                onPress={() => { Keyboard.dismiss(); setShowCategoryPicker(true); }}
              >
                <AppText
                  variant="body"
                  tone={formData.category ? "primary" : "tertiary"}
                  style={styles.pickerText}
                >
                  {formData.category || 'Categoría (opcional)'}
                </AppText>
                <Text style={styles.pickerArrow}>▼</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.pickerButton,
                  { backgroundColor: colors.surface.card },
                ]}
                onPress={() => { Keyboard.dismiss(); setShowUnitPicker(true); }}
              >
                <AppText
                  variant="body"
                  tone="primary"
                  style={styles.pickerText}
                >
                  {formData.unit}
                </AppText>
                <Text style={styles.pickerArrow}>▼</Text>
              </Pressable>
            </View>

            <View style={styles.stockRow}>
              <AppInput
                label="Stock inicial"
                placeholder="0"
                value={formData.initialStock.toString()}
                onChangeText={(text) => setFormData({
                  ...formData,
                  initialStock: parseInt(text) || 0,
                })}
                keyboardType="number-pad"
                style={styles.stockInput}
              />

              <Pressable
                style={[
                  styles.pickerButton,
                  { backgroundColor: formData.expiryDate ? colors.surface.card : colors.surface.soft },
                  { flex: 1 },
                ]}
                onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
              >
                <AppText
                  variant="body"
                  tone={formData.expiryDate ? "primary" : "tertiary"}
                  style={styles.pickerText}
                >
                  {formData.expiryDate
                    ? formatDateToDDMMYYYY(formData.expiryDate)
                    : 'Fecha caducidad (opcional)'}
                </AppText>
                <Text style={styles.pickerArrow}>📅</Text>
              </Pressable>
            </View>

            {showCategoryPicker && (
              <CategoryPicker
                categories={PRODUCT_CATEGORIES}
                selected={formData.category}
                onSelect={(cat) => {
                  setFormData({ ...formData, category: cat });
                  setShowCategoryPicker(false);
                }}
                onClose={() => setShowCategoryPicker(false)}
              />
            )}

            {showUnitPicker && (
              <CategoryPicker
                categories={DEFAULT_UNITS}
                selected={formData.unit}
                onSelect={(unit) => {
                  setFormData({ ...formData, unit });
                  setShowUnitPicker(false);
                }}
                onClose={() => setShowUnitPicker(false)}
              />
            )}

            <DatePickerModal
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSelect={(date) => {
                setFormData({ ...formData, expiryDate: date });
                setShowDatePicker(false);
              }}
              initialDate={formData.expiryDate || undefined}
            />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <AppButton
              title="Cancelar"
              onPress={onClose}
              variant="ghost"
              size="lg"
              style={styles.cancelButton}
            />
            <AppButton
              title={loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Agregar')}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.shadow.default,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing[4],
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  closeButton: {
    fontSize: 24,
    color: colors.text.tertiary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  scrollContentContainer: {
    paddingBottom: spacing[10],
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minHeight: 48,
  },
  pickerText: {
    flex: 1,
  },
  pickerArrow: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  stockRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  stockInput: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  pickerModal: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing[4],
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  pickerItemSelected: {
    backgroundColor: colors.terracotta[50],
  },
  checkMark: {
    color: colors.terracotta[500],
    fontWeight: '700',
  },
  datePickerContainer: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing[4],
    alignItems: 'center',
  },
  datePickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
});