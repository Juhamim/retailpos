import { StateStorage } from "zustand/middleware";

// Detect if we are running inside a Tauri container
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && ((window as any).__TAURI__ !== undefined || (window as any).__TAURI_METADATA__ !== undefined);
};

export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // 1. Try local cache in window.localStorage first for immediate availability
    let localVal: string | null = null;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localVal = localStorage.getItem(name);
      } catch (err) {
        console.warn("localStorage read warning:", err);
      }
    }

    // 2. If in Tauri desktop app, attempt to read authoritative native file
    if (isTauri()) {
      try {
        const { readTextFile, exists } = await import("@tauri-apps/api/fs");
        const { join } = await import("@tauri-apps/api/path");
        const { invoke } = await import("@tauri-apps/api/tauri");

        const dbPath = await invoke<string>("get_app_data_path");
        const filePath = await join(dbPath, `${name}.json`);

        if (await exists(filePath)) {
          const fileContent = await readTextFile(filePath);
          if (fileContent) {
            // Keep localStorage updated as cache
            if (typeof window !== "undefined" && window.localStorage) {
              try {
                localStorage.setItem(name, fileContent);
              } catch (_) {}
            }
            return fileContent;
          }
        }
      } catch (e) {
        console.warn("Tauri native storage read fallback for", name, e);
      }
    }

    return localVal;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // 1. Always update localStorage synchronously for instant in-session access
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(name, value);
      } catch (err) {
        console.error("localStorage write error for", name, err);
      }
    }

    // 2. Also persist to native file system if inside Tauri desktop
    if (isTauri()) {
      try {
        const { writeTextFile, createDir } = await import("@tauri-apps/api/fs");
        const { join } = await import("@tauri-apps/api/path");
        const { invoke } = await import("@tauri-apps/api/tauri");

        const dbPath = await invoke<string>("get_app_data_path");
        await createDir(dbPath, { recursive: true });

        const filePath = await join(dbPath, `${name}.json`);
        await writeTextFile(filePath, value);
      } catch (e) {
        console.warn("Tauri native storage write error for", name, e);
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.removeItem(name);
      } catch (err) {
        console.error("localStorage remove error for", name, err);
      }
    }

    if (isTauri()) {
      try {
        const { removeFile, exists } = await import("@tauri-apps/api/fs");
        const { join } = await import("@tauri-apps/api/path");
        const { invoke } = await import("@tauri-apps/api/tauri");

        const dbPath = await invoke<string>("get_app_data_path");
        const filePath = await join(dbPath, `${name}.json`);

        if (await exists(filePath)) {
          await removeFile(filePath);
        }
      } catch (e) {
        console.warn("Tauri native storage remove error for", name, e);
      }
    }
  },
};

