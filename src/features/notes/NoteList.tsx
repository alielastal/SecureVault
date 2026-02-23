import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, StickyNote, Trash2, BookOpen } from "lucide-react";
import { listNotes, deleteNote, type NoteListItem } from "../../lib/tauri";

interface Props {
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  refreshKey: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoteList({ onSelectNote, onNewNote, refreshKey }: Props) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    try {
      const result = await listNotes();
      setNotes(result);
    } catch (err) {
      console.error("Failed to list notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t("notes.confirm_delete"))) return;
    try {
      await deleteNote(id);
      await loadNotes();
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
        <h1 className="text-2xl font-bold text-white">{t("notes.title")}</h1>
        <button
          onClick={onNewNote}
          className="flex items-center gap-2 px-5 py-2.5 bg-vault-600 hover:bg-vault-700 text-white font-medium rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {t("notes.new")}
        </button>
      </div>

      {/* Note List */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <BookOpen className="w-16 h-16 mb-4 text-gray-700" />
          <p className="text-lg font-medium">{t("notes.no_notes")}</p>
          <p className="text-sm mt-1">{t("notes.no_notes_desc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <StickyNote className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{note.title}</p>
                <p className="text-sm text-gray-500 truncate">{note.preview}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDate(note.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, note.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                title={t("notes.delete")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
