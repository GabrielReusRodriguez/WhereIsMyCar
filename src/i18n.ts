import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import ca from "./locales/ca.json";

export const IDIOMA_KEY = "whereismycar.idioma";

export type Idioma = "es" | "ca";

const IDIOMAS: readonly Idioma[] = ["es", "ca"];

function esIdioma(valor: string | null): valor is Idioma {
  return valor !== null && (IDIOMAS as readonly string[]).includes(valor);
}

function idiomaInicial(): Idioma {
  const guardado = localStorage.getItem(IDIOMA_KEY);
  if (esIdioma(guardado)) return guardado;

  return navigator.language.toLowerCase().startsWith("ca") ? "ca" : "es";
}

const idioma = idiomaInicial();

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    ca: { translation: ca },
  },
  lng: idioma,
  fallbackLng: "es",
  interpolation: { escapeValue: false },
});

document.documentElement.lang = idioma;

export function cambiarIdioma(nuevo: Idioma): void {
  localStorage.setItem(IDIOMA_KEY, nuevo);
  document.documentElement.lang = nuevo;
  void i18n.changeLanguage(nuevo);
}

export default i18n;
