import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save } from "lucide-react";
import { getNote, saveNote } from "../../lib/tauri";

interface Props {
  noteId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

export default function NoteEditor({ noteId, onBack, onSaved }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (noteId) {
      setLoading(true);
      getNote(noteId)
        .then((note) => {
          setTitle(note.title);
          setContent(note.content);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTitle("");
      setContent("");
    }
  }, [noteId]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    try {
      await saveNote(
        title || "Untitled",
        content,
        noteId || undefined
      );
      onSaved();
      if (!noteId) onBack();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("notes.back")}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-vault-600 hover:bg-vault-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? t("notes.saving") : t("notes.save")}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8 overflow-y-auto">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("notes.title_placeholder")}
          className="w-full text-2xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-600 mb-4"
          autoFocus={!noteId}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("notes.content_placeholder")}
          className="w-full flex-1 min-h-[400px] bg-transparent border-none outline-none text-gray-300 placeholder-gray-600 resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}
