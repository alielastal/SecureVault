import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Files, StickyNote, Upload, Plus } from "lucide-react";
import { listFiles, listNotes } from "../../lib/tauri";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fileCount, setFileCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    listFiles().then((files) => setFileCount(files.length)).catch(() => {});
    listNotes().then((notes) => setNoteCount(notes.length)).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">
        {t("dashboard.welcome")}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div
          onClick={() => navigate("/files")}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Files className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{fileCount}</p>
              <p className="text-sm text-gray-400">{t("dashboard.encrypted_files")}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate("/notes")}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <StickyNote className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{noteCount}</p>
              <p className="text-sm text-gray-400">{t("dashboard.secure_notes")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-white mb-4">
        {t("dashboard.quick_actions")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/files")}
          className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-vault-600 hover:bg-vault-950/20 transition-colors text-start"
        >
          <div className="w-10 h-10 bg-vault-600/10 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-vault-400" />
          </div>
          <span className="text-gray-300">{t("dashboard.upload_file")}</span>
        </button>

        <button
          onClick={() => navigate("/notes")}
          className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-vault-600 hover:bg-vault-950/20 transition-colors text-start"
        >
          <div className="w-10 h-10 bg-vault-600/10 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-vault-400" />
          </div>
          <span className="text-gray-300">{t("dashboard.new_note")}</span>
        </button>
      </div>
    </div>
  );
}
