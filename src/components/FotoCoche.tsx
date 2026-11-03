import { useEffect, useId, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

export type FotoSeleccionada = {
  blob: Blob;
  url: string;
};

type Props = {
  foto: FotoSeleccionada | null;
  onCambio: (foto: FotoSeleccionada | null) => void;
  deshabilitado?: boolean;
};

export function FotoCoche({ foto, onCambio, deshabilitado = false }: Props) {
  const { t } = useTranslation();
  const idInput = useId();

  useEffect(() => {
    if (foto === null) return;
    const url = foto.url;
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const seleccionar = (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0] ?? null;
    evento.target.value = "";

    if (archivo === null || !archivo.type.startsWith("image/")) return;
    onCambio({ blob: archivo, url: URL.createObjectURL(archivo) });
  };

  const quitar = () => {
    onCambio(null);
  };

  return (
    <div className="foto">
      <span className="foto__leyenda">{t("foto.titulo")}</span>

      {foto === null ? (
        <p className="foto__ayuda">{t("foto.ayuda")}</p>
      ) : (
        <img className="foto__preview" src={foto.url} alt={t("foto.alt")} />
      )}

      <input
        id={idInput}
        className="foto__input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={seleccionar}
        disabled={deshabilitado}
      />

      <div className="foto__acciones">
        <label
          className="boton boton--secundario"
          htmlFor={idInput}
          aria-disabled={deshabilitado}
        >
          {foto === null ? t("foto.anadir") : t("foto.cambiar")}
        </label>

        {foto !== null && (
          <button
            type="button"
            className="boton boton--secundario"
            onClick={quitar}
            disabled={deshabilitado}
          >
            {t("foto.quitar")}
          </button>
        )}
      </div>
    </div>
  );
}
