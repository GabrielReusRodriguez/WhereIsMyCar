export type CodigoErrorUbicacion =
  | "permiso-denegado"
  | "no-disponible"
  | "timeout"
  | "no-soportado";

export class ErrorUbicacion extends Error {
  readonly codigo: CodigoErrorUbicacion;

  constructor(codigo: CodigoErrorUbicacion) {
    super(codigo);
    this.name = "ErrorUbicacion";
    this.codigo = codigo;
  }
}

export type Coordenadas = {
  lat: number;
  lng: number;
};

function codigoDesdeError(error: GeolocationPositionError): CodigoErrorUbicacion {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "permiso-denegado";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "no-disponible";
  }
}

export function obtenerUbicacion(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new ErrorUbicacion("no-soportado"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (error) => reject(new ErrorUbicacion(codigoDesdeError(error))),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}
