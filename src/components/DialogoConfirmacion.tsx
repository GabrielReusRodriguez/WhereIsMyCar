import { useEffect, useRef } from "react";

type Props = {
  abierto: boolean;
  titulo: string;
  texto: string;
  etiquetaConfirmar: string;
  etiquetaCancelar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function DialogoConfirmacion({
  abierto,
  titulo,
  texto,
  etiquetaConfirmar,
  etiquetaCancelar,
  onConfirmar,
  onCancelar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo === null) return;

    if (abierto && !dialogo.open) {
      dialogo.showModal();
    } else if (!abierto && dialogo.open) {
      dialogo.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
    >
      <h2 className="dialogo__titulo">{titulo}</h2>
      <p className="dialogo__texto">{texto}</p>
      <div className="acciones">
        <button type="button" className="boton boton--peligro" onClick={onConfirmar}>
          {etiquetaConfirmar}
        </button>
        <button
          type="button"
          className="boton boton--secundario"
          onClick={onCancelar}
        >
          {etiquetaCancelar}
        </button>
      </div>
    </dialog>
  );
}
