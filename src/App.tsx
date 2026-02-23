import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./stores/appStore";
import { isVaultInitialized } from "./lib/tauri";
import AppLayout from "./components/layout/AppLayout";
import SetupPassword from "./features/auth/SetupPassword";
import MasterPassword from "./features/auth/MasterPassword";
import Dashboard from "./features/auth/Dashboard";
import FileList from "./features/files/FileList";
import NotesPage from "./features/notes/NotesPage";

function AppContent() {
  const { isUnlocked, isInitialized, setInitialized, language } = useAppStore();

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    isVaultInitialized()
      .then(setInitialized)
      .catch(() => setInitialized(false));
  }, [setInitialized]);

  if (isInitialized === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vault-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isInitialized) {
    return <SetupPassword />;
  }

  if (!isUnlocked) {
    return <MasterPassword />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/files" element={<FileList />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
