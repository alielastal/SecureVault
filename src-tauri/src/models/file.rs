use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedFile {
    pub id: String,
    pub original_name: String,
    pub file_size: i64,
    pub nonce: String,
    pub created_at: String,
    pub updated_at: String,
}
