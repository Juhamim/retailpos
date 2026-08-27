import { invoke } from "@tauri-apps/api/tauri";

export async function getAppDataPath(): Promise<string> {
  return await invoke<string>("get_app_data_path");
}

export async function getDatabasePath(): Promise<string> {
  return await invoke<string>("get_database_path");
}