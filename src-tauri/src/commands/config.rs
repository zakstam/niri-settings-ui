use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;

use kdl::KdlDocument;

use crate::config::types::NiriConfig;
use crate::config::writer;

pub struct ConfigState {
    pub config: NiriConfig,
    pub main_doc: KdlDocument,
    pub included_docs: Vec<(PathBuf, KdlDocument)>,
    pub config_path: PathBuf,
}

#[tauri::command]
pub fn read_config(state: tauri::State<'_, Mutex<ConfigState>>) -> Result<NiriConfig, String> {
    let guard = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(guard.config.clone())
}

#[tauri::command]
pub fn write_config(
    config: NiriConfig,
    state: tauri::State<'_, Mutex<ConfigState>>,
) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Clone old config before mutable borrow
    let old_config = guard.config.clone();
    let config_path = guard.config_path.clone();

    // Destructure to satisfy borrow checker (two &mut fields)
    let ConfigState {
        ref mut main_doc,
        ref mut included_docs,
        ..
    } = *guard;

    // Apply changes to the KDL AST
    writer::apply_changes(
        main_doc,
        included_docs,
        &old_config,
        &config,
    )
    .map_err(|e| format!("Failed to apply changes: {}", e))?;

    // Write to disk (ensure_v1 is called inside to keep niri-compatible format)
    writer::write_config(main_doc, &config_path, included_docs)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    // Update the stored config
    guard.config = config;

    Ok(())
}

#[tauri::command]
pub fn get_config_diff(
    config: NiriConfig,
    state: tauri::State<'_, Mutex<ConfigState>>,
) -> Result<String, String> {
    let guard = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Clone the current documents
    let mut doc_copy = guard.main_doc.clone();
    let mut included_copy = guard.included_docs.clone();

    // Apply changes to the copy
    writer::apply_changes(&mut doc_copy, &mut included_copy, &guard.config, &config)
        .map_err(|e| format!("Failed to apply changes: {}", e))?;

    // Ensure v1 format for accurate diff preview
    doc_copy.ensure_v1();
    let original = guard.main_doc.to_string();
    let modified = doc_copy.to_string();
    let diff = writer::generate_diff(&original, &modified);

    Ok(diff)
}

#[tauri::command]
pub fn get_outputs() -> Result<serde_json::Value, String> {
    let output = Command::new("niri")
        .args(["msg", "--json", "outputs"])
        .output()
        .map_err(|e| format!("Failed to run niri: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("niri msg outputs failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let value: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(value)
}

#[tauri::command]
pub fn get_workspaces() -> Result<serde_json::Value, String> {
    let output = Command::new("niri")
        .args(["msg", "--json", "workspaces"])
        .output()
        .map_err(|e| format!("Failed to run niri: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("niri msg workspaces failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let value: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(value)
}

#[tauri::command]
pub fn reload_niri() -> Result<(), String> {
    let output = Command::new("niri")
        .args(["msg", "action", "load-config-file"])
        .output()
        .map_err(|e| format!("Failed to run niri: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("niri reload failed: {}", stderr));
    }

    Ok(())
}
