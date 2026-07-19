use std::path::{Component, Path};

const BLOCKED_TARGET_EXTENSIONS: [&str; 10] = [
    "exe", "msi", "bat", "cmd", "ps1", "vbs", "js", "jar", "scr", "com",
];

#[derive(Debug, PartialEq, Eq)]
pub enum CredentialPolicyError {
    MetadataUnavailable,
    InvalidSize,
    UnsupportedExtension,
    ContentDetectionFailed,
    UnknownFileType,
    MimeMismatch,
}

#[derive(Debug, PartialEq, Eq)]
pub struct CredentialValidation {
    pub extension: String,
    pub mime_type: &'static str,
    pub size_bytes: u64,
}

pub fn has_blocked_target_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            BLOCKED_TARGET_EXTENSIONS
                .iter()
                .any(|blocked| extension.eq_ignore_ascii_case(blocked))
        })
        .unwrap_or(false)
}

fn supported_credential_mime(extension: &str) -> Option<&'static str> {
    match extension {
        "pdf" => Some("application/pdf"),
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "webp" => Some("image/webp"),
        _ => None,
    }
}

pub fn validate_credential_file(
    source: &Path,
    maximum_bytes: u64,
) -> Result<CredentialValidation, CredentialPolicyError> {
    let metadata = source
        .metadata()
        .map_err(|_| CredentialPolicyError::MetadataUnavailable)?;
    if metadata.len() == 0 || metadata.len() > maximum_bytes {
        return Err(CredentialPolicyError::InvalidSize);
    }

    let (extension, expected_mime) = source
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .and_then(|value| supported_credential_mime(&value).map(|mime| (value, mime)))
        .ok_or(CredentialPolicyError::UnsupportedExtension)?;
    let detected = infer::get_from_path(source)
        .map_err(|_| CredentialPolicyError::ContentDetectionFailed)?
        .ok_or(CredentialPolicyError::UnknownFileType)?;
    if detected.mime_type() != expected_mime {
        return Err(CredentialPolicyError::MimeMismatch);
    }

    Ok(CredentialValidation {
        extension,
        mime_type: expected_mime,
        size_bytes: metadata.len(),
    })
}

pub fn is_safe_backup_entry(path: &str) -> bool {
    let candidate = Path::new(path);
    if candidate.is_absolute()
        || candidate
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return false;
    }
    if path == "painel.sqlite3" || path == "manifest.json" {
        return true;
    }
    let components: Vec<_> = candidate.components().collect();
    components.len() == 2
        && matches!(
            components.first(),
            Some(Component::Normal(name)) if *name == "credentials" || *name == "thumbnails"
        )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, path::PathBuf, time::SystemTime};

    fn test_directory(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("valid system clock")
            .as_nanos();
        std::env::temp_dir().join(format!("focus-cockpit-{label}-{nonce}"))
    }

    #[test]
    fn executable_and_script_extensions_are_blocked_case_insensitively() {
        for extension in BLOCKED_TARGET_EXTENSIONS {
            assert!(has_blocked_target_extension(Path::new(&format!(
                "unsafe.{}",
                extension.to_ascii_uppercase()
            ))));
        }
        assert!(!has_blocked_target_extension(Path::new("notes.md")));
        assert!(!has_blocked_target_extension(Path::new("certificate.pdf")));
    }

    #[test]
    fn valid_pdf_content_is_accepted() {
        let directory = test_directory("valid-pdf");
        fs::create_dir_all(&directory).expect("create test directory");
        let pdf = directory.join("credential.pdf");
        fs::write(&pdf, b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n").expect("write pdf");

        let result = validate_credential_file(&pdf, 25 * 1024 * 1024).expect("validate pdf");
        assert_eq!(result.extension, "pdf");
        assert_eq!(result.mime_type, "application/pdf");

        fs::remove_dir_all(directory).expect("remove test directory");
    }

    #[test]
    fn disguised_content_is_rejected() {
        let directory = test_directory("disguised-file");
        fs::create_dir_all(&directory).expect("create test directory");
        let disguised = directory.join("credential.jpg");
        fs::write(&disguised, b"%PDF-1.7\nnot really a jpeg").expect("write disguised file");

        assert_eq!(
            validate_credential_file(&disguised, 25 * 1024 * 1024),
            Err(CredentialPolicyError::MimeMismatch)
        );

        fs::remove_dir_all(directory).expect("remove test directory");
    }

    #[test]
    fn empty_and_unsupported_files_are_rejected() {
        let directory = test_directory("rejected-files");
        fs::create_dir_all(&directory).expect("create test directory");
        let empty = directory.join("empty.png");
        let executable = directory.join("unsafe.exe");
        fs::write(&empty, []).expect("write empty file");
        fs::write(&executable, b"MZ").expect("write executable");

        assert_eq!(
            validate_credential_file(&empty, 25 * 1024 * 1024),
            Err(CredentialPolicyError::InvalidSize)
        );
        assert_eq!(
            validate_credential_file(&executable, 25 * 1024 * 1024),
            Err(CredentialPolicyError::UnsupportedExtension)
        );

        fs::remove_dir_all(directory).expect("remove test directory");
    }

    #[test]
    fn backup_entries_cannot_escape_the_restore_directory() {
        assert!(is_safe_backup_entry("painel.sqlite3"));
        assert!(is_safe_backup_entry("credentials/example.pdf"));
        assert!(is_safe_backup_entry("thumbnails/example.png"));
        assert!(!is_safe_backup_entry("../painel.sqlite3"));
        assert!(!is_safe_backup_entry("credentials/../../unsafe.exe"));
        assert!(!is_safe_backup_entry("credentials/nested/example.pdf"));
        assert!(!is_safe_backup_entry("C:/Windows/System32/example.dll"));
    }
}
