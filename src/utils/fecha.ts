export function formatearFecha(epoch: number, idioma: "es" | "ca"): string {
  return new Intl.DateTimeFormat(idioma === "ca" ? "ca-ES" : "es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(epoch));
}
