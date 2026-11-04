import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { NuevoAparcamiento } from "../types/aparcamiento";
import { useUbicacionGps } from "../hooks/useUbicacionGps";
import { CampoTexto } from "./CampoTexto";
import { CampoUbicacionGps } from "./CampoUbicacionGps";
import { FotoCoche, type FotoSeleccionada } from "./FotoCoche";

type Props = {
  onGuardar: (datos: NuevoAparcamiento, foto?: Blob) => void;
  onCancelar: () => void;
};

type ModoCalle = "gps" | "direccion" | "completo";

const MODOS: readonly ModoCalle[] = ["gps", "direccion", "completo"];

export function FormularioCalle({ onGuardar, onCancelar }: Props) {
  const { t } = useTranslation();
  const [modo, setModo] = useState<ModoCalle>("direccion");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [dePago, setDePago] = useState(false);
  const [foto, setFoto] = useState<FotoSeleccionada | null>(null);
  const { ubicacion, solicitar } = useUbicacionGps();
  const [conError, setConError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  const pideGps = modo === "gps" || modo === "completo";
  const pideDireccion = modo === "direccion" || modo === "completo";

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const calleValida = calle.trim();
    const numeroValido = numero.trim();
    const ciudadValida = ciudad.trim();

    const direccionValida =
      !pideDireccion || (calleValida !== "" && numeroValido !== "");
    const gpsValida = !pideGps || ubicacion.estado === "ok";

    if (!direccionValida || !gpsValida) {
      setConError(true);
      return;
    }

    setConError(false);
    setErrorGuardado(false);
    setGuardando(true);

    try {
      const direccion = {
        calle: calleValida,
        numero: numeroValido,
        ...(ciudadValida === "" ? {} : { ciudad: ciudadValida }),
      };
      const gps =
        ubicacion.estado === "ok"
          ? { lat: ubicacion.lat, lng: ubicacion.lng }
          : null;

      const datos: NuevoAparcamiento =
        modo === "gps" && gps !== null
          ? { tipo: "calle", modo: "gps", gps, dePago }
          : modo === "direccion"
            ? { tipo: "calle", modo: "direccion", direccion, dePago }
            : gps !== null
              ? { tipo: "calle", modo: "completo", gps, direccion, dePago }
              : { tipo: "calle", modo: "direccion", direccion, dePago };

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

      <fieldset className="modo">
        <legend className="modo__leyenda">{t("calle.modo")}</legend>
        <div className="modo__opciones">
          {MODOS.map((opcion) => (
            <label key={opcion} className="modo__opcion">
              <input
                type="radio"
                name="modo-calle"
                value={opcion}
                checked={modo === opcion}
                onChange={() => {
                  setModo(opcion);
                  setConError(false);
                }}
                disabled={guardando}
              />
              <span>{t(`calle.modo_${opcion}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {pideDireccion && (
        <>
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
          />
        </>
      )}

      {pideGps && (
        <CampoUbicacionGps
          ubicacion={ubicacion}
          onSolicitar={solicitar}
          deshabilitado={guardando}
          mostrarErrorObligatorio={conError}
        />
      )}

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
