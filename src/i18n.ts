import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import ca from "./locales/ca.json";

export const IDIOMA_KEY = "whereismycar.idioma";
export const IDIOMA_PARAM = "lang";

export type Idioma = "es" | "ca";

const IDIOMAS: readonly Idioma[] = ["es", "ca"];

function esIdioma(valor: string | null): valor is Idioma {
  return valor !== null && (IDIOMAS as readonly string[]).includes(valor);
}

/** Lee `?lang=es` o `?lang=ca` de una query string. Devuelve `null` si falta o no es válido. */
export function idiomaDesdeBusqueda(busqueda: string): Idioma | null {
  const valor = new URLSearchParams(busqueda).get(IDIOMA_PARAM);
  return esIdioma(valor) ? valor : null;
}

function idiomaInicial(): Idioma {
  const deUrl = idiomaDesdeBusqueda(window.location.search);
  if (deUrl !== null) return deUrl;

  const guardado = localStorage.getItem(IDIOMA_KEY);
  if (esIdioma(guardado)) return guardado;

  return navigator.language.toLowerCase().startsWith("ca") ? "ca" : "es";
}

function sincronizarUrl(nuevo: Idioma): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get(IDIOMA_PARAM) === nuevo) return;
  url.searchParams.set(IDIOMA_PARAM, nuevo);
  window.history.replaceState(window.history.state, "", url);
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

// Un enlace con `?lang=` fija el idioma también para visitas posteriores.
if (idiomaDesdeBusqueda(window.location.search) !== null) {
  localStorage.setItem(IDIOMA_KEY, idioma);
}

export function cambiarIdioma(nuevo: Idioma): void {
  localStorage.setItem(IDIOMA_KEY, nuevo);
  document.documentElement.lang = nuevo;
  sincronizarUrl(nuevo);
  void i18n.changeLanguage(nuevo);
}

export default i18n;
