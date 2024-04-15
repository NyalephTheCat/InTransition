import { Serializable } from "./serialize";

export interface ObjectStoreConfig {
  name: string;
  keyPath: string;
}

export class DatabaseManager<T extends Serializable> {
  private db: IDBDatabase | null = null;

  constructor(private name: string, private version: number, private objectStores: ObjectStoreConfig[], private emptyValue: T) {}

  private async ensureDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      return this.open();
    }
    return this.db;
  }

  private async open(): Promise<IDBDatabase> {
    if (!window.indexedDB) {
      throw new Error('IndexedDB is not supported by this browser.');
    }

    const request = window.indexedDB.open(this.name, this.version);
    return new Promise((resolve, reject) => {
      request.onerror = (event: Event) => {
        console.error("Database error:", (event.target as IDBRequest).error?.message);
        reject(new Error('Database error: ' + (event.target as IDBRequest).error?.message));
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBRequest<IDBDatabase>).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        this.objectStores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, { keyPath: store.keyPath });
            console.log(`Creating object store: ${store.name}`);
          }
        });
      };
    });
  }

  private close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async addItem(storeName: string, item: T): Promise<void> {
    const serializedItem = JSON.stringify(item);
    return this.performWriteOperation(storeName, serializedItem, 'add');
  }

  async updateItem(storeName: string, item: T): Promise<void> {
    const serializedItem = JSON.stringify(item);
    return this.performWriteOperation(storeName, serializedItem, 'put');
  }

  async deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
    return this.performWriteOperation(storeName, key, 'delete');
  }

  async getItem(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.performReadOperation(storeName, key, 'get');
  }

  async getAll(storeName: string): Promise<T[]> {
    return this.performReadOperation(storeName, null, 'getAll');
  }

  async clear(): Promise<void> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction(this.objectStores.map(os => os.name), 'readwrite');
      const clearPromises = this.objectStores.map(storeConfig => {
        const store = transaction.objectStore(storeConfig.name);
        return store.clear();
      });

      return Promise.all(clearPromises).then(() => {
        console.log("All stores cleared successfully.");
      });
    } finally {
      this.close();
    }
  }

  private async performWriteOperation(storeName: string, data: any, operation: 'add' | 'put' | 'delete'): Promise<void> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = (operation === 'delete') ? store.delete(data) : store[operation](data);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`Item ${operation}ed successfully.`);
          resolve();
        };

        request.onerror = (event: Event) => {
          console.error(`Error ${operation}ing item:`, (event.target as IDBRequest).error?.message);
          reject(new Error(`Error ${operation}ing item: ` + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
  }

  private async performReadOperation(storeName: string, key: any, operation: 'get' | 'getAll'): Promise<any> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = (operation === 'get') ? store.get(key) : store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (operation === 'getAll') {
            resolve(result.map((res: any) => JSON.parse(res)));
          } else {
            resolve(JSON.parse(result));
          }
          console.log(`Item(s) ${operation} successfully.`);
        };

        request.onerror = (event: Event) => {
          console.error(`Error ${operation} item:`, (event.target as IDBRequest).error?.message);
          reject(new Error(`Error ${operation} item: ` + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
  }
}
