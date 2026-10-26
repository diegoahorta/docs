/* Diário de Classe — aplicativo offline.
 * Todos os dados ficam no aparelho (arquivo interno do app no Android, localStorage no navegador).
 */
'use strict';

/* =========================================================================
 * Utilidades
 * ========================================================================= */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const h = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const byName = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function weekday(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}
/** Converte valores vindos de planilhas (Date, número serial do Excel, dd/mm/aaaa, aaaa-mm-dd) em aaaa-mm-dd. */
function toISODate(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v)) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) {
    let y = m[3];
    if (y.length === 2) y = (Number(y) > 50 ? '19' : '20') + y;
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return '';
}
function parseNum(v) {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
}
function fmtNum(n, dec = 1) {
  if (n == null || !isFinite(n)) return '—';
  return n.toFixed(dec).replace('.', ',');
}
const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

/* =========================================================================
 * Persistência (offline)
 * ========================================================================= */
const NATIVE = typeof window.Android !== 'undefined';
const STORAGE_KEY = 'diario-de-classe';
let db;

function defaultDb() {
  const ano = String(new Date().getFullYear());
  return {
    versao: 1,
    config: {
      escola: '',
      professor: '',
      anoAtual: ano,
      nomePeriodo: 'Bimestre',
      numPeriodos: 4,
      mediaMinima: 6,
      freqMinima: 75,
      notaMaxima: 10,
      calculoMedia: 'ponderada', // 'ponderada' | 'soma' | 'aritmetica'
      regraRecuperacao: 'maior', // 'maior' | 'media'
      justificadaContaPresenca: true,
    },
    anos: [novoAnoLetivo(ano, 4)],
    turmas: [],
    alunos: [],
    aulas: [],
    avaliacoes: [],
    notas: {},
  };
}

function novoAnoLetivo(ano, n) {
  // Divide o período de fevereiro a meados de dezembro igualmente entre os bimestres/trimestres.
  const ini = new Date(Number(ano), 1, 2).getTime();
  const fim = new Date(Number(ano), 11, 18).getTime();
  const step = (fim - ini) / n;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const periodos = [];
  for (let i = 0; i < n; i++) {
    periodos.push({ n: i + 1, inicio: iso(ini + step * i + (i ? 86400000 : 0)), fim: iso(ini + step * (i + 1)) });
  }
  return { ano: String(ano), periodos, diasLetivos: 200 };
}

function migrate(d) {
  const base = defaultDb();
  d.config = Object.assign({}, base.config, d.config || {});
  for (const k of ['anos', 'turmas', 'alunos', 'aulas', 'avaliacoes']) if (!Array.isArray(d[k])) d[k] = [];
  if (!d.notas || typeof d.notas !== 'object') d.notas = {};
  if (!d.anos.length) d.anos.push(novoAnoLetivo(d.config.anoAtual, d.config.numPeriodos));
  for (const t of d.turmas) if (!Array.isArray(t.disciplinas)) t.disciplinas = [];
  for (const a of d.alunos) if (!Array.isArray(a.ocorrencias)) a.ocorrencias = [];
  d.versao = 1;
  return d;
}

function loadDb() {
  let raw = '';
  try { raw = NATIVE ? window.Android.loadData() : localStorage.getItem(STORAGE_KEY); } catch (e) { raw = ''; }
  if (raw) {
    try { return migrate(JSON.parse(raw)); } catch (e) { console.error(e); }
  }
  return defaultDb();
}

let saveTimer = null;
function saveDb(immediate) {
  clearTimeout(saveTimer);
  const doSave = () => {
    const s = JSON.stringify(db);
    try {
      if (NATIVE) {
        if (!window.Android.saveData(s)) toast('Erro ao salvar os dados!');
      } else {
        localStorage.setItem(STORAGE_KEY, s);
      }
    } catch (e) { toast('Erro ao salvar: ' + e.message); }
  };
  if (immediate) doSave(); else saveTimer = setTimeout(doSave, 250);
}
window.addEventListener('pagehide', () => saveDb(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveDb(true); });

/* =========================================================================
 * Acesso aos dados
 * ========================================================================= */
const cfg = () => db.config;
const getTurma = (id) => db.turmas.find((t) => t.id === id);
const getAluno = (id) => db.alunos.find((a) => a.id === id);
const getAula = (id) => db.aulas.find((a) => a.id === id);
const getAval = (id) => db.avaliacoes.find((a) => a.id === id);
const getDisc = (turma, id) => turma && turma.disciplinas.find((d) => d.id === id);
const alunosDaTurma = (turmaId, todos) => db.alunos
  .filter((a) => a.turmaId === turmaId && (todos || a.situacao === 'Ativo' || !a.situacao))
  .sort((a, b) => (Number(a.numero) || 9999) - (Number(b.numero) || 9999) || byName(a, b));
const todosAlunosDaTurma = (turmaId) => alunosDaTurma(turmaId, true);
const periodos = () => Array.from({ length: Number(cfg().numPeriodos) || 4 }, (_, i) => i + 1);
const nomePeriodo = (p, curto) => {
  if (p === 'F') return curto ? 'RF' : 'Recuperação final';
  return curto ? `${p}º ${cfg().nomePeriodo.charAt(0)}` : `${p}º ${cfg().nomePeriodo}`;
};
function anoLetivo(ano) {
  let a = db.anos.find((x) => x.ano === String(ano));
  if (!a) {
    a = novoAnoLetivo(ano, cfg().numPeriodos);
    db.anos.push(a);
    db.anos.sort((x, y) => x.ano.localeCompare(y.ano));
  }
  return a;
}
/** Descobre o bimestre de uma data a partir do calendário do ano letivo. */
function periodoDaData(iso, ano) {
  const al = db.anos.find((x) => x.ano === String(ano || iso.slice(0, 4)));
  if (al) {
    const p = al.periodos.find((p) => p.n <= periodos().length && iso >= p.inicio && iso <= p.fim);
    if (p) return p.n;
    const antes = al.periodos.filter((p) => p.n <= periodos().length && iso > p.fim);
    if (antes.length) return Math.min(antes[antes.length - 1].n + 1, periodos().length);
    return 1;
  }
  const mes = Number(iso.slice(5, 7));
  return Math.min(periodos().length, Math.max(1, Math.ceil((mes - 1) / (11 / periodos().length))));
}
function numeroSeguinte(turmaId) {
  return todosAlunosDaTurma(turmaId).reduce((m, a) => Math.max(m, Number(a.numero) || 0), 0) + 1;
}
function getNota(avId, alunoId) {
  const n = db.notas[avId];
  return n && n[alunoId] != null ? n[alunoId] : null;
}
function setNota(avId, alunoId, valor) {
  if (!db.notas[avId]) db.notas[avId] = {};
  if (valor == null) delete db.notas[avId][alunoId];
  else db.notas[avId][alunoId] = valor;
}

/* =========================================================================
 * Cálculos: frequência, médias e situação
 * ========================================================================= */
function frequencia(alunoId, turmaId, discId, periodo) {
  let aulas = 0, faltas = 0, justificadas = 0;
  for (const au of db.aulas) {
    if (au.turmaId !== turmaId) continue;
    if (discId && au.disciplinaId !== discId) continue;
    if (periodo && au.periodo !== periodo) continue;
    const st = au.presencas && au.presencas[alunoId];
    if (!st) continue; // aluno não estava matriculado nesta aula
    const q = Number(au.qtd) || 1;
    aulas += q;
    if (st === 'F') faltas += q;
    else if (st === 'J') { justificadas += q; if (!cfg().justificadaContaPresenca) faltas += q; }
  }
  return { aulas, faltas, justificadas, freq: aulas ? ((aulas - faltas) / aulas) * 100 : null };
}

const avaliacoesDe = (turmaId, discId, periodo) => db.avaliacoes
  .filter((a) => a.turmaId === turmaId && a.disciplinaId === discId && a.periodo === periodo)
  .sort((a, b) => (a.tipo === 'rec') - (b.tipo === 'rec') || (a.data || '').localeCompare(b.data || '') || (a.ordem || 0) - (b.ordem || 0));

function mediaPeriodo(alunoId, turmaId, discId, periodo) {
  const avs = avaliacoesDe(turmaId, discId, periodo);
  const regulares = avs.filter((a) => a.tipo !== 'rec');
  let soma = 0, pesos = 0, qtd = 0;
  for (const av of regulares) {
    const n = getNota(av.id, alunoId);
    if (n == null) continue;
    const p = Number(av.peso) || 1;
    qtd++;
    if (cfg().calculoMedia === 'ponderada') { soma += n * p; pesos += p; }
    else if (cfg().calculoMedia === 'soma') { soma += n; pesos = 1; }
    else { soma += n; pesos += 1; }
  }
  let media = qtd ? soma / pesos : null;
  if (media != null) media = Math.min(media, Number(cfg().notaMaxima) || 10);
  for (const rec of avs.filter((a) => a.tipo === 'rec')) {
    const r = getNota(rec.id, alunoId);
    if (r == null) continue;
    media = aplicaRecuperacao(media, r);
  }
  return round1(media);
}
function aplicaRecuperacao(media, rec) {
  if (media == null) return rec;
  return cfg().regraRecuperacao === 'media' ? Math.max(media, (media + rec) / 2) : Math.max(media, rec);
}

const SIT = {
  APROVADO: 'Aprovado', RECUPERACAO: 'Recuperação', REPROVADO: 'Reprovado',
  REP_FALTA: 'Reprovado por falta', CURSANDO: 'Cursando',
};
function resultadoDisciplina(aluno, turmaId, discId) {
  const medias = periodos().map((p) => mediaPeriodo(aluno.id, turmaId, discId, p));
  const lancadas = medias.filter((m) => m != null);
  const anual = lancadas.length ? round1(lancadas.reduce((s, m) => s + m, 0) / lancadas.length) : null;
  const recs = avaliacoesDe(turmaId, discId, 'F');
  let recFinal = null;
  for (const r of recs) { const n = getNota(r.id, aluno.id); if (n != null) recFinal = n; }
  const final = recFinal != null ? round1(aplicaRecuperacao(anual, recFinal)) : anual;
  const fr = frequencia(aluno.id, turmaId, discId);
  const completo = lancadas.length === medias.length;
  let situacao;
  if (aluno.situacao && aluno.situacao !== 'Ativo') situacao = aluno.situacao;
  else if (!completo) situacao = SIT.CURSANDO;
  else if (fr.freq != null && fr.freq < cfg().freqMinima) situacao = SIT.REP_FALTA;
  else if (final >= cfg().mediaMinima) situacao = SIT.APROVADO;
  else if (recFinal == null) situacao = SIT.RECUPERACAO;
  else situacao = SIT.REPROVADO;
  return { medias, anual, recFinal, final, ...fr, situacao };
}
function resultadoGeral(aluno, turma) {
  const porDisc = turma.disciplinas.map((d) => ({ disc: d, r: resultadoDisciplina(aluno, turma.id, d.id) }));
  const fr = frequencia(aluno.id, turma.id);
  const finais = porDisc.map((x) => x.r.final).filter((m) => m != null);
  const mediaGeral = finais.length ? round1(finais.reduce((s, m) => s + m, 0) / finais.length) : null;
  let situacao;
  const sits = porDisc.map((x) => x.r.situacao);
  if (aluno.situacao && aluno.situacao !== 'Ativo') situacao = aluno.situacao;
  else if (!porDisc.length || sits.includes(SIT.CURSANDO)) situacao = SIT.CURSANDO;
  else if (fr.freq != null && fr.freq < cfg().freqMinima) situacao = SIT.REP_FALTA;
  else if (sits.includes(SIT.REPROVADO) || sits.includes(SIT.REP_FALTA)) situacao = SIT.REPROVADO;
  else if (sits.includes(SIT.RECUPERACAO)) situacao = SIT.RECUPERACAO;
  else situacao = SIT.APROVADO;
  return { porDisc, mediaGeral, ...fr, situacao };
}
function sitBadge(s) {
  const cls = s === SIT.APROVADO ? 'ok' : s === SIT.RECUPERACAO ? 'warn'
    : (s === SIT.REPROVADO || s === SIT.REP_FALTA) ? 'bad' : 'neutral';
  return `<span class="badge ${cls}">${h(s)}</span>`;
}
const notaCls = (n) => (n == null ? '' : n >= cfg().mediaMinima ? 'v-ok' : 'v-bad');
const freqCls = (f) => (f == null ? '' : f >= cfg().freqMinima ? 'v-ok' : 'v-bad');
const fmtFreq = (f) => (f == null ? '—' : fmtNum(f, 1) + '%');

/* =========================================================================
 * Interface: navegação, toast, modais
 * ========================================================================= */
const state = { stack: [], view: null };
function nav(view, params = {}, replace) {
  if (state.view && !replace) state.stack.push(state.view);
  state.view = { view, ...params };
  render();
  window.scrollTo(0, 0);
}
function back() {
  if (closeModal()) return true;
  if (state.stack.length) { state.view = state.stack.pop(); render(); return true; }
  return false;
}
window.handleBack = back;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

let modalStack = [];
function openModal(html, onMount) {
  const root = $('#modal-root');
  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.innerHTML = `<div class="modal" role="dialog">${html}</div>`;
  el.addEventListener('click', (e) => { if (e.target === el) closeModal(); });
  root.appendChild(el);
  modalStack.push(el);
  if (onMount) onMount(el.firstElementChild);
  return el.firstElementChild;
}
function closeModal() {
  const el = modalStack.pop();
  if (!el) return false;
  el.remove();
  return true;
}
function confirmDlg(msg, okLabel = 'Confirmar', danger = true) {
  return new Promise((resolve) => {
    const m = openModal(`<h2>Confirmação</h2><p>${h(msg)}</p>
      <div class="actions"><button class="btn" data-r="0">Cancelar</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${h(okLabel)}</button></div>`);
    $$('button[data-r]', m).forEach((b) => b.addEventListener('click', () => { closeModal(); resolve(b.dataset.r === '1'); }));
  });
}
function menu(title, items) {
  const m = openModal(`<h2>${h(title)}</h2>` + items.map((it, i) =>
    `<button class="menu-item" data-i="${i}"><span class="ic">${it.icon || ''}</span><span>${h(it.label)}</span></button>`).join(''));
  $$('.menu-item', m).forEach((b) => b.addEventListener('click', () => { closeModal(); items[Number(b.dataset.i)].action(); }));
}

/** Formulário genérico em modal. fields: [{name,label,type,options,value,required,hint,half}] */
function formDlg({ title, fields, saveLabel = 'Salvar', onSave, onDelete }) {
  const fieldHtml = (f) => {
    const id = 'f_' + f.name;
    const v = f.value == null ? '' : f.value;
    let input;
    if (f.type === 'select') {
      input = `<select id="${id}" name="${f.name}">${f.options.map((o) => {
        const [val, lab] = Array.isArray(o) ? o : [o, o];
        return `<option value="${h(val)}" ${String(val) === String(v) ? 'selected' : ''}>${h(lab)}</option>`;
      }).join('')}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea id="${id}" name="${f.name}">${h(v)}</textarea>`;
    } else if (f.type === 'checkbox') {
      return `<div class="field check"><label><input type="checkbox" id="${id}" name="${f.name}" ${v ? 'checked' : ''}> ${h(f.label)}</label>${f.hint ? `<div class="hint">${h(f.hint)}</div>` : ''}</div>`;
    } else {
      const type = f.type === 'number' ? 'text' : (f.type || 'text');
      const extra = f.type === 'number' ? 'inputmode="decimal"' : '';
      input = `<input id="${id}" name="${f.name}" type="${type}" ${extra} value="${h(v)}" ${f.placeholder ? `placeholder="${h(f.placeholder)}"` : ''} autocomplete="off">`;
    }
    return `<div class="field"><label for="${id}">${h(f.label)}${f.required ? ' *' : ''}</label>${input}${f.hint ? `<div class="hint">${h(f.hint)}</div>` : ''}</div>`;
  };
  let body = '', buf = [];
  const flush = () => { if (buf.length) { body += `<div class="grid2">${buf.join('')}</div>`; buf = []; } };
  for (const f of fields) { if (f.half) { buf.push(fieldHtml(f)); if (buf.length === 2) flush(); } else { flush(); body += fieldHtml(f); } }
  flush();
  const m = openModal(`<h2>${h(title)}</h2><form novalidate>${body}
    <div class="actions">${onDelete ? '<button type="button" class="btn danger" data-del>Excluir</button>' : ''}
    <button type="button" class="btn" data-cancel>Cancelar</button>
    <button type="submit" class="btn primary">${h(saveLabel)}</button></div></form>`);
  const form = $('form', m);
  $('[data-cancel]', m).addEventListener('click', closeModal);
  if (onDelete) $('[data-del]', m).addEventListener('click', async () => { if (await onDelete()) closeModal(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const vals = {};
    for (const f of fields) {
      const el = form.elements[f.name];
      let v = f.type === 'checkbox' ? el.checked : el.value.trim();
      if (f.type === 'number') v = parseNum(v);
      if (f.required && (v === '' || v == null)) { el.focus(); toast(`Preencha: ${f.label}`); return; }
      vals[f.name] = v;
    }
    if (onSave(vals) !== false) closeModal();
  });
  const first = $('input:not([type=checkbox]),textarea', m);
  if (first && !first.value) setTimeout(() => { if (!m.contains(document.activeElement)) first.focus(); }, 50);
  return m;
}

/* =========================================================================
 * Renderização
 * ========================================================================= */
function topbar(title, sub, { backBtn = true, actions = '' } = {}) {
  return `<header class="topbar">
    ${backBtn ? '<button class="icon-btn" data-act="back" aria-label="Voltar">←</button>' : ''}
    <h1><span>${h(title)}</span>${sub ? `<small>${h(sub)}</small>` : ''}</h1>${actions}</header>`;
}

function render() {
  const v = state.view;
  const app = $('#app');
  const views = { home: viewHome, turma: viewTurma, aula: viewAula, aluno: viewAluno, boletim: viewBoletim, config: viewConfig, planilha: viewPlanilha };
  app.innerHTML = (views[v.view] || viewHome)(v);
  const after = app._after; app._after = null;
  if (after) after();
}
const afterRender = (fn) => { $('#app')._after = fn; };

/* ---------- Tela inicial: turmas ---------- */
function viewHome() {
  const anos = Array.from(new Set([cfg().anoAtual, ...db.anos.map((a) => a.ano), ...db.turmas.map((t) => t.anoLetivo)])).filter(Boolean).sort();
  const ano = state.view.ano || cfg().anoAtual;
  const turmas = db.turmas.filter((t) => t.anoLetivo === ano).sort(byName);
  const sub = [cfg().professor, cfg().escola].filter(Boolean).join(' · ') || 'Toque em ⚙ para configurar';
  let html = topbar('Diário de Classe', sub, {
    backBtn: false,
    actions: `<button class="icon-btn" data-act="home-menu" aria-label="Menu">⋮</button>
              <button class="icon-btn" data-act="config" aria-label="Configurações">⚙</button>`,
  });
  html += '<main>';
  html += `<div class="chips">${anos.map((a) => `<button class="chip ${a === ano ? 'active' : ''}" data-act="ano" data-id="${h(a)}">Ano letivo ${h(a)}</button>`).join('')}
    <button class="chip" data-act="novo-ano">+ Ano</button></div>`;
  if (!turmas.length) {
    html += `<div class="empty"><div class="big">📚</div><p>Nenhuma turma em ${h(ano)}.</p>
      <p class="small">Crie uma turma ou importe uma planilha Excel (.xlsx / .xls) com seus alunos.</p>
      <div class="btn-row"><button class="btn primary" data-act="nova-turma">+ Criar turma</button>
      <button class="btn" data-act="importar">📥 Importar Excel</button></div></div>`;
  }
  for (const t of turmas) {
    const n = alunosDaTurma(t.id).length;
    const aulas = db.aulas.filter((a) => a.turmaId === t.id).length;
    const meta = [t.curso, t.serie, t.turno, t.idioma].filter(Boolean).join(' · ');
    html += `<button class="card turma-card" data-act="abrir-turma" data-id="${t.id}">
      <h3>${h(t.nome)}</h3><div class="meta">${h(meta || 'Toque para abrir')}</div>
      <div class="stats"><span class="stat"><b>${n}</b> alunos</span>
      <span class="stat"><b>${t.disciplinas.length}</b> disciplinas</span>
      <span class="stat"><b>${aulas}</b> aulas</span></div></button>`;
  }
  html += `</main><button class="fab" data-act="nova-turma"><span>+</span> Turma</button>`;
  return html;
}

/* ---------- Turma ---------- */
const TABS = [['alunos', 'Alunos'], ['chamada', 'Chamada'], ['notas', 'Notas'], ['resumo', 'Boletim'], ['info', 'Turma']];
function viewTurma(v) {
  const t = getTurma(v.id);
  if (!t) { state.view = { view: 'home' }; return viewHome(); }
  const tab = v.tab || 'alunos';
  const sub = [t.anoLetivo, t.curso, t.serie, t.turno].filter(Boolean).join(' · ');
  let html = topbar(t.nome, sub, { actions: '<button class="icon-btn" data-act="turma-menu" aria-label="Opções">⋮</button>' });
  html += `<nav class="tabs">${TABS.map(([k, l]) => `<button class="tab ${k === tab ? 'active' : ''}" data-act="tab" data-id="${k}">${l}</button>`).join('')}</nav><main>`;
  if (tab === 'alunos') html += tabAlunos(t, v);
  else if (tab === 'chamada') html += tabChamada(t, v);
  else if (tab === 'notas') html += tabNotas(t, v);
  else if (tab === 'resumo') html += tabResumo(t, v);
  else html += tabInfo(t);
  html += '</main>';
  return html;
}

function discSelector(t, v, allowAll) {
  if (!t.disciplinas.length) {
    return `<div class="card"><p>Esta turma ainda não tem disciplinas/matérias.</p>
      <button class="btn primary" data-act="nova-disc">+ Adicionar disciplina</button></div>`;
  }
  const cur = currentDisc(t, v, allowAll);
  return `<div class="chips">${allowAll ? `<button class="chip ${cur === '*' ? 'active' : ''}" data-act="disc" data-id="*">Geral</button>` : ''}
    ${t.disciplinas.map((d) => `<button class="chip ${d.id === cur ? 'active' : ''}" data-act="disc" data-id="${d.id}">${h(d.nome)}</button>`).join('')}</div>`;
}
function currentDisc(t, v, allowAll) {
  if (v.disc === '*' && allowAll) return '*';
  if (v.disc && getDisc(t, v.disc)) return v.disc;
  if (allowAll) return '*';
  return t.disciplinas[0] && t.disciplinas[0].id;
}

function tabAlunos(t, v) {
  const q = norm(v.q || '');
  const lista = todosAlunosDaTurma(t.id).filter((a) => !q || norm(a.nome).includes(q) || norm(a.matricula).includes(q));
  let html = `<div class="btn-row"><button class="btn primary" data-act="novo-aluno">+ Aluno</button>
    <button class="btn" data-act="importar">📥 Importar Excel</button></div>`;
  html += `<input class="input search" type="search" placeholder="Buscar aluno por nome ou matrícula" value="${h(v.q || '')}" data-input="busca">`;
  if (!lista.length) {
    return html + `<div class="empty"><div class="big">🧑‍🎓</div><p>${q ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}</p></div>`;
  }
  html += '<div class="list">';
  for (const a of lista) {
    const fr = frequencia(a.id, t.id);
    const r = t.disciplinas.length ? resultadoGeral(a, t) : null;
    const extra = [a.matricula && `Matr. ${a.matricula}`, `Freq. ${fmtFreq(fr.freq)}`, r && r.mediaGeral != null && `Média ${fmtNum(r.mediaGeral)}`].filter(Boolean).join(' · ');
    const inativo = a.situacao && a.situacao !== 'Ativo';
    html += `<button class="item" data-act="abrir-aluno" data-id="${a.id}">
      <div class="avatar">${h(a.numero || '?')}</div>
      <div class="grow"><div class="title">${h(a.nome)}</div><div class="sub">${h(extra)}</div></div>
      ${inativo ? `<span class="badge neutral">${h(a.situacao)}</span>` : (fr.freq != null && fr.freq < cfg().freqMinima ? '<span class="badge bad">Freq.</span>' : '')}
    </button>`;
  }
  html += '</div>';
  html += `<p class="muted small">${lista.length} aluno(s). Toque no aluno para ver o boletim e os dados.</p>`;
  return html;
}

function tabChamada(t, v) {
  let html = discSelector(t, v, false);
  if (!t.disciplinas.length) return html;
  const disc = currentDisc(t, v, false);
  const per = v.per || 0;
  html += `<div class="chips"><button class="chip ${!per ? 'active' : ''}" data-act="per" data-id="0">Todos</button>
    ${periodos().map((p) => `<button class="chip ${per === p ? 'active' : ''}" data-act="per" data-id="${p}">${nomePeriodo(p)}</button>`).join('')}</div>`;
  const aulas = db.aulas.filter((a) => a.turmaId === t.id && a.disciplinaId === disc && (!per || a.periodo === per))
    .sort((a, b) => b.data.localeCompare(a.data));
  html += `<div class="btn-row"><button class="btn primary" data-act="nova-aula">+ Nova aula / chamada</button></div>`;
  if (!aulas.length) return html + `<div class="empty"><div class="big">🗓️</div><p>Nenhuma aula registrada.</p></div>`;
  const totalQtd = aulas.reduce((s, a) => s + (Number(a.qtd) || 1), 0);
  html += `<p class="muted small">${aulas.length} registro(s) · ${totalQtd} aula(s) dada(s)</p><div class="list">`;
  for (const a of aulas) {
    const vals = Object.values(a.presencas || {});
    const f = vals.filter((x) => x === 'F').length;
    const j = vals.filter((x) => x === 'J').length;
    html += `<button class="item" data-act="abrir-aula" data-id="${a.id}">
      <div class="avatar">${h(a.data.slice(8, 10))}</div>
      <div class="grow"><div class="title">${fmtDate(a.data)} (${weekday(a.data)}) · ${nomePeriodo(a.periodo)}</div>
      <div class="sub">${h(a.conteudo || 'Sem conteúdo registrado')}</div></div>
      <div class="small" style="text-align:right">${a.qtd > 1 ? `${a.qtd} aulas<br>` : ''}<span class="${f ? 'v-bad' : 'v-ok'}">${f} falta(s)</span>${j ? `<br><span class="muted">${j} just.</span>` : ''}</div>
    </button>`;
  }
  return html + '</div>';
}

function tabNotas(t, v) {
  let html = discSelector(t, v, false);
  if (!t.disciplinas.length) return html;
  const disc = currentDisc(t, v, false);
  const per = v.nper || 1;
  html += `<div class="chips">${periodos().map((p) => `<button class="chip ${per === p ? 'active' : ''}" data-act="nper" data-id="${p}">${nomePeriodo(p)}</button>`).join('')}
    <button class="chip ${per === 'F' ? 'active' : ''}" data-act="nper" data-id="F">Rec. final</button></div>`;
  const avs = avaliacoesDe(t.id, disc, per);
  const alunos = alunosDaTurma(t.id);
  html += `<div class="btn-row"><button class="btn primary" data-act="nova-aval">+ ${per === 'F' ? 'Recuperação final' : 'Avaliação'}</button>
    ${per !== 'F' ? '<button class="btn" data-act="nova-rec">+ Recuperação</button>' : ''}</div>`;
  if (!alunos.length) return html + '<div class="empty"><p>Cadastre alunos para lançar notas.</p></div>';
  if (!avs.length) {
    return html + `<div class="empty"><div class="big">📝</div><p>Nenhuma avaliação neste período.</p>
      <p class="small">Crie avaliações (prova, trabalho, participação…) com peso. A média é calculada automaticamente
      (${cfg().calculoMedia === 'ponderada' ? 'média ponderada' : cfg().calculoMedia === 'soma' ? 'soma das notas' : 'média aritmética'}).</p></div>`;
  }
  html += `<div class="table-wrap"><table class="grid"><thead><tr><th class="name">Aluno</th>
    ${avs.map((a) => `<th class="clickable" data-act="editar-aval" data-id="${a.id}">${h(a.nome)}<br><span class="muted">${a.tipo === 'rec' ? 'rec.' : 'peso ' + fmtNum(Number(a.peso) || 1, 0)}${a.data ? ' · ' + fmtDate(a.data).slice(0, 5) : ''}</span></th>`).join('')}
    <th>${per === 'F' ? 'Média anual' : 'Média'}</th>${per === 'F' ? '<th>Final</th><th>Situação</th>' : ''}</tr></thead><tbody>`;
  for (const al of alunos) {
    let tail;
    if (per === 'F') {
      const r = resultadoDisciplina(al, t.id, disc);
      tail = `<td class="${notaCls(r.anual)}">${fmtNum(r.anual)}</td><td class="${notaCls(r.final)}" data-media="${al.id}">${fmtNum(r.final)}</td><td>${sitBadge(r.situacao)}</td>`;
    } else {
      const m = mediaPeriodo(al.id, t.id, disc, per);
      tail = `<td class="${notaCls(m)}" data-media="${al.id}">${fmtNum(m)}</td>`;
    }
    html += `<tr><td class="name">${h(al.numero ? al.numero + '. ' : '')}${h(al.nome)}</td>
      ${avs.map((a) => { const n = getNota(a.id, al.id); return `<td><input class="nota" inputmode="decimal" data-nota="${a.id}" data-aluno="${al.id}" value="${n == null ? '' : h(String(n).replace('.', ','))}"></td>`; }).join('')}
      ${tail}</tr>`;
  }
  html += '</tbody></table></div>';
  html += `<p class="muted small">Toque no nome da avaliação para editar ou excluir. Nota de 0 a ${fmtNum(Number(cfg().notaMaxima), 0)}. A recuperação ${cfg().regraRecuperacao === 'maior' ? 'substitui a média quando for maior' : 'faz média com a nota anterior quando melhora'}.</p>`;
  return html;
}

function tabResumo(t, v) {
  let html = discSelector(t, v, true);
  if (!t.disciplinas.length) return html;
  const disc = currentDisc(t, v, true);
  const alunos = todosAlunosDaTurma(t.id);
  html += `<div class="btn-row"><button class="btn primary" data-act="exportar-turma">📤 Exportar turma (Excel)</button></div>`;
  if (!alunos.length) return html + '<div class="empty"><p>Nenhum aluno.</p></div>';
  html += '<div class="table-wrap"><table class="grid"><thead><tr><th class="name">Aluno</th>';
  if (disc === '*') {
    html += `${t.disciplinas.map((d) => `<th>${h(d.nome)}</th>`).join('')}<th>Média geral</th><th>Faltas</th><th>Freq.</th><th>Situação</th></tr></thead><tbody>`;
    for (const al of alunos) {
      const r = resultadoGeral(al, t);
      html += `<tr class="clickable" data-act="abrir-aluno" data-id="${al.id}"><td class="name">${h(al.numero ? al.numero + '. ' : '')}${h(al.nome)}</td>
        ${r.porDisc.map((x) => `<td class="${notaCls(x.r.final)}">${fmtNum(x.r.final)}</td>`).join('')}
        <td class="${notaCls(r.mediaGeral)}">${fmtNum(r.mediaGeral)}</td><td>${r.faltas}</td>
        <td class="${freqCls(r.freq)}">${fmtFreq(r.freq)}</td><td>${sitBadge(r.situacao)}</td></tr>`;
    }
  } else {
    html += `${periodos().map((p) => `<th>${nomePeriodo(p, true)}</th>`).join('')}<th>Média anual</th><th>Rec. final</th><th>Média final</th><th>Faltas</th><th>Freq.</th><th>Situação</th></tr></thead><tbody>`;
    for (const al of alunos) {
      const r = resultadoDisciplina(al, t.id, disc);
      html += `<tr class="clickable" data-act="abrir-aluno" data-id="${al.id}"><td class="name">${h(al.numero ? al.numero + '. ' : '')}${h(al.nome)}</td>
        ${r.medias.map((m) => `<td class="${notaCls(m)}">${fmtNum(m)}</td>`).join('')}
        <td class="${notaCls(r.anual)}">${fmtNum(r.anual)}</td><td>${fmtNum(r.recFinal)}</td>
        <td class="${notaCls(r.final)}">${fmtNum(r.final)}</td><td>${r.faltas}</td>
        <td class="${freqCls(r.freq)}">${fmtFreq(r.freq)}</td><td>${sitBadge(r.situacao)}</td></tr>`;
    }
  }
  html += '</tbody></table></div>';
  html += `<p class="muted small">Média mínima ${fmtNum(Number(cfg().mediaMinima))} · Frequência mínima ${fmtNum(Number(cfg().freqMinima), 0)}%. Toque em um aluno para ver o boletim completo.</p>`;
  return html;
}

function tabInfo(t) {
  const alunos = todosAlunosDaTurma(t.id);
  const ativos = alunos.filter((a) => !a.situacao || a.situacao === 'Ativo').length;
  const rows = [['Ano letivo', t.anoLetivo], ['Curso', t.curso], ['Série / ano', t.serie], ['Turno', t.turno],
    ['Idioma', t.idioma], ['Escola', t.escola || cfg().escola], ['Professor(a)', t.professor || cfg().professor],
    ['Sala', t.sala], ['Horário', t.horario], ['Observações', t.obs]].filter((r) => r[1]);
  let html = `<div class="card"><div class="row-between"><b>Dados da turma</b><button class="btn small" data-act="editar-turma">Editar</button></div>
    <dl class="kv" style="margin-top:10px">${rows.map(([k, val]) => `<dt>${k}</dt><dd>${h(val)}</dd>`).join('')}
    <dt>Alunos</dt><dd>${ativos} ativo(s) de ${alunos.length}</dd></dl></div>`;
  html += `<div class="section-title">Disciplinas / matérias</div><div class="list">`;
  for (const d of t.disciplinas) {
    const aulas = db.aulas.filter((a) => a.turmaId === t.id && a.disciplinaId === d.id).reduce((s, a) => s + (Number(a.qtd) || 1), 0);
    html += `<button class="item" data-act="editar-disc" data-id="${d.id}"><div class="grow"><div class="title">${h(d.nome)}</div>
      <div class="sub">${[d.professor, d.cargaHoraria && `Carga horária: ${d.cargaHoraria} aulas`, `${aulas} aula(s) dada(s)`].filter(Boolean).map(h).join(' · ')}</div></div><span class="muted">✎</span></button>`;
  }
  if (!t.disciplinas.length) html += '<div class="item muted">Nenhuma disciplina cadastrada.</div>';
  html += `</div><button class="btn primary block" data-act="nova-disc">+ Adicionar disciplina</button>`;
  html += `<div class="section-title">Ações</div>
    <div class="btn-row"><button class="btn" data-act="exportar-turma">📤 Exportar turma (Excel)</button>
    <button class="btn" data-act="duplicar-turma">⧉ Copiar para novo ano</button>
    <button class="btn" data-act="renumerar">🔢 Renumerar alunos (A–Z)</button>
    <button class="btn danger" data-act="excluir-turma">🗑 Excluir turma</button></div>`;
  return html;
}

/* ---------- Chamada (registro de aula) ---------- */
function viewAula(v) {
  const t = getTurma(v.turmaId);
  const aula = v.draft;
  const disc = getDisc(t, aula.disciplinaId);
  const alunos = alunosDaTurma(t.id);
  // alunos inativos que já tinham registro nesta aula continuam visíveis
  for (const id of Object.keys(aula.presencas)) {
    if (!alunos.find((a) => a.id === id)) { const a = getAluno(id); if (a) alunos.push(a); }
  }
  const f = alunos.filter((a) => aula.presencas[a.id] === 'F').length;
  const j = alunos.filter((a) => aula.presencas[a.id] === 'J').length;
  let html = topbar(v.isNew ? 'Nova aula' : 'Editar aula', `${t.nome} · ${disc ? disc.nome : ''}`,
    { actions: '<button class="icon-btn" data-act="salvar-aula" aria-label="Salvar">✔</button>' });
  html += `<main><div class="card">
    <div class="grid2"><div class="field"><label>Data</label><input type="date" data-aula="data" value="${h(aula.data)}"></div>
    <div class="field"><label>${h(cfg().nomePeriodo)}</label><select data-aula="periodo">${periodos().map((p) => `<option value="${p}" ${aula.periodo === p ? 'selected' : ''}>${nomePeriodo(p)}</option>`).join('')}</select></div></div>
    <div class="grid2"><div class="field"><label>Disciplina</label><select data-aula="disciplinaId">${t.disciplinas.map((d) => `<option value="${d.id}" ${d.id === aula.disciplinaId ? 'selected' : ''}>${h(d.nome)}</option>`).join('')}</select></div>
    <div class="field"><label>Nº de aulas</label><input type="text" inputmode="numeric" data-aula="qtd" value="${h(aula.qtd)}"></div></div>
    <div class="field"><label>Conteúdo / atividades</label><textarea data-aula="conteudo" placeholder="Conteúdo trabalhado, tarefas, observações">${h(aula.conteudo || '')}</textarea></div>
  </div>`;
  html += `<div class="row-between"><div class="section-title">Chamada · <span id="resumo-chamada">${alunos.length - f - j} P · ${f} F · ${j} J</span></div>
    <button class="btn small" data-act="todos-presentes">Todos presentes</button></div>
    <div class="legend">Toque no botão para alternar: P = presente · F = falta · J = falta justificada</div><div class="list">`;
  for (const a of alunos) {
    const st = aula.presencas[a.id] || 'P';
    html += `<div class="item" data-act="toggle-pres" data-id="${a.id}"><div class="avatar">${h(a.numero || '?')}</div>
      <div class="grow"><div class="title">${h(a.nome)}</div></div>
      <button class="pres-btn pres-${st}" data-act="toggle-pres" data-id="${a.id}">${st}</button></div>`;
  }
  if (!alunos.length) html += '<div class="item muted">Nenhum aluno ativo na turma.</div>';
  html += `</div><div class="btn-row"><button class="btn primary" data-act="salvar-aula">Salvar chamada</button>
    ${v.isNew ? '' : '<button class="btn danger" data-act="excluir-aula">Excluir aula</button>'}</div></main>`;
  return html;
}

/* ---------- Aluno ---------- */
const ALUNO_FIELDS = [
  { name: 'nome', label: 'Nome completo', required: true },
  { name: 'numero', label: 'Nº na chamada', type: 'number', half: true },
  { name: 'matricula', label: 'Matrícula / RA', half: true },
  { name: 'nascimento', label: 'Data de nascimento', type: 'date', half: true },
  { name: 'sexo', label: 'Sexo', type: 'select', options: ['', 'Feminino', 'Masculino', 'Outro'], half: true },
  { name: 'cpf', label: 'CPF / documento', half: true },
  { name: 'situacao', label: 'Situação', type: 'select', options: ['Ativo', 'Transferido', 'Desistente', 'Remanejado', 'Concluído'], half: true },
  { name: 'responsavel', label: 'Responsável' },
  { name: 'telefone', label: 'Telefone', type: 'tel', half: true },
  { name: 'telefone2', label: 'Telefone 2', type: 'tel', half: true },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'endereco', label: 'Endereço' },
  { name: 'necessidades', label: 'Necessidades especiais / saúde / alergias', type: 'textarea' },
  { name: 'obs', label: 'Observações', type: 'textarea' },
];
function viewAluno(v) {
  const a = getAluno(v.id);
  if (!a) { back(); return ''; }
  const t = getTurma(a.turmaId);
  const sub = `${t ? t.nome : ''}${a.matricula ? ' · Matr. ' + a.matricula : ''}`;
  let html = topbar(a.nome, sub, { actions: '<button class="icon-btn" data-act="aluno-menu" aria-label="Opções">⋮</button>' });
  html += '<main>';
  html += boletimHtml(a, t);
  const info = ALUNO_FIELDS.filter((f) => f.name !== 'nome' && a[f.name]).map((f) => [f.label, f.type === 'date' ? fmtDate(a[f.name]) : a[f.name]]);
  html += `<div class="section-title">Dados do aluno</div><div class="card">
    <dl class="kv">${info.map(([k, val]) => `<dt>${h(k)}</dt><dd>${h(val)}</dd>`).join('') || '<dd class="muted">Sem dados adicionais.</dd>'}</dl>
    <div class="btn-row"><button class="btn" data-act="editar-aluno" data-id="${a.id}">✎ Editar dados</button></div></div>`;
  html += `<div class="section-title">Ocorrências e anotações</div><div class="list">`;
  const oc = (a.ocorrencias || []).slice().sort((x, y) => y.data.localeCompare(x.data));
  for (const o of oc) {
    html += `<button class="item" data-act="editar-ocorrencia" data-id="${o.id}"><div class="grow">
      <div class="title">${fmtDate(o.data)} · ${h(o.tipo)}</div><div class="sub">${h(o.descricao)}</div></div></button>`;
  }
  if (!oc.length) html += '<div class="item muted">Nenhuma anotação.</div>';
  html += `</div><button class="btn block" data-act="nova-ocorrencia">+ Nova ocorrência / anotação</button></main>`;
  return html;
}
function boletimHtml(a, t) {
  if (!t) return '';
  const r = resultadoGeral(a, t);
  let html = `<div class="card"><div class="row-between"><b>Boletim ${h(t.anoLetivo)}</b>${sitBadge(r.situacao)}</div>
    <div class="stats"><span class="stat">Média geral <b class="${notaCls(r.mediaGeral)}">${fmtNum(r.mediaGeral)}</b></span>
    <span class="stat">Frequência <b class="${freqCls(r.freq)}">${fmtFreq(r.freq)}</b></span>
    <span class="stat">Faltas <b>${r.faltas}</b>${r.justificadas ? ` (+${r.justificadas} just.)` : ''}</span>
    <span class="stat">Aulas <b>${r.aulas}</b></span></div></div>`;
  if (!t.disciplinas.length) return html;
  html += `<div class="table-wrap"><table class="grid"><thead><tr><th class="name">Disciplina</th>
    ${periodos().map((p) => `<th>${nomePeriodo(p, true)}</th>`).join('')}<th>MA</th><th>RF</th><th>MF</th><th>Faltas</th><th>Freq.</th><th>Situação</th></tr></thead><tbody>`;
  for (const { disc, r: x } of r.porDisc) {
    html += `<tr><td class="name">${h(disc.nome)}</td>${x.medias.map((m) => `<td class="${notaCls(m)}">${fmtNum(m)}</td>`).join('')}
      <td class="${notaCls(x.anual)}">${fmtNum(x.anual)}</td><td>${fmtNum(x.recFinal)}</td><td class="${notaCls(x.final)}">${fmtNum(x.final)}</td>
      <td>${x.faltas}</td><td class="${freqCls(x.freq)}">${fmtFreq(x.freq)}</td><td>${sitBadge(x.situacao)}</td></tr>`;
  }
  html += '</tbody></table></div><p class="muted small">MA = média anual · RF = recuperação final · MF = média final</p>';
  return html;
}
function viewBoletim(v) { return viewAluno(v); }

/* ---------- Configurações ---------- */
function viewConfig() {
  const c = cfg();
  let html = topbar('Configurações', 'Escola, avaliação e ano letivo');
  html += `<main><div class="card">
    <div class="field"><label>Escola / instituição</label><input data-cfg="escola" value="${h(c.escola)}"></div>
    <div class="field"><label>Professor(a)</label><input data-cfg="professor" value="${h(c.professor)}"></div>
    <div class="grid2"><div class="field"><label>Ano letivo atual</label><input data-cfg="anoAtual" inputmode="numeric" value="${h(c.anoAtual)}"></div>
    <div class="field"><label>Divisão do ano</label><select data-cfg="periodoTipo">
      ${[['Bimestre', 4], ['Trimestre', 3], ['Semestre', 2]].map(([n, q]) => `<option value="${n}|${q}" ${c.nomePeriodo === n && Number(c.numPeriodos) === q ? 'selected' : ''}>${q} ${n.toLowerCase()}s</option>`).join('')}
    </select></div></div></div>
    <div class="section-title">Avaliação</div><div class="card">
    <div class="grid2"><div class="field"><label>Média mínima</label><input data-cfg="mediaMinima" inputmode="decimal" value="${h(fmtNum(Number(c.mediaMinima)))}"></div>
    <div class="field"><label>Nota máxima</label><input data-cfg="notaMaxima" inputmode="decimal" value="${h(fmtNum(Number(c.notaMaxima), 0))}"></div></div>
    <div class="grid2"><div class="field"><label>Frequência mínima (%)</label><input data-cfg="freqMinima" inputmode="decimal" value="${h(fmtNum(Number(c.freqMinima), 0))}"></div>
    <div class="field"><label>Cálculo da média</label><select data-cfg="calculoMedia">
      <option value="ponderada" ${c.calculoMedia === 'ponderada' ? 'selected' : ''}>Ponderada (pesos)</option>
      <option value="aritmetica" ${c.calculoMedia === 'aritmetica' ? 'selected' : ''}>Aritmética</option>
      <option value="soma" ${c.calculoMedia === 'soma' ? 'selected' : ''}>Soma das notas</option></select></div></div>
    <div class="field"><label>Recuperação</label><select data-cfg="regraRecuperacao">
      <option value="maior" ${c.regraRecuperacao === 'maior' ? 'selected' : ''}>Vale a maior nota (média ou recuperação)</option>
      <option value="media" ${c.regraRecuperacao === 'media' ? 'selected' : ''}>Média entre nota anterior e recuperação</option></select></div>
    <div class="field check"><label><input type="checkbox" data-cfg="justificadaContaPresenca" ${c.justificadaContaPresenca ? 'checked' : ''}> Falta justificada não reduz a frequência</label></div>
    </div>`;
  const al = anoLetivo(c.anoAtual);
  html += `<div class="section-title">Calendário do ano letivo ${h(al.ano)}</div><div class="card">
    <p class="small muted">As datas definem o ${h(c.nomePeriodo.toLowerCase())} sugerido automaticamente na chamada.</p>
    ${periodos().map((p) => {
      const per = al.periodos.find((x) => x.n === p) || {};
      return `<div class="grid2"><div class="field"><label>${nomePeriodo(p)} — início</label><input type="date" data-per="${p}" data-k="inicio" value="${h(per.inicio || '')}"></div>
      <div class="field"><label>fim</label><input type="date" data-per="${p}" data-k="fim" value="${h(per.fim || '')}"></div></div>`;
    }).join('')}
    <div class="field"><label>Dias letivos previstos</label><input data-ano="diasLetivos" inputmode="numeric" value="${h(al.diasLetivos || '')}"></div></div>`;
  html += `<div class="section-title">Dados e cópia de segurança</div>
    <div class="btn-row"><button class="btn" data-act="exportar-tudo">📤 Exportar tudo (Excel)</button>
    <button class="btn" data-act="importar">📥 Importar Excel</button></div>
    <div class="btn-row"><button class="btn" data-act="backup">💾 Salvar backup (.json)</button>
    <button class="btn" data-act="restaurar">♻ Restaurar backup</button></div>
    <div class="btn-row"><button class="btn small" data-act="modelo">📄 Baixar planilha-modelo</button>
    <button class="btn danger small" data-act="apagar-tudo">Apagar todos os dados</button></div>
    <p class="muted small">O app funciona sem internet: os dados ficam salvos somente neste aparelho. Faça backups periódicos.<br>
    ${db.turmas.length} turma(s) · ${db.alunos.length} aluno(s) · ${db.aulas.length} aula(s) · ${db.avaliacoes.length} avaliação(ões)</p></main>`;
  return html;
}

/* ---------- Visualização de planilha importada ---------- */
function viewPlanilha(v) {
  const wb = importState.wb;
  if (!wb) { back(); return ''; }
  const sheet = v.sheet || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '', raw: false, blankrows: false });
  const formato = detectarFormatoDiario(wb);
  let html = topbar(importState.name, `${wb.SheetNames.length} planilha(s)`);
  html += '<main>';
  if (formato) {
    html += `<div class="card"><b>Arquivo do Diário de Classe reconhecido</b>
      <p class="small muted">Contém: ${formato.join(', ')}. Os dados serão mesclados (turmas, alunos, aulas, chamadas e notas são combinados pelo nome/matrícula).</p>
      <button class="btn primary block" data-act="importar-diario">📥 Importar dados do diário</button></div>`;
  }
  html += `<div class="card"><b>Importar alunos desta planilha</b>
    <p class="small muted">Use uma planilha com uma linha de cabeçalho (ex.: Nome, Matrícula, Nascimento, Responsável, Telefone…).</p>
    <button class="btn ${formato ? '' : 'primary'} block" data-act="mapear-alunos">🧑‍🎓 Importar como lista de alunos</button></div>`;
  html += `<div class="chips">${wb.SheetNames.map((s) => `<button class="chip ${s === sheet ? 'active' : ''}" data-act="sheet" data-id="${h(s)}">${h(s)}</button>`).join('')}</div>`;
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (!rows.length) html += '<div class="empty">Planilha vazia.</div>';
  else {
    html += `<div class="table-wrap"><table class="grid"><thead><tr><th class="name">#</th>${Array.from({ length: maxCols }, (_, i) => `<th>${XLSX.utils.encode_col(i)}</th>`).join('')}</tr></thead><tbody>`;
    for (const [i, r] of rows.slice(0, 200).entries()) {
      html += `<tr><td class="name">${i + 1}</td>${Array.from({ length: maxCols }, (_, c) => `<td style="text-align:left">${h(r[c])}</td>`).join('')}</tr>`;
    }
    html += '</tbody></table></div>';
    html += `<p class="muted small">${rows.length} linha(s)${rows.length > 200 ? ' (mostrando as 200 primeiras)' : ''}.</p>`;
  }
  html += `<button class="btn block" data-act="salvar-planilha-xlsx">💾 Salvar cópia como .xlsx</button></main>`;
  return html;
}

/* =========================================================================
 * Ações
 * ========================================================================= */
function curTurma() { return getTurma(state.view.id || state.view.turmaId); }

function formTurma(t) {
  const isNew = !t;
  t = t || { anoLetivo: state.view.ano || cfg().anoAtual };
  formDlg({
    title: isNew ? 'Nova turma' : 'Editar turma',
    fields: [
      { name: 'nome', label: 'Nome da turma', required: true, value: t.nome, placeholder: 'Ex.: 7º ano A' },
      { name: 'anoLetivo', label: 'Ano letivo', required: true, value: t.anoLetivo, half: true },
      { name: 'turno', label: 'Turno', type: 'select', options: ['', 'Manhã', 'Tarde', 'Noite', 'Integral'], value: t.turno, half: true },
      { name: 'curso', label: 'Curso / nível de ensino', value: t.curso, placeholder: 'Ex.: Ensino Fundamental II, Inglês Básico' },
      { name: 'serie', label: 'Série / ano / módulo', value: t.serie, half: true },
      { name: 'idioma', label: 'Idioma', value: t.idioma, half: true, placeholder: 'Ex.: Português' },
      { name: 'sala', label: 'Sala', value: t.sala, half: true },
      { name: 'horario', label: 'Horário', value: t.horario, half: true, placeholder: 'Ex.: Seg/Qua 8h' },
      { name: 'escola', label: 'Escola (se diferente)', value: t.escola, placeholder: cfg().escola },
      { name: 'professor', label: 'Professor(a) (se diferente)', value: t.professor, placeholder: cfg().professor },
      ...(isNew ? [{ name: 'disciplinas', label: 'Disciplinas / matérias', placeholder: 'Ex.: Matemática; Português; Ciências', hint: 'Separe por ponto e vírgula. Você pode adicionar outras depois.' }] : []),
      { name: 'obs', label: 'Observações', type: 'textarea', value: t.obs },
    ],
    onSave(vals) {
      if (isNew) {
        const discs = (vals.disciplinas || '').split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
        delete vals.disciplinas;
        const nt = { id: uid(), ...vals, disciplinas: discs.map((n) => ({ id: uid(), nome: n })), criadoEm: todayISO() };
        db.turmas.push(nt);
        anoLetivo(nt.anoLetivo);
        saveDb();
        nav('turma', { id: nt.id, tab: nt.disciplinas.length ? 'alunos' : 'info' });
        toast('Turma criada');
      } else {
        Object.assign(t, vals);
        anoLetivo(t.anoLetivo);
        saveDb(); render(); toast('Turma atualizada');
      }
    },
  });
}

function formDisc(t, d) {
  const isNew = !d;
  d = d || {};
  formDlg({
    title: isNew ? 'Nova disciplina' : 'Editar disciplina',
    fields: [
      { name: 'nome', label: 'Disciplina / matéria', required: true, value: d.nome, placeholder: 'Ex.: Matemática' },
      { name: 'cargaHoraria', label: 'Carga horária (aulas no ano)', type: 'number', value: d.cargaHoraria, half: true },
      { name: 'professor', label: 'Professor(a)', value: d.professor, half: true },
    ],
    onSave(vals) {
      if (isNew) { const nd = { id: uid(), ...vals }; t.disciplinas.push(nd); state.view.disc = nd.id; }
      else Object.assign(d, vals);
      saveDb(); render();
    },
    onDelete: isNew ? null : async () => {
      const n = db.aulas.filter((a) => a.disciplinaId === d.id).length + db.avaliacoes.filter((a) => a.disciplinaId === d.id).length;
      if (!await confirmDlg(`Excluir a disciplina "${d.nome}"${n ? ` e seus ${n} registros de aulas/avaliações` : ''}?`, 'Excluir')) return false;
      t.disciplinas = t.disciplinas.filter((x) => x.id !== d.id);
      excluirAvaliacoes(db.avaliacoes.filter((a) => a.disciplinaId === d.id));
      db.aulas = db.aulas.filter((a) => a.disciplinaId !== d.id);
      saveDb(); render(); return true;
    },
  });
}

function formAluno(a, turmaId) {
  const isNew = !a;
  a = a || { turmaId, numero: numeroSeguinte(turmaId), situacao: 'Ativo' };
  const fields = ALUNO_FIELDS.map((f) => ({ ...f, value: a[f.name] }));
  if (!isNew) {
    fields.splice(1, 0, { name: 'turmaId', label: 'Turma', type: 'select', value: a.turmaId,
      options: db.turmas.slice().sort((x, y) => (y.anoLetivo || '').localeCompare(x.anoLetivo || '') || byName(x, y)).map((t) => [t.id, `${t.nome} (${t.anoLetivo})`]) });
  }
  formDlg({
    title: isNew ? 'Novo aluno' : 'Editar aluno',
    fields,
    saveLabel: isNew ? 'Adicionar' : 'Salvar',
    onSave(vals) {
      if (isNew) {
        db.alunos.push({ id: uid(), turmaId, ocorrencias: [], ...vals });
        saveDb(); render(); toast('Aluno adicionado');
        setTimeout(() => formAluno(null, turmaId), 150); // facilita cadastrar vários seguidos
      } else {
        Object.assign(a, vals);
        saveDb(); render(); toast('Dados salvos');
      }
    },
    onDelete: isNew ? null : async () => {
      if (!await confirmDlg(`Excluir ${a.nome} e todas as suas notas e faltas? Para manter o histórico, prefira mudar a situação para "Transferido".`, 'Excluir')) return false;
      excluirAluno(a.id);
      saveDb(); closeModal(); back(); return false;
    },
  });
}
function excluirAluno(id) {
  db.alunos = db.alunos.filter((x) => x.id !== id);
  for (const au of db.aulas) if (au.presencas) delete au.presencas[id];
  for (const k of Object.keys(db.notas)) delete db.notas[k][id];
}
function excluirAvaliacoes(lista) {
  const ids = new Set(lista.map((a) => a.id));
  db.avaliacoes = db.avaliacoes.filter((a) => !ids.has(a.id));
  for (const id of ids) delete db.notas[id];
}

function formAval(t, discId, periodo, av, tipo) {
  const isNew = !av;
  tipo = av ? av.tipo : (periodo === 'F' ? 'rec' : tipo || 'normal');
  av = av || { data: todayISO(), peso: 1, nome: tipo === 'rec' ? (periodo === 'F' ? 'Recuperação final' : 'Recuperação') : `Avaliação ${avaliacoesDe(t.id, discId, periodo).filter((a) => a.tipo !== 'rec').length + 1}` };
  const fields = [
    { name: 'nome', label: 'Nome', required: true, value: av.nome, placeholder: 'Ex.: Prova 1, Trabalho, Participação' },
    { name: 'data', label: 'Data', type: 'date', value: av.data, half: true },
  ];
  if (tipo !== 'rec') fields.push({ name: 'peso', label: 'Peso', type: 'number', value: av.peso, half: true });
  fields.push({ name: 'descricao', label: 'Descrição / conteúdo', type: 'textarea', value: av.descricao });
  formDlg({
    title: isNew ? (tipo === 'rec' ? 'Nova recuperação' : 'Nova avaliação') : 'Editar avaliação',
    fields,
    onSave(vals) {
      if (vals.peso != null && vals.peso <= 0) { toast('O peso deve ser maior que zero'); return false; }
      if (isNew) db.avaliacoes.push({ id: uid(), turmaId: t.id, disciplinaId: discId, periodo, tipo, ordem: Date.now(), ...vals });
      else Object.assign(av, vals);
      saveDb(); render();
    },
    onDelete: isNew ? null : async () => {
      if (!await confirmDlg(`Excluir "${av.nome}" e todas as notas lançadas nela?`, 'Excluir')) return false;
      excluirAvaliacoes([av]); saveDb(); render(); return true;
    },
  });
}

function formOcorrencia(a, o) {
  const isNew = !o;
  o = o || { data: todayISO(), tipo: 'Observação' };
  formDlg({
    title: isNew ? 'Nova anotação' : 'Editar anotação',
    fields: [
      { name: 'data', label: 'Data', type: 'date', value: o.data, half: true, required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', value: o.tipo, half: true,
        options: ['Observação', 'Elogio', 'Advertência', 'Ocorrência disciplinar', 'Atestado médico', 'Contato com responsável', 'Atendimento pedagógico', 'Tarefa não entregue', 'Outro'] },
      { name: 'descricao', label: 'Descrição', type: 'textarea', value: o.descricao, required: true },
    ],
    onSave(vals) {
      if (isNew) a.ocorrencias.push({ id: uid(), ...vals }); else Object.assign(o, vals);
      saveDb(); render();
    },
    onDelete: isNew ? null : async () => {
      a.ocorrencias = a.ocorrencias.filter((x) => x.id !== o.id); saveDb(); render(); return true;
    },
  });
}

function novaAula(t, discId) {
  const data = todayISO();
  const presencas = {};
  for (const a of alunosDaTurma(t.id)) presencas[a.id] = 'P';
  nav('aula', { turmaId: t.id, isNew: true, draft: { id: uid(), turmaId: t.id, disciplinaId: discId, data, periodo: periodoDaData(data, t.anoLetivo), qtd: 1, conteudo: '', presencas } });
}
function abrirAula(id) {
  const a = getAula(id);
  const draft = JSON.parse(JSON.stringify(a));
  if (!draft.presencas) draft.presencas = {};
  for (const al of alunosDaTurma(a.turmaId)) if (!draft.presencas[al.id]) draft.presencas[al.id] = 'P';
  nav('aula', { turmaId: a.turmaId, isNew: false, draft });
}
function salvarAula() {
  const v = state.view, d = v.draft;
  d.qtd = Math.max(1, Math.round(parseNum(d.qtd) || 1));
  if (!d.data) { toast('Informe a data'); return; }
  const dup = db.aulas.find((a) => a.id !== d.id && a.turmaId === d.turmaId && a.disciplinaId === d.disciplinaId && a.data === d.data);
  if (v.isNew) db.aulas.push(d);
  else Object.assign(getAula(d.id), d);
  saveDb();
  toast(dup ? 'Chamada salva (atenção: já existe outra aula nesta data)' : 'Chamada salva');
  back();
  state.view.disc = d.disciplinaId;
  render();
}

function duplicarTurma(t) {
  const proximo = String(Number(t.anoLetivo) + 1 || cfg().anoAtual);
  formDlg({
    title: 'Copiar turma para novo ano',
    fields: [
      { name: 'nome', label: 'Nome da nova turma', value: t.nome, required: true },
      { name: 'anoLetivo', label: 'Ano letivo', value: proximo, required: true },
      { name: 'alunos', label: 'Copiar alunos ativos', type: 'checkbox', value: true },
    ],
    saveLabel: 'Copiar',
    onSave(vals) {
      const nt = { ...JSON.parse(JSON.stringify(t)), id: uid(), nome: vals.nome, anoLetivo: vals.anoLetivo, criadoEm: todayISO() };
      nt.disciplinas = t.disciplinas.map((d) => ({ ...d, id: uid() }));
      db.turmas.push(nt);
      anoLetivo(nt.anoLetivo);
      if (vals.alunos) {
        for (const a of alunosDaTurma(t.id)) db.alunos.push({ ...JSON.parse(JSON.stringify(a)), id: uid(), turmaId: nt.id, ocorrencias: [] });
      }
      saveDb();
      nav('turma', { id: nt.id, tab: 'alunos' });
      toast('Turma copiada');
    },
  });
}

const ACTIONS = {
  back: () => back(),
  config: () => nav('config'),
  ano: (id) => { state.view.ano = id; render(); },
  'novo-ano': () => formDlg({
    title: 'Novo ano letivo', fields: [{ name: 'ano', label: 'Ano', required: true, value: String(Number(cfg().anoAtual) + 1) },
      { name: 'atual', label: 'Definir como ano atual', type: 'checkbox', value: true }],
    onSave(v) { anoLetivo(v.ano); if (v.atual) cfg().anoAtual = v.ano; state.view.ano = v.ano; saveDb(); render(); },
  }),
  'home-menu': () => menu('Menu', [
    { icon: '📥', label: 'Importar planilha Excel (.xlsx, .xls, .csv)', action: importar },
    { icon: '📤', label: 'Exportar tudo para Excel', action: () => exportarExcel(null) },
    { icon: '💾', label: 'Salvar backup (.json)', action: backup },
    { icon: '♻', label: 'Restaurar backup', action: importar },
    { icon: '📄', label: 'Baixar planilha-modelo de alunos', action: modelo },
    { icon: '⚙', label: 'Configurações', action: () => nav('config') },
    { icon: 'ℹ', label: 'Sobre', action: () => openModal(`<h2>Diário de Classe</h2><p>Versão 1.0 · funciona 100% offline.</p>
      <p class="small muted">Turmas, alunos, chamada, conteúdo das aulas, notas por ${h(cfg().nomePeriodo.toLowerCase())}, médias, recuperação, frequência e boletim. Importa e exporta planilhas Excel.</p>
      <div class="actions"><button class="btn primary" onclick="closeModal()">OK</button></div>`) },
  ]),
  'nova-turma': () => formTurma(null),
  'abrir-turma': (id) => nav('turma', { id, tab: 'alunos' }),
  tab: (id) => { state.view.tab = id; render(); window.scrollTo(0, 0); },
  disc: (id) => { state.view.disc = id; render(); },
  per: (id) => { state.view.per = Number(id); render(); },
  nper: (id) => { state.view.nper = id === 'F' ? 'F' : Number(id); render(); },
  'turma-menu': () => {
    const t = curTurma();
    menu(t.nome, [
      { icon: '✎', label: 'Editar dados da turma', action: () => formTurma(t) },
      { icon: '📚', label: 'Adicionar disciplina', action: () => formDisc(t) },
      { icon: '🧑‍🎓', label: 'Adicionar aluno', action: () => formAluno(null, t.id) },
      { icon: '📥', label: 'Importar alunos (Excel)', action: importar },
      { icon: '📤', label: 'Exportar turma (Excel)', action: () => exportarExcel([t.id]) },
      { icon: '⧉', label: 'Copiar turma para novo ano', action: () => duplicarTurma(t) },
    ]);
  },
  'editar-turma': () => formTurma(curTurma()),
  'nova-disc': () => formDisc(curTurma()),
  'editar-disc': (id) => { const t = curTurma(); formDisc(t, getDisc(t, id)); },
  'excluir-turma': async () => {
    const t = curTurma();
    if (!await confirmDlg(`Excluir a turma "${t.nome}" com todos os alunos, aulas e notas? Esta ação não pode ser desfeita.`, 'Excluir turma')) return;
    for (const a of todosAlunosDaTurma(t.id)) excluirAluno(a.id);
    excluirAvaliacoes(db.avaliacoes.filter((a) => a.turmaId === t.id));
    db.aulas = db.aulas.filter((a) => a.turmaId !== t.id);
    db.turmas = db.turmas.filter((x) => x.id !== t.id);
    saveDb(); back(); toast('Turma excluída');
  },
  'duplicar-turma': () => duplicarTurma(curTurma()),
  renumerar: async () => {
    const t = curTurma();
    if (!await confirmDlg('Renumerar os alunos ativos em ordem alfabética? (Inativos vão para o final.)', 'Renumerar', false)) return;
    const ativos = alunosDaTurma(t.id).sort(byName);
    const inativos = todosAlunosDaTurma(t.id).filter((a) => !ativos.includes(a)).sort(byName);
    [...ativos, ...inativos].forEach((a, i) => { a.numero = i + 1; });
    saveDb(); render(); toast('Alunos renumerados');
  },
  'exportar-turma': () => exportarExcel([curTurma().id]),
  'novo-aluno': () => formAluno(null, curTurma().id),
  'abrir-aluno': (id) => nav('aluno', { id }),
  'editar-aluno': (id) => formAluno(getAluno(id)),
  'aluno-menu': () => {
    const a = getAluno(state.view.id);
    menu(a.nome, [
      { icon: '✎', label: 'Editar dados', action: () => formAluno(a) },
      { icon: '📝', label: 'Nova ocorrência / anotação', action: () => formOcorrencia(a) },
      { icon: '📤', label: 'Exportar boletim (Excel)', action: () => exportarBoletimAluno(a) },
    ]);
  },
  'nova-ocorrencia': () => formOcorrencia(getAluno(state.view.id)),
  'editar-ocorrencia': (id) => { const a = getAluno(state.view.id); formOcorrencia(a, a.ocorrencias.find((o) => o.id === id)); },
  'nova-aula': () => { const t = curTurma(); novaAula(t, currentDisc(t, state.view)); },
  'abrir-aula': (id) => abrirAula(id),
  'toggle-pres': (id) => {
    const p = state.view.draft.presencas;
    p[id] = { P: 'F', F: 'J', J: 'P' }[p[id] || 'P'];
    const btn = $(`.pres-btn[data-id="${id}"]`);
    btn.className = `pres-btn pres-${p[id]}`; btn.textContent = p[id];
    atualizaResumoChamada();
  },
  'todos-presentes': () => {
    const p = state.view.draft.presencas;
    for (const k of Object.keys(p)) p[k] = 'P';
    render();
  },
  'salvar-aula': () => salvarAula(),
  'excluir-aula': async () => {
    if (!await confirmDlg('Excluir esta aula e a chamada registrada?', 'Excluir')) return;
    db.aulas = db.aulas.filter((a) => a.id !== state.view.draft.id);
    saveDb(); back(); toast('Aula excluída');
  },
  'nova-aval': () => { const t = curTurma(); formAval(t, currentDisc(t, state.view), state.view.nper || 1); },
  'nova-rec': () => { const t = curTurma(); formAval(t, currentDisc(t, state.view), state.view.nper || 1, null, 'rec'); },
  'editar-aval': (id) => { const av = getAval(id); formAval(curTurma(), av.disciplinaId, av.periodo, av); },
  importar: () => importar(),
  restaurar: () => importar(),
  backup: () => backup(),
  modelo: () => modelo(),
  'exportar-tudo': () => exportarExcel(null),
  'apagar-tudo': async () => {
    if (!await confirmDlg('Apagar TODOS os dados do aplicativo? Faça um backup antes. Esta ação não pode ser desfeita.', 'Apagar tudo')) return;
    if (!await confirmDlg('Tem certeza? Todas as turmas, alunos, notas e faltas serão apagados.', 'Sim, apagar')) return;
    db = defaultDb(); saveDb(true); state.stack = []; nav('home', {}, true); toast('Dados apagados');
  },
  sheet: (id) => { state.view.sheet = id; render(); },
  'importar-diario': () => importarDiario(importState.wb),
  'mapear-alunos': () => mapearAlunos(importState.wb, state.view.sheet || importState.wb.SheetNames[0]),
  'salvar-planilha-xlsx': () => salvarArquivo(importState.name.replace(/\.[^.]+$/, '') + '.xlsx', XLSX.write(importState.wb, { bookType: 'xlsx', type: 'base64' }), MIME_XLSX),
};

function atualizaResumoChamada() {
  const vals = Object.values(state.view.draft.presencas);
  const el = $('#resumo-chamada');
  if (el) el.textContent = `${vals.filter((x) => x === 'P').length} P · ${vals.filter((x) => x === 'F').length} F · ${vals.filter((x) => x === 'J').length} J`;
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.id); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.input === 'busca') {
    state.view.q = el.value;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      const pos = el.selectionStart;
      render();
      const s = $('[data-input="busca"]');
      if (s) { s.focus(); s.setSelectionRange(pos, pos); }
    }, 200);
  } else if (el.dataset.aula) {
    const d = state.view.draft;
    const k = el.dataset.aula;
    d[k] = k === 'periodo' ? Number(el.value) : el.value;
    if (k === 'data' && el.value) {
      d.periodo = periodoDaData(el.value, getTurma(d.turmaId).anoLetivo);
      const sel = $('[data-aula="periodo"]'); if (sel) sel.value = d.periodo;
    }
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.nota) {
    let v = parseNum(el.value);
    const max = Number(cfg().notaMaxima) || 10;
    if (el.value.trim() !== '' && v == null) { toast('Nota inválida'); el.value = ''; v = null; }
    if (v != null && (v < 0 || v > max)) { toast(`A nota deve estar entre 0 e ${max}`); el.value = ''; v = null; }
    setNota(el.dataset.nota, el.dataset.aluno, v);
    saveDb();
    // atualiza médias da linha sem redesenhar a tela (mantém o teclado aberto)
    const t = curTurma(), v2 = state.view, disc = currentDisc(t, v2), per = v2.nper || 1;
    const al = getAluno(el.dataset.aluno);
    const cell = $(`[data-media="${al.id}"]`);
    if (cell) {
      const m = per === 'F' ? resultadoDisciplina(al, t.id, disc).final : mediaPeriodo(al.id, t.id, disc, per);
      cell.textContent = fmtNum(m); cell.className = notaCls(m);
    }
  } else if (el.dataset.cfg) {
    const c = cfg(), k = el.dataset.cfg;
    if (k === 'periodoTipo') {
      const [n, q] = el.value.split('|');
      c.nomePeriodo = n; c.numPeriodos = Number(q);
      const al = anoLetivo(c.anoAtual);
      const novo = novoAnoLetivo(al.ano, c.numPeriodos);
      al.periodos = novo.periodos;
      for (const au of db.aulas) if (au.periodo > c.numPeriodos) au.periodo = c.numPeriodos;
      saveDb(); render(); return;
    }
    if (el.type === 'checkbox') c[k] = el.checked;
    else if (['mediaMinima', 'freqMinima', 'notaMaxima'].includes(k)) {
      const n = parseNum(el.value);
      if (n == null || n < 0) { toast('Valor inválido'); render(); return; }
      c[k] = n;
    } else c[k] = el.value.trim();
    if (k === 'anoAtual') { anoLetivo(c.anoAtual); saveDb(); render(); return; }
    saveDb();
  } else if (el.dataset.per) {
    const al = anoLetivo(cfg().anoAtual);
    let p = al.periodos.find((x) => x.n === Number(el.dataset.per));
    if (!p) { p = { n: Number(el.dataset.per) }; al.periodos.push(p); }
    p[el.dataset.k] = el.value;
    saveDb();
  } else if (el.dataset.ano) {
    anoLetivo(cfg().anoAtual)[el.dataset.ano] = parseNum(el.value);
    saveDb();
  }
});

/* =========================================================================
 * Arquivos: abrir e salvar (Android usa o seletor do sistema)
 * ========================================================================= */
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
let importState = { name: '', wb: null };

function salvarArquivo(nome, base64, mime) {
  if (NATIVE) { window.Android.saveFile(nome, mime, base64); return; }
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Arquivo salvo: ' + nome);
}
window.onNativeExport = (ok, nome) => toast(ok ? `Arquivo salvo: ${nome}` : 'Exportação cancelada');
window.onNativeError = (msg) => toast(msg);

function importar() {
  if (NATIVE) { window.Android.pickFile(); return; }
  const inp = $('#file-input');
  inp.value = '';
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => window.onNativeImport(f.name, String(r.result).split(',')[1] || '');
    r.readAsDataURL(f);
  };
  inp.click();
}
const b64ToText = (b64) => new TextDecoder('utf-8').decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

window.onNativeImport = async (nome, b64) => {
  if (!nome || b64 == null) return;
  try {
    if (/\.json$/i.test(nome)) {
      const data = JSON.parse(b64ToText(b64));
      if (!data || !Array.isArray(data.turmas)) throw new Error('Arquivo de backup inválido');
      if (!await confirmDlg(`Restaurar o backup "${nome}"? Os dados atuais serão SUBSTITUÍDOS (${data.turmas.length} turma(s), ${(data.alunos || []).length} aluno(s)).`, 'Restaurar')) return;
      db = migrate(data); saveDb(true); state.stack = []; nav('home', {}, true); toast('Backup restaurado');
      return;
    }
    let wb;
    if (/\.csv$|\.txt$/i.test(nome)) wb = XLSX.read(b64ToText(b64), { type: 'string', cellDates: true, raw: false });
    else wb = XLSX.read(b64, { type: 'base64', cellDates: true });
    importState = { name: nome, wb };
    nav('planilha', { sheet: wb.SheetNames[0] });
  } catch (e) {
    console.error(e);
    toast('Não foi possível ler o arquivo: ' + e.message);
  }
};

function backup() {
  const nome = `diario-backup-${todayISO()}.json`;
  const json = JSON.stringify(db, null, 1);
  salvarArquivo(nome, btoa(unescape(encodeURIComponent(json))), 'application/json');
}

/* =========================================================================
 * Exportação para Excel
 * ========================================================================= */
const HDR = {
  turmas: ['Turma', 'Ano Letivo', 'Curso', 'Série/Ano', 'Turno', 'Idioma', 'Sala', 'Horário', 'Escola', 'Professor', 'Disciplinas', 'Observações'],
  alunos: ['Turma', 'Ano Letivo', 'Nº', 'Nome', 'Matrícula', 'Data de Nascimento', 'Sexo', 'CPF/Documento', 'Situação', 'Responsável', 'Telefone', 'Telefone 2', 'E-mail', 'Endereço', 'Necessidades Especiais', 'Observações'],
  aulas: ['Turma', 'Ano Letivo', 'Disciplina', 'Data', 'Dia', 'Período', 'Qtd. Aulas', 'Presentes', 'Faltas', 'Justificadas', 'Conteúdo'],
  chamada: ['Turma', 'Ano Letivo', 'Disciplina', 'Data', 'Período', 'Qtd. Aulas', 'Nº', 'Aluno', 'Matrícula', 'Presença'],
  notas: ['Turma', 'Ano Letivo', 'Disciplina', 'Período', 'Avaliação', 'Tipo', 'Data', 'Peso', 'Nº', 'Aluno', 'Matrícula', 'Nota'],
  ocorrencias: ['Turma', 'Ano Letivo', 'Nº', 'Aluno', 'Matrícula', 'Data', 'Tipo', 'Descrição'],
};
const xDate = (iso) => (iso ? fmtDate(iso) : '');
const xNum = (n) => (n == null ? '' : n);
const perLabel = (p) => (p === 'F' ? 'Rec. Final' : `${p}º ${cfg().nomePeriodo}`);

function sheetFrom(rows, widths) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const cols = rows[0].map((_, c) => {
    const w = widths && widths[c] || Math.min(45, Math.max(6, ...rows.slice(0, 300).map((r) => String(r[c] == null ? '' : r[c]).length + 2)));
    return { wch: w };
  });
  ws['!cols'] = cols;
  if (rows.length > 1) ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: rows[0].length - 1 } }) };
  return ws;
}
function addSheet(wb, name, ws) {
  let base = name.replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31), n = base, i = 2;
  while (wb.SheetNames.includes(n)) n = base.slice(0, 28) + ' ' + i++;
  XLSX.utils.book_append_sheet(wb, ws, n);
}

function montarWorkbook(turmaIds) {
  const turmas = (turmaIds ? turmaIds.map(getTurma) : db.turmas.slice()).filter(Boolean)
    .sort((a, b) => (a.anoLetivo || '').localeCompare(b.anoLetivo || '') || byName(a, b));
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: 'Diário de Classe', Author: cfg().professor || 'Diário de Classe', CreatedDate: new Date() };
  const c = cfg();

  // Boletim (resumo) — primeira planilha, a mais consultada
  const bol = [['Turma', 'Ano Letivo', 'Nº', 'Aluno', 'Matrícula', 'Disciplina', ...periodos().map((p) => perLabel(p)), 'Média Anual', 'Rec. Final', 'Média Final', 'Aulas', 'Faltas', 'Faltas Justificadas', 'Frequência (%)', 'Situação']];
  for (const t of turmas) {
    for (const a of todosAlunosDaTurma(t.id)) {
      for (const d of t.disciplinas) {
        const r = resultadoDisciplina(a, t.id, d.id);
        bol.push([t.nome, t.anoLetivo, xNum(Number(a.numero) || null), a.nome, a.matricula || '', d.nome, ...r.medias.map(xNum),
          xNum(r.anual), xNum(r.recFinal), xNum(r.final), r.aulas, r.faltas, r.justificadas, r.freq == null ? '' : round1(r.freq), r.situacao]);
      }
    }
  }
  addSheet(wb, 'Boletim', sheetFrom(bol));

  // Planilhas de leitura (mapas) por disciplina quando exporta poucas turmas
  if (turmas.length <= 3) {
    for (const t of turmas) {
      const prefix = turmas.length > 1 ? t.nome + ' ' : '';
      for (const d of t.disciplinas) {
        addSheet(wb, `${prefix}Notas ${d.nome}`, mapaNotas(t, d));
        addSheet(wb, `${prefix}Freq ${d.nome}`, mapaFrequencia(t, d));
      }
    }
  }

  const tr = [HDR.turmas];
  for (const t of turmas) tr.push([t.nome, t.anoLetivo, t.curso || '', t.serie || '', t.turno || '', t.idioma || '', t.sala || '', t.horario || '', t.escola || c.escola || '', t.professor || c.professor || '', t.disciplinas.map((d) => d.nome).join('; '), t.obs || '']);
  addSheet(wb, 'Turmas', sheetFrom(tr));

  const al = [HDR.alunos];
  for (const t of turmas) for (const a of todosAlunosDaTurma(t.id)) {
    al.push([t.nome, t.anoLetivo, xNum(Number(a.numero) || null), a.nome, a.matricula || '', xDate(a.nascimento), a.sexo || '', a.cpf || '', a.situacao || 'Ativo',
      a.responsavel || '', a.telefone || '', a.telefone2 || '', a.email || '', a.endereco || '', a.necessidades || '', a.obs || '']);
  }
  addSheet(wb, 'Alunos', sheetFrom(al));

  const au = [HDR.aulas], ch = [HDR.chamada];
  for (const t of turmas) {
    const alunos = todosAlunosDaTurma(t.id);
    const aulas = db.aulas.filter((a) => a.turmaId === t.id).sort((a, b) => a.data.localeCompare(b.data));
    for (const a of aulas) {
      const d = getDisc(t, a.disciplinaId);
      if (!d) continue;
      const vals = Object.values(a.presencas || {});
      au.push([t.nome, t.anoLetivo, d.nome, xDate(a.data), weekday(a.data), perLabel(a.periodo), Number(a.qtd) || 1,
        vals.filter((x) => x === 'P').length, vals.filter((x) => x === 'F').length, vals.filter((x) => x === 'J').length, a.conteudo || '']);
      for (const s of alunos) {
        const st = a.presencas && a.presencas[s.id];
        if (st) ch.push([t.nome, t.anoLetivo, d.nome, xDate(a.data), perLabel(a.periodo), Number(a.qtd) || 1, xNum(Number(s.numero) || null), s.nome, s.matricula || '', st]);
      }
    }
  }
  addSheet(wb, 'Aulas', sheetFrom(au, [12, 10, 16, 12, 6, 14, 10, 10, 8, 12, 50]));
  addSheet(wb, 'Chamada', sheetFrom(ch));

  const nt = [HDR.notas];
  for (const t of turmas) {
    const alunos = todosAlunosDaTurma(t.id);
    for (const d of t.disciplinas) {
      for (const p of [...periodos(), 'F']) {
        for (const av of avaliacoesDe(t.id, d.id, p)) {
          for (const s of alunos) {
            const n = getNota(av.id, s.id);
            nt.push([t.nome, t.anoLetivo, d.nome, perLabel(p), av.nome, av.tipo === 'rec' ? 'Recuperação' : 'Avaliação', xDate(av.data), av.tipo === 'rec' ? '' : (Number(av.peso) || 1),
              xNum(Number(s.numero) || null), s.nome, s.matricula || '', xNum(n)]);
          }
        }
      }
    }
  }
  addSheet(wb, 'Notas', sheetFrom(nt));

  const oc = [HDR.ocorrencias];
  for (const t of turmas) for (const a of todosAlunosDaTurma(t.id)) for (const o of (a.ocorrencias || [])) {
    oc.push([t.nome, t.anoLetivo, xNum(Number(a.numero) || null), a.nome, a.matricula || '', xDate(o.data), o.tipo || '', o.descricao || '']);
  }
  addSheet(wb, 'Ocorrências', sheetFrom(oc, [12, 10, 5, 30, 12, 12, 20, 60]));

  const cf = [['Configuração', 'Valor'], ['Escola', c.escola], ['Professor(a)', c.professor], ['Divisão do ano', `${c.numPeriodos} ${c.nomePeriodo.toLowerCase()}s`],
    ['Média mínima', c.mediaMinima], ['Frequência mínima (%)', c.freqMinima], ['Nota máxima', c.notaMaxima],
    ['Cálculo da média', c.calculoMedia], ['Recuperação', c.regraRecuperacao === 'maior' ? 'Maior nota' : 'Média com a nota anterior'],
    ['Falta justificada conta presença', c.justificadaContaPresenca ? 'Sim' : 'Não'], ['Exportado em', new Date().toLocaleString('pt-BR')]];
  addSheet(wb, 'Configurações', sheetFrom(cf));
  return wb;
}

function mapaNotas(t, d) {
  const head = ['Nº', 'Aluno'];
  const cols = [];
  for (const p of [...periodos(), 'F']) {
    for (const av of avaliacoesDe(t.id, d.id, p)) { head.push(`${perLabel(p)} - ${av.nome}`); cols.push({ av }); }
    if (p !== 'F') { head.push(`Média ${perLabel(p)}`); cols.push({ media: p }); }
  }
  head.push('Média Anual', 'Média Final', 'Faltas', 'Frequência (%)', 'Situação');
  const rows = [head];
  for (const a of todosAlunosDaTurma(t.id)) {
    const r = resultadoDisciplina(a, t.id, d.id);
    rows.push([xNum(Number(a.numero) || null), a.nome, ...cols.map((c) => xNum(c.av ? getNota(c.av.id, a.id) : r.medias[c.media - 1])),
      xNum(r.anual), xNum(r.final), r.faltas, r.freq == null ? '' : round1(r.freq), r.situacao]);
  }
  return sheetFrom(rows, [5, 32]);
}
function mapaFrequencia(t, d) {
  const aulas = db.aulas.filter((a) => a.turmaId === t.id && a.disciplinaId === d.id).sort((a, b) => a.data.localeCompare(b.data));
  const rows = [['Nº', 'Aluno', ...aulas.map((a) => fmtDate(a.data).slice(0, 5) + (a.qtd > 1 ? ` (${a.qtd})` : '')), 'Aulas', 'Faltas', 'Justificadas', 'Frequência (%)']];
  for (const s of todosAlunosDaTurma(t.id)) {
    const fr = frequencia(s.id, t.id, d.id);
    rows.push([xNum(Number(s.numero) || null), s.nome, ...aulas.map((a) => (a.presencas && a.presencas[s.id]) || '-'), fr.aulas, fr.faltas, fr.justificadas, fr.freq == null ? '' : round1(fr.freq)]);
  }
  return sheetFrom(rows, [5, 32, ...aulas.map(() => 7)]);
}

function exportarExcel(turmaIds) {
  if (!db.turmas.length) { toast('Não há turmas para exportar'); return; }
  const wb = montarWorkbook(turmaIds);
  const t = turmaIds && turmaIds.length === 1 ? getTurma(turmaIds[0]) : null;
  const nome = (t ? `diario-${t.nome}-${t.anoLetivo}` : `diario-completo-${todayISO()}`).replace(/[^\w\-À-ú ]+/g, '').replace(/\s+/g, '_') + '.xlsx';
  salvarArquivo(nome, XLSX.write(wb, { bookType: 'xlsx', type: 'base64', compression: true }), MIME_XLSX);
}
function exportarBoletimAluno(a) {
  const t = getTurma(a.turmaId);
  const r = resultadoGeral(a, t);
  const rows = [['Boletim escolar'], ['Escola', t.escola || cfg().escola], ['Aluno', a.nome], ['Matrícula', a.matricula || ''], ['Turma', t.nome], ['Ano letivo', t.anoLetivo], [],
    ['Disciplina', ...periodos().map((p) => perLabel(p)), 'Média Anual', 'Rec. Final', 'Média Final', 'Faltas', 'Frequência (%)', 'Situação']];
  for (const { disc, r: x } of r.porDisc) rows.push([disc.nome, ...x.medias.map(xNum), xNum(x.anual), xNum(x.recFinal), xNum(x.final), x.faltas, x.freq == null ? '' : round1(x.freq), x.situacao]);
  rows.push([], ['Média geral', xNum(r.mediaGeral)], ['Frequência geral (%)', r.freq == null ? '' : round1(r.freq)], ['Situação', r.situacao]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, ...Array(12).fill({ wch: 12 })];
  const wb = XLSX.utils.book_new();
  addSheet(wb, 'Boletim', ws);
  salvarArquivo(`boletim-${a.nome}`.replace(/[^\w\-À-ú ]+/g, '').replace(/\s+/g, '_') + '.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }), MIME_XLSX);
}
function modelo() {
  const wb = XLSX.utils.book_new();
  addSheet(wb, 'Alunos', sheetFrom([
    ['Nº', 'Nome', 'Matrícula', 'Data de Nascimento', 'Sexo', 'Responsável', 'Telefone', 'E-mail', 'Endereço', 'Necessidades Especiais', 'Observações'],
    [1, 'Ana Souza', '2026001', '15/03/2013', 'Feminino', 'Maria Souza', '(11) 99999-0000', 'maria@email.com', 'Rua A, 10', '', ''],
    [2, 'Bruno Lima', '2026002', '02/07/2013', 'Masculino', 'João Lima', '(11) 98888-0000', '', 'Rua B, 20', '', ''],
  ]));
  salvarArquivo('modelo-alunos.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }), MIME_XLSX);
}

/* =========================================================================
 * Importação de planilhas
 * ========================================================================= */
const ALUNO_SINONIMOS = {
  numero: ['n', 'no', 'nº', 'num', 'numero', 'n chamada', 'numero chamada', 'nr'],
  nome: ['nome', 'aluno', 'nome do aluno', 'nome completo', 'estudante', 'aluno a', 'nome aluno', 'student', 'name'],
  matricula: ['matricula', 'ra', 'registro', 'codigo', 'cod', 'id', 'rm', 'n matricula'],
  nascimento: ['nascimento', 'data de nascimento', 'data nascimento', 'dt nascimento', 'nasc', 'data nasc', 'birth'],
  sexo: ['sexo', 'genero'],
  cpf: ['cpf', 'documento', 'rg', 'cpf documento'],
  situacao: ['situacao', 'status'],
  responsavel: ['responsavel', 'nome do responsavel', 'mae', 'pai', 'filiacao', 'responsavel legal'],
  telefone: ['telefone', 'tel', 'celular', 'fone', 'contato', 'whatsapp', 'telefone 1'],
  telefone2: ['telefone 2', 'tel 2', 'celular 2'],
  email: ['email', 'e mail', 'correio eletronico'],
  endereco: ['endereco', 'logradouro', 'rua'],
  necessidades: ['necessidades especiais', 'necessidades', 'deficiencia', 'saude', 'nee'],
  obs: ['observacoes', 'observacao', 'obs'],
};

function detectarFormatoDiario(wb) {
  const found = [];
  const temCols = (sheet, cols) => {
    const ws = wb.Sheets[sheet]; if (!ws) return false;
    const head = (XLSX.utils.sheet_to_json(ws, { header: 1, raw: false })[0] || []).map(norm);
    return cols.every((c) => head.includes(norm(c)));
  };
  if (temCols('Turmas', ['Turma', 'Ano Letivo'])) found.push('turmas');
  if (temCols('Alunos', ['Turma', 'Nome'])) found.push('alunos');
  if (temCols('Aulas', ['Turma', 'Disciplina', 'Data'])) found.push('aulas');
  if (temCols('Chamada', ['Turma', 'Disciplina', 'Data', 'Aluno', 'Presença'])) found.push('chamada');
  if (temCols('Notas', ['Turma', 'Disciplina', 'Avaliação', 'Aluno', 'Nota'])) found.push('notas');
  if (temCols('Ocorrências', ['Turma', 'Aluno', 'Data', 'Descrição'])) found.push('ocorrências');
  return found.length && (found.includes('turmas') || found.includes('alunos')) ? found : null;
}

/** Lê as linhas de uma planilha como objetos com chaves normalizadas (sem acento, minúsculas). */
function linhas(wb, nome) {
  const ws = wb.Sheets[nome];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: true }).map((r) => {
    const o = {};
    for (const [k, v] of Object.entries(r)) o[norm(k)] = v instanceof Date ? v : (typeof v === 'string' ? v.trim() : v);
    return o;
  });
}
function parsePeriodo(v) {
  const s = norm(v);
  if (!s) return null;
  if (s.includes('final') || s === 'rf' || s === 'f') return 'F';
  const m = s.match(/\d+/);
  const n = m ? Number(m[0]) : null;
  return n && n >= 1 && n <= periodos().length ? n : null;
}

function importarDiario(wb) {
  const cont = { turmas: 0, alunos: 0, aulas: 0, presencas: 0, notas: 0, ocorrencias: 0 };
  const findTurma = (nome, ano, criar) => {
    ano = String(ano || cfg().anoAtual);
    let t = db.turmas.find((x) => norm(x.nome) === norm(nome) && String(x.anoLetivo) === ano);
    if (!t && criar && nome) {
      t = { id: uid(), nome: String(nome), anoLetivo: ano, disciplinas: [], criadoEm: todayISO() };
      db.turmas.push(t); anoLetivo(ano); cont.turmas++;
    }
    return t;
  };
  const findDisc = (t, nome) => {
    if (!nome) return null;
    let d = t.disciplinas.find((x) => norm(x.nome) === norm(nome));
    if (!d) { d = { id: uid(), nome: String(nome) }; t.disciplinas.push(d); }
    return d;
  };
  const findAluno = (t, nome, matricula, criar) => {
    const lista = todosAlunosDaTurma(t.id);
    let a = matricula ? lista.find((x) => x.matricula && String(x.matricula) === String(matricula)) : null;
    if (!a && nome) a = lista.find((x) => norm(x.nome) === norm(nome));
    if (!a && criar && nome) {
      a = { id: uid(), turmaId: t.id, nome: String(nome), matricula: matricula ? String(matricula) : '', numero: numeroSeguinte(t.id), situacao: 'Ativo', ocorrencias: [] };
      db.alunos.push(a); cont.alunos++;
    }
    return a;
  };
  const findAula = (t, d, data, extra) => {
    let a = db.aulas.find((x) => x.turmaId === t.id && x.disciplinaId === d.id && x.data === data);
    if (!a) {
      a = { id: uid(), turmaId: t.id, disciplinaId: d.id, data, periodo: periodoDaData(data, t.anoLetivo), qtd: 1, conteudo: '', presencas: {} };
      db.aulas.push(a); cont.aulas++;
    }
    if (extra) {
      if (extra.periodo) a.periodo = extra.periodo;
      if (extra.qtd) a.qtd = extra.qtd;
      if (extra.conteudo) a.conteudo = extra.conteudo;
    }
    return a;
  };
  const str = (v) => (v == null ? '' : String(v instanceof Date ? toISODate(v) : v).trim());

  for (const r of linhas(wb, 'Turmas')) {
    const t = findTurma(r['turma'], r['ano letivo'], true);
    if (!t) continue;
    const map = { curso: 'curso', serie: 'serie ano', turno: 'turno', idioma: 'idioma', sala: 'sala', horario: 'horario', escola: 'escola', professor: 'professor', obs: 'observacoes' };
    for (const [k, col] of Object.entries(map)) if (r[col] !== undefined && str(r[col]) && !t[k]) t[k] = str(r[col]);
    for (const n of str(r['disciplinas']).split(/[;,]/).map((s) => s.trim()).filter(Boolean)) findDisc(t, n);
  }
  for (const r of linhas(wb, 'Alunos')) {
    const t = findTurma(r['turma'], r['ano letivo'], true);
    if (!t || !str(r['nome'])) continue;
    const a = findAluno(t, str(r['nome']), str(r['matricula']), true);
    const map = { numero: 'n', nascimento: 'data de nascimento', sexo: 'sexo', cpf: 'cpf documento', situacao: 'situacao', responsavel: 'responsavel',
      telefone: 'telefone', telefone2: 'telefone 2', email: 'e mail', endereco: 'endereco', necessidades: 'necessidades especiais', obs: 'observacoes' };
    for (const [k, col] of Object.entries(map)) {
      if (r[col] === undefined || str(r[col]) === '') continue;
      a[k] = k === 'nascimento' ? toISODate(r[col]) : k === 'numero' ? Number(r[col]) || a.numero : str(r[col]);
    }
  }
  for (const r of linhas(wb, 'Aulas')) {
    const t = findTurma(r['turma'], r['ano letivo'], true);
    const data = toISODate(r['data']);
    if (!t || !data || !str(r['disciplina'])) continue;
    findAula(t, findDisc(t, str(r['disciplina'])), data, { periodo: parsePeriodo(r['periodo']), qtd: Number(r['qtd aulas']) || null, conteudo: str(r['conteudo']) });
  }
  for (const r of linhas(wb, 'Chamada')) {
    const t = findTurma(r['turma'], r['ano letivo'], true);
    const data = toISODate(r['data']);
    if (!t || !data || !str(r['disciplina'])) continue;
    const a = findAluno(t, str(r['aluno']), str(r['matricula']), true);
    if (!a) continue;
    const au = findAula(t, findDisc(t, str(r['disciplina'])), data, { periodo: parsePeriodo(r['periodo']), qtd: Number(r['qtd aulas']) || null });
    const p = str(r['presenca']).toUpperCase().charAt(0);
    au.presencas[a.id] = p === 'F' || p === 'A' ? 'F' : p === 'J' ? 'J' : 'P';
    cont.presencas++;
  }
  for (const r of linhas(wb, 'Notas')) {
    const t = findTurma(r['turma'], r['ano letivo'], true);
    const per = parsePeriodo(r['periodo']);
    if (!t || !per || !str(r['disciplina']) || !str(r['avaliacao'])) continue;
    const d = findDisc(t, str(r['disciplina']));
    const tipo = per === 'F' || norm(r['tipo']).startsWith('recup') ? 'rec' : 'normal';
    let av = db.avaliacoes.find((x) => x.turmaId === t.id && x.disciplinaId === d.id && x.periodo === per && norm(x.nome) === norm(r['avaliacao']));
    if (!av) {
      av = { id: uid(), turmaId: t.id, disciplinaId: d.id, periodo: per, tipo, nome: str(r['avaliacao']), data: toISODate(r['data']), peso: parseNum(r['peso']) || 1, ordem: Date.now() + cont.notas };
      db.avaliacoes.push(av);
    }
    const a = findAluno(t, str(r['aluno']), str(r['matricula']), true);
    const n = parseNum(r['nota']);
    if (a && n != null) { setNota(av.id, a.id, n); cont.notas++; }
  }
  for (const r of linhas(wb, 'Ocorrências')) {
    const t = findTurma(r['turma'], r['ano letivo'], false);
    if (!t) continue;
    const a = findAluno(t, str(r['aluno']), str(r['matricula']), false);
    const data = toISODate(r['data']);
    if (!a || !data || !str(r['descricao'])) continue;
    if (a.ocorrencias.some((o) => o.data === data && o.descricao === str(r['descricao']))) continue;
    a.ocorrencias.push({ id: uid(), data, tipo: str(r['tipo']) || 'Observação', descricao: str(r['descricao']) });
    cont.ocorrencias++;
  }
  saveDb(true);
  state.stack = [];
  nav('home', { ano: cfg().anoAtual }, true);
  openModal(`<h2>Importação concluída</h2><dl class="kv">
    <dt>Turmas novas</dt><dd>${cont.turmas}</dd><dt>Alunos novos</dt><dd>${cont.alunos}</dd>
    <dt>Aulas novas</dt><dd>${cont.aulas}</dd><dt>Registros de chamada</dt><dd>${cont.presencas}</dd>
    <dt>Notas</dt><dd>${cont.notas}</dd><dt>Ocorrências</dt><dd>${cont.ocorrencias}</dd></dl>
    <div class="actions"><button class="btn primary" onclick="closeModal()">OK</button></div>`);
}

function mapearAlunos(wb, sheet) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '', raw: true, blankrows: false });
  if (!rows.length) { toast('Planilha vazia'); return; }
  // procura a linha de cabeçalho: a primeira das 15 primeiras que contém algo parecido com "nome"
  let hdr = rows.slice(0, 15).findIndex((r) => r.some((c) => ALUNO_SINONIMOS.nome.includes(norm(c))));
  if (hdr < 0) hdr = 0;
  const head = rows[hdr].map((c, i) => String(c || '').trim() || `Coluna ${XLSX.utils.encode_col(i)}`);
  const guess = {};
  for (const [campo, sins] of Object.entries(ALUNO_SINONIMOS)) {
    const i = head.findIndex((c, idx) => sins.includes(norm(c)) && !Object.values(guess).includes(idx));
    guess[campo] = i;
  }
  if (guess.nome < 0) {
    // sem cabeçalho reconhecido: assume a coluna com mais texto
    let best = 0, bestLen = -1;
    head.forEach((_, i) => { const l = rows.slice(hdr, hdr + 30).reduce((s, r) => s + String(r[i] || '').replace(/[\d\W]/g, '').length, 0); if (l > bestLen) { bestLen = l; best = i; } });
    guess.nome = best;
  }
  const colOpts = [['-1', '— não importar —'], ...head.map((c, i) => [String(i), `${XLSX.utils.encode_col(i)}: ${c}`])];
  const nomeNova = /^(sheet|planilha|plan|folha)\s*\d*$/i.test(sheet) ? importState.name.replace(/\.[^.]+$/, '') : sheet;
  const turmasOpts = [['__nova', `+ Nova turma: "${nomeNova}"`], ...db.turmas.slice().sort((x, y) => (y.anoLetivo || '').localeCompare(x.anoLetivo || '') || byName(x, y)).map((t) => [t.id, `${t.nome} (${t.anoLetivo})`])];
  const atual = state.stack.slice().reverse().find((v) => v.view === 'turma');
  const labels = { numero: 'Nº chamada', nome: 'Nome', matricula: 'Matrícula', nascimento: 'Nascimento', sexo: 'Sexo', cpf: 'CPF/Documento', situacao: 'Situação', responsavel: 'Responsável', telefone: 'Telefone', telefone2: 'Telefone 2', email: 'E-mail', endereco: 'Endereço', necessidades: 'Necessidades especiais', obs: 'Observações' };
  formDlg({
    title: 'Importar alunos',
    saveLabel: 'Importar',
    fields: [
      { name: 'turma', label: 'Turma de destino', type: 'select', options: turmasOpts, value: atual ? atual.id : '__nova' },
      { name: 'hdr', label: 'Linha do cabeçalho', type: 'number', value: hdr + 1, hint: `Os alunos serão lidos a partir da linha ${hdr + 2}.` },
      ...Object.keys(ALUNO_SINONIMOS).map((k) => ({ name: 'c_' + k, label: labels[k], type: 'select', options: colOpts, value: String(guess[k]), half: true })),
      { name: 'atualizar', label: 'Atualizar alunos já cadastrados (mesmo nome ou matrícula)', type: 'checkbox', value: true },
    ],
    onSave(v) {
      const col = (k) => Number(v['c_' + k]);
      if (col('nome') < 0) { toast('Escolha a coluna do nome'); return false; }
      let t = getTurma(v.turma);
      if (!t) {
        t = { id: uid(), nome: nomeNova, anoLetivo: cfg().anoAtual, disciplinas: [], criadoEm: todayISO() };
        db.turmas.push(t);
      }
      const start = Math.max(1, Math.round(v.hdr || 1));
      let novos = 0, atualizados = 0;
      for (const r of rows.slice(start)) {
        const nome = String(r[col('nome')] == null ? '' : r[col('nome')]).trim();
        if (!nome || norm(nome) === 'nome') continue;
        const get = (k) => (col(k) >= 0 ? r[col(k)] : '');
        const matricula = String(get('matricula') || '').trim();
        const lista = todosAlunosDaTurma(t.id);
        let a = (matricula && lista.find((x) => x.matricula === matricula)) || lista.find((x) => norm(x.nome) === norm(nome));
        if (a && !v.atualizar) continue;
        if (!a) { a = { id: uid(), turmaId: t.id, situacao: 'Ativo', ocorrencias: [], numero: numeroSeguinte(t.id) }; db.alunos.push(a); novos++; }
        else atualizados++;
        a.nome = nome;
        for (const k of Object.keys(ALUNO_SINONIMOS)) {
          if (k === 'nome' || col(k) < 0) continue;
          const val = get(k);
          if (val === '' || val == null) continue;
          if (k === 'nascimento') a[k] = toISODate(val);
          else if (k === 'numero') a[k] = Number(val) || a.numero;
          else if (k === 'situacao') a[k] = ['Ativo', 'Transferido', 'Desistente', 'Remanejado', 'Concluído'].find((s) => norm(s) === norm(val)) || 'Ativo';
          else a[k] = String(val instanceof Date ? toISODate(val) : val).trim();
        }
      }
      saveDb(true);
      state.stack = [{ view: 'home', ano: t.anoLetivo }];
      state.view = { view: 'turma', id: t.id, tab: 'alunos' };
      render();
      toast(`${novos} aluno(s) importado(s)${atualizados ? `, ${atualizados} atualizado(s)` : ''}`);
    },
  });
}

/* =========================================================================
 * Início
 * ========================================================================= */
db = loadDb();
saveDb(true);
nav('home');
