use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const BLOCKED_EXTENSIONS: [&str; 10] = [
    "exe", "msi", "bat", "cmd", "ps1", "vbs", "js", "jar", "scr", "com",
];

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TargetType {
    File,
    Folder,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedTargetStatus {
    exists: bool,
    target_type_matches: bool,
    blocked: bool,
}

#[derive(Debug, Serialize)]
pub struct NativeFileError {
    code: &'static str,
    message: String,
}

impl NativeFileError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

fn has_blocked_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            BLOCKED_EXTENSIONS
                .iter()
                .any(|blocked| extension.eq_ignore_ascii_case(blocked))
        })
        .unwrap_or(false)
}

fn canonical_target(path: &str, target_type: &TargetType) -> Result<PathBuf, NativeFileError> {
    let requested = PathBuf::from(path);
    let canonical = requested.canonicalize().map_err(|_| {
        NativeFileError::new(
            "target_not_found",
            "O arquivo ou pasta não foi encontrado. Use Relocalizar para atualizar o caminho.",
        )
    })?;
    let metadata = canonical.metadata().map_err(|_| {
        NativeFileError::new(
            "target_unavailable",
            "O destino existe, mas não pôde ser acessado.",
        )
    })?;

    match target_type {
        TargetType::File if !metadata.is_file() => {
            return Err(NativeFileError::new(
                "target_type_mismatch",
                "O caminho cadastrado não aponta para um arquivo.",
            ));
        }
        TargetType::Folder if !metadata.is_dir() => {
            return Err(NativeFileError::new(
                "target_type_mismatch",
                "O caminho cadastrado não aponta para uma pasta.",
            ));
        }
        _ => {}
    }

    if matches!(target_type, TargetType::File) && has_blocked_extension(&canonical) {
        return Err(NativeFileError::new(
            "blocked_extension",
            "Esse tipo de arquivo não pode ser aberto pelo Focus Cockpit.",
        ));
    }

    Ok(canonical)
}

#[tauri::command]
pub fn inspect_saved_target(path: String, target_type: TargetType) -> SavedTargetStatus {
    let requested = PathBuf::from(&path);
    let metadata = requested.metadata();
    let exists = metadata.is_ok();
    let target_type_matches = metadata
        .as_ref()
        .map(|metadata| match target_type {
            TargetType::File => metadata.is_file(),
            TargetType::Folder => metadata.is_dir(),
        })
        .unwrap_or(false);
    let blocked = matches!(target_type, TargetType::File) && has_blocked_extension(&requested);

    SavedTargetStatus {
        exists,
        target_type_matches,
        blocked,
    }
}

#[tauri::command]
pub fn open_saved_target(path: String, target_type: TargetType) -> Result<(), NativeFileError> {
    let canonical = canonical_target(&path, &target_type)?;
    tauri_plugin_opener::open_path(canonical, None::<&str>).map_err(|_| {
        NativeFileError::new(
            "open_failed",
            "O Windows não conseguiu abrir o destino com o aplicativo padrão.",
        )
    })
}
