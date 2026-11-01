/**
 * MÓDULO 9 — PAINEL DO PROFESSOR (modo local).
 *
 * Tudo é salvo NESTE navegador (localStorage + IndexedDB para áudios). Não há servidor nem contas:
 * por isso o painel não armazena dados pessoais de alunos — apenas os arquivos de progresso que o
 * professor importa voluntariamente. Para uso multiusuário com autenticação, ver docs/BACKEND.md.
 */
import { h, clear, tabs, download, toast } from '../core/dom.js';
import * as store from '../core/store.js';
import { listUnits, allSkills, skillName, assetUrl } from '../core/unit-loader.js';
import { validateQuestion } from '../core/evaluate.js';
import { parseVTT, toVTT, validateTimings } from '../core/audio-sync.js';
import { putMedia, getMedia, deleteMedia } from '../core/idb.js';
import { classify, STATUS_LABELS } from '../core/srs.js';
import { renderQuestion } from '../components/question.js';
import { plain } from '../core/jp.js';

const clone = (u) => { const c = JSON.parse(JSON.stringify(u)); delete c._base; delete c._edited; return c; };

export async function render(ctx) {
  const units = await listUnits();
  let draft = clone(ctx.unit);
  draft._baseFrom ||= ctx.unit._base.replace(/^units\/|\/$/g, '');
  const dirty = h('span', { class: 'small muted', 'aria-live': 'polite' });
  const markDirty = () => (dirty.textContent = '● Alterações não salvas');

  async function save() {
    store.saveUnitOverride(draft);
    if (!units.some((u) => u.id === draft.id)) store.setCustomUnitIds([...store.getCustomUnitIds(), draft.id]);
    await ctx.reloadUnit(draft.id);
    draft = clone(ctx.unit); draft._baseFrom ||= ctx.unit._base.replace(/^units\/|\/$/g, '');
    dirty.textContent = '✓ Salvo neste navegador';
    toast('Unidade salva.');
  }
  const saveBar = () => h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', onClick: save }, '💾 Salvar alterações'), dirty);

  /* ---------- 1. Unidade ---------- */
  function unitTab() {
    const f = (label, path, type = 'text') => {
      const get = () => path.reduce((o, k) => o?.[k], draft);
      const inp = h('input', { type, value: get() ?? '', onInput: (e) => { let o = draft; path.slice(0, -1).forEach((k) => (o = o[k] ||= {})); o[path.at(-1)] = type === 'number' ? Number(e.target.value) : e.target.value; markDirty(); } });
      return h('label', { class: 'field' }, label, inp);
    };
    const objectives = h('textarea', { onInput: (e) => { draft.objectives = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); markDirty(); } }, draft.objectives.join('\n'));
    const cover = h('input', { type: 'file', accept: 'image/*', onChange: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 400 * 1024) return toast('Imagem muito grande (máx. 400 KB para salvar no navegador).');
      const r = new FileReader();
      r.onload = () => { draft.coverImage = r.result; markDirty(); toast('Imagem carregada — salve para aplicar.'); };
      r.readAsDataURL(file);
    } });
    const importInp = h('input', { type: 'file', accept: 'application/json,.json', onChange: async (e) => {
      try {
        const u = JSON.parse(await e.target.files[0].text());
        if (!u.id || !u.tracks || !u.questions) throw new Error('JSON sem id/tracks/questions.');
        draft = u; draft._baseFrom ||= ctx.unit._base.replace(/^units\/|\/$/g, '');
        await save();
        ctx.go('#/teacher');
      } catch (err) { toast(`Importação falhou: ${err.message}`); }
    } });
    return h('div', {},
      h('section', { class: 'card' }, h('h3', {}, 'Unidade ativa'),
        h('div', { class: 'row' }, h('select', { 'aria-label': 'Unidade', style: { width: 'auto' }, onChange: async (e) => { await ctx.reloadUnit(e.target.value); ctx.go('#/teacher'); location.reload(); } },
          units.map((u) => h('option', { value: u.id, selected: u.id === ctx.unit.id }, `${u.title} — ${u.language} ${u.level}${u.custom ? ' (criada no painel)' : ''}`)))),
        ctx.unit._edited ? h('p', { class: 'notice' }, 'Esta unidade tem edições salvas neste navegador. ', h('button', { class: 'btn small', onClick: async () => {
          if (!confirm('Descartar as edições e voltar ao arquivo original?')) return;
          store.removeUnitOverride(ctx.unit.id);
          await ctx.reloadUnit(ctx.unit.id).catch(() => ctx.reloadUnit('en-a1-cafe'));
          location.reload();
        } }, 'Restaurar original')) : null),
      h('section', { class: 'card' }, h('h3', {}, 'Identificação'),
        h('div', { class: 'grid two' }, f('Título', ['title']), f('Subtítulo', ['subtitle']), f('Idioma (nome)', ['language', 'name']), f('Código BCP-47 (voz/reconhecimento)', ['language', 'bcp47']),
          f('Nível (QECR / JLPT…)', ['level']), f('Idade', ['age'], 'number'), f('Nº da unidade', ['unitNumber'], 'number'), f('Objetivo comunicativo', ['communicativeGoal']),
          f('URL pública dos áudios (para a apostila)', ['audioBaseUrl'], 'url'), f('Título do Discover', ['labels', 'discover'])),
        h('label', { class: 'field' }, 'Objetivos (um por linha)', objectives),
        h('label', { class: 'field' }, 'Imagem de capa (opcional)', cover),
        saveBar()),
      h('section', { class: 'card' }, h('h3', {}, 'Criar, exportar e importar'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onClick: async () => {
            const id = prompt('ID da nova unidade (letras, números e hífen):', `${draft.id}-copia`);
            if (!id || !/^[a-z0-9-]+$/.test(id)) return id && toast('ID inválido.');
            draft = { ...clone(draft), id, title: `${draft.title} (cópia)`, _baseFrom: draft._baseFrom };
            await save();
            location.reload();
          } }, '➕ Duplicar como nova unidade'),
          h('button', { class: 'btn', onClick: () => download(`${draft.id}.json`, JSON.stringify(draft, null, 2), 'application/json') }, '⬇ Exportar unidade (JSON)'),
          h('label', { class: 'btn' }, '⬆ Importar unidade (JSON)', h('span', { class: 'sr-only' }, importInp))),
        h('p', { class: 'small muted' }, 'Para publicar uma unidade para todos, coloque o JSON exportado em units/<id>/unit.json e registre-a em units/index.json (ver docs/ADICIONAR-UNIDADES.md).')));
  }

  /* ---------- 2. Áudio e transcrição ---------- */
  function audioTab() {
    const wrap = h('div', {});
    draft.tracks.forEach((track, ti) => {
      const key = `${draft.id}/${track.id}`;
      const info = h('p', { class: 'small' });
      getMedia(key).then((b) => (info.textContent = b ? `Áudio importado em uso (${(b.size / 1024).toFixed(0)} KB).` : `Usando o arquivo da unidade: ${track.audio}`));
      const tbody = h('tbody', {});
      const problems = h('div', { 'aria-live': 'polite' });
      const drawRows = () => {
        clear(tbody).append(...track.segments.map((s, i) => h('tr', {},
          h('td', {}, String(i + 1)),
          h('td', {}, h('input', { value: s.speaker, 'aria-label': `Falante ${i + 1}`, style: { width: '90px' }, onInput: (e) => { s.speaker = e.target.value; markDirty(); } })),
          h('td', {}, h('input', { value: s.text, 'aria-label': `Texto ${i + 1}`, onInput: (e) => { s.text = e.target.value; markDirty(); } }),
            h('input', { value: s.pt, 'aria-label': `Tradução ${i + 1}`, onInput: (e) => { s.pt = e.target.value; markDirty(); } })),
          h('td', {}, h('input', { type: 'number', step: '0.01', value: s.start, 'aria-label': `Início ${i + 1}`, style: { width: '90px' }, onInput: (e) => { s.start = Number(e.target.value); markDirty(); } })),
          h('td', {}, h('input', { type: 'number', step: '0.01', value: s.end, 'aria-label': `Fim ${i + 1}`, style: { width: '90px' }, onInput: (e) => { s.end = Number(e.target.value); markDirty(); } })))));
        const p = validateTimings(track.segments);
        clear(problems).append(p.length ? h('div', { class: 'notice warn' }, p.join(' ')) : h('p', { class: 'small muted' }, '✓ Trilha de tempo válida.'));
      };
      drawRows();

      const audioFile = h('input', { type: 'file', accept: 'audio/*', onChange: async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await putMedia(key, file);
        info.textContent = `Áudio importado em uso (${(file.size / 1024).toFixed(0)} KB). Ajuste os tempos com a ferramenta de marcação.`;
        ctx.disposePlayers();
        toast('Áudio importado.');
      } });
      const timingFile = h('input', { type: 'file', accept: '.vtt,.srt,.json,text/vtt', onChange: async (e) => {
        const text = await e.target.files[0].text();
        let cues;
        try { cues = e.target.files[0].name.endsWith('.json') ? JSON.parse(text) : parseVTT(text); } catch (err) { return toast(`Arquivo inválido: ${err.message}`); }
        if (cues.length !== track.segments.length && !confirm(`O arquivo tem ${cues.length} trechos e a faixa tem ${track.segments.length}. Substituir os segmentos pelos do arquivo?`)) {
          cues.slice(0, track.segments.length).forEach((c, i) => Object.assign(track.segments[i], { start: c.start, end: c.end }));
        } else if (cues.length !== track.segments.length) {
          track.segments = cues.map((c, i) => ({ id: `${track.id}s${i + 1}`, speaker: c.speaker || (c.text.match(/^<v ([^>]+)>/)?.[1]) || 'Narrator', text: (c.text || '').replace(/^<v [^>]+>/, ''), pt: c.pt || '', start: c.start, end: c.end }));
        } else cues.forEach((c, i) => Object.assign(track.segments[i], { start: c.start, end: c.end }, c.text ? { text: c.text.replace(/^<v [^>]+>/, '') } : {}));
        markDirty(); drawRows();
      } });

      // Ferramenta de marcação: toque/tecla no início e no fim de cada fala
      const tapOut = h('p', { class: 'small', 'aria-live': 'polite' });
      const tapAudio = h('audio', { controls: true, style: { width: '100%' } });
      let tapIdx = 0; let phase = 'start';
      const tapBtn = h('button', { class: 'btn accent', onClick: () => tap() }, '⏺ Marcar');
      const tap = () => {
        const s = track.segments[tapIdx];
        if (!s) return;
        const t = +tapAudio.currentTime.toFixed(2);
        if (phase === 'start') { s.start = t; phase = 'end'; tapOut.textContent = `Fala ${tapIdx + 1}: início ${t}s. Toque de novo no FIM de “${s.text}”.`; }
        else { s.end = t; phase = 'start'; tapIdx++; tapOut.textContent = track.segments[tapIdx] ? `Fim marcado. Próxima: toque no INÍCIO de “${track.segments[tapIdx].text}”.` : '✓ Todas as falas marcadas. Confira a tabela e salve.'; drawRows(); }
        markDirty();
      };
      const startTap = async () => {
        const blob = await getMedia(key);
        tapAudio.src = blob ? URL.createObjectURL(blob) : assetUrl(draft._baseFrom ? `units/${draft._baseFrom}/${track.audio}` : track.audio);
        tapIdx = 0; phase = 'start';
        tapOut.textContent = `Dê play e toque em “Marcar” (ou tecla M) no INÍCIO de “${track.segments[0].text}”.`;
        tapAudio.focus();
      };
      const keyHandler = (e) => { if (e.key === 'm' || e.key === 'M') { e.preventDefault(); tap(); } };
      tapAudio.addEventListener('keydown', keyHandler);
      tapBtn.addEventListener('keydown', keyHandler);

      wrap.append(h('section', { class: 'card' },
        h('h3', {}, `Faixa ${ti + 1}: ${plain(track.title)}`), info,
        h('div', { class: 'grid two' },
          h('label', { class: 'field' }, 'Importar áudio (MP3, OGG, WAV, M4A)', audioFile),
          h('label', { class: 'field' }, 'Importar tempos/transcrição (WebVTT, SRT ou JSON)', timingFile)),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', onClick: () => download(`${track.id}.vtt`, toVTT(track.segments), 'text/vtt') }, '⬇ Exportar WebVTT'),
          h('button', { class: 'btn small ghost', onClick: async () => { await deleteMedia(key); ctx.disposePlayers(); info.textContent = `Usando o arquivo da unidade: ${track.audio}`; } }, 'Remover áudio importado')),
        h('details', {}, h('summary', {}, '⏱ Ferramenta de marcação de tempos'),
          h('p', { class: 'small' }, 'Para gravações humanas: toque o áudio e marque o início e o fim de cada fala. Os valores vão para a tabela.'),
          h('button', { class: 'btn small', onClick: startTap }, 'Começar marcação'), tapAudio, h('div', { class: 'row' }, tapBtn), tapOut),
        h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['#', 'Falante', 'Texto / tradução', 'Início (s)', 'Fim (s)'].map((x) => h('th', {}, x)))), tbody)),
        problems));
    });
    wrap.append(saveBar());
    return wrap;
  }

  /* ---------- Editores JSON (gramática, atividades) ---------- */
  function jsonEditor({ title, help, get, set, validate }) {
    const ta = h('textarea', { class: 'code', spellcheck: 'false', 'aria-label': title }, JSON.stringify(get(), null, 2));
    const out = h('div', { 'aria-live': 'polite' });
    const apply = () => {
      try {
        const val = JSON.parse(ta.value);
        const errs = validate?.(val) || [];
        if (errs.length) return clear(out).append(h('div', { class: 'notice warn' }, h('strong', {}, `${errs.length} problema(s): `), h('ul', {}, errs.slice(0, 20).map((e) => h('li', {}, e)))));
        set(val); markDirty();
        clear(out).append(h('p', { class: 'feedback' }, '✓ Válido e aplicado ao rascunho. Clique em Salvar.'));
      } catch (e) { clear(out).append(h('div', { class: 'notice warn' }, `JSON inválido: ${e.message}`)); }
    };
    return h('section', { class: 'card' }, h('h3', {}, title), h('p', { class: 'small muted' }, help), ta,
      h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn', onClick: apply }, 'Validar e aplicar')), out);
  }

  function grammarTab() {
    return h('div', {},
      jsonEditor({ title: 'Padrões do Discover', help: 'sentences[].chunks = [texto, papel]; papéis: subject, verb, article, object, polite, extra. pattern = fórmula exibida. ruleSteps = revelação gradual.',
        get: () => draft.discover, set: (v) => (draft.discover = v),
        validate: (v) => [!Array.isArray(v.sentences) && 'faltando sentences', !Array.isArray(v.ruleSteps) && 'faltando ruleSteps', !Array.isArray(v.questions) && 'faltando questions'].filter(Boolean) }),
      jsonEditor({ title: 'Estruturas do Grammar Lab', help: 'Cada item: id, name, function, form, explanation, table, examples, comparison, commonErrors, usage, pronunciation, check. Para japonês/mandarim, veja os campos opcionais em docs/ADICIONAR-UNIDADES.md.',
        get: () => draft.grammar, set: (v) => (draft.grammar = v),
        validate: (v) => (Array.isArray(v) ? v.flatMap((g) => ['id', 'name', 'form', 'explanation', 'examples', 'check'].filter((k) => !g[k]).map((k) => `${g.id || '?'}: faltando ${k}`)) : ['Deve ser uma lista']) }),
      saveBar());
  }

  function activitiesTab() {
    const preview = h('div', {});
    const sel = h('select', { 'aria-label': 'Pré-visualizar questão', onChange: (e) => {
      const q = [...draft.questions, ...(draft.reviewItems || [])].find((x) => x.id === e.target.value);
      clear(preview).append(q ? renderQuestion(q, { ...ctx, unit: draft, record: () => {} }, { module: 'preview' }) : '');
    } }, h('option', { value: '' }, 'Pré-visualizar uma questão…'), [...draft.questions, ...(draft.reviewItems || [])].map((q) => h('option', { value: q.id }, `${q.id} (${q.type}, ${q.stage || 'revisão'})`)));
    return h('div', {},
      jsonEditor({ title: 'Banco de questões', help: 'Tipos: mcq, tf, gap, order, transform, match, produce. stage: listening | A | B | C | D | exam. skills liga a questão à revisão espaçada. distractors justifica alternativas erradas.',
        get: () => draft.questions, set: (v) => (draft.questions = v), validate: (v) => (Array.isArray(v) ? [...v.flatMap(validateQuestion), ...dupes(v)] : ['Deve ser uma lista']) }),
      jsonEditor({ title: 'Itens de revisão (novos contextos)', help: 'Mesmo formato das questões + "context". Usados pelo desafio de revisão espaçada.',
        get: () => draft.reviewItems || [], set: (v) => (draft.reviewItems = v), validate: (v) => (Array.isArray(v) ? v.flatMap(validateQuestion) : ['Deve ser uma lista']) }),
      h('section', { class: 'card' }, h('h3', {}, 'Pré-visualização'), sel, preview),
      saveBar());
  }
  const dupes = (list) => { const seen = new Set(); return list.filter((q) => (seen.has(q.id) ? true : (seen.add(q.id), false))).map((q) => `id duplicado: ${q.id}`); };

  /* ---------- Critérios ---------- */
  function criteriaTab() {
    const c = (draft.config ||= {});
    const num = (label, key, help, step = 1) => h('label', { class: 'field' }, label,
      h('input', { type: 'number', step, value: c[key], onInput: (e) => { c[key] = Number(e.target.value); markDirty(); } }), h('span', { class: 'small muted' }, help));
    return h('section', { class: 'card' }, h('h3', {}, 'Critérios de avaliação e revisão'),
      h('div', { class: 'grid two' },
        num('Meta de acertos (0–1)', 'passThreshold', 'Ex.: 0.7 = 70% de acertos na 1ª tentativa para “meta atingida”.', 0.05),
        num('Caixa mínima para “Consolidado”', 'consolidateAfter', 'Quantos acertos seguidos (com intervalos) para consolidar uma competência.'),
        num('Tempo de resposta padrão (s)', 'responseTimeSeconds', 'Usado no Speaking Studio. 0 = sem limite.'),
        h('label', { class: 'field' }, 'Intervalos de revisão (dias, separados por vírgula)',
          h('input', { type: 'text', value: (c.srsIntervalsDays || []).join(', '), onInput: (e) => { c.srsIntervalsDays = e.target.value.split(',').map(Number).filter((n) => n > 0); markDirty(); } }))),
      saveBar());
  }

  /* ---------- Resultados ---------- */
  function resultsTab() {
    const wrap = h('div', {});
    const draw = () => {
      const imported = store.getImportedResults().filter((r) => r.unitId === ctx.unit.id);
      const local = { student: 'Este dispositivo', ...ctx.progress, exportedAt: new Date().toISOString() };
      const rows = [local, ...imported];
      const skills = allSkills(ctx.unit);
      const cfg = { consolidateAfter: ctx.unit.config?.consolidateAfter ?? 3 };
      const acc = (r) => { const f = (r.attempts || []).filter((a) => a.firstTry); return f.length ? `${Math.round((f.filter((a) => a.correct).length / f.length) * 100)}%` : '—'; };
      clear(wrap).append(
        h('section', { class: 'card' }, h('h3', {}, 'Importar progresso dos alunos'),
          h('p', { class: 'small' }, 'Os alunos exportam o arquivo em “Progresso e medalhas”. Importe vários de uma vez.'),
          h('input', { type: 'file', multiple: true, accept: '.json,application/json', onChange: async (e) => {
            const list = store.getImportedResults();
            let n = 0;
            for (const f of e.target.files) {
              try { const d = JSON.parse(await f.text()); if (d.format !== 'odu-progress') throw new Error('formato'); list.push(d); n++; } catch { toast(`Ignorado: ${f.name}`); }
            }
            store.saveImportedResults(list); toast(`${n} arquivo(s) importado(s).`); draw();
          } }),
          h('p', { class: 'small muted' }, 'LGPD: os dados ficam somente neste navegador. Peça aos alunos que usem apelido ou número da chamada. Apague os dados quando não forem mais necessários.'),
          h('button', { class: 'btn small ghost', onClick: () => { if (confirm('Apagar todos os resultados importados?')) { store.saveImportedResults([]); draw(); } } }, 'Apagar resultados importados')),
        h('section', { class: 'card' }, h('h3', {}, `Resultados — ${ctx.unit.title}`),
          h('div', { class: 'table-wrap' }, h('table', {},
            h('thead', {}, h('tr', {}, ['Aluno', 'XP', 'Acertos 1ª tent.', 'Tentativas', ...skills.map((s) => skillName(ctx.unit, s))].map((x) => h('th', {}, x)))),
            h('tbody', {}, rows.map((r) => h('tr', {}, h('td', {}, r.student), h('td', {}, r.xp || 0), h('td', {}, acc(r)), h('td', {}, (r.attempts || []).length),
              skills.map((s) => { const st = classify(r.srs?.[s], cfg); return h('td', { class: `status-${st} small` }, r.srs?.[s] ? STATUS_LABELS[st] : '—'); })))))),
          h('div', { class: 'row', style: { marginTop: '10px' } },
            h('button', { class: 'btn', onClick: () => {
              const head = ['aluno', 'xp', 'acertos_primeira', 'tentativas', ...skills];
              const csv = [head, ...rows.map((r) => [r.student, r.xp || 0, acc(r), (r.attempts || []).length, ...skills.map((s) => (r.srs?.[s] ? STATUS_LABELS[classify(r.srs[s], cfg)] : ''))])]
                .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
              download(`relatorio-${ctx.unit.id}.csv`, '﻿' + csv, 'text/csv');
            } }, '⬇ Relatório (CSV)'),
            h('button', { class: 'btn', onClick: () => download(`atividades-${ctx.unit.id}.json`, JSON.stringify({ questions: ctx.unit.questions, reviewItems: ctx.unit.reviewItems }, null, 2), 'application/json') }, '⬇ Exportar atividades (JSON)'),
            h('a', { class: 'btn', href: '#/docs' }, '📄 Gerar apostilas'))));
    };
    draw();
    return wrap;
  }

  const t = tabs([
    { id: 't-unit', label: 'Unidade', render: unitTab },
    { id: 't-audio', label: 'Áudio e transcrição', render: audioTab },
    { id: 't-grammar', label: 'Gramática e padrões', render: grammarTab },
    { id: 't-acts', label: 'Atividades', render: activitiesTab },
    { id: 't-crit', label: 'Critérios', render: criteriaTab },
    { id: 't-res', label: 'Resultados', render: resultsTab },
  ], { label: 'Seções do painel' });

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 9'), h('h1', {}, 'Painel do professor'),
      h('div', { class: 'notice' }, 'Modo local: as edições ficam salvas neste navegador e podem ser exportadas em JSON. Este painel não tem login porque não guarda dados em servidor — para uso compartilhado com contas e permissões, implemente o backend descrito em docs/BACKEND.md.')),
    t.el);
}
