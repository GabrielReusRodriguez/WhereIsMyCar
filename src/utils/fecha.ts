type UnidadTiempo = "segundo" | "minuto" | "hora" | "dia";

const UNIDADES: Record<"es" | "ca", Record<UnidadTiempo, string>> = {
  es: { segundo: "s", minuto: "min", hora: "h", dia: "d" },
  ca: { segundo: "s", minuto: "min", hora: "h", dia: "d" },
};

function localeDe(idioma: "es" | "ca"): string {
  return idioma === "ca" ? "ca-ES" : "es-ES";
}

export function formatearFecha(epoch: number, idioma: "es" | "ca"): string {
  return new Intl.DateTimeFormat(localeDe(idioma), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(epoch));
}

function formatearUnidad(
  idioma: "es" | "ca",
  valor: number,
  unidad: UnidadTiempo,
): string {
  const numero = new Intl.NumberFormat(localeDe(idioma)).format(valor);
  return `${numero} ${UNIDADES[idioma][unidad]}`;
}

/**
 * Formatea una duración en milisegundos con la unidad más significativa
 * (y una segunda unidad de precisión cuando aporta valor):
 * `30 s`, `45 min`, `2 h 15 min`, `3 d 4 h`.
 */
export function formatearDuracion(
  milisegundos: number,
  idioma: "es" | "ca",
): string {
  const totalSegundos = Math.max(0, Math.floor(milisegundos / 1000));

  if (totalSegundos < 60) {
    return formatearUnidad(idioma, totalSegundos, "segundo");
  }

  const totalMinutos = Math.floor(totalSegundos / 60);
  if (totalMinutos < 60) {
    return formatearUnidad(idioma, totalMinutos, "minuto");
  }

  const totalHoras = Math.floor(totalMinutos / 60);
  if (totalHoras < 24) {
    const minutos = totalMinutos % 60;
    const horas = formatearUnidad(idioma, totalHoras, "hora");
    return minutos === 0
      ? horas
      : `${horas} ${formatearUnidad(idioma, minutos, "minuto")}`;
  }

  const dias = Math.floor(totalHoras / 24);
  const horas = totalHoras % 24;
  const textoDias = formatearUnidad(idioma, dias, "dia");
  return horas === 0
    ? textoDias
    : `${textoDias} ${formatearUnidad(idioma, horas, "hora")}`;
}
