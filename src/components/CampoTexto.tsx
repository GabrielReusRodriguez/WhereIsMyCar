type Props = {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  ayuda?: string;
  requerido?: boolean;
  inputMode?: "text" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  error?: boolean;
};

export function CampoTexto({
  id,
  etiqueta,
  valor,
  onChange,
  ayuda,
  requerido = false,
  inputMode,
  autoComplete,
  placeholder,
  error = false,
}: Props) {
  const ayudaId = ayuda === undefined ? undefined : `${id}-ayuda`;

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
        {requerido && (
          <span className="campo__requerido" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        className={error ? "campo__input campo__input--error" : "campo__input"}
        type="text"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        aria-describedby={ayudaId}
        aria-invalid={error || undefined}
        required={requerido}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {ayuda !== undefined && (
        <p id={ayudaId} className="campo__ayuda">
          {ayuda}
        </p>
      )}
    </div>
  );
}
