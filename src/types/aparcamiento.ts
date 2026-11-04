export type TipoAparcamiento = "parking" | "calle";

/** Coordenadas GPS de un aparcamiento en la calle. */
export type UbicacionGps = {
  lat: number;
  lng: number;
};

/** Dirección postal de un aparcamiento en la calle. */
export type Direccion = {
  calle: string;
  numero: string;
  ciudad?: string;
};

/** Ubicación opcional de un aparcamiento público: dirección o GPS. */
export type UbicacionParking =
  | { modo: "direccion"; direccion: Direccion }
  | { modo: "gps"; gps: UbicacionGps };

type AparcamientoBase = {
  /** Identificador único e inmutable del registro. */
  id: string;
  /** Hora en la que se guardó el aparcamiento (epoch ms). */
  guardadoEn: number;
  /** Clave de la foto en IndexedDB, si existe. */
  fotoId?: string;
};

export type AparcamientoParking = AparcamientoBase & {
  tipo: "parking";
  planta: string;
  zona?: string;
  plaza: string;
  /** Dirección o coordenadas del parking, si el usuario las indica. */
  ubicacion?: UbicacionParking;
};

type AparcamientoCalleBase = AparcamientoBase & {
  tipo: "calle";
  dePago: boolean;
};

/**
 * Un aparcamiento en la calle se registra en uno de tres modos:
 * solo GPS, solo dirección o ambos.
 */
export type AparcamientoCalle =
  | (AparcamientoCalleBase & { modo: "gps"; gps: UbicacionGps })
  | (AparcamientoCalleBase & { modo: "direccion"; direccion: Direccion })
  | (AparcamientoCalleBase & {
      modo: "completo";
      gps: UbicacionGps;
      direccion: Direccion;
    });

export type Aparcamiento = AparcamientoParking | AparcamientoCalle;

/** Evento inmutable asociado a un aparcamiento. */
export type EventoAparcamiento = {
  id: string;
  tipo: "recogido";
  aparcamientoId: string;
  ocurridoEn: number;
};

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** Datos que introduce el usuario; id, hora y foto se añaden al guardar. */
export type NuevoAparcamiento = DistributiveOmit<
  Aparcamiento,
  "id" | "guardadoEn" | "fotoId"
>;
