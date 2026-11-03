export const DB_NOMBRE = "whereismycar";
export const DB_VERSION = 1;
export const ALMACEN_FOTOS = "fotos";

export type FotoGuardada = {
  id: string;
  blob: Blob;
  tipoMime: string;
};

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(DB_NOMBRE, DB_VERSION);

    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      if (!db.objectStoreNames.contains(ALMACEN_FOTOS)) {
        db.createObjectStore(ALMACEN_FOTOS, { keyPath: "id" });
      }
    };

    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () =>
      reject(peticion.error ?? new Error("No se pudo abrir IndexedDB"));
    peticion.onblocked = () =>
      reject(new Error("La base de datos está bloqueada por otra pestaña"));
  });
}

async function ejecutar<T>(
  modo: IDBTransactionMode,
  operacion: (almacen: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrirDb();

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaccion = db.transaction(ALMACEN_FOTOS, modo);
      const peticion = operacion(transaccion.objectStore(ALMACEN_FOTOS));

      peticion.onsuccess = () => resolve(peticion.result);
      peticion.onerror = () =>
        reject(peticion.error ?? new Error("Error en IndexedDB"));
      transaccion.onabort = () =>
        reject(transaccion.error ?? new Error("Transacción abortada"));
    });
  } finally {
    db.close();
  }
}

export async function guardarFoto(foto: FotoGuardada): Promise<void> {
  await ejecutar("readwrite", (almacen) => almacen.put(foto));
}

export async function leerFoto(id: string): Promise<FotoGuardada | null> {
  const foto = await ejecutar<FotoGuardada | undefined>("readonly", (almacen) =>
    almacen.get(id),
  );
  return foto ?? null;
}

export async function borrarFoto(id: string): Promise<void> {
  await ejecutar("readwrite", (almacen) => almacen.delete(id));
}
