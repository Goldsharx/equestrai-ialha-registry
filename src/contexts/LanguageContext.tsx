import { createContext, useContext, useState, type ReactNode } from "react";

export type Language = "en" | "es";

const dictionary = {
  en: {
    welcomeBack: "Welcome back",
    loginSubtitle: "Log in to your IALHA registry account.",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    phone: "Phone",
    farmName: "Farm name (optional)",
    addressLine1: "Address line 1",
    addressLine2: "Address line 2 (optional)",
    city: "City",
    state: "State",
    zip: "ZIP code",
    preferredLanguage: "Preferred language",
    english: "English",
    spanish: "Spanish",
    login: "Log in",
    signup: "Sign up",
    magicLink: "Email me a login link",
    sendingLink: "Sending link...",
    linkSent: "Check your email for a login link.",
    noAccount: "Don't have an account?",
    haveAccount: "Already a member?",
    createAccount: "Create your account",
    signupSubtitle: "Join the IALHA registry community.",
    creatingAccount: "Creating account...",
    loggingIn: "Logging in...",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    contactInfo: "Contact information",
    addressInfo: "Address",
    accountInfo: "Account",
  },
  es: {
    welcomeBack: "Bienvenido de nuevo",
    loginSubtitle: "Inicia sesión en tu cuenta del registro IALHA.",
    email: "Correo electrónico",
    password: "Contraseña",
    fullName: "Nombre completo",
    phone: "Teléfono",
    farmName: "Nombre del rancho (opcional)",
    addressLine1: "Dirección línea 1",
    addressLine2: "Dirección línea 2 (opcional)",
    city: "Ciudad",
    state: "Estado",
    zip: "Código postal",
    preferredLanguage: "Idioma preferido",
    english: "Inglés",
    spanish: "Español",
    login: "Iniciar sesión",
    signup: "Registrarse",
    magicLink: "Enviarme un enlace de acceso",
    sendingLink: "Enviando enlace...",
    linkSent: "Revisa tu correo para un enlace de acceso.",
    noAccount: "¿No tienes una cuenta?",
    haveAccount: "¿Ya eres miembro?",
    createAccount: "Crea tu cuenta",
    signupSubtitle: "Únete a la comunidad del registro IALHA.",
    creatingAccount: "Creando cuenta...",
    loggingIn: "Iniciando sesión...",
    requiredField: "Este campo es obligatorio",
    invalidEmail: "Ingresa un correo electrónico válido",
    contactInfo: "Información de contacto",
    addressInfo: "Dirección",
    accountInfo: "Cuenta",
  },
} as const;

export type TKey = keyof typeof dictionary["en"];

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const t = (key: TKey) => dictionary[lang][key];
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
