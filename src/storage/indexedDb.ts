export const DB_NOMBRE = "whereismycar";
export const DB_VERSION = 2;
export const ALMACEN_FOTOS = "fotos";
export const ALMACEN_APARCAMIENTOS = "aparcamientos";
export const ALMACEN_EVENTOS = "eventos";
export const INDICE_GUARDADO_EN = "porGuardadoEn";
export const INDICE_APARCAMIENTO = "porAparcamiento";

export type FotoGuardada = {
  id: string;
  blob: Blob;
  tipoMime: string;
};

/**
 * `IDBRequest<T>` es invariante en su tipo de resultado (por el `this` de los
 * handlers), así que las operaciones se declaran como `IDBRequest<unknown>` y
 * el consumidor castea el resultado de la transacción.
 */
export type Operacion = {
  almacen: string;
  ejecutar: (store: IDBObjectStore) => IDBRequest<unknown>;
};

/** Adapta un `IDBRequest` concreto a la firma de `Operacion`. */
export function peticion<T>(solicitud: IDBRequest<T>): IDBRequest<unknown> {
  return solicitud as unknown as IDBRequest<unknown>;
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(DB_NOMBRE, DB_VERSION);

    peticion.onupgradeneeded = () => {
      const db = peticion.result;

      if (!db.objectStoreNames.contains(ALMACEN_FOTOS)) {
        db.createObjectStore(ALMACEN_FOTOS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(ALMACEN_APARCAMIENTOS)) {
        const aparcamientos = db.createObjectStore(ALMACEN_APARCAMIENTOS, {
          keyPath: "id",
        });
        aparcamientos.createIndex(INDICE_GUARDADO_EN, "guardadoEn");
      }

      if (!db.objectStoreNames.contains(ALMACEN_EVENTOS)) {
        const eventos = db.createObjectStore(ALMACEN_EVENTOS, {
          keyPath: "id",
        });
        eventos.createIndex(INDICE_APARCAMIENTO, "aparcamientoId");
      }
    };

    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () =>
      reject(peticion.error ?? new Error("No se pudo abrir IndexedDB"));
    peticion.onblocked = () =>
      reject(new Error("La base de datos está bloqueada por otra pestaña"));
  });
}

/**
 * Ejecuta varias operaciones dentro de una única transacción atómica.
 * Si alguna falla, la transacción se aborta y no se persiste nada.
 * Devuelve los resultados en el mismo orden que las operaciones.
 */
export function transaccion(
  almacenes: readonly string[],
  modo: IDBTransactionMode,
  operaciones: (db: IDBDatabase) => Operacion[],
): Promise<unknown[]> {
  return abrirDb().then(
    (db) =>
      new Promise<unknown[]>((resolve, reject) => {
        try {
          const transaccion = db.transaction([...almacenes], modo);
          const resultados: unknown[] = [];
          let cerrada = false;

          const cerrar = () => {
            if (cerrada) return;
            cerrada = true;
            db.close();
          };

          transaccion.oncomplete = () => {
            cerrar();
            resolve(resultados);
          };
          transaccion.onabort = () => {
            cerrar();
            reject(transaccion.error ?? new Error("Transacción abortada"));
          };
          transaccion.onerror = () => {
            cerrar();
            reject(transaccion.error ?? new Error("Error en IndexedDB"));
          };

          const lista = operaciones(db);

          if (lista.length === 0) {
            cerrar();
            resolve(resultados);
            return;
          }

          lista.forEach((operacion, indice) => {
            const peticion = operacion.ejecutar(
              transaccion.objectStore(operacion.almacen),
            );
            peticion.onsuccess = () => {
              resultados[indice] = peticion.result;
            };
            // Un error en la petición aborta la transacción: se gestiona en
            // `transaccion.onerror` / `onabort`.
          });
        } catch (error) {
          db.close();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }),
  );
}

export async function guardarFoto(foto: FotoGuardada): Promise<void> {
  await transaccion([ALMACEN_FOTOS], "readwrite", () => [
    { almacen: ALMACEN_FOTOS, ejecutar: (store) => peticion(store.put(foto)) },
  ]);
}

export async function leerFoto(id: string): Promise<FotoGuardada | null> {
  const [foto] = await transaccion([ALMACEN_FOTOS], "readonly", () => [
    { almacen: ALMACEN_FOTOS, ejecutar: (store) => peticion(store.get(id)) },
  ]);
  return (foto as FotoGuardada | undefined) ?? null;
}

export async function borrarFoto(id: string): Promise<void> {
  await transaccion([ALMACEN_FOTOS], "readwrite", () => [
    { almacen: ALMACEN_FOTOS, ejecutar: (store) => peticion(store.delete(id)) },
  ]);
}

export async function guardarFotoAparcamiento(
  blob: Blob,
  id: string,
): Promise<string> {
  await guardarFoto({
    id,
    blob,
    tipoMime: blob.type === "" ? "image/jpeg" : blob.type,
  });
  return id;
}
