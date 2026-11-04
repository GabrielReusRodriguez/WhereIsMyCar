import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Aparcamiento } from "../types/aparcamiento";
import {
  APARCAMIENTO_KEY_LEGACY,
  anadirAparcamiento,
  calcularActivo,
  leerActivo,
  listarAparcamientos,
  listarEventos,
  migrarDesdeLocalStorage,
  registrarRecogida,
  validarAparcamiento,
} from "./aparcamientos";
import { ALMACEN_APARCAMIENTOS, ALMACEN_EVENTOS, ALMACEN_FOTOS } from "./indexedDb";

const parking = {
  tipo: "parking" as const,
  planta: "-2",
  zona: "A",
  plaza: "42",
};

const calleGps = {
  tipo: "calle" as const,
  modo: "gps" as const,
  gps: { lat: 41.3874, lng: 2.1686 },
  dePago: false,
};

const calleDireccion = {
  tipo: "calle" as const,
  modo: "direccion" as const,
  direccion: { calle: "Gran Via", numero: "10", ciudad: "Barcelona" },
  dePago: true,
};

const calleCompleta = {
  tipo: "calle" as const,
  modo: "completo" as const,
  gps: { lat: 41.3874, lng: 2.1686 },
  direccion: { calle: "Gran Via", numero: "10" },
  dePago: false,
};

async function vaciarAlmacenes(): Promise<void> {
  await new Promise<void>((resolve) => {
    const peticion = indexedDB.deleteDatabase("whereismycar");
    peticion.onsuccess = () => resolve();
    peticion.onerror = () => resolve();
    peticion.onblocked = () => resolve();
  });
  localStorage.clear();
}

describe("validación del modelo", () => {
  it("acepta los tres modos de calle", () => {
    for (const datos of [calleGps, calleDireccion, calleCompleta]) {
      const registro = validarAparcamiento({
        ...datos,
        id: "x",
        guardadoEn: 1,
      });
      expect(registro).not.toBeNull();
    }
  });

  it("rechaza una calle sin GPS ni dirección", () => {
    expect(
      validarAparcamiento({
        tipo: "calle",
        id: "x",
        guardadoEn: 1,
        dePago: false,
      }),
    ).toBeNull();
  });

  it("rechaza una dirección sin número", () => {
    expect(
      validarAparcamiento({
        tipo: "calle",
        id: "x",
        guardadoEn: 1,
        dePago: false,
        direccion: { calle: "Gran Via", numero: "  " },
      }),
    ).toBeNull();
  });

  it("rechaza un parking sin plaza", () => {
    expect(
      validarAparcamiento({
        tipo: "parking",
        id: "x",
        guardadoEn: 1,
        planta: "-2",
      }),
    ).toBeNull();
  });

  it("acepta un parking con dirección opcional", () => {
    const registro = validarAparcamiento({
      ...parking,
      id: "x",
      guardadoEn: 1,
      ubicacion: {
        modo: "direccion",
        direccion: { calle: "Gran Via", numero: "10", ciudad: "Barcelona" },
      },
    });

    expect(registro).toMatchObject({
      tipo: "parking",
      ubicacion: {
        modo: "direccion",
        direccion: { calle: "Gran Via", numero: "10", ciudad: "Barcelona" },
      },
    });
  });

  it("acepta un parking con GPS opcional", () => {
    const registro = validarAparcamiento({
      ...parking,
      id: "x",
      guardadoEn: 1,
      ubicacion: { modo: "gps", gps: { lat: 41.3874, lng: 2.1686 } },
    });

    expect(registro).toMatchObject({
      tipo: "parking",
      ubicacion: { modo: "gps", gps: { lat: 41.3874, lng: 2.1686 } },
    });
  });

  it("rechaza un parking con ubicación inválida", () => {
    expect(
      validarAparcamiento({
        ...parking,
        id: "x",
        guardadoEn: 1,
        ubicacion: { modo: "gps", gps: { lat: "no", lng: 2.1686 } },
      }),
    ).toBeNull();

    expect(
      validarAparcamiento({
        ...parking,
        id: "x",
        guardadoEn: 1,
        ubicacion: {
          modo: "direccion",
          direccion: { calle: "Gran Via", numero: "  " },
        },
      }),
    ).toBeNull();
  });
});

describe("almacenamiento inmutable", () => {
  beforeEach(vaciarAlmacenes);

  it("no hay activo si no hay registros", async () => {
    expect(await leerActivo()).toBeNull();
  });

  it("guarda los tres modos con id único", async () => {
    const a = await anadirAparcamiento(calleGps);
    const b = await anadirAparcamiento(calleDireccion);
    const c = await anadirAparcamiento(calleCompleta);

    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    expect(await listarAparcamientos()).toHaveLength(3);
  });

  it("el activo es el registro más reciente sin recoger", async () => {
    const primero = await anadirAparcamiento(parking);
    await new Promise((r) => setTimeout(r, 2));
    const segundo = await anadirAparcamiento(calleGps);

    expect((await leerActivo())?.id).toBe(segundo.id);

    await registrarRecogida(segundo.id);
    expect((await leerActivo())?.id).toBe(primero.id);
  });

  it("recoger no borra el registro ni la foto", async () => {
    const foto = new Blob(["x"], { type: "image/jpeg" });
    const registro = await anadirAparcamiento(calleDireccion, foto);

    await registrarRecogida(registro.id);

    const guardados = await listarAparcamientos();
    expect(guardados.map((r) => r.id)).toContain(registro.id);
    expect(guardados.find((r) => r.id === registro.id)?.fotoId).toBe(registro.id);

    const eventos = await listarEventos();
    expect(eventos).toHaveLength(1);
    expect(eventos[0]?.aparcamientoId).toBe(registro.id);
    expect(await leerActivo()).toBeNull();
  });

  it("calcularActivo ignora los recogidos", () => {
    const registros: Aparcamiento[] = [
      { id: "a", tipo: "parking", guardadoEn: 1, planta: "1", plaza: "1" },
      { id: "b", tipo: "parking", guardadoEn: 2, planta: "2", plaza: "2" },
    ];
    const eventos = [
      { id: "e", tipo: "recogido" as const, aparcamientoId: "b", ocurridoEn: 3 },
    ];

    expect(calcularActivo(registros, eventos)?.id).toBe("a");
    expect(calcularActivo(registros, [])?.id).toBe("b");
  });
});

describe("migración desde localStorage", () => {
  beforeEach(vaciarAlmacenes);

  it("importa el registro antiguo de calle como modo completo", async () => {
    localStorage.setItem(
      APARCAMIENTO_KEY_LEGACY,
      JSON.stringify({
        id: "activo",
        tipo: "calle",
        guardadoEn: 1_700_000_000_000,
        calle: "Gran Via",
        numero: "10",
        ciudad: "Barcelona",
        lat: 41.3874,
        lng: 2.1686,
        dePago: true,
      }),
    );

    const migrado = await migrarDesdeLocalStorage();

    expect(migrado).not.toBeNull();
    expect(migrado?.tipo).toBe("calle");
    expect(localStorage.getItem(APARCAMIENTO_KEY_LEGACY)).toBeNull();
    expect(await listarAparcamientos()).toHaveLength(1);
    expect(await leerActivo()).not.toBeNull();
  });

  it("ignora datos corruptos y limpia la clave", async () => {
    localStorage.setItem(APARCAMIENTO_KEY_LEGACY, "{no es json");

    expect(await migrarDesdeLocalStorage()).toBeNull();
    expect(localStorage.getItem(APARCAMIENTO_KEY_LEGACY)).toBeNull();
    expect(await listarAparcamientos()).toHaveLength(0);
  });

  it("no hace nada si no hay registro antiguo", async () => {
    expect(await migrarDesdeLocalStorage()).toBeNull();
    expect(await listarAparcamientos()).toHaveLength(0);
  });
});

describe("esquema de IndexedDB", () => {
  beforeEach(vaciarAlmacenes);

  it("crea los almacenes y los índices", async () => {
    await anadirAparcamiento(parking);

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const peticion = indexedDB.open("whereismycar");
      peticion.onsuccess = () => resolve(peticion.result);
      peticion.onerror = () => reject(peticion.error);
    });

    expect([...db.objectStoreNames].sort()).toEqual(
      [ALMACEN_APARCAMIENTOS, ALMACEN_EVENTOS, ALMACEN_FOTOS].sort(),
    );

    const tx = db.transaction(ALMACEN_APARCAMIENTOS, "readonly");
    const store = tx.objectStore(ALMACEN_APARCAMIENTOS);
    expect([...store.indexNames]).toContain("porGuardadoEn");
    db.close();
  });
});
