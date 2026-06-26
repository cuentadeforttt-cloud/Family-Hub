import { supabase } from '../../supabase';
import type { InventorySetting } from '../../types/inventory';

export class InventorySettingsService {
  constructor(
    private householdId: string,
    private userId: string
  ) {}

  async get(key: string, userSpecific = true): Promise<string | null> {
    const userId = userSpecific ? this.userId : null;

    const query = supabase
      .from('inventory_settings')
      .select('value')
      .eq('household_id', this.householdId)
      .eq('key', key);

    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.is('user_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data?.value || null;
  }

  async set(key: string, value: string, userSpecific = true): Promise<void> {
    const userId = userSpecific ? this.userId : null;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('inventory_settings')
      .upsert({
        household_id: this.householdId,
        user_id: userId,
        key,
        value,
        updated_at: now,
      }, {
        onConflict: 'household_id,user_id,key',
      });

    if (error) throw error;
  }

  async getAll(): Promise<InventorySetting[]> {
    const { data, error } = await supabase
      .from('inventory_settings')
      .select('*')
      .eq('household_id', this.householdId)
      .or(`user_id.eq.${this.userId},user_id.is.null`)
      .order('key', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapSetting);
  }

  async delete(key: string, userSpecific = true): Promise<void> {
    const userId = userSpecific ? this.userId : null;

    const query = supabase
      .from('inventory_settings')
      .delete()
      .eq('household_id', this.householdId)
      .eq('key', key);

    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.is('user_id', null);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async getExpiryAlertDays(): Promise<number> {
    const value = await this.get('expiry_alert_days', false);
    return value ? parseInt(value, 10) : 3;
  }

  async setExpiryAlertDays(days: number): Promise<void> {
    await this.set('expiry_alert_days', days.toString(), false);
  }

  async getLowStockAlert(): Promise<boolean> {
    const value = await this.get('low_stock_alert', false);
    return value === 'true';
  }

  async setLowStockAlert(enabled: boolean): Promise<void> {
    await this.set('low_stock_alert', enabled.toString(), false);
  }

  async getNotificationsEnabled(): Promise<boolean> {
    const value = await this.get('notifications_enabled', true);
    return value !== 'false';
  }

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await this.set('notifications_enabled', enabled.toString(), true);
  }

  private mapSetting(row: any): InventorySetting {
    return {
      id: row.id,
      householdId: row.household_id,
      userId: row.user_id,
      key: row.key,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export function createInventorySettingsService(householdId: string, userId: string): InventorySettingsService {
  return new InventorySettingsService(householdId, userId);
}