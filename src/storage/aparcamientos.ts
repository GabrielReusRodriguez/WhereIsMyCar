import type {
  Aparcamiento,
  AparcamientoCalle,
  AparcamientoParking,
  Direccion,
  EventoAparcamiento,
  NuevoAparcamiento,
  UbicacionGps,
} from "../types/aparcamiento";
import {
  ALMACEN_APARCAMIENTOS,
  ALMACEN_EVENTOS,
  ALMACEN_FOTOS,
  INDICE_GUARDADO_EN,
  peticion,
  transaccion,
} from "./indexedDb";

/** Clave del registro antiguo (mutable) que se migra al nuevo esquema. */
export const APARCAMIENTO_KEY_LEGACY = "whereismycar.aparcamiento";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function esTextoNoVacio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

function validarGps(valor: unknown): UbicacionGps | null {
  if (!esObjeto(valor) || !esNumero(valor.lat) || !esNumero(valor.lng)) {
    return null;
  }
  return { lat: valor.lat, lng: valor.lng };
}

function validarDireccion(valor: unknown): Direccion | null {
  if (!esObjeto(valor)) return null;
  if (!esTextoNoVacio(valor.calle) || !esTextoNoVacio(valor.numero)) {
    return null;
  }
  if (valor.ciudad !== undefined && typeof valor.ciudad !== "string") {
    return null;
  }
  return {
    calle: valor.calle,
    numero: valor.numero,
    ...(esTextoNoVacio(valor.ciudad) ? { ciudad: valor.ciudad } : {}),
  };
}

function validarParking(valor: Record<string, unknown>): AparcamientoParking | null {
  if (!esTextoNoVacio(valor.planta) || !esTextoNoVacio(valor.plaza)) return null;
  if (valor.zona !== undefined && typeof valor.zona !== "string") return null;

  return {
    id: valor.id as string,
    tipo: "parking",
    guardadoEn: valor.guardadoEn as number,
    ...(typeof valor.fotoId === "string" ? { fotoId: valor.fotoId } : {}),
    planta: valor.planta,
    ...(esTextoNoVacio(valor.zona) ? { zona: valor.zona } : {}),
    plaza: valor.plaza,
  };
}

function validarCalle(valor: Record<string, unknown>): AparcamientoCalle | null {
  if (typeof valor.dePago !== "boolean") return null;

  const base = {
    id: valor.id as string,
    tipo: "calle" as const,
    guardadoEn: valor.guardadoEn as number,
    ...(typeof valor.fotoId === "string" ? { fotoId: valor.fotoId } : {}),
    dePago: valor.dePago,
  };

  const gps = validarGps(valor.gps);
  const direccion = validarDireccion(valor.direccion);

  if (gps !== null && direccion !== null) {
    return { ...base, modo: "completo", gps, direccion };
  }
  if (gps !== null) return { ...base, modo: "gps", gps };
  if (direccion !== null) return { ...base, modo: "direccion", direccion };
  return null;
}

/** Valida un registro leído del almacenamiento; devuelve null si es inválido. */
export function validarAparcamiento(valor: unknown): Aparcamiento | null {
  if (!esObjeto(valor)) return null;
  if (!esTextoNoVacio(valor.id) || !esNumero(valor.guardadoEn)) return null;

  if (valor.tipo === "parking") return validarParking(valor);
  if (valor.tipo === "calle") return validarCalle(valor);
  return null;
}

function validarEvento(valor: unknown): EventoAparcamiento | null {
  if (!esObjeto(valor)) return null;
  if (!esTextoNoVacio(valor.id) || !esTextoNoVacio(valor.aparcamientoId)) {
    return null;
  }
  if (!esNumero(valor.ocurridoEn)) return null;
  if (valor.tipo !== "recogido") return null;

  return {
    id: valor.id,
    tipo: "recogido",
    aparcamientoId: valor.aparcamientoId,
    ocurridoEn: valor.ocurridoEn,
  };
}

function nuevoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listarAparcamientos(): Promise<Aparcamiento[]> {
  const [registros] = await transaccion(
    [ALMACEN_APARCAMIENTOS],
    "readonly",
    () => [
      {
        almacen: ALMACEN_APARCAMIENTOS,
        ejecutar: (store) =>
          peticion(store.index(INDICE_GUARDADO_EN).getAll()),
      },
    ],
  );

  const validos: Aparcamiento[] = [];
  for (const registro of (registros as unknown[] | undefined) ?? []) {
    const valido = validarAparcamiento(registro);
    if (valido !== null) validos.push(valido);
  }
  return validos;
}

export async function listarEventos(): Promise<EventoAparcamiento[]> {
  const [registros] = await transaccion(
    [ALMACEN_EVENTOS],
    "readonly",
    () => [
      {
        almacen: ALMACEN_EVENTOS,
        ejecutar: (store) => peticion(store.getAll()),
      },
    ],
  );

  const validos: EventoAparcamiento[] = [];
  for (const registro of (registros as unknown[] | undefined) ?? []) {
    const valido = validarEvento(registro);
    if (valido !== null) validos.push(valido);
  }
  return validos;
}

/**
 * Devuelve el aparcamiento activo: el más reciente que no tenga un evento
 * de recogida asociado. Los registros nunca se modifican ni se borran.
 */
export function calcularActivo(
  aparcamientos: readonly Aparcamiento[],
  eventos: readonly EventoAparcamiento[],
): Aparcamiento | null {
  const recogidos = new Set(eventos.map((evento) => evento.aparcamientoId));

  let activo: Aparcamiento | null = null;
  for (const aparcamiento of aparcamientos) {
    if (recogidos.has(aparcamiento.id)) continue;
    if (activo === null || aparcamiento.guardadoEn > activo.guardadoEn) {
      activo = aparcamiento;
    }
  }
  return activo;
}

export async function leerActivo(): Promise<Aparcamiento | null> {
  const [aparcamientos, eventos] = await Promise.all([
    listarAparcamientos(),
    listarEventos(),
  ]);
  return calcularActivo(aparcamientos, eventos);
}

/**
 * Añade un registro inmutable. El `id` se genera aquí y la foto, si existe,
 * se guarda en el mismo `id` dentro de la misma transacción.
 */
export async function anadirAparcamiento(
  datos: NuevoAparcamiento,
  foto?: Blob,
): Promise<Aparcamiento> {
  const id = nuevoId();
  const registro = validarAparcamiento({
    ...datos,
    id,
    guardadoEn: Date.now(),
    ...(foto === undefined ? {} : { fotoId: id }),
  });

  if (registro === null) {
    throw new Error("Datos de aparcamiento inválidos");
  }

  const almacenes =
    foto === undefined
      ? [ALMACEN_APARCAMIENTOS]
      : [ALMACEN_APARCAMIENTOS, ALMACEN_FOTOS];

  await transaccion(almacenes, "readwrite", () => [
    {
      almacen: ALMACEN_APARCAMIENTOS,
      ejecutar: (store) => peticion(store.add(registro)),
    },
    ...(foto === undefined
      ? []
      : [
          {
            almacen: ALMACEN_FOTOS,
            ejecutar: (store: IDBObjectStore) =>
              peticion(
                store.add({
                  id,
                  blob: foto,
                  tipoMime: foto.type === "" ? "image/jpeg" : foto.type,
                }),
              ),
          },
        ]),
  ]);

  return registro;
}

/**
 * Registra la recogida del coche como evento inmutable. El aparcamiento y su
 * foto se conservan intactos.
 */
export async function registrarRecogida(
  aparcamientoId: string,
): Promise<EventoAparcamiento> {
  const evento: EventoAparcamiento = {
    id: nuevoId(),
    tipo: "recogido",
    aparcamientoId,
    ocurridoEn: Date.now(),
  };

  await transaccion([ALMACEN_EVENTOS], "readwrite", () => [
    {
      almacen: ALMACEN_EVENTOS,
      ejecutar: (store) => peticion(store.add(evento)),
    },
  ]);

  return evento;
}

/**
 * Copia la foto del esquema antiguo (clave fija `"activo"`) al nuevo `id` y
 * elimina la entrada antigua.
 */
async function migrarFotoAntigua(nuevoFotoId: string): Promise<void> {
  const [foto] = await transaccion([ALMACEN_FOTOS], "readonly", () => [
    {
      almacen: ALMACEN_FOTOS,
      ejecutar: (store) => peticion(store.get("activo")),
    },
  ]);

  const anterior = foto as { blob: Blob; tipoMime: string } | undefined;
  if (anterior === undefined) return;

  await transaccion([ALMACEN_FOTOS], "readwrite", () => [
    {
      almacen: ALMACEN_FOTOS,
      ejecutar: (store) =>
        peticion(
          store.put({
            id: nuevoFotoId,
            blob: anterior.blob,
            tipoMime: anterior.tipoMime,
          }),
        ),
    },
    {
      almacen: ALMACEN_FOTOS,
      ejecutar: (store) => peticion(store.delete("activo")),
    },
  ]);
}

/**
 * Migra el registro antiguo guardado en localStorage (esquema mutable, con
 * `id: "activo"` y coordenadas planas) al nuevo esquema inmutable. Idempotente:
 * elimina la clave antigua tras importarla.
 */
export async function migrarDesdeLocalStorage(): Promise<Aparcamiento | null> {
  let bruto: string | null;
  try {
    bruto = localStorage.getItem(APARCAMIENTO_KEY_LEGACY);
  } catch {
    return null;
  }
  if (bruto === null) return null;

  let migrado: Aparcamiento | null = null;

  try {
    const antiguo: unknown = JSON.parse(bruto);
    if (esObjeto(antiguo) && esNumero(antiguo.guardadoEn)) {
      const id = nuevoId();
      const fotoId = typeof antiguo.fotoId === "string" ? id : undefined;

      const base = {
        id,
        guardadoEn: antiguo.guardadoEn,
        ...(fotoId === undefined ? {} : { fotoId }),
      };

      const candidato =
        antiguo.tipo === "parking"
          ? {
              ...base,
              tipo: "parking",
              planta: antiguo.planta,
              zona: antiguo.zona,
              plaza: antiguo.plaza,
            }
          : antiguo.tipo === "calle"
            ? {
                ...base,
                tipo: "calle",
                dePago: antiguo.dePago,
                ...(esNumero(antiguo.lat) && esNumero(antiguo.lng)
                  ? {
                      gps: { lat: antiguo.lat, lng: antiguo.lng },
                      direccion: {
                        calle: antiguo.calle,
                        numero: antiguo.numero,
                        ciudad: antiguo.ciudad,
                      },
                    }
                  : {}),
              }
            : null;

      migrado = candidato === null ? null : validarAparcamiento(candidato);

      if (migrado !== null) {
        await transaccion([ALMACEN_APARCAMIENTOS], "readwrite", () => [
          {
            almacen: ALMACEN_APARCAMIENTOS,
            ejecutar: (store) => peticion(store.add(migrado)),
          },
        ]);

        if (fotoId !== undefined) {
          await migrarFotoAntigua(fotoId);
        }
      }
    }
  } catch {
    migrado = null;
  }

  try {
    localStorage.removeItem(APARCAMIENTO_KEY_LEGACY);
  } catch {
    // localStorage no disponible: la clave se reintentará en el próximo arranque.
  }

  return migrado;
}
