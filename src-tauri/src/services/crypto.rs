use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;

use crate::error::VaultError;

pub struct CryptoService {
    key: [u8; 32],
}

impl CryptoService {
    /// Derive a 256-bit encryption key from a password using Argon2id
    pub fn from_password(password: &str, salt: &[u8]) -> Result<Self, VaultError> {
        let argon2 = Argon2::default();
        let mut key = [0u8; 32];

        argon2
            .hash_password_into(password.as_bytes(), salt, &mut key)
            .map_err(|e| VaultError::Encryption(format!("Key derivation failed: {}", e)))?;

        Ok(Self { key })
    }

    /// Hash a password for storage (verification only, not for encryption key)
    pub fn hash_password(password: &str) -> Result<String, VaultError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| VaultError::Encryption(format!("Password hashing failed: {}", e)))?;
        Ok(hash.to_string())
    }

    /// Verify a password against a stored hash
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, VaultError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| VaultError::Encryption(format!("Invalid hash format: {}", e)))?;
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Generate a random salt (16 bytes)
    pub fn generate_salt() -> Vec<u8> {
        let mut salt = vec![0u8; 16];
        rand::thread_rng().fill_bytes(&mut salt);
        salt
    }

    /// Encrypt data using AES-256-GCM
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<(Vec<u8>, String), VaultError> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| VaultError::Encryption(format!("Cipher init failed: {}", e)))?;

        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| VaultError::Encryption(format!("Encryption failed: {}", e)))?;

        let nonce_b64 = BASE64.encode(nonce_bytes);
        Ok((ciphertext, nonce_b64))
    }

    /// Decrypt data using AES-256-GCM
    pub fn decrypt(&self, ciphertext: &[u8], nonce_b64: &str) -> Result<Vec<u8>, VaultError> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| VaultError::Encryption(format!("Cipher init failed: {}", e)))?;

        let nonce_bytes = BASE64
            .decode(nonce_b64)
            .map_err(|e| VaultError::Encryption(format!("Invalid nonce: {}", e)))?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|_| VaultError::InvalidPassword)?;

        Ok(plaintext)
    }
}
