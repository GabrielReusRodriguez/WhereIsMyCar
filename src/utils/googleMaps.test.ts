import { describe, expect, it } from "vitest";
import { formatearCoordenadas, urlGoogleMaps } from "./googleMaps";

describe("utilidades de Google Maps", () => {
  it("construye la URL de búsqueda con las coordenadas", () => {
    expect(urlGoogleMaps(41.3874, 2.1686)).toBe(
      "https://www.google.com/maps?q=41.3874,2.1686",
    );
  });

  it("formatea las coordenadas con cinco decimales", () => {
    expect(formatearCoordenadas(41.3874123, 2.1686123)).toBe(
      "41.38741, 2.16861",
    );
  });
});
