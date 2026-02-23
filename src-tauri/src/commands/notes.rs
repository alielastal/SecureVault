use tauri::State;

use crate::commands::auth::VaultState;
use crate::error::VaultError;
use crate::models::note::{NoteListItem, NoteResponse, SecureNote};
use crate::services::database::Database;

#[tauri::command]
pub fn save_note(
    title: String,
    content: String,
    id: Option<String>,
    vault: State<'_, VaultState>,
    db: State<'_, Database>,
) -> Result<NoteResponse, VaultError> {
    let crypto = vault.crypto.lock().unwrap();
    let crypto = crypto.as_ref().ok_or(VaultError::NotInitialized)?;

    let (title_encrypted, title_nonce) = crypto.encrypt(title.as_bytes())?;
    let (content_encrypted, content_nonce) = crypto.encrypt(content.as_bytes())?;

    let now = chrono::Utc::now().to_rfc3339();

    let note_id = id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let is_update = db.get_note(&note_id)?.is_some();

    let note = SecureNote {
        id: note_id.clone(),
        title_encrypted,
        content_encrypted,
        title_nonce,
        content_nonce,
        created_at: if is_update {
            db.get_note(&note_id)?
                .map(|n| n.created_at)
                .unwrap_or_else(|| now.clone())
        } else {
            now.clone()
        },
        updated_at: now.clone(),
    };

    if is_update {
        db.update_note(&note)?;
    } else {
        db.insert_note(&note)?;
    }

    Ok(NoteResponse {
        id: note_id,
        title,
        content,
        created_at: note.created_at,
        updated_at: note.updated_at,
    })
}

#[tauri::command]
pub fn get_note(
    id: String,
    vault: State<'_, VaultState>,
    db: State<'_, Database>,
) -> Result<NoteResponse, VaultError> {
    let crypto = vault.crypto.lock().unwrap();
    let crypto = crypto.as_ref().ok_or(VaultError::NotInitialized)?;

    let note = db
        .get_note(&id)?
        .ok_or_else(|| VaultError::NoteNotFound(id))?;

    let title = String::from_utf8(crypto.decrypt(&note.title_encrypted, &note.title_nonce)?)
        .map_err(|e| VaultError::Encryption(format!("UTF-8 decode failed: {}", e)))?;

    let content =
        String::from_utf8(crypto.decrypt(&note.content_encrypted, &note.content_nonce)?)
            .map_err(|e| VaultError::Encryption(format!("UTF-8 decode failed: {}", e)))?;

    Ok(NoteResponse {
        id: note.id,
        title,
        content,
        created_at: note.created_at,
        updated_at: note.updated_at,
    })
}

#[tauri::command]
pub fn list_notes(
    vault: State<'_, VaultState>,
    db: State<'_, Database>,
) -> Result<Vec<NoteListItem>, VaultError> {
    let crypto = vault.crypto.lock().unwrap();
    let crypto = crypto.as_ref().ok_or(VaultError::NotInitialized)?;

    let notes = db.list_notes()?;
    let mut items = Vec::new();

    for note in notes {
        let title = String::from_utf8(crypto.decrypt(&note.title_encrypted, &note.title_nonce)?)
            .unwrap_or_else(|_| "???".to_string());

        let content =
            String::from_utf8(crypto.decrypt(&note.content_encrypted, &note.content_nonce)?)
                .unwrap_or_default();

        let preview: String = content.chars().take(100).collect();

        items.push(NoteListItem {
            id: note.id,
            title,
            preview,
            updated_at: note.updated_at,
        });
    }

    Ok(items)
}

#[tauri::command]
pub fn delete_note(id: String, db: State<'_, Database>) -> Result<(), VaultError> {
    if !db.delete_note(&id)? {
        return Err(VaultError::NoteNotFound(id));
    }
    Ok(())
}
