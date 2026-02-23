import { useState } from "react";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";

export default function NotesPage() {
  const [view, setView] = useState<"list" | "editor">("list");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setView("editor");
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setView("editor");
  };

  const handleBack = () => {
    setView("list");
    setSelectedNoteId(null);
  };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  if (view === "editor") {
    return (
      <NoteEditor
        noteId={selectedNoteId}
        onBack={handleBack}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <NoteList
      onSelectNote={handleSelectNote}
      onNewNote={handleNewNote}
      refreshKey={refreshKey}
    />
  );
}
