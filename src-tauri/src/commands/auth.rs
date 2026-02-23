use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use tauri::State;

use crate::error::VaultError;
use crate::services::crypto::CryptoService;
use crate::services::database::Database;

use std::sync::Mutex;

pub struct VaultState {
    pub crypto: Mutex<Option<CryptoService>>,
}

#[tauri::command]
pub fn is_vault_initialized(db: State<'_, Database>) -> Result<bool, VaultError> {
    Ok(db.get_config("password_hash")?.is_some())
}

#[tauri::command]
pub fn setup_master_password(
    password: String,
    db: State<'_, Database>,
    vault: State<'_, VaultState>,
) -> Result<(), VaultError> {
    if db.get_config("password_hash")?.is_some() {
        return Err(VaultError::AlreadyInitialized);
    }

    let hash = CryptoService::hash_password(&password)?;
    let salt = CryptoService::generate_salt();
    let salt_b64 = BASE64.encode(&salt);

    db.set_config("password_hash", &hash)?;
    db.set_config("salt", &salt_b64)?;

    let crypto = CryptoService::from_password(&password, &salt)?;
    *vault.crypto.lock().unwrap() = Some(crypto);

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    db: State<'_, Database>,
    vault: State<'_, VaultState>,
) -> Result<bool, VaultError> {
    let hash = db
        .get_config("password_hash")?
        .ok_or(VaultError::NotInitialized)?;

    if !CryptoService::verify_password(&password, &hash)? {
        return Ok(false);
    }

    let salt_b64 = db
        .get_config("salt")?
        .ok_or(VaultError::NotInitialized)?;
    let salt = BASE64
        .decode(&salt_b64)
        .map_err(|e| VaultError::Encryption(format!("Invalid salt: {}", e)))?;

    let crypto = CryptoService::from_password(&password, &salt)?;
    *vault.crypto.lock().unwrap() = Some(crypto);

    Ok(true)
}

#[tauri::command]
pub fn lock_vault(vault: State<'_, VaultState>) -> Result<(), VaultError> {
    *vault.crypto.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
pub fn is_vault_unlocked(vault: State<'_, VaultState>) -> Result<bool, VaultError> {
    Ok(vault.crypto.lock().unwrap().is_some())
}
