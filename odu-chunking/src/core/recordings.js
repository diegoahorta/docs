/**
 * Áudios do próprio aluno (gravados no app ou importados), guardados no
 * IndexedDB do aparelho. Chave: "<id da frase>:<idioma>".
 */
const DB = 'odu-blocos-audio';
const STORE = 'gravacoes';
let dbp = null;

function open() {
  dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
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

export const saveRecording = (key, blob) => tx('readwrite', (s) => s.put({ blob, at: Date.now() }, key));
export const getRecording = (key) => tx('readonly', (s) => s.get(key));
export const deleteRecording = (key) => tx('readwrite', (s) => s.delete(key));
export const listRecordingKeys = () => tx('readonly', (s) => s.getAllKeys());

export const canRecord = () => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

/** Grava do microfone até `stop()` ser chamado. */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  rec.start();
  return {
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(parts, { type: rec.mimeType || 'audio/webm' }));
        };
        rec.stop();
      }),
  };
}
