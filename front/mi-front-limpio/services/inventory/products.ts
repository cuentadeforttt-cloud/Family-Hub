import { supabase } from '../../supabase';
import type { Product } from '../../types/inventory';

export interface ProductFilters {
  category?: string;
  search?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
  expired?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductCreateInput {
  name: string;
  category?: string | null;
  description?: string | null;
  currentStock?: number;
  unit?: string | null;
  expiryDate?: string | null;
}

export interface ProductUpdateInput {
  name?: string;
  category?: string | null;
  description?: string | null;
  currentStock?: number;
  unit?: string | null;
  expiryDate?: string | null;
}

export class ProductsService {
  constructor(
    private householdId: string,
    private userId: string
  ) {}

  async getAll(filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('household_id', this.householdId)
      .order('name', { ascending: true });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.lowStock) {
      query = query.lt('current_stock', 1);
    }

    if (filters.expiringSoon) {
      const alertDays = await this.getExpiryAlertDays();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + alertDays);
      query = query
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .gt('expiry_date', new Date().toISOString().split('T')[0]);
    }

    if (filters.expired) {
      query = query
        .not('expiry_date', 'is', null)
        .lt('expiry_date', new Date().toISOString().split('T')[0]);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(this.mapProduct);
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('household_id', this.householdId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapProduct(data) : null;
  }

  async create(input: ProductCreateInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        household_id: this.householdId,
        name: input.name,
        category: input.category,
        description: input.description,
        current_stock: input.currentStock || 0,
        unit: input.unit || 'unidad',
        expiry_date: input.expiryDate,
        created_by: this.userId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapProduct(data);
  }

  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.category !== undefined) updates.category = input.category;
    if (input.description !== undefined) updates.description = input.description;
    if (input.currentStock !== undefined) updates.current_stock = input.currentStock;
    if (input.unit !== undefined) updates.unit = input.unit;
    if (input.expiryDate !== undefined) updates.expiry_date = input.expiryDate;

    const { data, error } = await supabase
      .from('products')
      .update(updates as any)
      .eq('id', id)
      .eq('household_id', this.householdId)
      .select()
      .single();

    if (error) throw error;
    return this.mapProduct(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('household_id', this.householdId);

    if (error) throw error;
  }

  async updateStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', id)
      .eq('household_id', this.householdId);

    if (error) throw error;
  }

  async adjustStock(id: string, delta: number): Promise<number> {
    const product = await this.getById(id);
    if (!product) throw new Error('Product not found');

    const newStock = Math.max(0, product.currentStock + delta);
    await this.updateStock(id, newStock);
    return newStock;
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('household_id', this.householdId)
      .not('category', 'is', null);

    if (error) throw error;
    const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))];
    return categories.sort();
  }

  async getExpiringSoon(days: number = 3): Promise<Product[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getAll({
      expiringSoon: true,
      limit: 50,
    });
  }

  async getLowStock(): Promise<Product[]> {
    return this.getAll({ lowStock: true });
  }

  async getExpired(): Promise<Product[]> {
    return this.getAll({ expired: true });
  }

  private async getExpiryAlertDays(): Promise<number> {
    const { data } = await supabase
      .from('inventory_settings')
      .select('value')
      .eq('household_id', this.householdId)
      .eq('key', 'expiry_alert_days')
      .maybeSingle();

    return data ? parseInt(data.value, 10) : 3;
  }

  private mapProduct(row: any): Product {
    return {
      id: row.id,
      householdId: row.household_id,
      name: row.name,
      category: row.category,
      description: row.description,
      currentStock: row.current_stock,
      unit: row.unit,
      expiryDate: row.expiry_date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export function createProductsService(householdId: string, userId: string): ProductsService {
  return new ProductsService(householdId, userId);
}