import { describe, expect, it } from "vitest";
import ca from "./locales/ca.json";
import es from "./locales/es.json";

function claves(objeto: Record<string, unknown>, prefijo = ""): string[] {
  return Object.entries(objeto).flatMap(([clave, valor]) => {
    const ruta = prefijo === "" ? clave : `${prefijo}.${clave}`;
    if (typeof valor === "object" && valor !== null) {
      return claves(valor as Record<string, unknown>, ruta);
    }
    return [ruta];
  });
}

function valores(objeto: Record<string, unknown>): string[] {
  return Object.values(objeto).flatMap((valor) => {
    if (typeof valor === "object" && valor !== null) {
      return valores(valor as Record<string, unknown>);
    }
    return [String(valor)];
  });
}

describe("traducciones", () => {
  it("castellano y catalán tienen las mismas claves", () => {
    expect(claves(ca).sort()).toEqual(claves(es).sort());
  });

  it("no hay traducciones vacías", () => {
    for (const valor of [...valores(es), ...valores(ca)]) {
      expect(valor.trim()).not.toBe("");
    }
  });
});
