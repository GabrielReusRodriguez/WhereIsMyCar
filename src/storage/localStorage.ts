import type { Aparcamiento } from "../types/aparcamiento";

export const APARCAMIENTO_KEY = "whereismycar.aparcamiento";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function esAparcamiento(valor: unknown): valor is Aparcamiento {
  if (!esObjeto(valor)) return false;
  if (valor.id !== "activo" || !esNumero(valor.guardadoEn)) return false;

  if (valor.tipo === "parking") {
    return (
      typeof valor.planta === "string" &&
      valor.planta.length > 0 &&
      (valor.zona === undefined || typeof valor.zona === "string") &&
      typeof valor.plaza === "string" &&
      valor.plaza.length > 0
    );
  }

  if (valor.tipo === "calle") {
    return (
      typeof valor.calle === "string" &&
      valor.calle.length > 0 &&
      typeof valor.numero === "string" &&
      valor.numero.length > 0 &&
      typeof valor.ciudad === "string" &&
      valor.ciudad.length > 0 &&
      esNumero(valor.lat) &&
      esNumero(valor.lng) &&
      typeof valor.dePago === "boolean"
    );
  }

  return false;
}

export function leerAparcamiento(): Aparcamiento | null {
  try {
    const bruto = localStorage.getItem(APARCAMIENTO_KEY);
    if (bruto === null) return null;

    const datos: unknown = JSON.parse(bruto);
    return esAparcamiento(datos) ? datos : null;
  } catch {
    return null;
  }
}

export function guardarAparcamiento(aparcamiento: Aparcamiento): void {
  localStorage.setItem(APARCAMIENTO_KEY, JSON.stringify(aparcamiento));
}

export function borrarAparcamiento(): void {
  localStorage.removeItem(APARCAMIENTO_KEY);
}
