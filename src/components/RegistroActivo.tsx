import { useTranslation } from "react-i18next";
import type { Aparcamiento } from "../types/aparcamiento";
import { formatearFecha } from "../utils/fecha";
import type { Idioma } from "../i18n";

type Props = {
  aparcamiento: Aparcamiento;
  onRecoger: () => void;
};

export function RegistroActivo({ aparcamiento, onRecoger }: Props) {
  const { t, i18n } = useTranslation();
  const idioma: Idioma = i18n.language === "ca" ? "ca" : "es";

  const recoger = () => {
    if (window.confirm(t("guardado.confirmarRecoger"))) {
      onRecoger();
    }
  };

  return (
    <section className="registro" aria-labelledby="registro-titulo">
      <p className="registro__etiqueta">{t("guardado.titulo")}</p>
      <h2 id="registro-titulo" className="registro__tipo">
        {aparcamiento.tipo === "parking"
          ? t("guardado.tipoParking")
          : t("guardado.tipoCalle")}
      </h2>
      <p className="registro__hora">
        {t("guardado.hora", {
          fecha: formatearFecha(aparcamiento.guardadoEn, idioma),
        })}
      </p>

      {aparcamiento.tipo === "parking" && (
        <dl className="registro__datos">
          <div className="registro__dato">
            <dt>{t("parking.planta")}</dt>
            <dd>{aparcamiento.planta}</dd>
          </div>
          {aparcamiento.zona !== undefined && (
            <div className="registro__dato">
              <dt>{t("parking.zona")}</dt>
              <dd>{aparcamiento.zona}</dd>
            </div>
          )}
          <div className="registro__dato">
            <dt>{t("parking.plaza")}</dt>
            <dd>{aparcamiento.plaza}</dd>
          </div>
        </dl>
      )}

      <button type="button" className="boton boton--peligro" onClick={recoger}>
        {t("guardado.recoger")}
      </button>
    </section>
  );
}
