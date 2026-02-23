import { create } from "zustand";
import i18n from "../i18n";

interface AppState {
  isUnlocked: boolean;
  isInitialized: boolean | null;
  language: string;
  setUnlocked: (unlocked: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  toggleLanguage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isUnlocked: false,
  isInitialized: null,
  language: localStorage.getItem("vault-lang") || "en",

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),

  toggleLanguage: () => {
    const newLang = get().language === "en" ? "ar" : "en";
    localStorage.setItem("vault-lang", newLang);
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    set({ language: newLang });
  },
}));
