import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'inventario' | 'compras';

type Category = {
  id: string;
  icon: string;
  label: string;
  count: number;
  color: string;
};

type LowStockItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  icon: string;
};

type ExpiringItem = {
  id: string;
  name: string;
  expiresIn: string;
  icon: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { id: 'mercaderia',      icon: '🛒', label: 'Mercadería',       count: 25, color: '#CD7353' },
  { id: 'limpieza',        icon: '🧹', label: 'Limpieza',         count: 14, color: '#6B4FE8' },
  { id: 'herramientas',    icon: '🔧', label: 'Herramientas',     count: 25, color: '#D4975A' },
  { id: 'electrodomest',   icon: '📺', label: 'Electrodomésticos', count: 41, color: '#7C9E7A' },
  { id: 'medicamentos',    icon: '💊', label: 'Medicamentos',     count: 12, color: '#E57373' },
  { id: 'otros',           icon: '📦', label: 'Otros',            count: 24, color: '#64B5F6' },
];

const LOW_STOCK: LowStockItem[] = [
  { id: '1', name: 'Arroz',          quantity: '0',  unit: 'kg restantes',  icon: '🌾' },
  { id: '2', name: 'Papel higiénico', quantity: '2', unit: 'rollos',        icon: '🧻' },
  { id: '3', name: 'Napolitanas',    quantity: '1',  unit: 'paquete',       icon: '🍫' },
  { id: '4', name: 'Aceite de oliva', quantity: '0', unit: 'botellas',      icon: '🫒' },
];

const EXPIRING: ExpiringItem[] = [
  { id: '1', name: 'Yogurt',    expiresIn: 'Vence en 1 día',   icon: '🥛' },
  { id: '2', name: 'Embutido',  expiresIn: 'Vence en 3 días',  icon: '🥩' },
  { id: '3', name: 'Manteca',   expiresIn: 'Vence en 5 días',  icon: '🧈' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const InventarioScreen = () => {
  const [activeTab, setActiveTab] = useState<Tab>('inventario');
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  const addToList = (itemName: string) => {
    if (shoppingList.includes(itemName)) {
      Alert.alert('Ya en la lista', `${itemName} ya está en tu lista de compras.`);
      return;
    }
    setShoppingList(prev => [...prev, itemName]);
    Alert.alert('Agregado ✓', `${itemName} fue agregado a la lista de compras.`);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Inventario</Text>
          <Text style={S.headerSub}>Gestión del hogar</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => Alert.alert('Agregar ítem', 'Próximamente podrás agregar ítems manualmente.')}>
          <Text style={S.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab toggle ──────────────────────────────────────────────────── */}
      <View style={S.tabToggle}>
        <TouchableOpacity
          style={[S.tabBtn, activeTab === 'inventario' && S.tabBtnActive]}
          onPress={() => setActiveTab('inventario')}
        >
          <Text style={[S.tabBtnText, activeTab === 'inventario' && S.tabBtnTextActive]}>
            Inventario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.tabBtn, activeTab === 'compras' && S.tabBtnActive]}
          onPress={() => setActiveTab('compras')}
        >
          <Text style={[S.tabBtnText, activeTab === 'compras' && S.tabBtnTextActive]}>
            Lista de compras{shoppingList.length > 0 ? ` (${shoppingList.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'inventario' ? (
          <>
            {/* ── Categories grid ───────────────────────────────────────── */}
            <Text style={S.sectionLabel}>Categorías</Text>
            <View style={S.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={S.categoryCard}
                  onPress={() => Alert.alert(cat.label, `${cat.count} ítems en esta categoría.\nFuncionalidad completa próximamente.`)}
                >
                  <View style={[S.categoryIconBg, { backgroundColor: cat.color + '18' }]}>
                    <Text style={S.categoryIcon}>{cat.icon}</Text>
                  </View>
                  <Text style={S.categoryLabel}>{cat.label}</Text>
                  <Text style={[S.categoryCount, { color: cat.color }]}>{cat.count} ítems</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Geni sugiere ──────────────────────────────────────────── */}
            <View style={S.geniCard}>
              <View style={S.geniHeader}>
                <Text style={S.geniIcon}>✨</Text>
                <Text style={S.geniTitle}>Geni sugiere</Text>
              </View>
              <Text style={S.geniText}>
                Parece que necesitas reabastecerte de aceite de oliva. ¿Quieres que lo agregue a tu lista de compras?
              </Text>
              <TouchableOpacity
                style={S.geniBtn}
                onPress={() => addToList('Aceite de oliva')}
              >
                <Text style={S.geniBtnText}>Agregar a compras</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* ── Stock bajo ────────────────────────────────────────────── */}
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>Stock bajo ({LOW_STOCK.length})</Text>
            </View>
            {LOW_STOCK.map(item => (
              <View key={item.id} style={S.stockCard}>
                <View style={S.stockLeft}>
                  <View style={S.stockIconBg}>
                    <Text style={S.stockIcon}>{item.icon}</Text>
                  </View>
                  <View>
                    <Text style={S.stockName}>{item.name}</Text>
                    <Text style={S.stockQty}>{item.quantity} {item.unit}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[S.stockBtn, shoppingList.includes(item.name) && S.stockBtnDone]}
                  onPress={() => addToList(item.name)}
                >
                  <Text style={[S.stockBtnText, shoppingList.includes(item.name) && S.stockBtnTextDone]}>
                    {shoppingList.includes(item.name) ? '✓ En lista' : 'Agregar →'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* ── Próximos a vencer ─────────────────────────────────────── */}
            <View style={[S.sectionHeader, { marginTop: 8 }]}>
              <Text style={S.sectionTitle}>Próximos a vencer</Text>
            </View>
            {EXPIRING.map(item => (
              <View key={item.id} style={S.expiryCard}>
                <View style={S.stockIconBg}>
                  <Text style={S.stockIcon}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.stockName}>{item.name}</Text>
                  <Text style={S.expiryDate}>{item.expiresIn}</Text>
                </View>
                <View style={S.expiryDot} />
              </View>
            ))}

            {/* ── Shopping list (added items) ───────────────────────────── */}
            {shoppingList.length > 0 && (
              <>
                <View style={[S.sectionHeader, { marginTop: 8 }]}>
                  <Text style={S.sectionTitle}>Mi lista ({shoppingList.length})</Text>
                </View>
                {shoppingList.map((item, i) => (
                  <View key={i} style={S.expiryCard}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>🛒</Text>
                    <Text style={{ flex: 1, fontSize: 15, color: '#1C1C1C', fontWeight: '600' }}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => setShoppingList(prev => prev.filter(x => x !== item))}
                    >
                      <Text style={{ fontSize: 18, color: '#AAAAAA' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1C' },
  headerSub: { fontSize: 13, color: '#888888', marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#CD7353',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', lineHeight: 28 },

  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#EDEBE6',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#CD7353' },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#888888' },
  tabBtnTextActive: { color: '#FFFFFF' },

  scroll: { flex: 1, paddingHorizontal: 20 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#888888',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 14,
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1C1C1C' },

  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2DFD6',
    alignItems: 'flex-start',
  },
  categoryIconBg: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  categoryIcon: { fontSize: 22 },
  categoryLabel: { fontSize: 14, fontWeight: '700', color: '#1C1C1C', marginBottom: 4 },
  categoryCount: { fontSize: 12, fontWeight: '600' },

  // Geni card
  geniCard: {
    backgroundColor: '#6B4FE8',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  geniHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  geniIcon: { fontSize: 18 },
  geniTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  geniText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 14 },
  geniBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  geniBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Stock bajo
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    marginBottom: 10,
    borderWidth: 1, borderColor: '#E2DFD6',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stockIconBg: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F3F2EE',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  stockIcon: { fontSize: 20 },
  stockName: { fontSize: 15, fontWeight: '700', color: '#1C1C1C' },
  stockQty: { fontSize: 12, color: '#888888', marginTop: 2 },
  stockBtn: {
    borderWidth: 1.5, borderColor: '#CD7353',
    borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12,
  },
  stockBtnDone: { backgroundColor: '#7C9E7A', borderColor: '#7C9E7A' },
  stockBtnText: { fontSize: 13, fontWeight: '700', color: '#CD7353' },
  stockBtnTextDone: { color: '#FFFFFF' },

  // Próximos a vencer
  expiryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    marginBottom: 10,
    borderWidth: 1, borderColor: '#E2DFD6',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  expiryDate: { fontSize: 12, color: '#E57373', marginTop: 2, fontWeight: '600' },
  expiryDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E57373',
  },
});
