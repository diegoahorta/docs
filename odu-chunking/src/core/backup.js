import { isNative, nativeExport } from './native.js';
import { store } from './store.js';

const fileName = () => `odu-blocos-progresso-${new Date().toISOString().slice(0, 10)}.json`;

/**
 * Exporta o progresso como JSON. No Android abre o "Salvar como" do sistema
 * (Downloads, Drive, etc.); no navegador baixa o arquivo.
 */
export async function exportProgress() {
  const data = JSON.stringify({ app: 'odu-blocos', exportedAt: new Date().toISOString(), ...store.get() }, null, 2);
  const name = fileName();
  if (isNative()) {
    const { msg } = await nativeExport(name, data);
    return msg;
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return `Arquivo ${name} baixado`;
}

export async function importProgress(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  store.restore(data);
}
