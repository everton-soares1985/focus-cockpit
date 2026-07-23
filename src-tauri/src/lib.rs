mod backup;
mod credential_storage;
mod native_files;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        tauri_plugin_sql::Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/01_initial.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 2,
            description: "add_domain_rules",
            sql: include_str!("../migrations/02_domain_rules.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 3,
            description: "add_write_safety_rules",
            sql: include_str!("../migrations/03_write_safety.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 4,
            description: "add_personal_books_library",
            sql: include_str!("../migrations/04_books.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:painel.sqlite3", migrations)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            backup::discard_backup_snapshot,
            backup::export_backup,
            backup::inspect_backup,
            backup::prepare_backup_snapshot,
            backup::restore_backup,
            credential_storage::discard_credential_import,
            credential_storage::export_credential,
            credential_storage::import_credential,
            credential_storage::open_credential,
            credential_storage::read_credential_bytes,
            native_files::inspect_saved_target,
            native_files::open_saved_target
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
