import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { borrarFoto, guardarFoto, leerFoto } from "./indexedDb";

const foto = {
  id: "activo",
  blob: new Blob(["foto"], { type: "image/jpeg" }),
  tipoMime: "image/jpeg",
};

describe("almacenamiento de fotos", () => {
  beforeEach(async () => {
    await borrarFoto("activo");
  });

  it("devuelve null si no existe la foto", async () => {
    expect(await leerFoto("activo")).toBeNull();
  });

  it("guarda y recupera la foto", async () => {
    await guardarFoto(foto);

    const guardada = await leerFoto("activo");
    expect(guardada).not.toBeNull();
    expect(guardada?.id).toBe("activo");
    expect(guardada?.tipoMime).toBe("image/jpeg");
    expect(guardada?.blob).toBeDefined();
  });

  it("borra la foto", async () => {
    await guardarFoto(foto);
    await borrarFoto("activo");
    expect(await leerFoto("activo")).toBeNull();
  });
});
