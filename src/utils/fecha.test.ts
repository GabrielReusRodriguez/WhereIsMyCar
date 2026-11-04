import { describe, expect, it } from "vitest";
import { formatearDuracion, formatearFecha } from "./fecha";

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

describe("formatearDuracion", () => {
  const minuto = 60_000;
  const hora = 60 * minuto;
  const dia = 24 * hora;

  it("muestra segundos por debajo de un minuto", () => {
    expect(formatearDuracion(30_000, "es")).toBe("30 s");
  });

  it("muestra minutos por debajo de una hora", () => {
    expect(formatearDuracion(45 * minuto, "es")).toBe("45 min");
  });

  it("muestra horas y minutos", () => {
    expect(formatearDuracion(2 * hora + 15 * minuto, "es")).toBe("2 h 15 min");
  });

  it("omite los minutos cuando son cero", () => {
    expect(formatearDuracion(3 * hora, "es")).toBe("3 h");
  });

  it("muestra días y horas", () => {
    expect(formatearDuracion(3 * dia + 4 * hora, "es")).toBe("3 d 4 h");
  });

  it("funciona en catalán", () => {
    expect(formatearDuracion(2 * hora + 15 * minuto, "ca")).toBe("2 h 15 min");
  });

  it("no muestra duraciones negativas", () => {
    expect(formatearDuracion(-5_000, "es")).toBe("0 s");
  });
});
