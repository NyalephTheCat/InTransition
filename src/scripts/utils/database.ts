export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB is not supported by this browser.');
    }
    const request = window.indexedDB.open('NarrativeDatabase', 1);

    request.onerror = (event: any) => {
      reject('Database error: ' + event.target.errorCode);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('storylets')) {
        db.createObjectStore('storylets', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
  });
}

export function clearDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB is not supported by this browser.');
    }
    const request = window.indexedDB.deleteDatabase('NarrativeDatabase');

    request.onerror = (event: any) => {
      reject('Database error: ' + event.target.errorCode);
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
  });
}