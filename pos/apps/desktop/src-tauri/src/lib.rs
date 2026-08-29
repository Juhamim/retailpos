use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug)]
pub struct BackupFileInfo {
    pub filename: String,
    pub filepath: String,
    pub size_bytes: u64,
    pub created_at: String,
}

fn get_installation_backups_dir(app: &tauri::AppHandle) -> PathBuf {
    // 1. Primary: Current executable directory (the application installation folder)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            let install_backups = parent.join("backups");
            if fs::create_dir_all(&install_backups).is_ok() {
                return install_backups;
            }
        }
    }

    // 2. Secondary: App Data folder
    if let Some(app_data) = app.path_resolver().app_data_dir() {
        let app_data_backups = app_data.join("backups");
        let _ = fs::create_dir_all(&app_data_backups);
        return app_data_backups;
    }

    // 3. Fallback: Working directory
    let cwd_backups = PathBuf::from("backups");
    let _ = fs::create_dir_all(&cwd_backups);
    cwd_backups
}

#[tauri::command]
fn get_app_data_path(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to resolve app data directory")?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_database_path(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to resolve app data directory")?;
    let db_path = path.join("database").join("retailflow.db");
    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_backups_directory_path(app: tauri::AppHandle) -> Result<String, String> {
    let backups_dir = get_installation_backups_dir(&app);
    Ok(backups_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn open_backups_folder(app: tauri::AppHandle) -> Result<bool, String> {
    let backups_dir = get_installation_backups_dir(&app);
    let path_str = backups_dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
        return Ok(true);
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open finder: {}", e))?;
        return Ok(true);
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
        return Ok(true);
    }

    #[allow(unreachable_code)]
    Ok(false)
}

#[tauri::command]
fn open_specific_folder(folder_path: String) -> Result<bool, String> {
    let path = std::path::Path::new(&folder_path);
    if !path.exists() {
        let _ = fs::create_dir_all(path);
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
        return Ok(true);
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open finder: {}", e))?;
        return Ok(true);
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
        return Ok(true);
    }

    #[allow(unreachable_code)]
    Ok(false)
}

#[tauri::command]
fn save_dayend_backup(app: tauri::AppHandle, filename: String, content: String, custom_dir: Option<String>) -> Result<String, String> {
    let backups_dir = if let Some(ref dir) = custom_dir {
        let p = PathBuf::from(dir);
        let _ = fs::create_dir_all(&p);
        p
    } else {
        get_installation_backups_dir(&app)
    };
    
    // Save to target backups directory
    let file_path = backups_dir.join(&filename);
    fs::write(&file_path, &content).map_err(|e| format!("Failed to write backup: {}", e))?;

    // Mirror to installation/app_data folder if custom_dir is set for dual-safety
    let install_dir = get_installation_backups_dir(&app);
    if install_dir != backups_dir {
        let _ = fs::create_dir_all(&install_dir);
        let _ = fs::write(install_dir.join(&filename), &content);
    }

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn list_dayend_backups(app: tauri::AppHandle) -> Result<Vec<BackupFileInfo>, String> {
    let backups_dir = get_installation_backups_dir(&app);
    if !backups_dir.exists() {
        return Ok(Vec::new());
    }

    let mut list = Vec::new();
    if let Ok(entries) = fs::read_dir(backups_dir) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    let fname = entry.file_name().to_string_lossy().to_string();
                    if fname.ends_with(".json") {
                        let created = meta.created().or_else(|_| meta.modified());
                        let created_str = match created {
                            Ok(t) => {
                                let duration = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
                                format!("{}", duration.as_secs())
                            }
                            Err(_) => String::new(),
                        };
                        list.push(BackupFileInfo {
                            filename: fname,
                            filepath: entry.path().to_string_lossy().to_string(),
                            size_bytes: meta.len(),
                            created_at: created_str,
                        });
                    }
                }
            }
        }
    }

    // Sort newest first
    list.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(list)
}

#[tauri::command]
fn get_local_ip_addresses() -> Result<Vec<String>, String> {
    let mut ips = Vec::new();
    ips.push("10.13.115.101".to_string());
    ips.push("127.0.0.1".to_string());
    Ok(ips)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_title("RetailFlow POS").ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_data_path,
            get_database_path,
            get_backups_directory_path,
            open_backups_folder,
            open_specific_folder,
            save_dayend_backup,
            list_dayend_backups,
            get_local_ip_addresses,
        ])
        .run(tauri::generate_context!())
        .expect("error while running RetailFlow POS");
}
