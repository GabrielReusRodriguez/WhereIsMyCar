import { beforeEach, describe, expect, it } from "vitest";
import type { AparcamientoCalle, AparcamientoParking } from "../types/aparcamiento";
import {
  APARCAMIENTO_KEY,
  borrarAparcamiento,
  guardarAparcamiento,
  leerAparcamiento,
} from "./localStorage";

const parking: AparcamientoParking = {
  id: "activo",
  tipo: "parking",
  guardadoEn: 1_700_000_000_000,
  planta: "-2",
  zona: "A",
  plaza: "42",
};

const calle: AparcamientoCalle = {
  id: "activo",
  tipo: "calle",
  guardadoEn: 1_700_000_000_001,
  calle: "Gran Via",
  numero: "10",
  ciudad: "Barcelona",
  lat: 41.3874,
  lng: 2.1686,
  dePago: false,
};

describe("almacenamiento del aparcamiento", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("devuelve null si no hay registro", () => {
    expect(leerAparcamiento()).toBeNull();
  });

  it("guarda y recupera un parking", () => {
    guardarAparcamiento(parking);
    expect(leerAparcamiento()).toEqual(parking);
  });

  it("guarda y recupera un aparcamiento en la calle", () => {
    guardarAparcamiento(calle);
    expect(leerAparcamiento()).toEqual(calle);
  });

  it("ignora datos corruptos", () => {
    localStorage.setItem(APARCAMIENTO_KEY, "{no es json");
    expect(leerAparcamiento()).toBeNull();

    localStorage.setItem(APARCAMIENTO_KEY, JSON.stringify({ tipo: "parking" }));
    expect(leerAparcamiento()).toBeNull();
  });

  it("borra el registro", () => {
    guardarAparcamiento(parking);
    borrarAparcamiento();
    expect(leerAparcamiento()).toBeNull();
  });
});
