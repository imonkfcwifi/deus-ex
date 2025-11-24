
import { Faction, LogEntry, PendingDecision, WorldStats, Person } from "../types";

const DB_NAME = "DeusExDB";
const STORE_NAME = "saves";
const DB_VERSION = 1;
const SAVE_KEY = "current_save";

export interface GameState {
  id: string; // 'current_save'
  stats: WorldStats;
  factions: Faction[];
  figures: Person[]; // Added figures
  logs: LogEntry[];
  pendingDecision: PendingDecision | null;
  lastSaved: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const storageService = {
  saveGame: async (
    stats: WorldStats,
    factions: Faction[],
    figures: Person[],
    logs: LogEntry[],
    pendingDecision: PendingDecision | null
  ): Promise<boolean> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const state: GameState = {
        id: SAVE_KEY,
        stats,
        factions,
        figures,
        logs,
        pendingDecision,
        lastSaved: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(state);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (e) {
      console.error("Failed to save game to IndexedDB:", e);
      return false;
    }
  },

  loadGame: async (): Promise<GameState | null> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      return new Promise<GameState | null>((resolve, reject) => {
        const request = store.get(SAVE_KEY);
        request.onsuccess = () => {
            resolve(request.result as GameState || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Failed to load game from IndexedDB:", e);
      return null;
    }
  },

  clearGame: async (): Promise<boolean> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(SAVE_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return true;
    } catch (e) {
      console.error("Failed to clear game:", e);
      return false;
    }
  },
};
