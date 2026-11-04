import { useTranslation } from "react-i18next";
import type { EstadoUbicacionGps } from "../hooks/useUbicacionGps";
import type { CodigoErrorUbicacion } from "../utils/geolocalizacion";
import { formatearCoordenadas, urlGoogleMaps } from "../utils/googleMaps";

const CLAVES_ERROR: Record<CodigoErrorUbicacion, string> = {
  "permiso-denegado": "errores.ubicacionPermiso",
  "no-disponible": "errores.ubicacionNoDisponible",
  timeout: "errores.ubicacionTimeout",
  "no-soportado": "errores.ubicacionNoSoportado",
};

type Props = {
  ubicacion: EstadoUbicacionGps;
  onSolicitar: () => void;
  deshabilitado?: boolean;
  mostrarErrorObligatorio?: boolean;
};

export function CampoUbicacionGps({
  ubicacion,
  onSolicitar,
  deshabilitado = false,
  mostrarErrorObligatorio = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <fieldset className="ubicacion">
      <legend className="ubicacion__leyenda">{t("calle.ubicacion")}</legend>

      <button
        type="button"
        className="boton boton--secundario"
        onClick={onSolicitar}
        disabled={ubicacion.estado === "cargando" || deshabilitado}
      >
        {ubicacion.estado === "cargando"
          ? t("calle.obteniendoUbicacion")
          : t("calle.usarUbicacion")}
      </button>

      {ubicacion.estado === "ok" && (
        <div className="ubicacion__resultado">
          <p className="ubicacion__ok">{t("calle.ubicacionObtenida")}</p>
          <p className="ubicacion__coordenadas">
            {formatearCoordenadas(ubicacion.lat, ubicacion.lng)}
          </p>
          <a
            className="enlace"
            href={urlGoogleMaps(ubicacion.lat, ubicacion.lng)}
            target="_blank"
            rel="noreferrer"
          >
            {t("calle.verEnMaps")}
          </a>
        </div>
      )}

      {ubicacion.estado === "error" && (
        <p className="error" role="alert">
          {t(CLAVES_ERROR[ubicacion.codigo])}
        </p>
      )}

      {mostrarErrorObligatorio && ubicacion.estado !== "ok" && (
        <p className="error" role="status">
          {t("errores.ubicacionObligatoria")}
        </p>
      )}
    </fieldset>
  );
}
