import { describe, expect, it } from "vitest";
import { formatearFecha } from "./fecha";

describe("formatearFecha", () => {
  const fecha = new Date(2024, 4, 1, 10, 30).getTime();

  it("formatea en castellano", () => {
    const texto = formatearFecha(fecha, "es");
    expect(texto).toContain("2024");
    expect(texto).toContain("10:30");
  });

  it("formatea en catalán", () => {
    const texto = formatearFecha(fecha, "ca");
    expect(texto).toContain("2024");
    expect(texto).toContain("10:30");
  });
});
