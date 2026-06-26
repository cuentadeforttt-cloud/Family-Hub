import { databaseService } from '../database/database';
import { TemplateItem } from '../../types';

export class TemplateRepository {
  async getAll(): Promise<TemplateItem[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      `SELECT t.*, p.name as productName, p.category, p.currentStock, p.expiryDate
       FROM template t 
       JOIN products p ON t.productId = p.id 
       ORDER BY p.name ASC`,
    );
    return results as TemplateItem[];
  }

  async getById(id: string): Promise<TemplateItem | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      `SELECT t.*, p.name as productName, p.category, p.currentStock, p.expiryDate
       FROM template t 
       JOIN products p ON t.productId = p.id 
       WHERE t.id = ?`,
      [id],
    );
    return (result as TemplateItem) || null;
  }

  async getByProductId(productId: string): Promise<TemplateItem | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      `SELECT t.*, p.name as productName, p.category, p.currentStock, p.expiryDate
       FROM template t 
       JOIN products p ON t.productId = p.id 
       WHERE t.productId = ?`,
      [productId],
    );
    return (result as TemplateItem) || null;
  }

  async create(
    template: Omit<
      TemplateItem,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'productName'
      | 'category'
      | 'currentStock'
      | 'expiryDate'
    >,
  ): Promise<TemplateItem> {
    const db = databaseService.getDatabase();
    const id = `template_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO template (id, productId, idealQuantity, priority, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        template.productId,
        template.idealQuantity || 0,
        template.priority,
        now,
        now,
      ],
    );

    return this.getById(id) as Promise<TemplateItem>;
  }

  async update(
    id: string,
    updates: Partial<
      Omit<
        TemplateItem,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'productName'
        | 'category'
        | 'currentStock'
        | 'expiryDate'
      >
    >,
  ): Promise<TemplateItem> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const fields = [];
    const values = [];

    if (updates.idealQuantity !== undefined) {
      fields.push('idealQuantity = ?');
      values.push(updates.idealQuantity);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE template SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    return this.getById(id) as Promise<TemplateItem>;
  }

  async updateByProductId(
    productId: string,
    updates: Partial<
      Omit<
        TemplateItem,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'productName'
        | 'category'
        | 'currentStock'
        | 'expiryDate'
      >
    >,
  ): Promise<TemplateItem | null> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const fields = [];
    const values = [];

    if (updates.idealQuantity !== undefined) {
      fields.push('idealQuantity = ?');
      values.push(updates.idealQuantity);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(productId);

    await db.runAsync(
      `UPDATE template SET ${fields.join(', ')} WHERE productId = ?`,
      values,
    );

    return this.getByProductId(productId);
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM template WHERE id = ?', [id]);
  }

  async deleteByProductId(productId: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM template WHERE productId = ?', [productId]);
  }

  async upsert(
    template: Omit<
      TemplateItem,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'productName'
      | 'category'
      | 'currentStock'
      | 'expiryDate'
    >,
  ): Promise<TemplateItem> {
    const existing = await this.getByProductId(template.productId);

    if (existing) {
      return this.updateByProductId(template.productId, {
        idealQuantity: template.idealQuantity,
        priority: template.priority,
      }) as Promise<TemplateItem>;
    } else {
      return this.create(template);
    }
  }
}

export const templateRepository = new TemplateRepository();
