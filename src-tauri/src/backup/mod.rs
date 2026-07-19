use focus_cockpit_security_policy::is_safe_backup_entry;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};
use uuid::Uuid;
use zip::{write::SimpleFileOptions, CompressionMethod, ZipArchive, ZipWriter};

const SCHEMA_VERSION: u32 = 2;
const MAX_BACKUP_BYTES: u64 = 1024 * 1024 * 1024;
const MAX_BACKUP_FILES: usize = 10_000;
const MAX_MANIFEST_BYTES: u64 = 5 * 1024 * 1024;

#[derive(Debug, Serialize)]
pub struct BackupError {
    code: &'static str,
    message: String,
}

impl BackupError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestFile {
    path: String,
    size_bytes: u64,
    sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupManifest {
    format: String,
    schema_version: u32,
    created_at_epoch_seconds: u64,
    files: Vec<ManifestFile>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupSummary {
    schema_version: u32,
    created_at_epoch_seconds: u64,
    credential_count: usize,
    thumbnail_count: usize,
    total_bytes: u64,
}

fn config_root(app: &AppHandle) -> Result<PathBuf, BackupError> {
    app.path().app_config_dir().map_err(|_| {
        BackupError::new(
            "app_data_unavailable",
            "A pasta privada do Focus Cockpit não está disponível.",
        )
    })
}

fn epoch_seconds() -> Result<u64, BackupError> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .map_err(|_| BackupError::new("clock_error", "O relógio do sistema está inválido."))
}

fn sha256(path: &Path) -> Result<String, BackupError> {
    let mut file = File::open(path).map_err(|_| {
        BackupError::new(
            "file_unavailable",
            "Um arquivo do backup não pôde ser lido.",
        )
    })?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer).map_err(|_| {
            BackupError::new(
                "file_unavailable",
                "Um arquivo do backup não pôde ser lido.",
            )
        })?;
        if read == 0 {
            break;
        }
        digest.update(&buffer[..read]);
    }
    Ok(format!("{:x}", digest.finalize()))
}

fn collect_directory_files(
    root: &Path,
    archive_prefix: &str,
    files: &mut Vec<(PathBuf, String)>,
) -> Result<(), BackupError> {
    if !root.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(root)
        .map_err(|_| BackupError::new("storage_unavailable", "Os anexos não puderam ser lidos."))?
    {
        let entry = entry.map_err(|_| {
            BackupError::new("storage_unavailable", "Os anexos não puderam ser lidos.")
        })?;
        let path = entry.path();
        let file_type = entry.file_type().map_err(|_| {
            BackupError::new(
                "storage_unavailable",
                "O tipo de um anexo não pôde ser verificado.",
            )
        })?;
        if file_type.is_symlink() {
            return Err(BackupError::new(
                "unsafe_storage_entry",
                "O armazenamento de anexos contém um link simbólico não permitido.",
            ));
        }
        if file_type.is_dir() {
            return Err(BackupError::new(
                "unexpected_storage_layout",
                "Foi encontrada uma subpasta inesperada nos anexos.",
            ));
        }
        if file_type.is_file() {
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .ok_or_else(|| {
                    BackupError::new("invalid_file_name", "Um anexo possui nome inválido.")
                })?;
            files.push((path.clone(), format!("{archive_prefix}/{name}")));
        }
    }
    Ok(())
}

fn zip_state(
    config: &Path,
    database: &Path,
    destination: &Path,
) -> Result<BackupSummary, BackupError> {
    if !database.is_file() {
        return Err(BackupError::new(
            "database_not_found",
            "O banco local ainda não existe para ser copiado.",
        ));
    }
    if destination.exists() {
        return Err(BackupError::new(
            "destination_exists",
            "Já existe um backup com esse nome.",
        ));
    }

    let parent = destination.parent().ok_or_else(|| {
        BackupError::new(
            "invalid_destination",
            "Escolha uma pasta válida para o backup.",
        )
    })?;
    let canonical_parent = parent.canonicalize().map_err(|_| {
        BackupError::new(
            "invalid_destination",
            "A pasta de destino não foi encontrada.",
        )
    })?;
    let file_name = destination.file_name().ok_or_else(|| {
        BackupError::new(
            "invalid_destination",
            "Informe um nome válido para o backup.",
        )
    })?;
    let final_destination = canonical_parent.join(file_name);
    let temporary = canonical_parent.join(format!(".focus-cockpit-{}.partial", Uuid::new_v4()));

    let mut source_files = vec![(database.to_path_buf(), "painel.sqlite3".to_owned())];
    collect_directory_files(
        &config.join("credentials"),
        "credentials",
        &mut source_files,
    )?;
    collect_directory_files(&config.join("thumbnails"), "thumbnails", &mut source_files)?;
    if source_files.len() > MAX_BACKUP_FILES {
        return Err(BackupError::new(
            "backup_too_many_files",
            "O backup possui arquivos demais.",
        ));
    }

    let mut manifest_files = Vec::with_capacity(source_files.len());
    let mut total_bytes = 0_u64;
    for (source, archive_path) in &source_files {
        let size = source
            .metadata()
            .map_err(|_| {
                BackupError::new(
                    "file_unavailable",
                    "Um arquivo do backup não pôde ser lido.",
                )
            })?
            .len();
        total_bytes = total_bytes.checked_add(size).ok_or_else(|| {
            BackupError::new("backup_too_large", "O tamanho do backup é inválido.")
        })?;
        if total_bytes > MAX_BACKUP_BYTES {
            return Err(BackupError::new(
                "backup_too_large",
                "O backup ultrapassa o limite de 1 GB.",
            ));
        }
        manifest_files.push(ManifestFile {
            path: archive_path.clone(),
            size_bytes: size,
            sha256: sha256(source)?,
        });
    }

    let manifest = BackupManifest {
        format: "focus-cockpit-backup".to_owned(),
        schema_version: SCHEMA_VERSION,
        created_at_epoch_seconds: epoch_seconds()?,
        files: manifest_files,
    };
    let output = File::create(&temporary).map_err(|_| {
        BackupError::new(
            "backup_create_failed",
            "Não foi possível criar o arquivo de backup.",
        )
    })?;
    let mut writer = ZipWriter::new(output);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);
    let write_result = (|| -> Result<(), BackupError> {
        for (source, archive_path) in &source_files {
            writer.start_file(archive_path, options).map_err(|_| {
                BackupError::new("backup_write_failed", "Não foi possível gravar o backup.")
            })?;
            let mut input = File::open(source).map_err(|_| {
                BackupError::new(
                    "file_unavailable",
                    "Um arquivo do backup não pôde ser lido.",
                )
            })?;
            std::io::copy(&mut input, &mut writer).map_err(|_| {
                BackupError::new("backup_write_failed", "Não foi possível gravar o backup.")
            })?;
        }
        writer.start_file("manifest.json", options).map_err(|_| {
            BackupError::new(
                "backup_write_failed",
                "Não foi possível gravar o manifesto.",
            )
        })?;
        let json = serde_json::to_vec_pretty(&manifest).map_err(|_| {
            BackupError::new(
                "manifest_failed",
                "O manifesto do backup não pôde ser criado.",
            )
        })?;
        writer.write_all(&json).map_err(|_| {
            BackupError::new(
                "backup_write_failed",
                "Não foi possível gravar o manifesto.",
            )
        })?;
        writer.finish().map_err(|_| {
            BackupError::new(
                "backup_write_failed",
                "Não foi possível finalizar o backup.",
            )
        })?;
        Ok(())
    })();

    if let Err(error) = write_result {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }
    fs::rename(&temporary, &final_destination).map_err(|_| {
        let _ = fs::remove_file(&temporary);
        BackupError::new(
            "backup_move_failed",
            "Não foi possível concluir o backup no destino escolhido.",
        )
    })?;

    Ok(BackupSummary {
        schema_version: manifest.schema_version,
        created_at_epoch_seconds: manifest.created_at_epoch_seconds,
        credential_count: manifest
            .files
            .iter()
            .filter(|file| file.path.starts_with("credentials/"))
            .count(),
        thumbnail_count: manifest
            .files
            .iter()
            .filter(|file| file.path.starts_with("thumbnails/"))
            .count(),
        total_bytes,
    })
}

fn validate_archive(path: &Path) -> Result<(BackupManifest, BackupSummary), BackupError> {
    let input = File::open(path).map_err(|_| {
        BackupError::new(
            "backup_not_found",
            "O backup selecionado não foi encontrado.",
        )
    })?;
    let mut archive = ZipArchive::new(input)
        .map_err(|_| BackupError::new("invalid_backup", "O arquivo não é um backup válido."))?;
    if archive.len() > MAX_BACKUP_FILES + 1 {
        return Err(BackupError::new(
            "backup_too_many_files",
            "O backup possui arquivos demais.",
        ));
    }

    let mut names = HashSet::new();
    let mut archive_total = 0_u64;
    for index in 0..archive.len() {
        let entry = archive.by_index(index).map_err(|_| {
            BackupError::new("invalid_backup", "Uma entrada do backup está corrompida.")
        })?;
        let name = entry.name().to_owned();
        if !is_safe_backup_entry(&name) || !names.insert(name) || entry.is_dir() {
            return Err(BackupError::new(
                "unsafe_backup_layout",
                "O backup contém caminhos inválidos ou repetidos.",
            ));
        }
        archive_total = archive_total.checked_add(entry.size()).ok_or_else(|| {
            BackupError::new("backup_too_large", "O tamanho do backup é inválido.")
        })?;
        if archive_total > MAX_BACKUP_BYTES {
            return Err(BackupError::new(
                "backup_too_large",
                "O backup ultrapassa o limite de 1 GB.",
            ));
        }
    }

    let manifest: BackupManifest = {
        let mut entry = archive.by_name("manifest.json").map_err(|_| {
            BackupError::new(
                "manifest_missing",
                "O manifesto do backup não foi encontrado.",
            )
        })?;
        if entry.size() > MAX_MANIFEST_BYTES {
            return Err(BackupError::new(
                "manifest_too_large",
                "O manifesto do backup ultrapassa o limite permitido.",
            ));
        }
        serde_json::from_reader(&mut entry).map_err(|_| {
            BackupError::new("manifest_invalid", "O manifesto do backup está inválido.")
        })?
    };
    if manifest.format != "focus-cockpit-backup" || manifest.schema_version != SCHEMA_VERSION {
        return Err(BackupError::new(
            "unsupported_backup_version",
            "A versão deste backup não é compatível com o aplicativo.",
        ));
    }
    if manifest.files.len() + 1 != archive.len()
        || !manifest
            .files
            .iter()
            .any(|file| file.path == "painel.sqlite3")
    {
        return Err(BackupError::new(
            "manifest_mismatch",
            "O conteúdo do backup está incompleto.",
        ));
    }

    let mut total_bytes = 0_u64;
    let mut manifest_names = HashSet::new();
    for expected in &manifest.files {
        if !is_safe_backup_entry(&expected.path)
            || expected.path == "manifest.json"
            || !manifest_names.insert(expected.path.clone())
        {
            return Err(BackupError::new(
                "manifest_mismatch",
                "O manifesto contém um caminho inválido.",
            ));
        }
        let mut entry = archive.by_name(&expected.path).map_err(|_| {
            BackupError::new(
                "manifest_mismatch",
                "Um arquivo listado no manifesto não existe.",
            )
        })?;
        if entry.size() != expected.size_bytes {
            return Err(BackupError::new(
                "integrity_failed",
                "O tamanho de um arquivo do backup diverge do manifesto.",
            ));
        }
        let mut digest = Sha256::new();
        let mut buffer = [0_u8; 64 * 1024];
        loop {
            let read = entry.read(&mut buffer).map_err(|_| {
                BackupError::new("integrity_failed", "Um arquivo do backup está corrompido.")
            })?;
            if read == 0 {
                break;
            }
            digest.update(&buffer[..read]);
        }
        if format!("{:x}", digest.finalize()) != expected.sha256 {
            return Err(BackupError::new(
                "integrity_failed",
                "A assinatura de um arquivo do backup é inválida.",
            ));
        }
        total_bytes = total_bytes.saturating_add(expected.size_bytes);
    }

    let mut database = archive.by_name("painel.sqlite3").map_err(|_| {
        BackupError::new(
            "database_missing",
            "O banco de dados não foi encontrado no backup.",
        )
    })?;
    let mut sqlite_header = [0_u8; 16];
    database.read_exact(&mut sqlite_header).map_err(|_| {
        BackupError::new(
            "database_invalid",
            "O banco de dados do backup está incompleto.",
        )
    })?;
    if &sqlite_header != b"SQLite format 3\0" {
        return Err(BackupError::new(
            "database_invalid",
            "O arquivo de banco do backup não é um SQLite válido.",
        ));
    }

    let summary = BackupSummary {
        schema_version: manifest.schema_version,
        created_at_epoch_seconds: manifest.created_at_epoch_seconds,
        credential_count: manifest
            .files
            .iter()
            .filter(|file| file.path.starts_with("credentials/"))
            .count(),
        thumbnail_count: manifest
            .files
            .iter()
            .filter(|file| file.path.starts_with("thumbnails/"))
            .count(),
        total_bytes,
    };
    Ok((manifest, summary))
}

fn extract_archive(
    path: &Path,
    destination: &Path,
    manifest: &BackupManifest,
) -> Result<(), BackupError> {
    fs::create_dir_all(destination).map_err(|_| {
        BackupError::new(
            "restore_prepare_failed",
            "A restauração não pôde ser preparada.",
        )
    })?;
    let input = File::open(path).map_err(|_| {
        BackupError::new(
            "backup_not_found",
            "O backup selecionado não foi encontrado.",
        )
    })?;
    let mut archive = ZipArchive::new(input)
        .map_err(|_| BackupError::new("invalid_backup", "O arquivo não é um backup válido."))?;
    for expected in &manifest.files {
        let mut entry = archive.by_name(&expected.path).map_err(|_| {
            BackupError::new(
                "manifest_mismatch",
                "Um arquivo do backup não foi encontrado.",
            )
        })?;
        let output_path = destination.join(Path::new(&expected.path));
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|_| {
                BackupError::new(
                    "restore_prepare_failed",
                    "A restauração não pôde criar uma pasta interna.",
                )
            })?;
        }
        let mut output = File::create(output_path).map_err(|_| {
            BackupError::new(
                "restore_write_failed",
                "Um arquivo restaurado não pôde ser criado.",
            )
        })?;
        std::io::copy(&mut entry, &mut output).map_err(|_| {
            BackupError::new(
                "restore_write_failed",
                "Um arquivo restaurado não pôde ser gravado.",
            )
        })?;
    }
    Ok(())
}

fn remove_managed_path(config: &Path, path: &Path) -> Result<(), BackupError> {
    if path.parent() != Some(config) {
        return Err(BackupError::new(
            "unsafe_restore_path",
            "A restauração tentou acessar um caminho inválido.",
        ));
    }
    if path.is_dir() {
        fs::remove_dir_all(path)
    } else if path.exists() {
        fs::remove_file(path)
    } else {
        Ok(())
    }
    .map_err(|_| {
        BackupError::new(
            "restore_replace_failed",
            "Os dados atuais não puderam ser substituídos.",
        )
    })
}

#[tauri::command]
pub fn prepare_backup_snapshot(app: AppHandle) -> Result<String, BackupError> {
    let config = config_root(&app)?;
    let staging = config
        .join("backups")
        .join("staging")
        .join(Uuid::new_v4().to_string());
    fs::create_dir_all(&staging).map_err(|_| {
        BackupError::new(
            "snapshot_prepare_failed",
            "O snapshot do banco não pôde ser preparado.",
        )
    })?;
    Ok(staging
        .join("painel.sqlite3")
        .to_string_lossy()
        .into_owned())
}

#[tauri::command]
pub fn export_backup(
    app: AppHandle,
    snapshot_path: String,
    destination_path: String,
) -> Result<BackupSummary, BackupError> {
    let config = config_root(&app)?;
    let staging = config.join("backups").join("staging");
    let snapshot = PathBuf::from(snapshot_path).canonicalize().map_err(|_| {
        BackupError::new(
            "snapshot_not_found",
            "O snapshot do banco não foi encontrado.",
        )
    })?;
    let canonical_staging = staging.canonicalize().map_err(|_| {
        BackupError::new(
            "snapshot_not_found",
            "A pasta temporária do backup não foi encontrada.",
        )
    })?;
    if !snapshot.starts_with(&canonical_staging)
        || snapshot.file_name().and_then(|value| value.to_str()) != Some("painel.sqlite3")
    {
        return Err(BackupError::new(
            "invalid_snapshot",
            "O snapshot informado não pertence ao aplicativo.",
        ));
    }
    let result = zip_state(&config, &snapshot, Path::new(&destination_path));
    if let Some(parent) = snapshot.parent() {
        let _ = fs::remove_dir_all(parent);
    }
    result
}

#[tauri::command]
pub fn discard_backup_snapshot(app: AppHandle, snapshot_path: String) -> Result<(), BackupError> {
    let config = config_root(&app)?;
    let staging = config.join("backups").join("staging");
    let snapshot = PathBuf::from(snapshot_path);
    let parent = snapshot
        .parent()
        .ok_or_else(|| BackupError::new("invalid_snapshot", "O snapshot informado é inválido."))?;
    if snapshot.file_name().and_then(|value| value.to_str()) != Some("painel.sqlite3")
        || parent.parent() != Some(staging.as_path())
    {
        return Err(BackupError::new(
            "invalid_snapshot",
            "O snapshot informado não pertence ao aplicativo.",
        ));
    }
    if parent.exists() {
        fs::remove_dir_all(parent).map_err(|_| {
            BackupError::new(
                "snapshot_cleanup_failed",
                "O snapshot temporário não pôde ser removido.",
            )
        })?;
    }
    Ok(())
}

#[tauri::command]
pub fn inspect_backup(backup_path: String) -> Result<BackupSummary, BackupError> {
    let (_, summary) = validate_archive(Path::new(&backup_path))?;
    Ok(summary)
}

#[tauri::command]
pub fn restore_backup(
    app: AppHandle,
    backup_path: String,
    confirmed: bool,
) -> Result<BackupSummary, BackupError> {
    if !confirmed {
        return Err(BackupError::new(
            "confirmation_required",
            "Confirme a restauração antes de continuar.",
        ));
    }
    let backup_path = PathBuf::from(backup_path).canonicalize().map_err(|_| {
        BackupError::new(
            "backup_not_found",
            "O backup selecionado não foi encontrado.",
        )
    })?;
    let (manifest, summary) = validate_archive(&backup_path)?;
    let config = config_root(&app)?;
    fs::create_dir_all(&config).map_err(|_| {
        BackupError::new(
            "storage_unavailable",
            "A pasta privada do aplicativo não está disponível.",
        )
    })?;

    let database = config.join("painel.sqlite3");
    if database.exists() {
        let backup_directory = config.join("backups");
        fs::create_dir_all(&backup_directory).map_err(|_| {
            BackupError::new(
                "safety_backup_failed",
                "O backup de segurança não pôde ser preparado.",
            )
        })?;
        let safety_path = backup_directory.join(format!(
            "pre-restore-{}-{}.focusbackup",
            epoch_seconds()?,
            Uuid::new_v4()
        ));
        zip_state(&config, &database, &safety_path).map_err(|_| {
            BackupError::new(
                "safety_backup_failed",
                "A restauração foi cancelada porque o backup de segurança falhou.",
            )
        })?;
    }

    let restore_staging = config.join(format!(".restore-{}", Uuid::new_v4()));
    if let Err(error) = extract_archive(&backup_path, &restore_staging, &manifest) {
        let _ = fs::remove_dir_all(&restore_staging);
        return Err(error);
    }
    let rollback = config.join(format!(".rollback-{}", Uuid::new_v4()));
    if fs::create_dir_all(&rollback).is_err() {
        let _ = fs::remove_dir_all(&restore_staging);
        return Err(BackupError::new(
            "restore_prepare_failed",
            "A restauração não pôde ser preparada.",
        ));
    }

    let mut protected_names = Vec::new();
    for name in ["painel.sqlite3", "credentials", "thumbnails"] {
        let current = config.join(name);
        if current.exists() {
            if fs::rename(&current, rollback.join(name)).is_err() {
                for protected_name in protected_names.iter().rev() {
                    let _ = fs::rename(rollback.join(protected_name), config.join(protected_name));
                }
                let _ = fs::remove_dir_all(&restore_staging);
                let _ = fs::remove_dir_all(&rollback);
                return Err(BackupError::new(
                    "restore_replace_failed",
                    "Os dados atuais não puderam ser protegidos.",
                ));
            }
            protected_names.push(name);
        }
    }
    for name in ["painel.sqlite3", "credentials", "thumbnails"] {
        let restored = restore_staging.join(name);
        if restored.exists() {
            if let Err(error) = fs::rename(&restored, config.join(name)) {
                for rollback_name in ["painel.sqlite3", "credentials", "thumbnails"] {
                    let current = config.join(rollback_name);
                    let protected = rollback.join(rollback_name);
                    let _ = remove_managed_path(&config, &current);
                    if protected.exists() {
                        let _ = fs::rename(protected, current);
                    }
                }
                let _ = fs::remove_dir_all(&restore_staging);
                let _ = fs::remove_dir_all(&rollback);
                return Err(BackupError::new(
                    "restore_replace_failed",
                    format!("A restauração falhou: {error}"),
                ));
            }
        }
    }
    let _ = fs::remove_file(config.join("painel.sqlite3-wal"));
    let _ = fs::remove_file(config.join("painel.sqlite3-shm"));
    let _ = fs::remove_dir_all(&restore_staging);
    let _ = fs::remove_dir_all(&rollback);
    Ok(summary)
}
