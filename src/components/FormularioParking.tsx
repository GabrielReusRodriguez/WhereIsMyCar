import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { NuevoAparcamiento } from "../types/aparcamiento";
import { CampoTexto } from "./CampoTexto";
import { FotoCoche, type FotoSeleccionada } from "./FotoCoche";

type Props = {
  onGuardar: (datos: NuevoAparcamiento, foto?: Blob) => void;
  onCancelar: () => void;
};

export function FormularioParking({ onGuardar, onCancelar }: Props) {
  const { t } = useTranslation();
  const [planta, setPlanta] = useState("");
  const [zona, setZona] = useState("");
  const [plaza, setPlaza] = useState("");
  const [foto, setFoto] = useState<FotoSeleccionada | null>(null);
  const [conError, setConError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const plantaValida = planta.trim();
    const plazaValida = plaza.trim();

    if (plantaValida === "" || plazaValida === "") {
      setConError(true);
      return;
    }

    setConError(false);
    setErrorGuardado(false);
    setGuardando(true);

    try {
      const datos: NuevoAparcamiento = {
        tipo: "parking",
        planta: plantaValida,
        ...(zona.trim() === "" ? {} : { zona: zona.trim() }),
        plaza: plazaValida,
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
