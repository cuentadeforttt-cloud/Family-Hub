import { supabase } from '../../supabase';
import type { InventoryTemplate } from '../../types/inventory';

export interface TemplateCreateInput {
  productId: string;
  idealQuantity: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface TemplateUpdateInput {
  idealQuantity?: number;
  priority?: 'high' | 'medium' | 'low';
}

export class TemplatesService {
  constructor(
    private householdId: string,
    private userId: string
  ) {}

  async getAll(): Promise<InventoryTemplate[]> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .select(`
        *,
        products!inner(name, category, current_stock)
      `)
      .eq('household_id', this.householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapTemplate);
  }

  async getByProductId(productId: string): Promise<InventoryTemplate | null> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .select(`
        *,
        products!inner(name, category, current_stock)
      `)
      .eq('household_id', this.householdId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapTemplate(data) : null;
  }

  async create(input: TemplateCreateInput): Promise<InventoryTemplate> {
    const { data, error } = await supabase
      .from('inventory_templates')
      .upsert({
        household_id: this.householdId,
        product_id: input.productId,
        ideal_quantity: input.idealQuantity,
        priority: input.priority || 'medium',
        created_by: this.userId,
      }, {
        onConflict: 'household_id,product_id',
      })
      .select(`
        *,
        products!inner(name, category, current_stock)
      `)
      .single();

    if (error) throw error;
    return this.mapTemplate(data);
  }

  async update(id: string, input: TemplateUpdateInput): Promise<InventoryTemplate> {
    const updates: Record<string, unknown> = {};
    if (input.idealQuantity !== undefined) updates.ideal_quantity = input.idealQuantity;
    if (input.priority !== undefined) updates.priority = input.priority;

    const { data, error } = await supabase
      .from('inventory_templates')
      .update(updates as any)
      .eq('id', id)
      .eq('household_id', this.householdId)
      .select(`
        *,
        products!inner(name, category, current_stock)
      `)
      .single();

    if (error) throw error;
    return this.mapTemplate(data);
  }

  async upsert(input: TemplateCreateInput): Promise<InventoryTemplate> {
    return this.create(input);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_templates')
      .delete()
      .eq('id', id)
      .eq('household_id', this.householdId);

    if (error) throw error;
  }

  async deleteByProductId(productId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_templates')
      .delete()
      .eq('product_id', productId)
      .eq('household_id', this.householdId);

    if (error) throw error;
  }

  private mapTemplate(row: any): InventoryTemplate {
    return {
      id: row.id,
      householdId: row.household_id,
      productId: row.product_id,
      idealQuantity: row.ideal_quantity,
      priority: row.priority,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      productName: row.products?.name,
      category: row.products?.category,
      currentStock: row.products?.current_stock,
    };
  }
}

export function createTemplatesService(householdId: string, userId: string): TemplatesService {
  return new TemplatesService(householdId, userId);
}