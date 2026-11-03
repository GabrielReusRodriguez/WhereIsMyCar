import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAparcamiento } from "./hooks/useAparcamiento";
import { SelectorTipo } from "./components/SelectorTipo";
import { FormularioParking } from "./components/FormularioParking";
import { RegistroActivo } from "./components/RegistroActivo";
import { cambiarIdioma, type Idioma } from "./i18n";
import type { TipoAparcamiento } from "./types/aparcamiento";

const IDIOMAS: readonly Idioma[] = ["es", "ca"];

export default function App() {
  const { t, i18n } = useTranslation();
  const { aparcamiento, guardar, recoger } = useAparcamiento();
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoAparcamiento | null>(null);

  return (
    <main className="app">
      <header className="app__cabecera">
        <img className="app__logo" src="/icon.svg" alt="" width="48" height="48" />
        <h1 className="app__titulo">{t("app.titulo")}</h1>
        <div className="idioma" role="group" aria-label={t("idioma.etiqueta")}>
          {IDIOMAS.map((idioma) => (
            <button
              key={idioma}
              type="button"
              className={
                i18n.language === idioma
                  ? "idioma__boton idioma__boton--activo"
                  : "idioma__boton"
              }
              aria-pressed={i18n.language === idioma}
              onClick={() => cambiarIdioma(idioma)}
            >
              {t(`idioma.${idioma}`)}
            </button>
          ))}
        </div>
      </header>

      {aparcamiento !== null ? (
        <RegistroActivo aparcamiento={aparcamiento} onRecoger={recoger} />
      ) : tipoSeleccionado === "parking" ? (
        <FormularioParking
          onGuardar={(datos) => {
            guardar(datos);
            setTipoSeleccionado(null);
          }}
          onCancelar={() => setTipoSeleccionado(null)}
        />
      ) : (
        <SelectorTipo onSeleccionar={setTipoSeleccionado} calleDisponible={false} />
      )}
    </main>
  );
}
