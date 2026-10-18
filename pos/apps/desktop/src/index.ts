import { invoke } from "@tauri-apps/api/tauri";
import { checkUpdate, installUpdate, onUpdaterEvent, UpdateResult, UpdateStatusResult } from "@tauri-apps/api/updater";
import { getVersion } from "@tauri-apps/api/app";

export async function getAppDataPath(): Promise<string> {
  return await invoke<string>("get_app_data_path");
}

export async function getDatabasePath(): Promise<string> {
  return await invoke<string>("get_database_path");
}

export async function getAppVersion(): Promise<string> {
  try {
    return await getVersion();
  } catch {
    return "1.0.0";
  }
}

export async function checkForDesktopUpdate(): Promise<UpdateResult> {
  return await checkUpdate();
}

export async function installDesktopUpdate(): Promise<void> {
  return await installUpdate();
}

export async function listenToDesktopUpdateEvents(
  handler: (status: UpdateStatusResult) => void
) {
  return await onUpdaterEvent(handler);
}