import { LANGS } from '../config.js';
import { sentenceText } from './blocks.js';
import { canRecord, deleteRecording, getRecording, saveRecording, startRecording } from './recordings.js';
import { speak, stopSpeech } from './speech.js';
import { h } from './ui.js';

const MAX_MS = 20_000;

/**
 * Painel de pronúncia (shadowing): ouvir o modelo, gravar a própria voz,
 * comparar os dois ou importar um arquivo de áudio para a frase.
 */
export function pronunciaPanel(item, { lang: initial = 'en' } = {}) {
  let lang = initial;
  let rec = null;
  let timer = null;
  let url = null;
  let player = null;

  const status = h('p.muted.rec-status', { role: 'status', 'aria-live': 'polite' });
  const recBtn = h('button.btn.rec', { type: 'button', onclick: () => toggleRec() }, 'Gravar');
  const mineBtn = h('button.btn.ghost', { type: 'button', onclick: () => playMine() }, 'Minha voz');
  const cmpBtn = h('button.btn.ghost', { type: 'button', onclick: () => compare() }, 'Comparar');
  const delBtn = h('button.btn.ghost', { type: 'button', onclick: () => remove() }, 'Apagar');
  const fileIn = h('input', {
    type: 'file',
    accept: 'audio/*',
    hidden: true,
    onchange: (e) => importFile(e.target.files[0]),
  });
  const importBtn = h('button.btn.ghost', { type: 'button', onclick: () => fileIn.click() }, 'Importar áudio');

  const key = () => `${item.id}:${lang}`;
  const text = () => sentenceText(lang, item.blocks[lang], item.p);

  const seg = h(
    'div.seg',
    { role: 'group', 'aria-label': 'Idioma da gravação' },
    LANGS.map((l) =>
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': String(l.code === lang),
          onclick: (e) => {
            lang = l.code;
            seg
              .querySelectorAll('button')
              .forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
            refresh();
          },
        },
        l.label,
      ),
    ),
  );

  async function refresh() {
    stopPlayback();
    const saved = await getRecording(key()).catch(() => null);
    if (url) URL.revokeObjectURL(url);
    url = saved ? URL.createObjectURL(saved.blob) : null;
    [mineBtn, cmpBtn, delBtn].forEach((b) => (b.disabled = !url));
    status.textContent = saved
      ? `Áudio salvo em ${new Date(saved.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`
      : 'Ainda sem áudio seu para esta frase neste idioma.';
  }

  function stopPlayback() {
    player?.pause();
    player = null;
    stopSpeech();
  }

  function playUrl() {
    return new Promise((resolve) => {
      player = new Audio(url);
      player.onended = resolve;
      player.onerror = resolve;
      player.play().catch(resolve);
    });
  }

  async function toggleRec() {
    if (rec) {
      clearTimeout(timer);
      const blob = await rec.stop();
      rec = null;
      recBtn.textContent = 'Gravar';
      recBtn.classList.remove('on');
      await saveRecording(key(), blob);
      await refresh();
      return;
    }
    if (!canRecord()) {
      status.textContent = 'Gravação indisponível neste navegador. Use "Importar áudio".';
      return;
    }
    try {
      stopPlayback();
      rec = await startRecording();
      recBtn.textContent = 'Parar';
      recBtn.classList.add('on');
      status.textContent = `Gravando em ${lang.toUpperCase()}… fale a frase em blocos.`;
      timer = setTimeout(() => rec && toggleRec(), MAX_MS);
    } catch (err) {
      console.warn(err);
      rec = null;
      status.textContent = 'Sem acesso ao microfone. Permita o microfone nas configurações do app ou do navegador.';
    }
  }

  async function playMine() {
    if (!url) return;
    stopPlayback();
    await playUrl();
  }

  async function compare() {
    if (!url) return;
    stopPlayback();
    status.textContent = 'Modelo…';
    await speak(text(), lang);
    status.textContent = 'Sua voz…';
    await playUrl();
    refresh();
  }

  async function remove() {
    await deleteRecording(key());
    refresh();
  }

  async function importFile(file) {
    if (!file) return;
    await saveRecording(key(), file);
    fileIn.value = '';
    refresh();
  }

  const el = h(
    'div.pronuncia',
    {},
    h(
      'div.row',
      {},
      seg,
      h('button.btn.ghost', { type: 'button', onclick: () => speak(text(), lang) }, 'Ouvir modelo'),
    ),
    h('div.row', {}, recBtn, mineBtn, cmpBtn, importBtn, delBtn, fileIn),
    status,
  );
  refresh();
  return el;
}
