export type TipoAparcamiento = "parking" | "calle";

type AparcamientoBase = {
  id: "activo";
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
};

export type AparcamientoCalle = AparcamientoBase & {
  tipo: "calle";
  calle: string;
  numero: string;
  ciudad: string;
  lat: number;
  lng: number;
  dePago: boolean;
};

export type Aparcamiento = AparcamientoParking | AparcamientoCalle;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** Datos que introduce el usuario; id, hora y foto se añaden al guardar. */
export type NuevoAparcamiento = DistributiveOmit<
  Aparcamiento,
  "id" | "guardadoEn" | "fotoId"
>;
