/**
 * IndexedDB mínimo para mídias importadas pelo professor (áudios, imagens grandes).
 * Chave: string livre, ex.: "en-a1-cafe/t1". Valor: Blob.
 */
const DB = 'odu-media';
const STORE = 'files';

function open() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDB indisponível'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export const putMedia = (key, blob) => tx('readwrite', (s) => s.put(blob, key));
export const getMedia = (key) => tx('readonly', (s) => s.get(key)).catch(() => undefined);
export const deleteMedia = (key) => tx('readwrite', (s) => s.delete(key));
