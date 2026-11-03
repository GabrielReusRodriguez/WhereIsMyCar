import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { NuevoAparcamiento } from "../types/aparcamiento";
import { CampoTexto } from "./CampoTexto";

type Props = {
  onGuardar: (datos: NuevoAparcamiento) => void;
  onCancelar: () => void;
};

export function FormularioParking({ onGuardar, onCancelar }: Props) {
  const { t } = useTranslation();
  const [planta, setPlanta] = useState("");
  const [zona, setZona] = useState("");
  const [plaza, setPlaza] = useState("");
  const [conError, setConError] = useState(false);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const plantaValida = planta.trim();
    const plazaValida = plaza.trim();

    if (plantaValida === "" || plazaValida === "") {
      setConError(true);
      return;
    }

    setConError(false);
    onGuardar({
      tipo: "parking",
      planta: plantaValida,
      ...(zona.trim() === "" ? {} : { zona: zona.trim() }),
      plaza: plazaValida,
    });
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2 className="formulario__titulo">{t("parking.titulo")}</h2>

      {conError && (
        <p className="error" role="alert">
          {t("errores.camposObligatorios")}
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

      <div className="acciones">
        <button type="submit" className="boton boton--primario">
          {t("comun.guardar")}
        </button>
        <button
          type="button"
          className="boton boton--secundario"
          onClick={onCancelar}
        >
          {t("comun.cancelar")}
        </button>
      </div>
    </form>
  );
}
