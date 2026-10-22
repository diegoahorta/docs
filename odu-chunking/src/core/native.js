/**
 * Ponte com o app Android (android/src/main/java/.../MainActivity.java).
 * No APK, o WebView injeta window.OduNative; no navegador tudo cai para as APIs web.
 */
export const native = typeof window !== 'undefined' ? window.OduNative : undefined;

export const isNative = () => Boolean(native);

let seq = 0;
const waiting = new Map();

// Chamados pelo Java quando a fala termina ou o backup é salvo.
if (typeof window !== 'undefined') {
  window.__oduTtsDone = (id) => {
    waiting.get(id)?.();
    waiting.delete(id);
  };
}

/** Fala com o TextToSpeech do Android. Resolve quando termina; false se não houver voz. */
export function nativeSpeak(text, tag, rate) {
  const id = `u${(seq += 1)}`;
  return new Promise((resolve) => {
    const ok = native.speak(text, tag, rate, id);
    if (!ok) {
      resolve(false);
      return;
    }
    // Garantia caso o aviso de fim não chegue (ex.: fala interrompida).
    const guard = setTimeout(() => window.__oduTtsDone(id), 1500 + text.length * 120);
    waiting.set(id, () => {
      clearTimeout(guard);
      resolve(true);
    });
  });
}

/** Abre o seletor "Salvar como" do Android e grava o texto no arquivo escolhido. */
export function nativeExport(name, content) {
  return new Promise((resolve) => {
    window.__oduExportDone = (ok, msg) => resolve({ ok, msg });
    native.exportFile(name, content);
  });
}
