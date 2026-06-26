import { databaseService } from '../database/database';

export interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export class SettingsRepository {
  async get(key: string): Promise<string | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );
    return result?.value || null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    // Verificar si existe
    const existing = await db.getFirstAsync(
      'SELECT id FROM settings WHERE key = ?',
      [key],
    );

    if (existing) {
      // Actualizar
      await db.runAsync(
        'UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?',
        [value, now, key],
      );
    } else {
      // Insertar
      const id = `setting_${key}_${Date.now()}`;
      await db.runAsync(
        'INSERT INTO settings (id, key, value, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [id, key, value, now, now],
      );
    }
  }

  async getAll(): Promise<Setting[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM settings ORDER BY key ASC',
    );
    return results as Setting[];
  }

  async delete(key: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
  }
}

export const settingsRepository = new SettingsRepository();
