import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  borrarFoto,
  guardarFoto,
  guardarFotoAparcamiento,
  leerFoto,
} from "./indexedDb";

const foto = {
  id: "registro-1",
  blob: new Blob(["foto"], { type: "image/jpeg" }),
  tipoMime: "image/jpeg",
};

describe("almacenamiento de fotos", () => {
  beforeEach(async () => {
    await borrarFoto("registro-1");
  });

  it("devuelve null si no existe la foto", async () => {
    expect(await leerFoto("registro-1")).toBeNull();
  });

  it("guarda y recupera la foto", async () => {
    await guardarFoto(foto);

    const guardada = await leerFoto("registro-1");
    expect(guardada).not.toBeNull();
    expect(guardada?.id).toBe("registro-1");
    expect(guardada?.tipoMime).toBe("image/jpeg");
    expect(guardada?.blob).toBeDefined();
  });

  it("asocia la foto al id del aparcamiento", async () => {
    const id = await guardarFotoAparcamiento(
      new Blob(["x"], { type: "image/png" }),
      "abc",
    );

    expect(id).toBe("abc");
    expect((await leerFoto("abc"))?.tipoMime).toBe("image/png");
    await borrarFoto("abc");
  });

  it("borra la foto", async () => {
    await guardarFoto(foto);
    await borrarFoto("registro-1");
    expect(await leerFoto("registro-1")).toBeNull();
  });
});
