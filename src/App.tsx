import { useTranslation } from "react-i18next";
import { cambiarIdioma, type Idioma } from "./i18n";

const IDIOMAS: readonly Idioma[] = ["es", "ca"];

export default function App() {
  const { t, i18n } = useTranslation();

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

      <section className="tarjeta" aria-labelledby="inicio-subtitulo">
        <h2 id="inicio-subtitulo" className="tarjeta__titulo">
          {t("app.subtitulo")}
        </h2>
        <p className="tarjeta__texto">{t("inicio.descripcion")}</p>
        <p className="tarjeta__aviso">{t("inicio.proximamente")}</p>
      </section>
    </main>
  );
}
