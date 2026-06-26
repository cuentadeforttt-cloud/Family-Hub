export interface Product {
  id: string;
  name: string;
  category: string | null;
  description?: string;
  currentStock: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  // Propiedades adicionales para la UI
  productName?: string;
  category?: string;
}

export interface TemplateItem {
  id: string;
  productId: string;
  idealQuantity: number;
  priority: string;
  createdAt: string;
  updatedAt: string;
  // Propiedades adicionales para la UI
  productName?: string;
  category?: string;
}

export interface Settings {
  id: string;
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
  recentPurchases: number;
}

export interface ShoppingListItem {
  productId: string;
  productName: string;
  neededQuantity: number;
  priority: string;
  category: string;
}
