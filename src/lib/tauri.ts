import { invoke } from "@tauri-apps/api/core";

// Auth
export const isVaultInitialized = () => invoke<boolean>("is_vault_initialized");
export const setupMasterPassword = (password: string) =>
  invoke("setup_master_password", { password });
export const unlockVault = (password: string) =>
  invoke<boolean>("unlock_vault", { password });
export const lockVault = () => invoke("lock_vault");
export const isVaultUnlocked = () => invoke<boolean>("is_vault_unlocked");

// Files
export interface EncryptedFile {
  id: string;
  original_name: string;
  file_size: number;
  nonce: string;
  created_at: string;
  updated_at: string;
}

export const encryptFile = (filePath: string) =>
  invoke<EncryptedFile>("encrypt_file", { filePath });
export const decryptFile = (id: string) =>
  invoke<number[]>("decrypt_file", { id });
export const listFiles = () => invoke<EncryptedFile[]>("list_files");
export const deleteFile = (id: string) => invoke("delete_file", { id });

// Notes
export interface NoteListItem {
  id: string;
  title: string;
  preview: string;
  updated_at: string;
}

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const saveNote = (title: string, content: string, id?: string) =>
  invoke<NoteResponse>("save_note", { title, content, id });
export const getNote = (id: string) => invoke<NoteResponse>("get_note", { id });
export const listNotes = () => invoke<NoteListItem[]>("list_notes");
export const deleteNote = (id: string) => invoke("delete_note", { id });
