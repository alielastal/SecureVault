use std::fs;
use tauri::State;

use crate::commands::auth::VaultState;
use crate::error::VaultError;
use crate::models::file::EncryptedFile;
use crate::services::database::Database;
use crate::services::storage::StorageService;

#[tauri::command]
pub fn encrypt_file(
    file_path: String,
    vault: State<'_, VaultState>,
    db: State<'_, Database>,
    storage: State<'_, StorageService>,
) -> Result<EncryptedFile, VaultError> {
    let crypto = vault.crypto.lock().unwrap();
    let crypto = crypto.as_ref().ok_or(VaultError::NotInitialized)?;

    let plaintext = fs::read(&file_path)?;
    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let file_size = plaintext.len() as i64;
    let (ciphertext, nonce) = crypto.encrypt(&plaintext)?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    storage.save_encrypted_file(&id, &ciphertext)?;

    let encrypted_file = EncryptedFile {
        id: id.clone(),
        original_name: file_name,
        file_size,
        nonce,
        created_at: now.clone(),
        updated_at: now,
    };

    db.insert_file(&encrypted_file)?;

    Ok(encrypted_file)
}

#[tauri::command]
pub fn decrypt_file(
    id: String,
    vault: State<'_, VaultState>,
    db: State<'_, Database>,
    storage: State<'_, StorageService>,
) -> Result<Vec<u8>, VaultError> {
    let crypto = vault.crypto.lock().unwrap();
    let crypto = crypto.as_ref().ok_or(VaultError::NotInitialized)?;

    let file = db
        .get_file(&id)?
        .ok_or_else(|| VaultError::FileNotFound(id.clone()))?;

    let ciphertext = storage.read_encrypted_file(&id)?;
    let plaintext = crypto.decrypt(&ciphertext, &file.nonce)?;

    Ok(plaintext)
}

#[tauri::command]
pub fn list_files(db: State<'_, Database>) -> Result<Vec<EncryptedFile>, VaultError> {
    db.list_files()
}

#[tauri::command]
pub fn delete_file(
    id: String,
    db: State<'_, Database>,
    storage: State<'_, StorageService>,
) -> Result<(), VaultError> {
    storage.delete_encrypted_file(&id)?;
    db.delete_file(&id)?;
    Ok(())
}

#[tauri::command]
pub fn get_file_info(
    id: String,
    db: State<'_, Database>,
) -> Result<EncryptedFile, VaultError> {
    db.get_file(&id)?
        .ok_or_else(|| VaultError::FileNotFound(id))
}
