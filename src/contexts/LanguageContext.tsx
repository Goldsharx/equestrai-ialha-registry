import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { translations, type Language, type TKey } from "@/i18n/translations";

const STORAGE_KEY = "preferred_language";

function readStored(): Language {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "es" ? "es" : "en";
}

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TKey | string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Language>(() => readStored());

  // Sync from profile after sign-in
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const pref = data?.preferred_language;
      if (pref === "en" || pref === "es") {
        setLangState(pref);
        window.localStorage.setItem(STORAGE_KEY, pref);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const setLang = useCallback(
    (l: Language) => {
      setLangState(l);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
      if (user) {
        // Fire and forget; don't block UI
        void supabase.from("profiles").update({ preferred_language: l }).eq("user_id", user.id);
      }
    },
    [user],
  );

  const t = useCallback(
    (key: TKey | string, vars?: Record<string, string | number>) => {
      const k = key as string;
      const dict = translations[lang] as Record<string, string>;
      const en = translations.en as Record<string, string>;
      // Lookup priority: exact key, then common namespaced fallbacks (back-compat
      // for legacy unprefixed keys like "welcomeBack" → "auth.welcomeBack").
      const candidates = [k, `auth.${k}`, `common.${k}`, `err.${k}`, `nav.${k}`];
      let str: string | undefined;
      for (const c of candidates) {
        str = dict[c] ?? en[c];
        if (str) break;
      }
      if (!str) str = k;
      if (vars) {
        for (const [vk, vv] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${vk}\\}`, "g"), String(vv));
        }
      }
      return str;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

export type { Language, TKey };
