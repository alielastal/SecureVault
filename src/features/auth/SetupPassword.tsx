import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Eye, EyeOff } from "lucide-react";
import { setupMasterPassword } from "../../lib/tauri";
import { useAppStore } from "../../stores/appStore";

export default function SetupPassword() {
  const { t } = useTranslation();
  const { setUnlocked, setInitialized, toggleLanguage, language } = useAppStore();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth.min_length"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwords_mismatch"));
      return;
    }

    setLoading(true);
    try {
      await setupMasterPassword(password);
      setInitialized(true);
      setUnlocked(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleLanguage}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {language === "en" ? "العربية" : "English"}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-vault-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-vault-600/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SecureVault</h1>
          <p className="text-gray-500 mt-1">{t("app.tagline")}</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-2">
            {t("auth.setup_title")}
          </h2>
          <p className="text-sm text-gray-400 mb-6">{t("auth.setup_desc")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500 transition-colors"
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                {t("auth.confirm_password")}
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-vault-600 hover:bg-vault-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
            >
              {loading ? t("common.loading") : t("auth.create")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
