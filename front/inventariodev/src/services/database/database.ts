import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly DATABASE_VERSION = 2; // Incrementar cuando haya cambios de esquema

  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      console.log('OPEN database: StocklyDB.db');
      this.db = await SQLite.openDatabaseAsync('StocklyDB.db');
      console.log(
        'SQLite.open({"name":"StocklyDB.db","location":"default","dblocation":"nosync"})',
      );

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.db = null;
      this.initPromise = null;
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Crear tabla de versiones si no existe
    await this.createVersionTable();

    // Obtener versión actual de la base de datos
    const currentVersion = await this.getDatabaseVersion();

    if (currentVersion === 0) {
      // Base de datos nueva
      console.log('Creating new database...');
      await this.createAllTables();
      await this.setDatabaseVersion(this.DATABASE_VERSION);
    } else if (currentVersion < this.DATABASE_VERSION) {
      // Necesita migración
      console.log(
        `Database needs migration from version ${currentVersion} to ${this.DATABASE_VERSION}`,
      );
      await this.migrateDatabase(currentVersion, this.DATABASE_VERSION);
    } else {
      console.log(`Database is up to date (version ${currentVersion})`);
    }
  }

  private async createVersionTable(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS database_version (
        id INTEGER PRIMARY KEY,
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  private async getDatabaseVersion(): Promise<number> {
    if (!this.db) return 0;

    try {
      const result = await this.db.getFirstAsync(`
        SELECT version FROM database_version 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);

      return result ? (result as any).version : 0;
    } catch (error) {
      return 0;
    }
  }

  private async setDatabaseVersion(version: number): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT INTO database_version (version, updated_at) VALUES (?, ?)`,
      version,
      new Date().toISOString(),
    );
  }

  private async migrateDatabase(
    fromVersion: number,
    toVersion: number,
  ): Promise<void> {
    if (!this.db) return;

    console.log(
      `Migrating database from version ${fromVersion} to ${toVersion}`,
    );

    // Migración de versión 1 a 2: Hacer category nullable
    if (fromVersion < 2) {
      await this.migrateCategoryToNullable();
      await this.setDatabaseVersion(2);
    }

    // Aquí se pueden agregar más migraciones en el futuro
    // if (fromVersion < 3) {
    //   await this.migrateToVersion3();
    //   await this.setDatabaseVersion(3);
    // }
  }

  private async migrateCategoryToNullable(): Promise<void> {
    if (!this.db) return;

    try {
      console.log('Migrating category column to nullable...');

      // Crear tabla temporal con la nueva estructura
      await this.db.execAsync(`
        CREATE TABLE products_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
          description TEXT,
          currentStock INTEGER DEFAULT 0,
          expiryDate TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Copiar datos existentes
      await this.db.execAsync(`
        INSERT INTO products_new (id, name, category, description, currentStock, expiryDate, createdAt, updatedAt)
        SELECT id, name, 
               CASE WHEN category = 'Sin categoría' THEN NULL ELSE category END,
               description, currentStock, expiryDate, createdAt, updatedAt
        FROM products;
      `);

      // Eliminar tabla antigua y renombrar la nueva
      await this.db.execAsync('DROP TABLE products');
      await this.db.execAsync('ALTER TABLE products_new RENAME TO products');

      console.log('Category migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  private async createAllTables(): Promise<void> {
    if (!this.db) return;

    // Eliminar tablas existentes
    await this.db.execAsync('DROP TABLE IF EXISTS products');
    await this.db.execAsync('DROP TABLE IF EXISTS template');
    await this.db.execAsync('DROP TABLE IF EXISTS stock_movements');
    await this.db.execAsync('DROP TABLE IF EXISTS settings');

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        currentStock INTEGER DEFAULT 0,
        expiryDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;

    const createTemplateTable = `
      CREATE TABLE IF NOT EXISTS template (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        idealQuantity INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );
    `;

    const createStockMovementsTable = `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'expired')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;

    await this.db.execAsync(createProductsTable);
    await this.db.execAsync(createTemplateTable);
    await this.db.execAsync(createStockMovementsTable);
    await this.db.execAsync(createSettingsTable);

    // Insert default settings
    await this.insertDefaultSettings();
  }

  private async insertDefaultSettings(): Promise<void> {
    if (!this.db) return;

    const defaultSettings = [
      { key: 'expiryAlertDays', value: '3' },
      { key: 'lowStockAlert', value: 'true' },
      { key: 'notificationsEnabled', value: 'true' },
    ];

    for (const setting of defaultSettings) {
      const checkQuery = 'SELECT COUNT(*) as count FROM settings WHERE key = ?';
      const result = await this.db.getFirstAsync(checkQuery, [setting.key]);
      const count = result?.count || 0;

      if (count === 0) {
        const insertQuery = `
          INSERT INTO settings (id, key, value, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
        `;
        const now = new Date().toISOString();
        const id = `setting_${setting.key}_${Date.now()}`;
        await this.db.runAsync(insertQuery, [
          id,
          setting.key,
          setting.value,
          now,
          now,
        ]);
      }
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.closeAsync();
        console.log('Database closed successfully');
      } catch (error) {
        console.error('Error closing database:', error);
      } finally {
        this.db = null;
        this.initPromise = null;
      }
    }
  }

  async reset(): Promise<void> {
    await this.close();
    await this.init();
  }
}

export const databaseService = new DatabaseService();
