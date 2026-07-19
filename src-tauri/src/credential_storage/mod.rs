use focus_cockpit_security_policy::{
    validate_credential_file, CredentialPolicyError, CredentialValidation,
};
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const MAX_CREDENTIAL_BYTES: u64 = 25 * 1024 * 1024;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedCredential {
    stored_path: String,
    thumbnail_path: Option<String>,
    original_name: String,
    mime_type: String,
    size_bytes: u64,
}

#[derive(Debug, Serialize)]
pub struct CredentialStorageError {
    code: &'static str,
    message: String,
}

impl CredentialStorageError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

fn storage_root(app: &AppHandle) -> Result<PathBuf, CredentialStorageError> {
    app.path()
        .app_config_dir()
        .map(|directory| directory.join("credentials"))
        .map_err(|_| {
            CredentialStorageError::new(
                "app_data_unavailable",
                "A pasta privada do Focus Cockpit não está disponível.",
            )
        })
}

fn canonical_source(source_path: &str) -> Result<PathBuf, CredentialStorageError> {
    let source = PathBuf::from(source_path).canonicalize().map_err(|_| {
        CredentialStorageError::new(
            "source_not_found",
            "O diploma selecionado não foi encontrado.",
        )
    })?;
    if !source.is_file() {
        return Err(CredentialStorageError::new(
            "source_not_file",
            "Selecione um arquivo PDF ou uma imagem.",
        ));
    }
    Ok(source)
}

fn validated_file(source: &Path) -> Result<(String, &'static str, u64), CredentialStorageError> {
    let CredentialValidation {
        extension,
        mime_type,
        size_bytes,
    } = validate_credential_file(source, MAX_CREDENTIAL_BYTES).map_err(|error| match error {
        CredentialPolicyError::MetadataUnavailable
        | CredentialPolicyError::ContentDetectionFailed => CredentialStorageError::new(
            "source_unavailable",
            "O conteúdo do diploma não pôde ser verificado.",
        ),
        CredentialPolicyError::InvalidSize => {
            CredentialStorageError::new("invalid_size", "O arquivo deve ter entre 1 byte e 25 MB.")
        }
        CredentialPolicyError::UnsupportedExtension => CredentialStorageError::new(
            "unsupported_extension",
            "Use um arquivo PDF, PNG, JPG, JPEG ou WebP.",
        ),
        CredentialPolicyError::UnknownFileType => CredentialStorageError::new(
            "unknown_file_type",
            "O conteúdo do arquivo não corresponde a um formato permitido.",
        ),
        CredentialPolicyError::MimeMismatch => CredentialStorageError::new(
            "mime_mismatch",
            "A extensão e o conteúdo do arquivo não correspondem.",
        ),
    })?;
    Ok((extension, mime_type, size_bytes))
}

fn canonical_managed_path(
    app: &AppHandle,
    stored_path: &str,
) -> Result<PathBuf, CredentialStorageError> {
    let root = storage_root(app)?;
    let canonical_root = root.canonicalize().map_err(|_| {
        CredentialStorageError::new(
            "storage_unavailable",
            "O armazenamento de diplomas ainda não foi criado.",
        )
    })?;
    let canonical = PathBuf::from(stored_path).canonicalize().map_err(|_| {
        CredentialStorageError::new(
            "credential_not_found",
            "A cópia interna do diploma não foi encontrada.",
        )
    })?;
    if !canonical.starts_with(canonical_root) || !canonical.is_file() {
        return Err(CredentialStorageError::new(
            "path_outside_storage",
            "O caminho informado não pertence ao armazenamento privado do aplicativo.",
        ));
    }
    Ok(canonical)
}

#[tauri::command]
pub fn import_credential(
    app: AppHandle,
    source_path: String,
) -> Result<ImportedCredential, CredentialStorageError> {
    let source = canonical_source(&source_path)?;
    let (extension, mime_type, size_bytes) = validated_file(&source)?;
    let original_name = source
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("diploma")
        .to_owned();

    let root = storage_root(&app)?;
    fs::create_dir_all(&root).map_err(|_| {
        CredentialStorageError::new(
            "storage_create_failed",
            "Não foi possível preparar a pasta privada de diplomas.",
        )
    })?;
    let destination = root.join(format!("{}.{}", Uuid::new_v4(), extension));
    fs::copy(&source, &destination).map_err(|_| {
        CredentialStorageError::new(
            "copy_failed",
            "Não foi possível importar uma cópia do diploma.",
        )
    })?;

    let stored_path = destination.to_string_lossy().into_owned();
    let thumbnail_path = mime_type.starts_with("image/").then(|| stored_path.clone());
    Ok(ImportedCredential {
        stored_path,
        thumbnail_path,
        original_name,
        mime_type: mime_type.to_owned(),
        size_bytes,
    })
}

#[tauri::command]
pub fn open_credential(app: AppHandle, stored_path: String) -> Result<(), CredentialStorageError> {
    let canonical = canonical_managed_path(&app, &stored_path)?;
    tauri_plugin_opener::open_path(canonical, None::<&str>).map_err(|_| {
        CredentialStorageError::new("open_failed", "O Windows não conseguiu abrir o diploma.")
    })
}

#[tauri::command]
pub fn read_credential_bytes(
    app: AppHandle,
    stored_path: String,
) -> Result<Vec<u8>, CredentialStorageError> {
    let canonical = canonical_managed_path(&app, &stored_path)?;
    fs::read(canonical).map_err(|_| {
        CredentialStorageError::new(
            "read_failed",
            "A pré-visualização do diploma não pôde ser carregada.",
        )
    })
}

#[tauri::command]
pub fn export_credential(
    app: AppHandle,
    stored_path: String,
    destination_path: String,
) -> Result<(), CredentialStorageError> {
    let source = canonical_managed_path(&app, &stored_path)?;
    let destination = PathBuf::from(destination_path);
    if destination.exists() {
        return Err(CredentialStorageError::new(
            "destination_exists",
            "Já existe um arquivo nesse destino. Escolha outro nome.",
        ));
    }
    let parent = destination.parent().ok_or_else(|| {
        CredentialStorageError::new(
            "invalid_destination",
            "Escolha uma pasta válida para exportar o diploma.",
        )
    })?;
    let canonical_parent = parent.canonicalize().map_err(|_| {
        CredentialStorageError::new(
            "invalid_destination",
            "A pasta escolhida para exportação não foi encontrada.",
        )
    })?;
    let file_name = destination.file_name().ok_or_else(|| {
        CredentialStorageError::new(
            "invalid_destination",
            "Informe um nome válido para a cópia exportada.",
        )
    })?;
    let safe_destination = canonical_parent.join(file_name);
    fs::copy(source, safe_destination).map_err(|_| {
        CredentialStorageError::new(
            "export_failed",
            "Não foi possível exportar a cópia do diploma.",
        )
    })?;
    Ok(())
}

#[tauri::command]
pub fn discard_credential_import(
    app: AppHandle,
    stored_path: String,
) -> Result<(), CredentialStorageError> {
    let canonical = canonical_managed_path(&app, &stored_path)?;
    fs::remove_file(canonical).map_err(|_| {
        CredentialStorageError::new(
            "discard_failed",
            "A importação falhou e a cópia interna não pôde ser removida.",
        )
    })
}
