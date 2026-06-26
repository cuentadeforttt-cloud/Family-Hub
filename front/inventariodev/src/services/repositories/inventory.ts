import { databaseService } from '../database/database';
import { InventoryItem, Product } from '../../types';

export class InventoryRepository {
  async getAll(): Promise<InventoryItem[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      `SELECT i.*, p.name as productName, p.category 
       FROM inventory i 
       JOIN products p ON i.productId = p.id 
       ORDER BY i.expiryDate ASC, p.name ASC`,
    );
    return results as InventoryItem[];
  }

  async getById(id: string): Promise<InventoryItem | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      `SELECT i.*, p.name as productName, p.category 
       FROM inventory i 
       JOIN products p ON i.productId = p.id 
       WHERE i.id = ?`,
      [id],
    );

    return (result as InventoryItem) || null;
  }

  async getByProductId(productId: string): Promise<InventoryItem[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      `SELECT i.*, p.name as productName, p.category 
       FROM inventory i 
       JOIN products p ON i.productId = p.id 
       WHERE i.productId = ? 
       ORDER BY i.expiryDate ASC`,
      [productId],
    );

    return results as InventoryItem[];
  }

  async create(
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const db = databaseService.getDatabase();
    const id = `inventory_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO inventory (id, productId, quantity, expiryDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item.productId, item.quantity, item.expiryDate || null, now, now],
    );

    return id;
  }

  async update(
    id: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await db.runAsync(
      `UPDATE inventory SET ${fields}, updatedAt = ? WHERE id = ?`,
      [...values, now, id],
    );
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM inventory WHERE id = ?', [id]);
  }

  async getExpiringSoon(days: number = 3): Promise<InventoryItem[]> {
    const db = databaseService.getDatabase();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const results = await db.getAllAsync(
      `SELECT i.*, p.name as productName, p.category 
       FROM inventory i 
       JOIN products p ON i.productId = p.id 
       WHERE i.expiryDate <= ? AND i.quantity > 0
       ORDER BY i.expiryDate ASC`,
      [futureDateStr],
    );

    return results as InventoryItem[];
  }

  async getLowStock(): Promise<
    Array<InventoryItem & { minQuantity: number; maxQuantity: number }>
  > {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      `SELECT i.*, p.name as productName, p.category,
              SUM(i.quantity) as totalQuantity
       FROM inventory i 
       JOIN products p ON i.productId = p.id 
       WHERE i.quantity > 0
       GROUP BY i.productId
       ORDER BY p.name ASC`,
    );

    return results as Array<
      InventoryItem & { minQuantity: number; maxQuantity: number }
    >;
  }

  async consumeQuantity(inventoryId: string, quantity: number): Promise<void> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      'SELECT quantity FROM inventory WHERE id = ?',
      [inventoryId],
    );

    if (!result) {
      throw new Error('Inventory item not found');
    }

    const currentQuantity = result.quantity;
    const newQuantity = Math.max(0, currentQuantity - quantity);

    if (newQuantity === 0) {
      await this.delete(inventoryId);
    } else {
      await this.update(inventoryId, { quantity: newQuantity });
    }
  }
}

export const inventoryRepository = new InventoryRepository();
