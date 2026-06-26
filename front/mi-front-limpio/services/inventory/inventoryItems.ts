import { supabase } from '../../supabase';
import type { InventoryItem } from '../../types/inventory';

export interface InventoryItemCreateInput {
  productId: string;
  quantity: number;
  expiryDate?: string | null;
  purchaseDate?: string | null;
  notes?: string | null;
}

export interface InventoryItemUpdateInput {
  quantity?: number;
  expiryDate?: string | null;
  purchaseDate?: string | null;
  notes?: string | null;
}

export class InventoryItemsService {
  constructor(
    private householdId: string,
    private userId: string
  ) {}

  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        products!inner(name, category)
      `)
      .eq('household_id', this.householdId)
      .order('expiry_date', { ascending: true, nullsFirst: true });

    if (error) throw error;
    return (data || []).map(this.mapInventoryItem);
  }

  async getByProductId(productId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        products!inner(name, category)
      `)
      .eq('household_id', this.householdId)
      .eq('product_id', productId)
      .order('expiry_date', { ascending: true, nullsFirst: true });

    if (error) throw error;
    return (data || []).map(this.mapInventoryItem);
  }

  async getById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        products!inner(name, category)
      `)
      .eq('id', id)
      .eq('household_id', this.householdId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? this.mapInventoryItem(data) : null;
  }

  async create(input: InventoryItemCreateInput): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        household_id: this.householdId,
        product_id: input.productId,
        quantity: input.quantity,
        expiry_date: input.expiryDate,
        purchase_date: input.purchaseDate || new Date().toISOString().split('T')[0],
        notes: input.notes,
        created_by: this.userId,
      })
      .select(`
        *,
        products!inner(name, category)
      `)
      .single();

    if (error) throw error;
    return this.mapInventoryItem(data);
  }

  async update(id: string, input: InventoryItemUpdateInput): Promise<InventoryItem> {
    const updates: Record<string, unknown> = {};
    if (input.quantity !== undefined) updates.quantity = input.quantity;
    if (input.expiryDate !== undefined) updates.expiry_date = input.expiryDate;
    if (input.purchaseDate !== undefined) updates.purchase_date = input.purchaseDate;
    if (input.notes !== undefined) updates.notes = input.notes;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates as any)
      .eq('id', id)
      .eq('household_id', this.householdId)
      .select(`
        *,
        products!inner(name, category)
      `)
      .single();

    if (error) throw error;
    return this.mapInventoryItem(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('household_id', this.householdId);

    if (error) throw error;
  }

  async consumeQuantity(inventoryItemId: string, quantity: number): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('id', inventoryItemId)
      .eq('household_id', this.householdId)
      .single();

    if (fetchError) throw fetchError;
    if (!item) throw new Error('Inventory item not found');

    const currentQuantity = item.quantity;
    const newQuantity = Math.max(0, currentQuantity - quantity);

    if (newQuantity === 0) {
      await this.delete(inventoryItemId);
    } else {
      await this.update(inventoryItemId, { quantity: newQuantity });
    }
  }

  async consumeProductFIFO(productId: string, quantity: number): Promise<void> {
    const items = await this.getByProductId(productId);
    const sortedItems = items.filter(i => i.quantity > 0).sort(
      (a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
    );

    let remainingQuantity = quantity;

    for (const item of sortedItems) {
      if (remainingQuantity <= 0) break;
      const consumeFromThisItem = Math.min(remainingQuantity, item.quantity);
      await this.consumeQuantity(item.id, consumeFromThisItem);
      remainingQuantity -= consumeFromThisItem;
    }

    if (remainingQuantity > 0) {
      throw new Error(`Insufficient stock. Missing ${remainingQuantity} units.`);
    }
  }

  async getExpiringSoon(days: number = 3): Promise<InventoryItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        products!inner(name, category)
      `)
      .eq('household_id', this.householdId)
      .gt('quantity', 0)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', todayStr)
      .lte('expiry_date', futureDateStr)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapInventoryItem);
  }

  async getLowStock(): Promise<Array<InventoryItem & { minQuantity: number }>> {
    const { data: templates, error: templateError } = await supabase
      .from('inventory_templates')
      .select('product_id, ideal_quantity')
      .eq('household_id', this.householdId);

    if (templateError) throw templateError;

    const templateMap = new Map(
      (templates || []).map(t => [t.product_id, t.ideal_quantity])
    );

    const { data: items, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        products!inner(name, category, current_stock)
      `)
      .eq('household_id', this.householdId)
      .gt('quantity', 0);

    if (error) throw error;

    const productQuantities = new Map<string, number>();
    for (const item of items || []) {
      const total = (productQuantities.get(item.product_id) || 0) + item.quantity;
      productQuantities.set(item.product_id, total);
    }

    return (items || [])
      .map(item => ({
        ...this.mapInventoryItem(item),
        minQuantity: templateMap.get(item.product_id) || 0,
      }))
      .filter(item => {
        const total = productQuantities.get(item.productId) || 0;
        const min = templateMap.get(item.productId) || 0;
        return min > 0 && total < min;
      });
  }

  private mapInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      householdId: row.household_id,
      productId: row.product_id,
      quantity: row.quantity,
      expiryDate: row.expiry_date,
      purchaseDate: row.purchase_date,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      productName: row.products?.name,
      category: row.products?.category,
    };
  }
}

export function createInventoryItemsService(householdId: string, userId: string): InventoryItemsService {
  return new InventoryItemsService(householdId, userId);
}