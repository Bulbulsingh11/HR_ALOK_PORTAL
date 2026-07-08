import { HRRecord } from './hrDataBridge';

const DB_NAME = 'HR_Database';
const STORE_NAME = 'ImportedData';
const DATA_KEY = 'imported_records';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch (e) {
          reject(e);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
}

export async function saveImportedData(data: HRRecord[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, DATA_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to memory only behavior:', err);
  }
}

export async function loadImportedData(): Promise<HRRecord[] | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(DATA_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.warn('IndexedDB load failed, falling back to memory only behavior:', err);
    return null;
  }
}

export async function clearImportedData(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(DATA_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (err) {
    console.warn('IndexedDB clear failed:', err);
  }
}
