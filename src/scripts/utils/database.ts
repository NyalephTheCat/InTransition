export interface ObjectStoreConfig {
  name: string;
  keyPath: string;
}

export class DatabaseManager<T> {
  private db: IDBDatabase | null = null;

  constructor(private name: string, private version: number, private objectStores: ObjectStoreConfig[]) {}

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
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Item added successfully.");
          resolve();
        };

        request.onerror = (event: Event) => {
          console.error("Error adding item:", (event.target as IDBRequest).error?.message);
          reject(new Error('Error adding item: ' + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
  }

  async getItem(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Item retrieved successfully.");
          resolve(request.result);
        };

        request.onerror = (event: Event) => {
          console.error("Error retrieving item:", (event.target as IDBRequest).error?.message);
          reject(new Error('Error retrieving item: ' + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
  }

  async updateItem(storeName: string, item: T): Promise<void> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Item updated successfully.");
          resolve();
        };

        request.onerror = (event: Event) => {
          console.error("Error updating item:", (event.target as IDBRequest).error?.message);
          reject(new Error('Error updating item: ' + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
  }

  async deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Item deleted successfully.");
          resolve();
        };

        request.onerror = (event: Event) => {
          console.error("Error deleting item:", (event.target as IDBRequest).error?.message);
          reject(new Error('Error deleting item: ' + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
  }

  async getAll(storeName: string): Promise<T[]> {
    try {
      await this.ensureDatabase();
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("All items retrieved successfully.");
          resolve(request.result);
        };

        request.onerror = (event: Event) => {
          console.error("Error retrieving all items:", (event.target as IDBRequest).error?.message);
          reject(new Error('Error retrieving all items: ' + (event.target as IDBRequest).error?.message));
        };
      });
    } finally {
      this.close();
    }
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
}
