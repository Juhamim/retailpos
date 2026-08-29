import { StateStorage } from "zustand/middleware";

// Detect if we are running inside a Tauri container
const isTauri = (): boolean => {
  return typeof window !== "undefined" && (window as any).__TAURI__ !== undefined;
};

export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isTauri()) {
      try {
        const { readTextFile, exists } = await import("@tauri-apps/api/fs");
        const { join } = await import("@tauri-apps/api/path");
        const { invoke } = await import("@tauri-apps/api/tauri");
        
        const dbPath = await invoke<string>("get_app_data_path");
        const filePath = await join(dbPath, `${name}.json`);
        
        if (await exists(filePath)) {
          return await readTextFile(filePath);
        }
      } catch (e) {
        console.error("Tauri storage read error for", name, e);
      }
    }
    // Fallback to localStorage in web browsers
    if (typeof window !== "undefined") {
      return localStorage.getItem(name);
    }
    return null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (isTauri()) {
      try {
        const { writeTextFile, createDir } = await import("@tauri-apps/api/fs");
        const { join } = await import("@tauri-apps/api/path");
        const { invoke } = await import("@tauri-apps/api/tauri");
        
        const dbPath = await invoke<string>("get_app_data_path");
        await createDir(dbPath, { recursive: true });
        
        const filePath = await join(dbPath, `${name}.json`);
        await writeTextFile(filePath, value);
        return;
      } catch (e) {
        console.error("Tauri storage write error for", name, e);
      }
    }
    // Fallback to localStorage in web browsers
    if (typeof window !== "undefined") {
      localStorage.setItem(name, value);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (isTauri()) {
      try {
        const { removeFile, exists } = await import("@tauri-apps/api/fs");
        const { join } = await import("@tauri-apps/api/path");
        const { invoke } = await import("@tauri-apps/api/tauri");
        
        const dbPath = await invoke<string>("get_app_data_path");
        const filePath = await join(dbPath, `${name}.json`);
        
        if (await exists(filePath)) {
          await removeFile(filePath);
          return;
        }
      } catch (e) {
        console.error("Tauri storage remove error for", name, e);
      }
    }
    // Fallback to localStorage in web browsers
    if (typeof window !== "undefined") {
      localStorage.removeItem(name);
    }
  }
};
