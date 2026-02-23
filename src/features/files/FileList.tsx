import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, File, Trash2, Download, FolderOpen } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { encryptFile, listFiles, deleteFile, decryptFile, type EncryptedFile } from "../../lib/tauri";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FileList() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    try {
      const result = await listFiles();
      setFiles(result);
    } catch (err) {
      console.error("Failed to list files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async () => {
    try {
      const selected = await open({ multiple: true });
      if (!selected) return;

      setUploading(true);
      const paths = Array.isArray(selected) ? selected : [selected];
      for (const filePath of paths) {
        if (filePath) {
          await encryptFile(filePath);
        }
      }
      await loadFiles();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: EncryptedFile) => {
    try {
      const data = await decryptFile(file.id);
      const bytes = new Uint8Array(data);
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("files.confirm_delete"))) return;
    try {
      await deleteFile(id);
      await loadFiles();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-gray-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t("files.title")}</h1>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-vault-600 hover:bg-vault-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          {uploading ? t("files.uploading") : t("files.upload")}
        </button>
      </div>

      {/* File List */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <FolderOpen className="w-16 h-16 mb-4 text-gray-700" />
          <p className="text-lg font-medium">{t("files.no_files")}</p>
          <p className="text-sm mt-1">{t("files.no_files_desc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {file.original_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file_size)} &middot;{" "}
                  {formatDate(file.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title={t("files.download")}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title={t("files.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
