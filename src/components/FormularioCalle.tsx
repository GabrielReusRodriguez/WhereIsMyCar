import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { NuevoAparcamiento } from "../types/aparcamiento";
import { guardarFotoAparcamiento } from "../storage/indexedDb";
import {
  ErrorUbicacion,
  obtenerUbicacion,
  type CodigoErrorUbicacion,
} from "../utils/geolocalizacion";
import { formatearCoordenadas, urlGoogleMaps } from "../utils/googleMaps";
import { CampoTexto } from "./CampoTexto";
import { FotoCoche, type FotoSeleccionada } from "./FotoCoche";

type Props = {
  onGuardar: (datos: NuevoAparcamiento, fotoId?: string) => void;
  onCancelar: () => void;
};

type EstadoUbicacion =
  | { estado: "inicial" }
  | { estado: "cargando" }
  | { estado: "ok"; lat: number; lng: number }
  | { estado: "error"; codigo: CodigoErrorUbicacion };

const CLAVES_ERROR: Record<CodigoErrorUbicacion, string> = {
  "permiso-denegado": "errores.ubicacionPermiso",
  "no-disponible": "errores.ubicacionNoDisponible",
  timeout: "errores.ubicacionTimeout",
  "no-soportado": "errores.ubicacionNoSoportado",
};

export function FormularioCalle({ onGuardar, onCancelar }: Props) {
  const { t } = useTranslation();
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [dePago, setDePago] = useState(false);
  const [foto, setFoto] = useState<FotoSeleccionada | null>(null);
  const [ubicacion, setUbicacion] = useState<EstadoUbicacion>({
    estado: "inicial",
  });
  const [conError, setConError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  const pedirUbicacion = async () => {
    setUbicacion({ estado: "cargando" });
    try {
      const { lat, lng } = await obtenerUbicacion();
      setUbicacion({ estado: "ok", lat, lng });
    } catch (error) {
      const codigo =
        error instanceof ErrorUbicacion ? error.codigo : "no-disponible";
      setUbicacion({ estado: "error", codigo });
    }
  };

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const calleValida = calle.trim();
    const numeroValido = numero.trim();
    const ciudadValida = ciudad.trim();

    if (
      calleValida === "" ||
      numeroValido === "" ||
      ciudadValida === "" ||
      ubicacion.estado !== "ok"
    ) {
      setConError(true);
      return;
    }

    setConError(false);
    setErrorGuardado(false);
    setGuardando(true);

    try {
      const fotoId =
        foto === null ? undefined : await guardarFotoAparcamiento(foto.blob);

      const datos: NuevoAparcamiento = {
        tipo: "calle",
        calle: calleValida,
        numero: numeroValido,
        ciudad: ciudadValida,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        dePago,
      };

      if (fotoId === undefined) {
        onGuardar(datos);
      } else {
        onGuardar(datos, fotoId);
      }
    } catch {
      setErrorGuardado(true);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2 className="formulario__titulo">{t("calle.titulo")}</h2>

      {conError && (
        <p className="error" role="alert">
          {t("errores.camposObligatorios")}
        </p>
      )}

      {errorGuardado && (
        <p className="error" role="alert">
          {t("errores.guardar")}
        </p>
      )}

      <CampoTexto
        id="calle-nombre"
        etiqueta={t("calle.calle")}
        ayuda={t("calle.calleAyuda")}
        valor={calle}
        onChange={setCalle}
        autoComplete="address-line1"
        requerido
        error={conError && calle.trim() === ""}
      />

      <CampoTexto
        id="calle-numero"
        etiqueta={t("calle.numero")}
        valor={numero}
        onChange={setNumero}
        autoComplete="address-line2"
        requerido
        error={conError && numero.trim() === ""}
      />

      <CampoTexto
        id="calle-ciudad"
        etiqueta={t("calle.ciudad")}
        valor={ciudad}
        onChange={setCiudad}
        autoComplete="address-level2"
        requerido
        error={conError && ciudad.trim() === ""}
      />

      <fieldset className="ubicacion">
        <legend className="ubicacion__leyenda">{t("calle.ubicacion")}</legend>

        <button
          type="button"
          className="boton boton--secundario"
          onClick={pedirUbicacion}
          disabled={ubicacion.estado === "cargando" || guardando}
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

        {conError && ubicacion.estado !== "ok" && (
          <p className="error" role="status">
            {t("errores.ubicacionObligatoria")}
          </p>
        )}
      </fieldset>

      <fieldset className="pago">
        <legend className="pago__leyenda">{t("calle.pago")}</legend>
        <div className="pago__opciones">
          <label className="pago__opcion">
            <input
              type="radio"
              name="pago"
              checked={!dePago}
              onChange={() => setDePago(false)}
            />
            <span>{t("calle.pagoNo")}</span>
          </label>
          <label className="pago__opcion">
            <input
              type="radio"
              name="pago"
              checked={dePago}
              onChange={() => setDePago(true)}
            />
            <span>{t("calle.pagoSi")}</span>
          </label>
        </div>
      </fieldset>

      <FotoCoche foto={foto} onCambio={setFoto} deshabilitado={guardando} />

      <div className="acciones">
        <button
          type="submit"
          className="boton boton--primario"
          disabled={guardando}
        >
          {guardando ? t("comun.guardando") : t("comun.guardar")}
        </button>
        <button
          type="button"
          className="boton boton--secundario"
          onClick={onCancelar}
          disabled={guardando}
        >
          {t("comun.cancelar")}
        </button>
      </div>
    </form>
  );
}
