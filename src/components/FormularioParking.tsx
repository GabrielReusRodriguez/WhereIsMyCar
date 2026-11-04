import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type {
  NuevoAparcamiento,
  UbicacionParking,
} from "../types/aparcamiento";
import { useUbicacionGps } from "../hooks/useUbicacionGps";
import { CampoTexto } from "./CampoTexto";
import { CampoUbicacionGps } from "./CampoUbicacionGps";
import { FotoCoche, type FotoSeleccionada } from "./FotoCoche";

type Props = {
  onGuardar: (datos: NuevoAparcamiento, foto?: Blob) => void;
  onCancelar: () => void;
};

type ModoUbicacion = "direccion" | "gps";

const MODOS_UBICACION: readonly ModoUbicacion[] = ["direccion", "gps"];

export function FormularioParking({ onGuardar, onCancelar }: Props) {
  const { t } = useTranslation();
  const [planta, setPlanta] = useState("");
  const [zona, setZona] = useState("");
  const [plaza, setPlaza] = useState("");
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [modoUbicacion, setModoUbicacion] = useState<ModoUbicacion>("direccion");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [ciudad, setCiudad] = useState("");
  const { ubicacion, solicitar } = useUbicacionGps();
  const [foto, setFoto] = useState<FotoSeleccionada | null>(null);
  const [conError, setConError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const plantaValida = planta.trim();
    const plazaValida = plaza.trim();
    const calleValida = calle.trim();
    const numeroValido = numero.trim();
    const ciudadValida = ciudad.trim();

    const direccionValida =
      !mostrarUbicacion ||
      modoUbicacion !== "direccion" ||
      (calleValida !== "" && numeroValido !== "");
    const gpsValida =
      !mostrarUbicacion ||
      modoUbicacion !== "gps" ||
      ubicacion.estado === "ok";

    if (
      plantaValida === "" ||
      plazaValida === "" ||
      !direccionValida ||
      !gpsValida
    ) {
      setConError(true);
      return;
    }

    setConError(false);
    setErrorGuardado(false);
    setGuardando(true);

    try {
      let ubicacionParking: UbicacionParking | undefined;
      if (mostrarUbicacion) {
        if (modoUbicacion === "gps" && ubicacion.estado === "ok") {
          ubicacionParking = {
            modo: "gps",
            gps: { lat: ubicacion.lat, lng: ubicacion.lng },
          };
        } else if (modoUbicacion === "direccion") {
          ubicacionParking = {
            modo: "direccion",
            direccion: {
              calle: calleValida,
              numero: numeroValido,
              ...(ciudadValida === "" ? {} : { ciudad: ciudadValida }),
            },
          };
        }
      }

      const datos: NuevoAparcamiento = {
        tipo: "parking",
        planta: plantaValida,
        ...(zona.trim() === "" ? {} : { zona: zona.trim() }),
        plaza: plazaValida,
        ...(ubicacionParking === undefined
          ? {}
          : { ubicacion: ubicacionParking }),
      };

      if (foto === null) {
        onGuardar(datos);
      } else {
        onGuardar(datos, foto.blob);
      }
    } catch {
      setErrorGuardado(true);
    } finally {
      setGuardando(false);
    }
  };

  const quitarUbicacion = () => {
    setMostrarUbicacion(false);
    setConError(false);
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2 className="formulario__titulo">{t("parking.titulo")}</h2>

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
        id="parking-planta"
        etiqueta={t("parking.planta")}
        ayuda={t("parking.plantaAyuda")}
        valor={planta}
        onChange={setPlanta}
        requerido
        error={conError && planta.trim() === ""}
      />

      <CampoTexto
        id="parking-zona"
        etiqueta={t("parking.zona")}
        ayuda={t("parking.zonaAyuda")}
        valor={zona}
        onChange={setZona}
      />

      <CampoTexto
        id="parking-plaza"
        etiqueta={t("parking.plaza")}
        ayuda={t("parking.plazaAyuda")}
        valor={plaza}
        onChange={setPlaza}
        requerido
        error={conError && plaza.trim() === ""}
      />

      {!mostrarUbicacion ? (
        <button
          type="button"
          className="enlace enlace--boton"
          onClick={() => {
            setMostrarUbicacion(true);
            setConError(false);
          }}
          disabled={guardando}
        >
          {t("parking.anadirUbicacion")}
        </button>
      ) : (
        <section
          className="ubicacion-parking"
          aria-label={t("parking.ubicacion")}
        >
          <div className="ubicacion-parking__cabecera">
            <h3 className="ubicacion-parking__titulo">
              {t("parking.ubicacion")}
            </h3>
            <button
              type="button"
              className="enlace enlace--boton"
              onClick={quitarUbicacion}
              disabled={guardando}
            >
              {t("parking.quitarUbicacion")}
            </button>
          </div>

          <fieldset className="modo">
            <legend className="modo__leyenda">
              {t("parking.ubicacionModo")}
            </legend>
            <div className="modo__opciones">
              {MODOS_UBICACION.map((opcion) => (
                <label key={opcion} className="modo__opcion">
                  <input
                    type="radio"
                    name="modo-ubicacion-parking"
                    value={opcion}
                    checked={modoUbicacion === opcion}
                    onChange={() => {
                      setModoUbicacion(opcion);
                      setConError(false);
                    }}
                    disabled={guardando}
                  />
                  <span>{t(`parking.ubicacionModo_${opcion}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {modoUbicacion === "direccion" ? (
            <>
              <CampoTexto
                id="parking-calle"
                etiqueta={t("calle.calle")}
                ayuda={t("calle.calleAyuda")}
                valor={calle}
                onChange={setCalle}
                autoComplete="address-line1"
                requerido
                error={conError && calle.trim() === ""}
              />

              <CampoTexto
                id="parking-numero"
                etiqueta={t("calle.numero")}
                valor={numero}
                onChange={setNumero}
                autoComplete="address-line2"
                requerido
                error={conError && numero.trim() === ""}
              />

              <CampoTexto
                id="parking-ciudad"
                etiqueta={t("calle.ciudad")}
                valor={ciudad}
                onChange={setCiudad}
                autoComplete="address-level2"
              />
            </>
          ) : (
            <CampoUbicacionGps
              ubicacion={ubicacion}
              onSolicitar={solicitar}
              deshabilitado={guardando}
              mostrarErrorObligatorio={conError}
            />
          )}
        </section>
      )}

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
