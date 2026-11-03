import { useCallback, useState } from "react";
import type { Aparcamiento, NuevoAparcamiento } from "../types/aparcamiento";
import {
  borrarAparcamiento,
  guardarAparcamiento,
  leerAparcamiento,
} from "../storage/localStorage";
import { borrarFoto } from "../storage/indexedDb";

export function useAparcamiento() {
  const [aparcamiento, setAparcamiento] = useState<Aparcamiento | null>(() =>
    leerAparcamiento(),
  );

  const guardar = useCallback(
    (datos: NuevoAparcamiento, fotoId?: string) => {
      const nuevo = {
        ...datos,
        id: "activo",
        guardadoEn: Date.now(),
        ...(fotoId === undefined ? {} : { fotoId }),
      } as Aparcamiento;

      guardarAparcamiento(nuevo);
      setAparcamiento(nuevo);
      return nuevo;
    },
    [],
  );

  const recoger = useCallback(async () => {
    const actual = leerAparcamiento();

    if (actual?.fotoId !== undefined) {
      await borrarFoto(actual.fotoId);
    }

    borrarAparcamiento();
    setAparcamiento(null);
  }, []);

  return { aparcamiento, guardar, recoger };
}
