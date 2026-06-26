export interface Product {
  id: string;
  householdId: string;
  name: string;
  category: string | null;
  description: string | null;
  currentStock: number;
  unit: string | null;
  expiryDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  householdId: string;
  productId: string;
  quantity: number;
  expiryDate: string | null;
  purchaseDate: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  productName?: string;
  category?: string;
}

export interface InventoryTemplate {
  id: string;
  householdId: string;
  productId: string;
  idealQuantity: number;
  priority: 'high' | 'medium' | 'low';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  productName?: string;
  category?: string;
  currentStock?: number;
}

export interface StockMovement {
  id: string;
  householdId: string;
  productId: string;
  inventoryItemId: string | null;
  type: 'add' | 'remove' | 'expired' | 'adjustment';
  quantity: number;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface InventorySetting {
  id: string;
  householdId: string;
  userId: string | null;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalItems: number;
  expiringSoon: number;
  lowStock: number;
  expired: number;
}

export interface ShoppingListItem {
  productId: string;
  productName: string;
  neededQuantity: number;
  priority: 'high' | 'medium' | 'low';
  category: string | null;
  currentStock: number;
  idealQuantity: number;
}

export interface ProductFormData {
  name: string;
  category: string;
  description: string;
  initialStock: number;
  unit: string;
  expiryDate: string | null;
}

export interface ExpiryStatus {
  text: string;
  variant: 'success' | 'info' | 'warning' | 'danger' | 'default';
  daysUntilExpiry: number;
}

export interface StockStatus {
  status: 'low' | 'normal' | 'high';
  color: string;
  label: string;
}

export type ProductCategory =
  | 'Lácteos'
  | 'Carnes'
  | 'Pescados'
  | 'Frutas'
  | 'Verduras'
  | 'Panadería'
  | 'Despensa'
  | 'Bebidas'
  | 'Congelados'
  | 'Limpieza'
  | 'Higiene'
  | 'Medicamentos'
  | 'Mascotas'
  | 'Otros';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Lácteos',
  'Carnes',
  'Pescados',
  'Frutas',
  'Verduras',
  'Panadería',
  'Despensa',
  'Bebidas',
  'Congelados',
  'Limpieza',
  'Higiene',
  'Medicamentos',
  'Mascotas',
  'Otros',
];

export const DEFAULT_UNITS = [
  'unidad',
  'kg',
  'g',
  'L',
  'ml',
  'paquete',
  'caja',
  'botella',
  'lata',
  'bolsa',
];

export const PRIORITY_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export const PRIORITY_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high: '#C46B6B',
  medium: '#D4944A',
  low: '#6B9E7A',
};