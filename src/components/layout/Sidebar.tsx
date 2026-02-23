import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield, Files, StickyNote, LayoutDashboard, Lock } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { lockVault } from "../../lib/tauri";
import { clsx } from "clsx";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "nav.dashboard" },
  { path: "/files", icon: Files, label: "nav.files" },
  { path: "/notes", icon: StickyNote, label: "nav.notes" },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { setUnlocked, language, toggleLanguage } = useAppStore();

  const handleLock = async () => {
    await lockVault();
    setUnlocked(false);
    navigate("/");
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-vault-600 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">SecureVault</h1>
          <p className="text-xs text-gray-500">{t("app.tagline")}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors text-sm",
                isActive
                  ? "bg-vault-600/20 text-vault-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              {t(item.label)}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          {language === "en" ? "العربية" : "English"}
        </button>
        <button
          onClick={handleLock}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
        >
          <Lock className="w-4 h-4" />
          {t("nav.lock")}
        </button>
      </div>
    </aside>
  );
}
