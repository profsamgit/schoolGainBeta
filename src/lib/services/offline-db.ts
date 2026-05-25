export interface OfflineDiscard {
  id: string;
  studentInput: string;
  capturedPhotoUri: string; // Base64
  timestamp: string;
  terminalId: string;
  wasteType?: string;
  weightKg: number;
}

export interface FailedDiscard extends OfflineDiscard {
  reason: string;
  failedAt: string;
}

const DB_NAME = 'SchoolGainOfflineDB';
const DB_VERSION = 1;

export class OfflineDB {
  private static db: IDBDatabase | null = null;

  public static async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB is only available in the browser.');
    }
    
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains('pendingOfflineDiscards')) {
          db.createObjectStore('pendingOfflineDiscards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('failedDiscards')) {
          db.createObjectStore('failedDiscards', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  public static async savePendingDiscard(discard: OfflineDiscard): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingOfflineDiscards', 'readwrite');
      const store = transaction.objectStore('pendingOfflineDiscards');
      const request = store.put(discard);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public static async getPendingDiscards(): Promise<OfflineDiscard[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingOfflineDiscards', 'readonly');
      const store = transaction.objectStore('pendingOfflineDiscards');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public static async deletePendingDiscard(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pendingOfflineDiscards', 'readwrite');
      const store = transaction.objectStore('pendingOfflineDiscards');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public static async saveFailedDiscard(failed: FailedDiscard): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('failedDiscards', 'readwrite');
      const store = transaction.objectStore('failedDiscards');
      const request = store.put(failed);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public static async getFailedDiscards(): Promise<FailedDiscard[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('failedDiscards', 'readonly');
      const store = transaction.objectStore('failedDiscards');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}
