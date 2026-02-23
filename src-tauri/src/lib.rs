mod commands;
mod error;
mod models;
mod services;

use commands::auth::VaultState;
use services::database::Database;
use services::storage::StorageService;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");

            let db_path = app_data_dir.join("vault.db");
            let db = Database::new(&db_path).expect("Failed to initialize database");
            app.manage(db);

            let storage =
                StorageService::new(&app_data_dir).expect("Failed to initialize storage");
            app.manage(storage);

            let vault_state = VaultState {
                crypto: Mutex::new(None),
            };
            app.manage(vault_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::is_vault_initialized,
            commands::auth::setup_master_password,
            commands::auth::unlock_vault,
            commands::auth::lock_vault,
            commands::auth::is_vault_unlocked,
            // Files
            commands::files::encrypt_file,
            commands::files::decrypt_file,
            commands::files::list_files,
            commands::files::delete_file,
            commands::files::get_file_info,
            // Notes
            commands::notes::save_note,
            commands::notes::get_note,
            commands::notes::list_notes,
            commands::notes::delete_note,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
