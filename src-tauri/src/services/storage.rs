use std::fs;
use std::path::{Path, PathBuf};

use crate::error::VaultError;

pub struct StorageService {
    vault_dir: PathBuf,
}

impl StorageService {
    pub fn new(app_data_dir: &Path) -> Result<Self, VaultError> {
        let vault_dir = app_data_dir.join("vault_files");
        fs::create_dir_all(&vault_dir)?;
        Ok(Self { vault_dir })
    }

    pub fn save_encrypted_file(&self, id: &str, data: &[u8]) -> Result<(), VaultError> {
        let path = self.vault_dir.join(id);
        fs::write(&path, data)?;
        Ok(())
    }

    pub fn read_encrypted_file(&self, id: &str) -> Result<Vec<u8>, VaultError> {
        let path = self.vault_dir.join(id);
        if !path.exists() {
            return Err(VaultError::FileNotFound(id.to_string()));
        }
        Ok(fs::read(&path)?)
    }

    pub fn delete_encrypted_file(&self, id: &str) -> Result<(), VaultError> {
        let path = self.vault_dir.join(id);
        if path.exists() {
            fs::remove_file(&path)?;
        }
        Ok(())
    }
}
