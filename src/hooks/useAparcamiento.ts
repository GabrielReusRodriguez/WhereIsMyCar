import { useCallback, useEffect, useState } from "react";
import type { Aparcamiento, NuevoAparcamiento } from "../types/aparcamiento";
import {
  anadirAparcamiento,
  leerActivo,
  migrarDesdeLocalStorage,
  registrarRecogida,
} from "../storage/aparcamientos";

export function useAparcamiento() {
  const [aparcamiento, setAparcamiento] = useState<Aparcamiento | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let activo = true;

    void (async () => {
      try {
        await migrarDesdeLocalStorage();
        const actual = await leerActivo();
        if (activo) setAparcamiento(actual);
      } catch {
        if (activo) setAparcamiento(null);
      } finally {
        if (activo) setCargado(true);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  const guardar = useCallback(
    async (datos: NuevoAparcamiento, foto?: Blob): Promise<Aparcamiento> => {
      const nuevo = await anadirAparcamiento(datos, foto);
      setAparcamiento(nuevo);
      return nuevo;
    },
    [],
  );

  const recoger = useCallback(async () => {
    if (aparcamiento === null) return;
    await registrarRecogida(aparcamiento.id);
    setAparcamiento(null);
  }, [aparcamiento]);

  return { aparcamiento, cargado, guardar, recoger };
}
