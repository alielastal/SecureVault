use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Mutex;

use crate::error::VaultError;
use crate::models::file::EncryptedFile;
use crate::models::note::SecureNote;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self, VaultError> {
        let conn = Connection::open(db_path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<(), VaultError> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS vault_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS encrypted_files (
                id TEXT PRIMARY KEY,
                original_name TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                nonce TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS secure_notes (
                id TEXT PRIMARY KEY,
                title_encrypted BLOB NOT NULL,
                content_encrypted BLOB NOT NULL,
                title_nonce TEXT NOT NULL,
                content_nonce TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            ",
        )?;
        Ok(())
    }

    // --- Config ---

    pub fn get_config(&self, key: &str) -> Result<Option<String>, VaultError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM vault_config WHERE key = ?1")?;
        let result = stmt
            .query_row(params![key], |row| row.get::<_, String>(0))
            .ok();
        Ok(result)
    }

    pub fn set_config(&self, key: &str, value: &str) -> Result<(), VaultError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO vault_config (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    // --- Files ---

    pub fn insert_file(&self, file: &EncryptedFile) -> Result<(), VaultError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO encrypted_files (id, original_name, file_size, nonce, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                file.id,
                file.original_name,
                file.file_size,
                file.nonce,
                file.created_at,
                file.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn list_files(&self) -> Result<Vec<EncryptedFile>, VaultError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, original_name, file_size, nonce, created_at, updated_at
             FROM encrypted_files ORDER BY created_at DESC",
        )?;
        let files = stmt
            .query_map([], |row| {
                Ok(EncryptedFile {
                    id: row.get(0)?,
                    original_name: row.get(1)?,
                    file_size: row.get(2)?,
                    nonce: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(files)
    }

    pub fn get_file(&self, id: &str) -> Result<Option<EncryptedFile>, VaultError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, original_name, file_size, nonce, created_at, updated_at
             FROM encrypted_files WHERE id = ?1",
        )?;
        let file = stmt
            .query_row(params![id], |row| {
                Ok(EncryptedFile {
                    id: row.get(0)?,
                    original_name: row.get(1)?,
                    file_size: row.get(2)?,
                    nonce: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .ok();
        Ok(file)
    }

    pub fn delete_file(&self, id: &str) -> Result<bool, VaultError> {
        let conn = self.conn.lock().unwrap();
        let affected = conn.execute("DELETE FROM encrypted_files WHERE id = ?1", params![id])?;
        Ok(affected > 0)
    }

    // --- Notes ---

    pub fn insert_note(&self, note: &SecureNote) -> Result<(), VaultError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO secure_notes (id, title_encrypted, content_encrypted, title_nonce, content_nonce, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                note.id,
                note.title_encrypted,
                note.content_encrypted,
                note.title_nonce,
                note.content_nonce,
                note.created_at,
                note.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_note(&self, note: &SecureNote) -> Result<(), VaultError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE secure_notes SET title_encrypted = ?1, content_encrypted = ?2,
             title_nonce = ?3, content_nonce = ?4, updated_at = ?5 WHERE id = ?6",
            params![
                note.title_encrypted,
                note.content_encrypted,
                note.title_nonce,
                note.content_nonce,
                note.updated_at,
                note.id,
            ],
        )?;
        Ok(())
    }

    pub fn list_notes(&self) -> Result<Vec<SecureNote>, VaultError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title_encrypted, content_encrypted, title_nonce, content_nonce, created_at, updated_at
             FROM secure_notes ORDER BY updated_at DESC",
        )?;
        let notes = stmt
            .query_map([], |row| {
                Ok(SecureNote {
                    id: row.get(0)?,
                    title_encrypted: row.get(1)?,
                    content_encrypted: row.get(2)?,
                    title_nonce: row.get(3)?,
                    content_nonce: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(notes)
    }

    pub fn get_note(&self, id: &str) -> Result<Option<SecureNote>, VaultError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title_encrypted, content_encrypted, title_nonce, content_nonce, created_at, updated_at
             FROM secure_notes WHERE id = ?1",
        )?;
        let note = stmt
            .query_row(params![id], |row| {
                Ok(SecureNote {
                    id: row.get(0)?,
                    title_encrypted: row.get(1)?,
                    content_encrypted: row.get(2)?,
                    title_nonce: row.get(3)?,
                    content_nonce: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .ok();
        Ok(note)
    }

    pub fn delete_note(&self, id: &str) -> Result<bool, VaultError> {
        let conn = self.conn.lock().unwrap();
        let affected = conn.execute("DELETE FROM secure_notes WHERE id = ?1", params![id])?;
        Ok(affected > 0)
    }
}
