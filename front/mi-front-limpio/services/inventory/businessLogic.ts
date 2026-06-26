import { supabase } from '../../supabase';
import type { ProductsService } from './products';
import type { InventoryItemsService } from './inventoryItems';
import type { TemplatesService } from './templates';
import type { InventorySettingsService } from './settings';
import type {
  ShoppingListItem,
  DashboardStats,
  ExpiryStatus,
  StockStatus,
} from '../../types/inventory';

export class InventoryBusinessLogic {
  constructor(
    private productsService: ProductsService,
    private inventoryItemsService: InventoryItemsService,
    private templatesService: TemplatesService,
    private inventorySettingsService: InventorySettingsService,
    private householdId: string,
    private userId: string
  ) {}

  async generateShoppingList(): Promise<ShoppingListItem[]> {
    const [templates, products] = await Promise.all([
      this.templatesService.getAll(),
      this.productsService.getAll(),
    ]);

    const productStockMap = new Map(
      products.map(p => [p.id, p.currentStock])
    );

    const shoppingList: ShoppingListItem[] = [];

    for (const template of templates) {
      const currentStock = productStockMap.get(template.productId) || 0;

      if (currentStock < template.idealQuantity) {
        const neededQuantity = template.idealQuantity - currentStock;

        shoppingList.push({
          productId: template.productId,
          productName: template.productName || 'Unknown',
          neededQuantity,
          priority: template.priority,
          category: template.category,
          currentStock,
          idealQuantity: template.idealQuantity,
        });
      }
    }

    return shoppingList.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      const catA = a.category || 'zzz';
      const catB = b.category || 'zzz';
      return catA.localeCompare(catB);
    });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [products, inventoryItems, expiringSoon, lowStock, expired] = await Promise.all([
      this.productsService.getAll(),
      this.inventoryItemsService.getAll(),
      this.getExpiringSoonItems(),
      this.inventoryItemsService.getLowStock(),
      this.productsService.getExpired(),
    ]);

    const totalProducts = products.length;
    const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const expiringSoonCount = expiringSoon.length;
    const lowStockCount = lowStock.length;
    const expiredCount = expired.length;

    return {
      totalProducts,
      totalItems,
      expiringSoon: expiringSoonCount,
      lowStock: lowStockCount,
      expired: expiredCount,
    };
  }

  async getExpiringSoonItems(): Promise<Array<{
    productId: string;
    productName: string;
    category: string | null;
    daysUntilExpiry: number;
    quantity: number;
    expiryDate: string;
  }>> {
    const alertDays = await this.inventorySettingsService.getExpiryAlertDays();
    const items = await this.inventoryItemsService.getExpiringSoon(alertDays);

    return items.map(item => ({
      productId: item.productId,
      productName: item.productName || 'Unknown',
      category: item.category ?? null,
      daysUntilExpiry: this.getDaysUntilExpiry(item.expiryDate!),
      quantity: item.quantity,
      expiryDate: item.expiryDate!,
    }));
  }

  async getLowStockItems(): Promise<Array<{
    productId: string;
    productName: string;
    category: string | null;
    currentStock: number;
    idealQuantity: number;
    neededQuantity: number;
  }>> {
    const lowStockItems = await this.inventoryItemsService.getLowStock();

    return lowStockItems.map(item => ({
      productId: item.productId,
      productName: item.productName || 'Unknown',
      category: item.category ?? null,
      currentStock: item.quantity,
      idealQuantity: item.minQuantity,
      neededQuantity: item.minQuantity - item.quantity,
    }));
  }

  getDaysUntilExpiry(expiryDate: string): number {
    if (!expiryDate) return 0;

    try {
      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);

      const diffTime = expiry.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  getExpiryStatus(expiryDate: string | null, alertDays: number = 3): ExpiryStatus {
    if (!expiryDate) {
      return { text: 'Sin fecha', variant: 'default', daysUntilExpiry: 0 };
    }

    const daysUntilExpiry = this.getDaysUntilExpiry(expiryDate);

    if (daysUntilExpiry < 0) {
      return { text: 'Caducado', variant: 'danger', daysUntilExpiry };
    }
    if (daysUntilExpiry === 0) {
      return { text: 'Hoy', variant: 'danger', daysUntilExpiry };
    }
    if (daysUntilExpiry <= alertDays) {
      return { text: `${daysUntilExpiry}d`, variant: 'warning', daysUntilExpiry };
    }
    if (daysUntilExpiry <= 7) {
      return { text: `${daysUntilExpiry}d`, variant: 'info', daysUntilExpiry };
    }
    return { text: `${daysUntilExpiry}d`, variant: 'success', daysUntilExpiry };
  }

  getStockStatus(currentStock: number, idealQuantity: number): StockStatus {
    if (idealQuantity === 0) {
      return { status: 'normal', color: '#6B9E7A', label: 'OK' };
    }

    const percentage = (currentStock / idealQuantity) * 100;

    if (percentage <= 25) {
      return { status: 'low', color: '#C46B6B', label: 'Bajo' };
    }
    if (percentage >= 100) {
      return { status: 'high', color: '#D4944A', label: 'Completo' };
    }
    return { status: 'normal', color: '#6B9E7A', label: 'Normal' };
  }

  async getProductSuggestions(): Promise<Array<{
    productId: string;
    productName: string;
    category: string | null;
    suggestedQuantity: number;
  }>> {
    const templates = await this.templatesService.getAll();
    const products = await this.productsService.getAll();

    const productStockMap = new Map(
      products.map(p => [p.id, p.currentStock])
    );

    const suggestions = [];

    for (const template of templates) {
      const currentStock = productStockMap.get(template.productId) || 0;

      if (currentStock < template.idealQuantity) {
        suggestions.push({
          productId: template.productId,
          productName: template.productName || 'Unknown',
          category: template.category ?? null,
          suggestedQuantity: template.idealQuantity - currentStock,
        });
      }
    }

    return suggestions;
  }

  async recordStockMovement(
    productId: string,
    type: 'add' | 'remove' | 'expired' | 'adjustment',
    quantity: number,
    reason?: string,
    inventoryItemId?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('stock_movements')
      .insert({
        household_id: this.householdId,
        product_id: productId,
        inventory_item_id: inventoryItemId,
        type,
        quantity,
        reason,
        created_by: user.id,
      });

    if (error) throw error;
  }
}

export function createInventoryBusinessLogic(
  productsService: ProductsService,
  inventoryItemsService: InventoryItemsService,
  templatesService: TemplatesService,
  inventorySettingsService: InventorySettingsService,
  householdId: string,
  userId: string
): InventoryBusinessLogic {
  return new InventoryBusinessLogic(
    productsService,
    inventoryItemsService,
    templatesService,
    inventorySettingsService,
    householdId,
    userId
  );
}