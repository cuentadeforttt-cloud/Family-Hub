import { inventoryRepository } from './repositories/inventory';
import { templateRepository } from './repositories/template';
import { productsRepository } from './repositories/products';
import { settingsRepository } from './repositories/settings';
import { InventoryItem, ShoppingListItem, DashboardStats } from '../types';

export class BusinessLogicService {
  // FIFO (First In, First Out) - Consumir productos por orden de caducidad
  async consumeProduct(productId: string, quantity: number): Promise<void> {
    const inventoryItems = await inventoryRepository.getByProductId(productId);

    // Ordenar por fecha de caducidad (más antigua primero)
    const sortedItems = inventoryItems.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );

    let remainingQuantity = quantity;

    for (const item of sortedItems) {
      if (remainingQuantity <= 0) break;

      const consumeFromThisItem = Math.min(remainingQuantity, item.quantity);
      await inventoryRepository.consumeQuantity(item.id, consumeFromThisItem);
      remainingQuantity -= consumeFromThisItem;
    }

    if (remainingQuantity > 0) {
      throw new Error(
        `No hay suficiente stock. Faltan ${remainingQuantity} unidades.`,
      );
    }
  }

  // Calcular lista de la compra basada en plantilla ideal vs inventario actual
  async generateShoppingList(): Promise<ShoppingListItem[]> {
    const templateItems = await templateRepository.getAll();
    const shoppingList: ShoppingListItem[] = [];

    for (const templateItem of templateItems) {
      const inventoryItems = await inventoryRepository.getByProductId(
        templateItem.productId,
      );
      const currentQuantity = inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      if (currentQuantity < templateItem.idealQuantity) {
        const neededQuantity = templateItem.idealQuantity - currentQuantity;

        shoppingList.push({
          productId: templateItem.productId,
          productName: templateItem.productName,
          neededQuantity,
          priority: templateItem.priority,
          category: templateItem.category,
        });
      }
    }

    // Ordenar por prioridad y luego por categoría
    return shoppingList.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.category.localeCompare(b.category);
    });
  }

  // Calcular estadísticas del dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [products, inventoryItems, expiringSoon, lowStock] =
      await Promise.all([
        productsRepository.getAll(),
        inventoryRepository.getAll(),
        this.getExpiringSoonItems(),
        this.getLowStockItems(),
      ]);

    const totalProducts = products.length;
    const totalItems = inventoryItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const expiringSoonCount = expiringSoon.length;
    const lowStockCount = lowStock.length;

    // Productos comprados en los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPurchases = inventoryItems.filter(
      item => new Date(item.purchaseDate) >= sevenDaysAgo,
    ).length;

    return {
      totalProducts,
      totalItems,
      expiringSoon: expiringSoonCount,
      lowStock: lowStockCount,
      recentPurchases,
    };
  }

  // Obtener productos próximos a caducar
  async getExpiringSoonItems(): Promise<InventoryItem[]> {
    const alertDays = await settingsRepository.getExpiryAlertDays();
    return inventoryRepository.getExpiringSoon(alertDays);
  }

  // Obtener productos con stock bajo
  async getLowStockItems(): Promise<
    Array<InventoryItem & { minQuantity: number; maxQuantity: number }>
  > {
    return inventoryRepository.getLowStock();
  }

  // Calcular días hasta caducidad
  getDaysUntilExpiry(expiryDate: string): number {
    if (!expiryDate) return 0;

    try {
      let expiry: Date;

      // Verificar si es formato ISO (2025-09-08T20:18:00.000Z)
      if (expiryDate.includes('T') || expiryDate.includes('-')) {
        expiry = new Date(expiryDate);
      } else {
        // Convertir fecha dd/MM/yyyy a formato válido para Date
        const dateParts = expiryDate.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);
          expiry = new Date(year, month - 1, day);
        } else {
          return 0;
        }
      }

      // Verificar que la fecha es válida
      if (isNaN(expiry.getTime())) {
        console.warn('Invalid date created:', { expiryDate });
        return 0;
      }

      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return days;
    } catch (error) {
      console.warn('Error parsing expiry date:', expiryDate, error);
    }

    return 0;
  }

  // Verificar si un producto está próximo a caducar
  isExpiringSoon(expiryDate: string, alertDays: number = 3): boolean {
    return this.getDaysUntilExpiry(expiryDate) <= alertDays;
  }

  // Calcular estado del stock
  getStockStatus(
    currentQuantity: number,
    minQuantity: number,
    maxQuantity: number,
  ): 'low' | 'normal' | 'high' {
    if (currentQuantity <= minQuantity) return 'low';
    if (currentQuantity >= maxQuantity) return 'high';
    return 'normal';
  }

  // Obtener sugerencias de productos para agregar al inventario
  async getProductSuggestions(): Promise<
    Array<{
      productId: string;
      productName: string;
      category: string;
      suggestedQuantity: number;
    }>
  > {
    const templateItems = await templateRepository.getAll();
    const suggestions = [];

    for (const templateItem of templateItems) {
      const inventoryItems = await inventoryRepository.getByProductId(
        templateItem.productId,
      );
      const currentQuantity = inventoryItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      if (currentQuantity < templateItem.idealQuantity) {
        suggestions.push({
          productId: templateItem.productId,
          productName: templateItem.productName,
          category: templateItem.category,
          suggestedQuantity: templateItem.idealQuantity - currentQuantity,
        });
      }
    }

    return suggestions;
  }
}

export const businessLogicService = new BusinessLogicService();
