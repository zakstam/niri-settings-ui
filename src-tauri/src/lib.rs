mod commands;
mod config;

use std::sync::Mutex;

use commands::config::ConfigState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_path = dirs::config_dir()
        .expect("Could not find config directory")
        .join("niri")
        .join("config.kdl");

    let (parsed_config, main_doc, included_docs) = if config_path.exists() {
        config::parser::parse_config(&config_path).expect("Failed to parse niri config")
    } else {
        // If no config file exists, start with defaults
        (
            config::types::NiriConfig::default(),
            kdl::KdlDocument::new(),
            Vec::new(),
        )
    };

    let state = ConfigState {
        config: parsed_config,
        main_doc,
        included_docs,
        config_path,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(Mutex::new(state))
        .invoke_handler(tauri::generate_handler![
            commands::config::read_config,
            commands::config::write_config,
            commands::config::get_config_diff,
            commands::config::get_outputs,
            commands::config::get_workspaces,
            commands::config::reload_niri,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
