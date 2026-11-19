// Armazenamento local (IndexedDB) — tudo fica no aparelho, off-line.
const DB_NAME = 'leitor-estudos';
const VERSION = 1;
export const STORES = ['docs', 'files', 'texts', 'annotations', 'excerpts', 'mindmaps', 'studies', 'collections', 'settings'];

let dbp;
function open() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        for (const s of STORES) {
          if (!d.objectStoreNames.contains(s)) {
            const os = d.createObjectStore(s, { keyPath: 'id' });
            if (s === 'annotations' || s === 'excerpts') os.createIndex('docId', 'docId');
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function run(store, mode, fn) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const os = t.objectStore(store);
    let result;
    const r = fn(os);
    if (r) r.onsuccess = () => { result = r.result; };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transação abortada'));
  });
}

export const db = {
  get: (s, id) => run(s, 'readonly', os => os.get(id)),
  all: s => run(s, 'readonly', os => os.getAll()),
  put: (s, v) => run(s, 'readwrite', os => os.put(v)).then(() => v),
  del: (s, id) => run(s, 'readwrite', os => os.delete(id)),
  clear: s => run(s, 'readwrite', os => os.clear()),
  byDoc: (s, docId) => run(s, 'readonly', os => os.index('docId').getAll(docId)),
  async putMany(s, list) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const t = d.transaction(s, 'readwrite');
      const os = t.objectStore(s);
      list.forEach(v => os.put(v));
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  },
  async setting(key, value) {
    if (value === undefined) return (await db.get('settings', key))?.value;
    return db.put('settings', { id: key, value });
  },
};

// Pede armazenamento persistente para o sistema não apagar os dados.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
