use tauri::Manager;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running RetailFlow POS");
}
