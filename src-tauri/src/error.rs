use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum VaultError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("Invalid password")]
    InvalidPassword,

    #[error("Vault not initialized")]
    NotInitialized,

    #[error("Vault already initialized")]
    AlreadyInitialized,

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Note not found: {0}")]
    NoteNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("{0}")]
    Other(String),
}

impl Serialize for VaultError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
