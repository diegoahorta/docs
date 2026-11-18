/* Bullet Journal — lógica central (sem DOM). Usado pelo app e pelos testes em Node. */
(function (root) {
  'use strict';
  // polyfills para WebViews antigos (Android 7 sem atualização)
  if (!String.prototype.padStart) String.prototype.padStart = function (n, c) { let s = String(this); while (s.length < n) s = (c || ' ') + s; return s; };
  if (!Object.values) Object.values = o => Object.keys(o).map(k => o[k]);

  // ---------------- datas ----------------
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const WD_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const WD_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => isoDate(new Date());
  const monthOf = date => date.slice(0, 7);
  const currentMonth = () => monthOf(today());
  const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d); };
  const addMonths = (ym, n) => {
    const [y, m] = ym.split('-').map(Number);
    const t = y * 12 + (m - 1) + n;
    return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
  };
  const daysInMonth = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const weekday = s => parseDate(s).getDay();
  const monthName = ym => MONTHS[Number(ym.split('-')[1]) - 1];
  const monthLabel = ym => `${monthName(ym)} ${ym.split('-')[0]}`;
  const dateLabel = s => { const d = parseDate(s); return `${WD_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`; };
  const shortDate = s => { const d = parseDate(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };

  // ---------------- chave (key) ----------------
  // Puces (bullets) e signifiers, conforme o método original (Ryder Carroll) e o guia analisado.
  const BULLETS = {
    task: { open: '•', done: '×', migrated: '>', scheduled: '<', cancelled: '•' },
    event: '○',
    note: '–'
  };
  const SIGNIFIERS = {
    priority: { sym: '*', label: 'Prioridade' },
    inspiration: { sym: '!', label: 'Inspiração / ideia' },
    explore: { sym: '?', label: 'Pesquisar / explorar' }
  };
  const TYPE_LABEL = { task: 'Tarefa', event: 'Evento', note: 'Nota' };
  const STATUS_LABEL = { open: 'Aberta', done: 'Concluída', migrated: 'Migrada (>)', scheduled: 'Agendada (<)', cancelled: 'Cancelada' };
  const LOG_LABEL = { daily: 'Daily log', monthly: 'Monthly log', future: 'Future log', collection: 'Coleção' };

  function bulletFor(e) {
    if (e.type === 'task') return BULLETS.task[e.status] || '•';
    return BULLETS[e.type] || '•';
  }

  // ---------------- estado ----------------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function defaultState() {
    const now = Date.now();
    return {
      version: 1,
      createdAt: now,
      settings: { theme: 'auto', futureStart: currentMonth(), name: '' },
      colors: [
        { id: 'c-pessoal', name: 'Pessoal', color: '#3E7CB1' },
        { id: 'c-trabalho', name: 'Trabalho', color: '#C4523A' },
        { id: 'c-saude', name: 'Saúde', color: '#4F8A5B' },
        { id: 'c-familia', name: 'Família', color: '#B5832A' }
      ],
      entries: [],
      pages: [],          // registro para o índice: {id, kind, ref, created}
      collections: [],    // {id, title, color, created}
      trackers: []        // {id, title, kind:'habit'|'value', month, habits:[{id,name}], marks:{}, values:{}, unit, created}
    };
  }

  function normalize(s) {
    const d = defaultState();
    if (!s || typeof s !== 'object') return d;
    const out = Object.assign({}, d, s);
    out.settings = Object.assign({}, d.settings, s.settings || {});
    for (const k of ['colors', 'entries', 'pages', 'collections', 'trackers']) if (!Array.isArray(out[k])) out[k] = d[k];
    return out;
  }

  // ---------------- páginas / índice ----------------
  function pageRef(log, e) {
    if (log === 'daily') return e.date;
    if (log === 'monthly') return e.month;
    if (log === 'collection') return e.collectionId;
    return null;
  }

  function ensurePage(state, kind, ref) {
    if (kind === 'future' || ref == null) return null;
    let p = state.pages.find(p => p.kind === kind && p.ref === ref);
    if (!p) { p = { id: uid(), kind, ref, created: Date.now() }; state.pages.push(p); }
    return p;
  }

  function pageTitle(state, p) {
    if (p.kind === 'daily') return `Daily · ${shortDate(p.ref)}`;
    if (p.kind === 'monthly') return `Monthly · ${monthLabel(p.ref)}`;
    if (p.kind === 'collection') { const c = state.collections.find(c => c.id === p.ref); return c ? c.title : '(coleção removida)'; }
    if (p.kind === 'tracker') { const t = state.trackers.find(t => t.id === p.ref); return t ? `Tracker · ${t.title}${t.month ? ' (' + monthLabel(t.month) + ')' : ''}` : '(tracker removido)'; }
    return p.kind;
  }

  /** Índice: páginas fixas (Chave, Índice, Future log) + páginas na ordem de criação, numeradas. */
  function buildIndex(state) {
    const fixed = [
      { kind: 'key', title: 'Chave (clefs)', page: 1 },
      { kind: 'index', title: 'Índice', page: 2 },
      { kind: 'future', title: 'Future log', page: 3 }
    ];
    const valid = state.pages.filter(p => {
      if (p.kind === 'collection') return state.collections.some(c => c.id === p.ref);
      if (p.kind === 'tracker') return state.trackers.some(t => t.id === p.ref);
      return true;
    }).sort((a, b) => a.created - b.created);
    const items = valid.map((p, i) => {
      let color = null;
      if (p.kind === 'collection') { const c = state.collections.find(c => c.id === p.ref); color = c && c.color; }
      return { kind: p.kind, ref: p.ref, id: p.id, title: pageTitle(state, p), page: 4 + i, color };
    });
    return fixed.concat(items);
  }

  // ---------------- entradas ----------------
  /** Interpreta prefixos do "rapid logging": "o " evento, "- " nota, "* " prioridade, "! " inspiração, "? " explorar. */
  function parseQuick(text, defaults) {
    let t = text.trim();
    const r = Object.assign({ type: 'task', signifier: '' }, defaults || {});
    let changed = true;
    while (changed && t.length > 1) {
      changed = false;
      const m = /^([.•o○\-–*!?])\s+/.exec(t);
      if (!m) break;
      const c = m[1];
      if (c === 'o' || c === '○') r.type = 'event';
      else if (c === '-' || c === '–') r.type = 'note';
      else if (c === '.' || c === '•') r.type = 'task';
      else if (c === '*') r.signifier = 'priority';
      else if (c === '!') r.signifier = 'inspiration';
      else if (c === '?') r.signifier = 'explore';
      t = t.slice(m[0].length); changed = true;
    }
    r.text = t;
    return r;
  }

  function addEntry(state, data) {
    const now = Date.now();
    const e = {
      id: uid(), type: data.type || 'task', text: (data.text || '').trim(), status: 'open',
      signifier: data.signifier || '', color: data.color || null, log: data.log,
      date: data.date || null, month: data.month || null, day: data.day || null,
      collectionId: data.collectionId || null, migratedFrom: data.migratedFrom || null, migratedTo: null,
      created: now, updated: now, order: now
    };
    if (e.log === 'daily' && e.date) e.month = monthOf(e.date);
    state.entries.push(e);
    ensurePage(state, e.log, pageRef(e.log, e));
    return e;
  }

  const getEntry = (state, id) => state.entries.find(e => e.id === id);

  function updateEntry(state, id, patch) {
    const e = getEntry(state, id);
    if (!e) return null;
    Object.assign(e, patch, { updated: Date.now() });
    return e;
  }

  function removeEntry(state, id) {
    const i = state.entries.findIndex(e => e.id === id);
    if (i >= 0) state.entries.splice(i, 1);
  }

  function toggleDone(state, id) {
    const e = getEntry(state, id);
    if (!e || e.type !== 'task') return e;
    e.status = e.status === 'done' ? 'open' : 'done';
    e.updated = Date.now();
    return e;
  }

  const byOrder = (a, b) => (a.order - b.order);
  const dailyEntries = (state, date) => state.entries.filter(e => e.log === 'daily' && e.date === date).sort(byOrder);
  const monthlyEntries = (state, ym) => state.entries.filter(e => e.log === 'monthly' && e.month === ym).sort(byOrder);
  const futureEntries = (state, ym) => state.entries.filter(e => e.log === 'future' && e.month === ym)
    .sort((a, b) => (a.day || 99) - (b.day || 99) || byOrder(a, b));
  const collectionEntries = (state, cid) => state.entries.filter(e => e.log === 'collection' && e.collectionId === cid).sort(byOrder);

  // ---------------- migração ----------------
  /**
   * Migra uma tarefa (ou evento) para outro lugar do caderno, como no método:
   *  - "tomorrow"   → próximo daily log           (símbolo > : vai para frente)
   *  - "daily"      → daily log de data escolhida (>)
   *  - "monthly"    → monthly log de um mês        (símbolo < : volta para o início do caderno)
   *  - "future"     → future log de um mês         (<)
   *  - "collection" → página de coleção            (>)
   * A entrada original fica marcada (> ou <) e uma cópia aberta é criada no destino.
   */
  function migrate(state, id, target) {
    const e = getEntry(state, id);
    if (!e) return null;
    const base = { type: e.type, text: e.text, signifier: e.signifier, color: e.color, migratedFrom: e.id };
    let copy;
    let mark;
    switch (target.to) {
      case 'tomorrow': {
        const from = e.date || today();
        const date = from < today() ? today() : addDays(from, 1);
        copy = addEntry(state, Object.assign(base, { log: 'daily', date })); mark = 'migrated'; break;
      }
      case 'daily':
        copy = addEntry(state, Object.assign(base, { log: 'daily', date: target.date })); mark = 'migrated'; break;
      case 'monthly':
        copy = addEntry(state, Object.assign(base, { log: 'monthly', month: target.month, day: target.day || null }));
        mark = (e.log === 'future' || (e.log === 'monthly' && target.month > e.month)) ? 'migrated' : 'scheduled'; break;
      case 'future':
        copy = addEntry(state, Object.assign(base, { log: 'future', month: target.month, day: target.day || null })); mark = 'scheduled'; break;
      case 'collection':
        copy = addEntry(state, Object.assign(base, { log: 'collection', collectionId: target.collectionId })); mark = 'migrated'; break;
      default: return null;
    }
    if (e.type === 'task') e.status = mark;
    e.migratedTo = copy.id;
    e.updated = Date.now();
    return copy;
  }

  /** Tarefas ainda abertas em páginas passadas: o que precisa ser revisto na migração. */
  function pendingMigration(state, ref) {
    const t = ref || today();
    const ym = monthOf(t);
    return state.entries.filter(e => e.type === 'task' && e.status === 'open' && (
      (e.log === 'daily' && e.date < t) ||
      (e.log === 'monthly' && e.month < ym) ||
      (e.log === 'future' && e.month <= ym)
    )).sort((a, b) => (a.date || a.month || '').localeCompare(b.date || b.month || '') || byOrder(a, b));
  }

  function whereLabel(state, e) {
    if (e.log === 'daily') return `Daily ${shortDate(e.date)}`;
    if (e.log === 'monthly') return `Monthly ${monthLabel(e.month)}${e.day ? ' · dia ' + e.day : ''}`;
    if (e.log === 'future') return `Future log ${monthLabel(e.month)}${e.day ? ' · dia ' + e.day : ''}`;
    if (e.log === 'collection') { const c = state.collections.find(c => c.id === e.collectionId); return `Coleção ${c ? c.title : ''}`; }
    return '';
  }

  // ---------------- coleções e trackers ----------------
  function addCollection(state, title, color) {
    const c = { id: uid(), title: title.trim(), color: color || null, created: Date.now() };
    state.collections.push(c);
    ensurePage(state, 'collection', c.id);
    return c;
  }

  function removeCollection(state, id) {
    state.collections = state.collections.filter(c => c.id !== id);
    state.entries = state.entries.filter(e => !(e.log === 'collection' && e.collectionId === id));
    state.pages = state.pages.filter(p => !(p.kind === 'collection' && p.ref === id));
  }

  function addTracker(state, data) {
    const t = {
      id: uid(), title: data.title.trim(), kind: data.kind || 'habit', month: data.month || currentMonth(),
      habits: (data.habits || []).filter(Boolean).map(name => ({ id: uid(), name: name.trim() })),
      marks: {}, values: {}, unit: data.unit || '', created: Date.now()
    };
    state.trackers.push(t);
    ensurePage(state, 'tracker', t.id);
    return t;
  }

  function removeTracker(state, id) {
    state.trackers = state.trackers.filter(t => t.id !== id);
    state.pages = state.pages.filter(p => !(p.kind === 'tracker' && p.ref === id));
  }

  function toggleMark(tracker, habitId, day) {
    const m = tracker.marks[habitId] || (tracker.marks[habitId] = {});
    if (m[day]) delete m[day]; else m[day] = 1;
    return !!m[day];
  }

  function habitStats(tracker) {
    const n = daysInMonth(tracker.month);
    return tracker.habits.map(h => {
      const done = Object.keys(tracker.marks[h.id] || {}).length;
      return { id: h.id, name: h.name, done, pct: Math.round(done / n * 100) };
    });
  }

  // ---------------- busca ----------------
  const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function search(state, q) {
    const f = fold(q).trim();
    if (!f) return [];
    return state.entries.filter(e => fold(e.text).includes(f)).sort((a, b) => b.created - a.created);
  }

  // ---------------- exportação ----------------
  function inRange(e, range) {
    if (!range || range.scope === 'all') return true;
    const key = e.date || (e.month ? e.month + '-' + pad(e.day || 1) : null);
    if (!key) return range.includeCollections !== false && e.log === 'collection';
    return key >= range.from && key <= range.to;
  }

  function entryLine(state, e) {
    const sig = e.signifier ? SIGNIFIERS[e.signifier].sym + ' ' : '';
    const col = e.color ? (state.colors.find(c => c.id === e.color) || {}).name : '';
    const struck = e.status === 'cancelled' ? '~~' : '';
    return `${sig}${bulletFor(e)} ${struck}${e.text}${struck}${col ? '  [' + col + ']' : ''}`;
  }

  function toMarkdown(state, range) {
    const L = [];
    const title = state.settings.name ? `Bullet Journal — ${state.settings.name}` : 'Bullet Journal';
    L.push(`# ${title}`, '', `Exportado em ${shortDate(today())}`, '');
    L.push('## Chave', '', '• tarefa · × concluída · > migrada · < agendada · ○ evento · – nota · * prioridade · ! inspiração · ? explorar', '');
    if (state.colors.length) L.push('Código de cores: ' + state.colors.map(c => `${c.name} (${c.color})`).join(', '), '');
    L.push('## Índice', '');
    buildIndex(state).forEach(i => L.push(`- p.${i.page} — ${i.title}`));
    L.push('');
    const ents = state.entries.filter(e => inRange(e, range));
    const fut = ents.filter(e => e.log === 'future');
    if (fut.length) {
      L.push('## Future log', '');
      [...new Set(fut.map(e => e.month))].sort().forEach(m => {
        L.push(`### ${monthLabel(m)}`);
        futureEntries(state, m).filter(e => inRange(e, range)).forEach(e => L.push(`- ${e.day ? e.day + ': ' : ''}${entryLine(state, e)}`));
        L.push('');
      });
    }
    const months = [...new Set(ents.filter(e => e.log === 'monthly' || e.log === 'daily').map(e => e.month))].sort();
    months.forEach(m => {
      const mon = monthlyEntries(state, m).filter(e => inRange(e, range));
      if (mon.length) {
        L.push(`## Monthly log — ${monthLabel(m)}`, '');
        const cal = mon.filter(e => e.day), todo = mon.filter(e => !e.day);
        if (cal.length) { L.push('**Calendário**', ''); cal.sort((a, b) => a.day - b.day).forEach(e => L.push(`- ${e.day} ${WD_SHORT[weekday(m + '-' + pad(e.day))]} — ${entryLine(state, e)}`)); L.push(''); }
        if (todo.length) { L.push('**Tarefas do mês**', ''); todo.forEach(e => L.push(`- ${entryLine(state, e)}`)); L.push(''); }
      }
      const days = [...new Set(ents.filter(e => e.log === 'daily' && e.month === m).map(e => e.date))].sort();
      days.forEach(d => {
        L.push(`### ${dateLabel(d)}`, '');
        dailyEntries(state, d).forEach(e => L.push(`- ${entryLine(state, e)}`));
        L.push('');
      });
    });
    const cols = state.collections.filter(c => ents.some(e => e.collectionId === c.id) || !range || range.scope === 'all');
    if (cols.length && (!range || range.includeCollections !== false)) {
      L.push('## Coleções', '');
      cols.forEach(c => {
        L.push(`### ${c.title}`, '');
        const ce = collectionEntries(state, c.id);
        if (!ce.length) L.push('_(vazia)_');
        ce.forEach(e => L.push(`- ${entryLine(state, e)}`));
        L.push('');
      });
    }
    const trs = state.trackers.filter(t => !range || range.scope === 'all' || (t.month >= range.from.slice(0, 7) && t.month <= range.to.slice(0, 7)));
    if (trs.length) {
      L.push('## Trackers', '');
      trs.forEach(t => {
        L.push(`### ${t.title} — ${monthLabel(t.month)}`, '');
        if (t.kind === 'habit') {
          habitStats(t).forEach(h => {
            const days = Object.keys(t.marks[h.id] || {}).map(Number).sort((a, b) => a - b);
            L.push(`- ${h.name}: ${h.done} dia(s) (${h.pct}%)${days.length ? ' — dias ' + days.join(', ') : ''}`);
          });
        } else {
          Object.keys(t.values).map(Number).sort((a, b) => a - b).forEach(d => L.push(`- dia ${d}: ${t.values[d]} ${t.unit}`));
        }
        L.push('');
      });
    }
    return L.join('\n');
  }

  function csvCell(v) {
    const s = v == null ? '' : String(v);
    return /[";\n\r,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(state, range) {
    const head = ['data', 'mes', 'dia', 'pagina', 'colecao', 'tipo', 'status', 'simbolo', 'significador', 'cor', 'texto', 'criado_em'];
    const rows = state.entries.filter(e => inRange(e, range)).sort((a, b) =>
      (a.date || a.month || '').localeCompare(b.date || b.month || '') || byOrder(a, b)).map(e => {
      const col = e.collectionId ? (state.collections.find(c => c.id === e.collectionId) || {}).title : '';
      const color = e.color ? (state.colors.find(c => c.id === e.color) || {}).name : '';
      return [e.date || '', e.month || '', e.day || '', LOG_LABEL[e.log], col, TYPE_LABEL[e.type], STATUS_LABEL[e.status] || '',
        bulletFor(e), e.signifier ? SIGNIFIERS[e.signifier].label : '', color, e.text, new Date(e.created).toISOString()];
    });
    return '﻿' + [head].concat(rows).map(r => r.map(csvCell).join(',')).join('\r\n');
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** HTML imprimível (Salvar como PDF) gerado a partir do Markdown exportado. */
  function toPrintableHTML(state, range) {
    const md = toMarkdown(state, range).split('\n');
    const body = md.map(l => {
      if (l.startsWith('### ')) return `<h3>${esc(l.slice(4))}</h3>`;
      if (l.startsWith('## ')) return `<h2>${esc(l.slice(3))}</h2>`;
      if (l.startsWith('# ')) return `<h1>${esc(l.slice(2))}</h1>`;
      if (l.startsWith('- ')) return `<li>${esc(l.slice(2)).replace(/~~(.+?)~~/g, '<s>$1</s>')}</li>`;
      if (/^\*\*(.+)\*\*$/.test(l)) return `<h4>${esc(l.replace(/\*\*/g, ''))}</h4>`;
      if (!l.trim()) return '';
      return `<p>${esc(l).replace(/_(.+)_/, '<em>$1</em>')}</p>`;
    }).join('\n');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Bullet Journal</title>
<style>body{font-family:Georgia,serif;color:#222;margin:24px;line-height:1.45;font-size:12pt}
h1{font-size:20pt;border-bottom:2px solid #222;padding-bottom:4px}h2{font-size:15pt;margin-top:22px;border-bottom:1px solid #999;page-break-after:avoid}
h3{font-size:12.5pt;margin:14px 0 4px;page-break-after:avoid}h4{margin:8px 0 2px}li{list-style:none;margin:2px 0;font-family:'Courier New',monospace;font-size:11pt}
p{margin:4px 0}</style></head><body>${body}</body></html>`;
  }

  function toJSON(state) {
    return JSON.stringify({ app: 'bullet-journal-offline', exportedAt: new Date().toISOString(), data: state }, null, 2);
  }

  /** Lê um backup JSON. mode "replace" substitui tudo; "merge" adiciona o que não existir (por id). */
  function importJSON(state, text, mode) {
    let obj = JSON.parse(text);
    if (obj && obj.data && obj.app === 'bullet-journal-offline') obj = obj.data;
    if (!obj || !Array.isArray(obj.entries)) throw new Error('Arquivo não é um backup válido do Bullet Journal');
    const inc = normalize(obj);
    if (mode === 'replace') return inc;
    const out = normalize(JSON.parse(JSON.stringify(state)));
    let added = 0;
    for (const k of ['colors', 'entries', 'pages', 'collections', 'trackers']) {
      const ids = new Set(out[k].map(x => x.id));
      inc[k].forEach(x => { if (!ids.has(x.id)) { out[k].push(x); added++; } });
    }
    out._merged = added;
    return out;
  }

  const api = {
    MONTHS, WD_LONG, WD_SHORT, BULLETS, SIGNIFIERS, TYPE_LABEL, STATUS_LABEL, LOG_LABEL,
    pad, isoDate, parseDate, today, monthOf, currentMonth, addDays, addMonths, daysInMonth, weekday,
    monthName, monthLabel, dateLabel, shortDate, uid, defaultState, normalize, bulletFor,
    ensurePage, buildIndex, pageTitle, parseQuick, addEntry, getEntry, updateEntry, removeEntry, toggleDone,
    dailyEntries, monthlyEntries, futureEntries, collectionEntries, migrate, pendingMigration, whereLabel,
    addCollection, removeCollection, addTracker, removeTracker, toggleMark, habitStats, search,
    toMarkdown, toCSV, toPrintableHTML, toJSON, importJSON, esc, fold
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Bujo = api;
})(typeof window !== 'undefined' ? window : globalThis);
