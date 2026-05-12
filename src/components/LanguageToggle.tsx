import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur transition-colors hover:border-accent hover:text-accent-foreground"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5 text-accent" />
      {lang === "en" ? "Se habla Español" : "Switch to English"}
    </button>
  );
}
