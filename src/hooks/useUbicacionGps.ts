import { useState } from "react";
import {
  ErrorUbicacion,
  obtenerUbicacion,
  type CodigoErrorUbicacion,
} from "../utils/geolocalizacion";

export type EstadoUbicacionGps =
  | { estado: "inicial" }
  | { estado: "cargando" }
  | { estado: "ok"; lat: number; lng: number }
  | { estado: "error"; codigo: CodigoErrorUbicacion };

export function useUbicacionGps() {
  const [ubicacion, setUbicacion] = useState<EstadoUbicacionGps>({
    estado: "inicial",
  });

  const solicitar = async () => {
    setUbicacion({ estado: "cargando" });
    try {
      const { lat, lng } = await obtenerUbicacion();
      setUbicacion({ estado: "ok", lat, lng });
    } catch (error) {
      const codigo =
        error instanceof ErrorUbicacion ? error.codigo : "no-disponible";
      setUbicacion({ estado: "error", codigo });
    }
  };

  return { ubicacion, solicitar };
}
