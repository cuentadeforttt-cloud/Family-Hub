import { databaseService } from '../database/database';
import { Product } from '../../types';

export class ProductsRepository {
  async getAll(): Promise<Product[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM products ORDER BY name ASC',
    );
    return results as Product[];
  }

  async getById(id: string): Promise<Product | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      'SELECT * FROM products WHERE id = ?',
      [id],
    );
    return (result as Product) || null;
  }

  async create(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Product> {
    const db = databaseService.getDatabase();
    const id = `product_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO products (id, name, category, description, currentStock, expiryDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        product.name,
        product.category,
        product.description || null,
        product.currentStock || 0,
        product.expiryDate || null,
        now,
        now,
      ],
    );

    return this.getById(id) as Promise<Product>;
  }

  async update(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Product> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.currentStock !== undefined) {
      fields.push('currentStock = ?');
      values.push(updates.currentStock);
    }
    if (updates.expiryDate !== undefined) {
      fields.push('expiryDate = ?');
      values.push(updates.expiryDate);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    return this.getById(id) as Promise<Product>;
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
  }

  async updateStock(id: string, newStock: number): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE products SET currentStock = ?, updatedAt = ? WHERE id = ?',
      [newStock, now, id],
    );
  }

  async updateExpiryDate(id: string, expiryDate: string | null): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE products SET expiryDate = ?, updatedAt = ? WHERE id = ?',
      [expiryDate, now, id],
    );
  }
}

export const productsRepository = new ProductsRepository();
