import { useTranslation } from "react-i18next";
import type { TipoAparcamiento } from "../types/aparcamiento";

type Props = {
  onSeleccionar: (tipo: TipoAparcamiento) => void;
  calleDisponible: boolean;
};

export function SelectorTipo({ onSeleccionar, calleDisponible }: Props) {
  const { t } = useTranslation();

  return (
    <section className="selector" aria-labelledby="selector-titulo">
      <h2 id="selector-titulo" className="selector__titulo">
        {t("inicio.subtitulo")}
      </h2>
      <p className="selector__descripcion">{t("inicio.descripcion")}</p>

      <div className="selector__opciones">
        <button
          type="button"
          className="selector__boton"
          onClick={() => onSeleccionar("parking")}
        >
          <span className="selector__icono" aria-hidden="true">
            P
          </span>
          <span>{t("inicio.tipoParking")}</span>
        </button>

        <button
          type="button"
          className="selector__boton"
          onClick={() => onSeleccionar("calle")}
          disabled={!calleDisponible}
        >
          <span className="selector__icono" aria-hidden="true">
            C
          </span>
          <span>{t("inicio.tipoCalle")}</span>
          {!calleDisponible && (
            <span className="selector__nota">{t("inicio.calleProximamente")}</span>
          )}
        </button>
      </div>
    </section>
  );
}
