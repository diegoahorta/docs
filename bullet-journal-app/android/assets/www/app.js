/* Bullet Journal offline — interface. Depende de core.js (window.Bujo). */
(function () {
  'use strict';
  const B = window.Bujo;
  const $ = s => document.querySelector(s);
  const esc = B.esc;
  const NATIVE = !!(window.Native && window.Native.isNative && window.Native.isNative());

  // ---------------- persistência ----------------
  const LS_KEY = 'bujo-offline-v1';
  function loadState() {
    let raw = '';
    try { raw = NATIVE ? window.Native.load() : (localStorage.getItem(LS_KEY) || ''); } catch (e) { raw = ''; }
    if (!raw) return B.defaultState();
    try { return B.normalize(JSON.parse(raw)); } catch (e) { return B.defaultState(); }
  }
  let S = loadState();
  let saveTimer = null;
  function flush() {
    clearTimeout(saveTimer); saveTimer = null;
    const json = JSON.stringify(S);
    try { if (NATIVE) window.Native.save(json); else localStorage.setItem(LS_KEY, json); } catch (e) { toast('Erro ao salvar'); }
  }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 250); }
  window.bujoFlush = flush;
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  // ---------------- utilidades de UI ----------------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }
  const colorOf = id => (S.colors.find(c => c.id === id) || {}).color;
  const colorName = id => (S.colors.find(c => c.id === id) || {}).name;

  function applyTheme() {
    const t = S.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    if (NATIVE && window.Native.setBars) window.Native.setBars(dark ? '#1E1C19' : '#F7F3EA', dark);
  }
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  // ---------------- navegação ----------------
  let view = { name: 'daily', date: B.today() };
  let stack = [];
  const TAB_OF = { daily: 'daily', monthly: 'monthly', future: 'future', collections: 'collections', collection: 'collections' };

  function go(v, push) {
    if (push) stack.push(view);
    view = v;
    render();
    $('#view').scrollTop = 0;
  }
  function tab(name) {
    stack = [];
    const v = { name };
    if (name === 'daily') v.date = B.today();
    if (name === 'monthly') v.month = B.currentMonth();
    go(v, false);
  }
  function back() {
    if (!$('#sheet-wrap').hidden) { closeSheet(); return true; }
    if (stack.length) { view = stack.pop(); render(); return true; }
    if (view.name !== 'daily' || view.date !== B.today()) { tab('daily'); return true; }
    return false;
  }
  window.bujoBack = back;

  // ---------------- compositor (rapid logging) ----------------
  const comp = { type: 'task', signifier: '', color: null, mDay: '', fMonth: null, fDay: '' };
  const TYPE_SYM = { task: '•', event: '○', note: '–' };
  const TYPE_NEXT = { task: 'event', event: 'note', note: 'task' };

  function composerContext() {
    switch (view.name) {
      case 'daily': return { log: 'daily', date: view.date };
      case 'monthly': return { log: 'monthly', month: view.month, day: comp.mDay ? Number(comp.mDay) : null };
      case 'future': return { log: 'future', month: comp.fMonth || futureStart(), day: comp.fDay ? Number(comp.fDay) : null };
      case 'collection': return { log: 'collection', collectionId: view.id };
      default: return null;
    }
  }

  function renderComposer() {
    const ctx = composerContext();
    const form = $('#composer');
    form.hidden = !ctx;
    if (!ctx) return;
    $('#c-type').textContent = TYPE_SYM[comp.type];
    $('#c-type').title = B.TYPE_LABEL[comp.type];
    const ph = { daily: 'Anotar no dia…', monthly: comp.mDay ? `Anotar no dia ${comp.mDay}…` : 'Tarefa do mês…', future: 'Anotar no future log…', collection: 'Adicionar à coleção…' };
    $('#c-text').placeholder = ph[ctx.log];
    let h = '';
    if (ctx.log === 'monthly') {
      const n = B.daysInMonth(view.month);
      h += `<select class="chip" data-change="mday" aria-label="Dia"><option value="">Lista de tarefas</option>${range(1, n).map(d => `<option value="${d}" ${String(d) === String(comp.mDay) ? 'selected' : ''}>Dia ${d} ${B.WD_SHORT[B.weekday(view.month + '-' + B.pad(d))]}</option>`).join('')}</select>`;
    }
    if (ctx.log === 'future') {
      const st = futureStart();
      h += `<select class="chip" data-change="fmonth" aria-label="Mês">${range(0, 11).map(i => { const m = B.addMonths(st, i); return `<option value="${m}" ${m === ctx.month ? 'selected' : ''}>${B.monthLabel(m)}</option>`; }).join('')}</select>`;
      h += `<select class="chip" data-change="fday" aria-label="Dia"><option value="">Sem dia</option>${range(1, B.daysInMonth(ctx.month)).map(d => `<option ${String(d) === String(comp.fDay) ? 'selected' : ''}>${d}</option>`).join('')}</select>`;
    }
    for (const k of Object.keys(B.SIGNIFIERS)) {
      h += `<button type="button" class="chip mono ${comp.signifier === k ? 'on' : ''}" data-act="comp-sig" data-k="${k}" title="${B.SIGNIFIERS[k].label}">${B.SIGNIFIERS[k].sym}</button>`;
    }
    for (const c of S.colors) {
      h += `<button type="button" class="chip ${comp.color === c.id ? 'on' : ''}" data-act="comp-color" data-k="${c.id}"><i class="sw" style="background:${c.color}"></i>${esc(c.name)}</button>`;
    }
    $('#composer-opts').innerHTML = h;
  }

  function submitComposer(ev) {
    ev.preventDefault();
    const input = $('#c-text');
    const text = input.value.trim();
    const ctx = composerContext();
    if (!text || !ctx) return;
    const q = B.parseQuick(text, { type: comp.type, signifier: comp.signifier });
    if (!q.text) return;
    B.addEntry(S, Object.assign({}, ctx, { type: q.type, text: q.text, signifier: q.signifier, color: comp.color }));
    input.value = '';
    comp.signifier = '';
    save(); renderView(); renderComposer();
    input.focus();
  }

  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const futureStart = () => S.settings.futureStart || B.currentMonth();

  // ---------------- componentes ----------------
  function entryRow(e, o) {
    o = o || {};
    const sig = e.signifier ? B.SIGNIFIERS[e.signifier].sym : '';
    const col = e.color ? colorOf(e.color) : null;
    let meta = '';
    if (o.where) meta = B.whereLabel(S, e);
    else if (e.migratedFrom && e.status === 'open') { const f = B.getEntry(S, e.migratedFrom); if (f) meta = 'migrada de ' + B.whereLabel(S, f); }
    return `<li class="entry ${e.type} ${e.type === 'task' ? e.status : (e.status === 'cancelled' ? 'cancelled' : '')}" data-act="entry" data-id="${e.id}">
      <span class="sig">${sig}</span>${o.day ? `<span class="day">${e.day || ''}</span>` : ''}
      <button class="bullet" data-act="bullet" data-id="${e.id}" aria-label="${B.TYPE_LABEL[e.type]}">${B.bulletFor(e)}</button>
      <span class="txt">${esc(e.text)}${meta ? `<span class="meta">${esc(meta)}</span>` : ''}</span>
      ${col ? `<span class="cdot" style="background:${col}" title="${esc(colorName(e.color))}"></span>` : ''}
    </li>`;
  }
  const entryList = (list, o) => list.length ? `<ul class="entries">${list.map(e => entryRow(e, o)).join('')}</ul>` : '';

  function setHeader(kicker, title, actions, showBack) {
    $('#page-kicker').textContent = kicker || '';
    $('#page-title').textContent = title;
    $('#top-actions').innerHTML = (actions || []).map(a => `<button class="icon-btn ${a.sm ? 'sm' : ''}" data-act="${a.act}" ${a.k ? `data-k="${a.k}"` : ''} aria-label="${esc(a.label)}">${a.icon}</button>`).join('');
    $('#btn-back').hidden = !showBack;
  }

  // ---------------- views ----------------
  const VIEWS = {};

  VIEWS.daily = () => {
    const d = view.date;
    const isToday = d === B.today();
    const kicker = isToday ? 'Daily log · hoje' : 'Daily log';
    const dt = B.parseDate(d);
    setHeader(kicker, `${B.WD_LONG[dt.getDay()]}, ${dt.getDate()} ${B.MONTHS[dt.getMonth()].slice(0, 3).toLowerCase()}`, [
      { act: 'day-prev', icon: '‹', label: 'Dia anterior' },
      ...(isToday ? [] : [{ act: 'day-today', icon: 'HOJE', label: 'Hoje', sm: true }]),
      { act: 'day-pick', icon: '▦', label: 'Escolher data' },
      { act: 'day-next', icon: '›', label: 'Próximo dia' }
    ], stack.length > 0);
    let h = '';
    const pend = B.pendingMigration(S).length;
    if (isToday && pend) h += `<div class="banner"><span class="bt"><b>${pend}</b> tarefa(s) aberta(s) em páginas passadas. Migre, conclua ou cancele.</span><button class="btn" data-act="open" data-k="migration">Revisar</button></div>`;
    const ym = B.monthOf(d), day = dt.getDate();
    const cal = B.monthlyEntries(S, ym).filter(e => e.day === day).concat(B.futureEntries(S, ym).filter(e => e.day === day));
    if (cal.length) h += `<div class="card"><h2>No calendário de hoje</h2>${entryList(cal)}</div>`;
    const list = B.dailyEntries(S, d);
    h += `<div class="card">${list.length ? entryList(list) : `<div class="empty">Página em branco. Anote tarefas (•), eventos (○) e notas (–) abaixo. Dica: comece com "o " para evento, "- " para nota, "* " para prioridade.</div>`}</div>`;
    return h;
  };

  VIEWS.monthly = () => {
    const m = view.month;
    setHeader('Monthly log', B.monthLabel(m), [
      { act: 'month-prev', icon: '‹', label: 'Mês anterior' },
      ...(m === B.currentMonth() ? [] : [{ act: 'month-now', icon: 'HOJE', label: 'Mês atual', sm: true }]),
      { act: 'month-next', icon: '›', label: 'Próximo mês' }
    ], stack.length > 0);
    const ents = B.monthlyEntries(S, m);
    const fut = B.futureEntries(S, m).filter(e => e.status === 'open');
    let h = '';
    if (fut.length) {
      h += `<div class="card"><h2>Do future log <span class="spacer"></span><button class="btn" data-act="pull-future">Trazer para o mês</button></h2>
        <div class="muted">Itens agendados para este mês no future log.</div>${entryList(fut, { day: true })}</div>`;
    }
    const n = B.daysInMonth(m), t = B.today();
    h += `<div class="section-title">Calendário <span class="spacer"></span><span class="muted">toque no dia para anotar</span></div><div class="card"><ul class="cal">`;
    for (let d = 1; d <= n; d++) {
      const iso = m + '-' + B.pad(d), wd = B.weekday(iso);
      const de = ents.filter(e => e.day === d);
      h += `<li class="${wd === 0 || wd === 6 ? 'we' : ''} ${iso === t ? 'today' : ''}"><button class="d" data-act="cal-day" data-k="${d}"><b>${d}</b> ${B.WD_SHORT[wd]}</button><div class="ce">${entryList(de)}</div></li>`;
    }
    h += `</ul></div>`;
    const todo = ents.filter(e => !e.day);
    h += `<div class="section-title">Tarefas do mês (to do list)</div><div class="card">${todo.length ? entryList(todo) : '<div class="empty">Nenhuma tarefa. Escolha "Lista de tarefas" abaixo e anote.</div>'}</div>`;
    const dailyCount = S.entries.filter(e => e.log === 'daily' && e.month === m).length;
    if (dailyCount) h += `<button class="btn block" data-act="open" data-k="month-days">Ver daily logs deste mês (${dailyCount} entradas)</button>`;
    return h;
  };

  VIEWS['month-days'] = () => {
    const m = view.month || B.currentMonth();
    setHeader('Daily logs', B.monthLabel(m), [], true);
    const days = [...new Set(S.entries.filter(e => e.log === 'daily' && e.month === m).map(e => e.date))].sort();
    return days.map(d => `<div class="card"><h2><button class="btn" data-act="goto-day" data-k="${d}">${esc(B.dateLabel(d))}</button></h2>${entryList(B.dailyEntries(S, d))}</div>`).join('') || '<div class="empty">Nenhum daily log neste mês.</div>';
  };

  VIEWS.future = () => {
    const st = futureStart();
    setHeader('Future log', `${B.monthName(st).slice(0, 3)} ${st.slice(0, 4)} – ${B.monthName(B.addMonths(st, 11)).slice(0, 3)} ${B.addMonths(st, 11).slice(0, 4)}`, [
      { act: 'future-prev', icon: '‹', label: 'Recuar um mês' },
      { act: 'future-next', icon: '›', label: 'Avançar um mês' }
    ], stack.length > 0);
    let h = `<div class="fgrid">`;
    for (let i = 0; i < 12; i++) {
      const m = B.addMonths(st, i);
      const list = B.futureEntries(S, m);
      h += `<div class="card fcard"><h2><button data-act="future-month" data-k="${m}">${B.monthLabel(m)}</button><span class="spacer"></span><button class="icon-btn sm" data-act="future-month" data-k="${m}" aria-label="Anotar em ${B.monthLabel(m)}">+</button></h2>
        ${list.length ? entryList(list, { day: true }) : '<div class="empty">—</div>'}</div>`;
    }
    return h + `</div><p class="muted">Rendez-vous, eventos, aniversários e prazos além do mês atual. No início de cada mês, traga os itens para o monthly log.</p>`;
  };

  VIEWS.collections = () => {
    setHeader('Coleções', 'Coleções', [{ act: 'new-collection', icon: '+', label: 'Nova coleção' }], false);
    if (!S.collections.length) return `<div class="card"><div class="empty">Coleções agrupam informações do mesmo tipo: livros a ler, filmes, receitas, lugares a visitar, um braindump (vide-cérebro)…</div><button class="btn primary block" data-act="new-collection">Criar primeira coleção</button></div>`;
    return `<div class="card"><ul class="menu">${S.collections.slice().sort((a, b) => a.created - b.created).map(c => {
      const ents = B.collectionEntries(S, c.id);
      const open = ents.filter(e => e.type === 'task' && e.status === 'open').length;
      return `<li><button data-act="goto-collection" data-k="${c.id}"><span class="mi" style="${c.color ? `background:${colorOf(c.color)};color:#fff` : ''}">❏</span><span class="ml">${esc(c.title)}<small>${ents.length} item(ns)${open ? ` · ${open} aberto(s)` : ''}</small></span><span class="mr">›</span></button></li>`;
    }).join('')}</ul></div>`;
  };

  VIEWS.collection = () => {
    const c = S.collections.find(c => c.id === view.id);
    if (!c) { view = { name: 'collections' }; return VIEWS.collections(); }
    setHeader('Coleção', c.title, [{ act: 'collection-menu', icon: '⋯', label: 'Opções da coleção' }], true);
    const list = B.collectionEntries(S, c.id);
    return `<div class="card" style="${c.color ? `border-left:5px solid ${colorOf(c.color)}` : ''}">${list.length ? entryList(list) : '<div class="empty">Vazia. Adicione itens abaixo.</div>'}</div>`;
  };

  VIEWS.more = () => {
    setHeader('Bullet Journal', S.settings.name || 'Mais', [], false);
    const pend = B.pendingMigration(S).length;
    const items = [
      ['index', '#', 'Índice', 'Todas as páginas numeradas + busca'],
      ['migration', '>', 'Migração', pend ? `${pend} tarefa(s) para revisar` : 'Nada pendente'],
      ['trackers', '▤', 'Trackers', 'Hábitos e acompanhamentos'],
      ['key', '•', 'Chave e código de cores', 'Puces, signifiers e cores'],
      ['export', '⇪', 'Exportar e backup', 'JSON, Markdown, CSV, PDF, compartilhar'],
      ['guide', '?', 'Guia do método', 'Como funciona o Bullet Journal'],
      ['settings', '⚙', 'Ajustes', 'Nome, tema, início do future log']
    ];
    return `<div class="card"><ul class="menu">${items.map(i => `<li><button data-act="open" data-k="${i[0]}"><span class="mi">${i[1]}</span><span class="ml">${i[2]}<small>${i[3]}</small></span><span class="mr">›</span></button></li>`).join('')}</ul></div>
      <p class="muted" style="text-align:center">Funciona 100% offline · os dados ficam somente neste aparelho.<br>Faça backups em “Exportar”.</p>`;
  };

  VIEWS.index = () => {
    setHeader('Página 2', 'Índice', [], true);
    const q = view.q || '';
    let h = `<input class="search" type="search" placeholder="Buscar em todas as entradas…" value="${esc(q)}" data-input="search">`;
    if (q.trim()) {
      const r = B.search(S, q);
      h += `<div class="card"><h2>${r.length} resultado(s)</h2>${r.length ? `<ul class="entries">${r.slice(0, 200).map(e => entryRow(e, { where: true })).join('')}</ul>` : '<div class="empty">Nada encontrado.</div>'}</div>`;
      return h;
    }
    h += `<div class="card"><ul class="idx">${B.buildIndex(S).map(i => `<li><button data-act="goto-page" data-kind="${i.kind}" data-k="${esc(i.ref || '')}"><span class="pg">p.${i.page}</span><span class="it">${esc(i.title)}</span>${i.color ? `<i class="sw" style="background:${colorOf(i.color)}"></i>` : ''}</button></li>`).join('')}</ul></div>`;
    return h;
  };

  VIEWS.migration = () => {
    setHeader('Migração', 'Revisar tarefas', [], true);
    const list = B.pendingMigration(S);
    let h = `<div class="card guide"><p>Tarefas não realizadas não se perdem: decida para onde cada uma vai.</p>
      <p><b>&gt;</b> para frente (amanhã, uma data, uma coleção) · <b>&lt;</b> para trás no caderno (monthly log ou future log) · <b>×</b> já feita · <s>cancelar</s> se perdeu o sentido.</p></div>`;
    if (!list.length) return h + '<div class="card"><div class="empty">Nenhuma tarefa pendente em páginas passadas. 🎉</div></div>';
    h += `<div class="btn-row"><button class="btn primary" data-act="migrate-all-today">Migrar todas para hoje (&gt;)</button></div>`;
    h += list.map(e => `<div class="card"><ul class="entries">${entryRow(e, { where: true })}</ul>
      <div class="chips" style="margin-top:6px">
        <button class="chip mono" data-act="m-quick" data-k="today" data-id="${e.id}">&gt; Hoje</button>
        <button class="chip mono" data-act="m-quick" data-k="monthly" data-id="${e.id}">&lt; Mês</button>
        <button class="chip mono" data-act="m-target" data-k="future" data-id="${e.id}">&lt; Futuro…</button>
        <button class="chip mono" data-act="m-target" data-k="collection" data-id="${e.id}">&gt; Coleção…</button>
        <button class="chip mono" data-act="m-quick" data-k="done" data-id="${e.id}">× Feita</button>
        <button class="chip" data-act="m-quick" data-k="cancel" data-id="${e.id}"><s>Cancelar</s></button>
      </div></div>`).join('');
    return h;
  };

  VIEWS.trackers = () => {
    setHeader('Trackers', 'Trackers', [{ act: 'new-tracker', icon: '+', label: 'Novo tracker' }], true);
    if (!S.trackers.length) return `<div class="card"><div class="empty">Trackers acompanham hábitos (água, leitura, exercício…) ou valores (peso, horas de sono, páginas lidas).</div><button class="btn primary block" data-act="new-tracker">Criar tracker</button></div>`;
    return `<div class="card"><ul class="menu">${S.trackers.slice().sort((a, b) => b.month.localeCompare(a.month) || a.created - b.created).map(t => {
      let sub = B.monthLabel(t.month);
      if (t.kind === 'habit') { const st = B.habitStats(t); sub += ` · ${st.length} hábito(s)`; } else sub += ` · ${Object.keys(t.values).length} registro(s)`;
      return `<li><button data-act="goto-tracker" data-k="${t.id}"><span class="mi">${t.kind === 'habit' ? '▦' : '∿'}</span><span class="ml">${esc(t.title)}<small>${sub}</small></span><span class="mr">›</span></button></li>`;
    }).join('')}</ul></div>`;
  };

  VIEWS.tracker = () => {
    const t = S.trackers.find(t => t.id === view.id);
    if (!t) { view = { name: 'trackers' }; return VIEWS.trackers(); }
    setHeader(`Tracker · ${B.monthLabel(t.month)}`, t.title, [{ act: 'tracker-menu', icon: '⋯', label: 'Opções' }], true);
    const n = B.daysInMonth(t.month);
    const td = B.monthOf(B.today()) === t.month ? Number(B.today().slice(8)) : 0;
    if (t.kind === 'habit') {
      let h = `<div class="card"><div class="tgrid-wrap"><table class="tgrid"><thead><tr><th class="hn">Hábito</th>${range(1, n).map(d => `<th>${d}<br>${B.WD_SHORT[B.weekday(t.month + '-' + B.pad(d))]}</th>`).join('')}</tr></thead><tbody>`;
      t.habits.forEach(hb => {
        const m = t.marks[hb.id] || {};
        h += `<tr><th class="hn">${esc(hb.name)}</th>${range(1, n).map(d => `<td><button class="${m[d] ? 'on' : ''} ${d === td ? 'td' : ''}" data-act="mark" data-k="${hb.id}" data-d="${d}" aria-label="${esc(hb.name)} dia ${d}"></button></td>`).join('')}</tr>`;
      });
      h += `</tbody></table></div>${t.habits.length ? '' : '<div class="empty">Adicione hábitos em ⋯</div>'}</div>`;
      h += `<div class="card"><h2>Resumo do mês</h2>${B.habitStats(t).map(s => `<div style="margin:8px 0"><div style="display:flex"><span style="flex:1">${esc(s.name)}</span><span class="muted">${s.done}/${n} · ${s.pct}%</span></div><div class="bar"><i style="width:${s.pct}%"></i></div></div>`).join('')}</div>`;
      return h;
    }
    const pts = range(1, n).filter(d => t.values[d] !== undefined && t.values[d] !== '').map(d => [d, Number(t.values[d])]);
    let chart = '<div class="empty">Registre valores para ver o gráfico.</div>';
    if (pts.length) {
      const ys = pts.map(p => p[1]); let lo = Math.min(...ys), hi = Math.max(...ys); if (lo === hi) { lo -= 1; hi += 1; }
      const W = 320, H = 140, px = d => 12 + (d - 1) / (n - 1) * (W - 24), py = v => H - 18 - (v - lo) / (hi - lo) * (H - 36);
      chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts.map(p => px(p[0]) + ',' + py(p[1])).join(' ')}"/>
        ${pts.map(p => `<circle cx="${px(p[0])}" cy="${py(p[1])}" r="3" fill="var(--accent)"/>`).join('')}
        <text x="4" y="12" font-size="10" fill="var(--ink-3)">${hi} ${esc(t.unit)}</text><text x="4" y="${H - 4}" font-size="10" fill="var(--ink-3)">${lo} ${esc(t.unit)}</text></svg>`;
    }
    return `<div class="card"><h2>Evolução</h2>${chart}</div><div class="card"><h2>Valores por dia ${t.unit ? `<span class="muted">(${esc(t.unit)})</span>` : ''}</h2><div class="vals">${range(1, n).map(d =>
      `<label>${B.pad(d)}<input inputmode="decimal" data-input="val" data-d="${d}" value="${t.values[d] !== undefined ? esc(t.values[d]) : ''}"></label>`).join('')}</div></div>`;
  };

  VIEWS.key = () => {
    setHeader('Página 1', 'Chave e cores', [], true);
    const k = [['•', 'Tarefa'], ['×', 'Tarefa concluída'], ['>', 'Tarefa migrada para frente (outro dia ou coleção)'], ['<', 'Tarefa agendada para trás (monthly log ou future log)'], ['<s>•</s>', 'Tarefa cancelada / irrelevante'], ['○', 'Evento / compromisso'], ['–', 'Nota']];
    let h = `<div class="card"><h2>Puces (bullets)</h2><ul class="key">${k.map(x => `<li><span class="ks">${x[0]}</span><span>${x[1]}</span></li>`).join('')}</ul></div>`;
    h += `<div class="card"><h2>Signifiers</h2><ul class="key">${Object.values(B.SIGNIFIERS).map(s => `<li><span class="ks sig">${s.sym}</span><span>${s.label}</span></li>`).join('')}</ul><p class="muted">Aparecem na margem, à esquerda da puce.</p></div>`;
    h += `<div class="card"><h2>Código de cores <span class="spacer"></span><button class="icon-btn sm" data-act="color-edit" aria-label="Nova cor">+</button></h2>
      ${S.colors.map(c => `<div class="colorrow"><span class="sw" style="background:${c.color}"></span><span class="nm">${esc(c.name)}</span><button class="btn" data-act="color-edit" data-k="${c.id}">Editar</button></div>`).join('') || '<div class="empty">Sem cores.</div>'}
      <p class="muted">Use cores para separar projetos, pessoas ou áreas da vida. Elas aparecem nas entradas, coleções e no índice.</p></div>`;
    h += `<div class="card"><h2>Atalhos de digitação</h2><ul class="key"><li><span class="ks">o␣</span>evento</li><li><span class="ks">-␣</span>nota</li><li><span class="ks">.␣</span>tarefa</li><li><span class="ks sig">*␣</span>prioridade</li><li><span class="ks sig">!␣</span>inspiração</li><li><span class="ks sig">?␣</span>explorar</li></ul></div>`;
    return h;
  };

  VIEWS.export = () => {
    setHeader('Seus dados', 'Exportar e backup', [], true);
    const ex = view.ex || (view.ex = { scope: 'all', from: B.currentMonth() + '-01', to: B.today() });
    const total = S.entries.length;
    return `<div class="card"><h2>O que exportar</h2>
      <div class="chips"><button class="chip ${ex.scope === 'all' ? 'on' : ''}" data-act="ex-scope" data-k="all">Tudo</button>
      <button class="chip ${ex.scope === 'month' ? 'on' : ''}" data-act="ex-scope" data-k="month">Mês atual</button>
      <button class="chip ${ex.scope === 'range' ? 'on' : ''}" data-act="ex-scope" data-k="range">Período…</button></div>
      ${ex.scope === 'range' ? `<div style="display:flex;gap:8px"><label class="field" style="flex:1"><span>De</span><input type="date" data-input="ex-from" value="${ex.from}"></label><label class="field" style="flex:1"><span>Até</span><input type="date" data-input="ex-to" value="${ex.to}"></label></div>` : ''}
      <p class="muted">${total} entrada(s), ${S.collections.length} coleção(ões), ${S.trackers.length} tracker(s) salvos.</p></div>
      <div class="card"><h2>Formatos</h2>
        <button class="btn block" data-act="export" data-k="md">Markdown (.md) — leitura e notas</button>
        <button class="btn block" data-act="export" data-k="txt">Texto (.txt)</button>
        <button class="btn block" data-act="export" data-k="csv">Planilha (.csv) — Excel / Sheets</button>
        <button class="btn block" data-act="export" data-k="pdf">PDF / Imprimir</button>
        <button class="btn block" data-act="export" data-k="share">Compartilhar como texto</button></div>
      <div class="card"><h2>Backup completo</h2><p class="muted">O backup JSON guarda tudo (entradas, coleções, trackers, cores e ajustes) e pode ser restaurado neste ou em outro aparelho.</p>
        <button class="btn primary block" data-act="export" data-k="json">Salvar backup (.json)</button>
        <button class="btn block" data-act="import">Restaurar backup…</button></div>
      <div class="card"><h2>Zona de perigo</h2><button class="btn danger block" data-act="wipe">Apagar todos os dados</button></div>`;
  };

  VIEWS.guide = () => {
    setHeader('Método', 'Guia do Bullet Journal', [], true);
    const sec = (n, t, body) => `<div class="card guide"><div class="num">${n}</div><h2>${t}</h2>${body}</div>`;
    return sec('00', 'A ideia', `<p>O Bullet Journal é um sistema analógico de organização criado por Ryder Carroll: um caderno que reúne agenda, lista de tarefas e diário. Ele se baseia em <b>registro rápido</b> (frases curtas com símbolos), <b>módulos</b> (páginas com funções definidas) e <b>migração</b> (revisar o que ficou pendente). Este app reproduz o mesmo fluxo, sem precisar de internet.</p>`) +
      sec('01', 'A chave', `<p>A primeira página: as <b>puces</b> (• tarefa, ○ evento, – nota), os <b>signifiers</b> (* prioridade, ! inspiração) e um <b>código de cores</b> opcional para projetos, pessoas ou áreas. Veja em Mais → Chave.</p>`) +
      sec('02', 'O índice', `<p>Lista todas as páginas com seu número, para encontrar tudo rapidamente. No app ele é montado sozinho, na ordem em que você cria as páginas, e inclui uma busca.</p>`) +
      sec('03', 'Future log', `<p>A visão de longo prazo: 12 meses a partir do mês que vem (ou do atual). Anote compromissos, aniversários, férias e prazos que caem depois do mês corrente. Comece a qualquer momento do ano, sem esperar 1º de janeiro.</p>`) +
      sec('04', 'Monthly log', `<p>Duas partes: o <b>calendário</b> (dias do mês com eventos) e a <b>lista de tarefas</b> do mês. Crie no fim de cada mês para o seguinte e traga para ele o que estava no future log.</p>`) +
      sec('05', 'Daily log', `<p>Escreva o dia no topo e anote ao longo do dia: tarefas, compromissos, ideias, notas. Pode ser preparado na véspera ou de manhã. O app abre sempre na página de hoje.</p>`) +
      sec('06', 'Coleções', `<p>Páginas temáticas: livros a ler, filmes, séries, receitas, lugares para visitar, um <b>braindump</b> sobre um projeto novo. Crie conforme a necessidade; elas entram no índice com a cor escolhida.</p>`) +
      sec('07', 'Trackers', `<p>Páginas de acompanhamento: hábitos (grade de dias), progresso de projetos, peso, sono… Crie quando precisar; no primeiro caderno, não complique.</p>`) +
      sec('08', 'Migração', `<p>Se uma tarefa não foi feita, ela é <b>reportada</b>: <b>&gt;</b> para frente (amanhã, outro dia ou uma coleção) ou <b>&lt;</b> para trás no caderno (monthly log, ou future log se não couber no mês). Assim nenhuma tarefa se perde. Se ela perdeu o sentido, cancele. Toque numa tarefa para migrar, ou use Mais → Migração para revisar tudo de uma vez.</p>`) +
      sec('09', 'Dicas', `<ul><li>Comece simples: caneta e caderno bastam — aqui, o app basta.</li><li>Toque na puce para concluir uma tarefa (•→×).</li><li>Toque na entrada para editar, migrar, marcar prioridade ou cor.</li><li>Faça um backup JSON de tempos em tempos (Mais → Exportar).</li></ul>`);
  };

  VIEWS.settings = () => {
    setHeader('Ajustes', 'Ajustes', [], true);
    const st = S.settings;
    return `<div class="card"><label class="field"><span>Nome do caderno / seu nome</span><input data-input="set-name" value="${esc(st.name)}" placeholder="Ex.: Meu journal 2026"></label>
      <label class="field"><span>Tema</span><select data-change="set-theme">${[['auto', 'Automático (sistema)'], ['light', 'Claro'], ['dark', 'Escuro']].map(o => `<option value="${o[0]}" ${st.theme === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
      <label class="field"><span>Future log começa em</span><input type="month" data-change="set-future" value="${futureStart()}"></label></div>
      <p class="muted" style="text-align:center">Bullet Journal Offline v1.0 · sem anúncios, sem conta, sem internet.</p>`;
  };

  // ---------------- render ----------------
  function renderView() {
    const fn = VIEWS[view.name] || VIEWS.daily;
    $('#view').innerHTML = fn();
    const tabName = TAB_OF[view.name] || 'more';
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tabName));
    const pend = B.pendingMigration(S).length;
    $('#badge').hidden = !pend; $('#badge').textContent = pend > 99 ? '99+' : pend;
  }
  function render() { renderView(); renderComposer(); }

  // ---------------- sheet ----------------
  function openSheet(html) {
    $('#sheet').innerHTML = `<div class="grip"></div>${html}`;
    $('#sheet-wrap').hidden = false;
    const f = $('#sheet [autofocus]'); if (f) setTimeout(() => f.focus(), 60);
  }
  function closeSheet() { $('#sheet-wrap').hidden = true; $('#sheet').innerHTML = ''; sheetCtx = {}; }
  let sheetCtx = {};

  function entrySheet(id) {
    const e = B.getEntry(S, id); if (!e) return;
    sheetCtx = { id };
    const isTask = e.type === 'task';
    const a = [];
    if (isTask) a.push(['toggle', e.status === 'done' ? '•' : '×', e.status === 'done' ? 'Reabrir' : 'Concluir']);
    if (isTask || e.type === 'event') {
      a.push(['mig-tomorrow', '>', 'Para amanhã']);
      a.push(['mig-date', '>', 'Para uma data…']);
      a.push(['mig-monthly', '<', 'Monthly log…']);
      a.push(['mig-future', '<', 'Future log…']);
    }
    a.push(['mig-collection', '>', 'Para coleção…']);
    a.push(['edit', '✎', 'Editar texto']);
    for (const k of Object.keys(B.SIGNIFIERS)) a.push(['sig:' + k, B.SIGNIFIERS[k].sym, (e.signifier === k ? 'Remover ' : '') + B.SIGNIFIERS[k].label]);
    a.push(['color', '●', 'Cor']);
    a.push(['type', TYPE_SYM[TYPE_NEXT[e.type]], 'Virar ' + B.TYPE_LABEL[TYPE_NEXT[e.type]].toLowerCase()]);
    a.push(['cancel', '—', e.status === 'cancelled' ? 'Restaurar' : 'Cancelar (irrelevante)']);
    if (e.migratedTo && B.getEntry(S, e.migratedTo)) a.push(['goto-to', '→', 'Ir para o destino']);
    if (e.migratedFrom && B.getEntry(S, e.migratedFrom)) a.push(['goto-from', '←', 'Ver origem']);
    a.push(['delete', '⌫', 'Excluir']);
    openSheet(`<h3>${B.bulletFor(e)} ${esc(e.text)}</h3><div class="sub">${B.TYPE_LABEL[e.type]} · ${esc(B.whereLabel(S, e))}${isTask ? ' · ' + B.STATUS_LABEL[e.status] : ''}</div>
      <div class="acts">${a.map(x => `<button class="btn ${x[0] === 'delete' ? 'danger' : ''}" data-act="ea" data-k="${x[0]}"><span class="sy">${x[1]}</span>${x[2]}</button>`).join('')}</div>`);
  }

  function monthOptions(from, count, sel) {
    return range(0, count - 1).map(i => { const m = B.addMonths(from, i); return `<option value="${m}" ${m === sel ? 'selected' : ''}>${B.monthLabel(m)}</option>`; }).join('');
  }

  function migrateSheet(id, kind) {
    const e = B.getEntry(S, id); if (!e) return;
    sheetCtx = { id, kind };
    const cm = B.currentMonth();
    let body = '';
    if (kind === 'date') body = `<label class="field"><span>Data</span><input type="date" id="mt-date" value="${B.addDays(B.today(), 1)}"></label>`;
    if (kind === 'monthly' || kind === 'future') {
      let def = kind === 'monthly' ? (e.log === 'monthly' || e.log === 'future' ? B.addMonths(e.month || cm, e.log === 'future' ? 0 : 1) : cm) : B.addMonths(cm, 1);
      body = `<label class="field"><span>Mês</span><select id="mt-month">${monthOptions(kind === 'monthly' ? B.addMonths(cm, -1) : cm, kind === 'monthly' ? 14 : 24, def)}</select></label>
        <label class="field"><span>Dia (opcional${kind === 'monthly' ? ' — vazio = lista de tarefas' : ''})</span><input type="number" id="mt-day" min="1" max="31" inputmode="numeric" value="${e.day || ''}"></label>`;
    }
    if (kind === 'collection') {
      body = S.collections.length ? `<div class="chips">${S.collections.map(c => `<button class="chip" data-act="mt-col" data-k="${c.id}">${c.color ? `<i class="sw" style="background:${colorOf(c.color)}"></i>` : ''}${esc(c.title)}</button>`).join('')}</div>` : '<div class="empty">Nenhuma coleção ainda.</div>';
      body += `<label class="field"><span>…ou criar nova coleção</span><input id="mt-newcol" placeholder="Ex.: Livros a ler"></label>`;
    }
    const title = { date: 'Migrar para uma data (>)', monthly: 'Agendar no monthly log (<)', future: 'Agendar no future log (<)', collection: 'Migrar para coleção (>)' }[kind];
    openSheet(`<h3>${title}</h3><div class="sub">${esc(e.text)}</div>${body}<div class="btn-row" style="margin-top:12px"><button class="btn" data-act="close">Voltar</button><button class="btn primary" data-act="mt-ok">Migrar</button></div>`);
  }

  function doMigrate(id, target) {
    const copy = B.migrate(S, id, target);
    if (copy) { save(); toast(`Migrada → ${B.whereLabel(S, copy)}`); }
    closeSheet(); renderView();
  }

  function textSheet(title, value, onOk, opts) {
    opts = opts || {};
    sheetCtx = { onOk };
    openSheet(`<h3>${esc(title)}</h3><label class="field">${opts.multi ? `<textarea id="ts-in" autofocus>${esc(value)}</textarea>` : `<input id="ts-in" autofocus value="${esc(value)}" placeholder="${esc(opts.ph || '')}">`}</label>
      ${opts.extra || ''}<div class="btn-row"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="ts-ok">${opts.okLabel || 'Salvar'}</button></div>`);
  }

  function confirmSheet(title, msg, okLabel, onOk) {
    sheetCtx = { onOk };
    openSheet(`<h3>${esc(title)}</h3><p class="muted">${msg}</p><div class="btn-row"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="cf-ok">${okLabel}</button></div>`);
  }

  function colorPickSheet(current, onPick) {
    sheetCtx = { onPick };
    openSheet(`<h3>Cor</h3><div class="chips"><button class="chip ${!current ? 'on' : ''}" data-act="pick-color" data-k="">Sem cor</button>${S.colors.map(c => `<button class="chip ${current === c.id ? 'on' : ''}" data-act="pick-color" data-k="${c.id}"><i class="sw" style="background:${c.color}"></i>${esc(c.name)}</button>`).join('')}</div>
      <p class="muted">Edite as cores em Mais → Chave e código de cores.</p>`);
  }

  const SUGGEST = ['Livros a ler', 'Filmes', 'Séries', 'Quadrinhos', 'Receitas para testar', 'Lugares para visitar', 'Braindump', 'Lista de compras', 'Metas do ano', 'Presentes'];
  function newCollectionSheet(after) {
    textSheet('Nova coleção', '', v => { const c = B.addCollection(S, v, sheetCtx.color || null); save(); closeSheet(); if (after) after(c); else go({ name: 'collection', id: c.id }, true); },
      { ph: 'Nome da coleção', okLabel: 'Criar', extra: `<div class="chips">${SUGGEST.map(s => `<button class="chip" data-act="suggest" data-k="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <div class="section-title" style="margin-top:12px">Cor (gommette)</div><div class="chips">${S.colors.map(c => `<button class="chip" data-act="nc-color" data-k="${c.id}"><i class="sw" style="background:${c.color}"></i>${esc(c.name)}</button>`).join('')}</div><div style="height:10px"></div>` });
  }

  function trackerSheet() {
    sheetCtx = {};
    openSheet(`<h3>Novo tracker</h3>
      <label class="field"><span>Tipo</span><select id="tr-kind"><option value="habit">Hábitos (grade de dias)</option><option value="value">Valor numérico (peso, sono…)</option></select></label>
      <label class="field"><span>Título</span><input id="tr-title" placeholder="Ex.: Hábitos" autofocus></label>
      <label class="field"><span>Mês</span><input type="month" id="tr-month" value="${B.currentMonth()}"></label>
      <label class="field" id="tr-h"><span>Hábitos (um por linha)</span><textarea id="tr-habits" placeholder="Beber 2L de água&#10;Ler 20 min&#10;Exercício"></textarea></label>
      <label class="field"><span>Unidade (só para valor)</span><input id="tr-unit" placeholder="kg, h, páginas…"></label>
      <div class="btn-row"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="tr-ok">Criar</button></div>`);
  }

  // ---------------- exportação ----------------
  function exportRange() {
    const ex = view.ex || { scope: 'all' };
    if (ex.scope === 'all') return { scope: 'all' };
    if (ex.scope === 'month') { const m = B.currentMonth(); return { scope: 'range', from: m + '-01', to: m + '-' + B.pad(B.daysInMonth(m)), includeCollections: false }; }
    return { scope: 'range', from: ex.from || '0000-01-01', to: ex.to || '9999-12-31', includeCollections: false };
  }

  function saveFile(name, mime, content) {
    if (NATIVE) { window.Native.exportFile(name, mime, content); return; }
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Arquivo gerado');
  }

  function doExport(kind) {
    const r = exportRange();
    const stamp = B.today();
    switch (kind) {
      case 'json': saveFile(`bullet-journal-backup-${stamp}.json`, 'application/json', B.toJSON(S)); break;
      case 'md': saveFile(`bullet-journal-${stamp}.md`, 'text/markdown', B.toMarkdown(S, r)); break;
      case 'txt': saveFile(`bullet-journal-${stamp}.txt`, 'text/plain', B.toMarkdown(S, r).replace(/^#+ /gm, '').replace(/\*\*/g, '')); break;
      case 'csv': saveFile(`bullet-journal-${stamp}.csv`, 'text/csv', B.toCSV(S, r)); break;
      case 'pdf': {
        const html = B.toPrintableHTML(S, r);
        if (NATIVE) window.Native.printHtml('Bullet Journal ' + stamp, html);
        else { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); } else saveFile(`bullet-journal-${stamp}.html`, 'text/html', html); }
        break;
      }
      case 'share': {
        const txt = B.toMarkdown(S, r);
        if (NATIVE) window.Native.share('Bullet Journal', txt);
        else if (navigator.share) navigator.share({ title: 'Bullet Journal', text: txt }).catch(() => {});
        else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Copiado para a área de transferência'));
        break;
      }
    }
  }

  function startImport() {
    if (NATIVE) { window.Native.importFile(); return; }
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => window.bujoImported(rd.result); rd.readAsText(f); };
    inp.click();
  }

  window.bujoImported = function (text) {
    let test;
    try { test = B.importJSON(B.defaultState(), text, 'replace'); } catch (e) { toast('Arquivo inválido: ' + e.message); return; }
    sheetCtx = { text };
    openSheet(`<h3>Restaurar backup</h3><p class="muted">O arquivo contém ${test.entries.length} entrada(s), ${test.collections.length} coleção(ões) e ${test.trackers.length} tracker(s).</p>
      <button class="btn primary block" data-act="imp" data-k="merge">Mesclar com os dados atuais</button>
      <button class="btn danger block" data-act="imp" data-k="replace">Substituir tudo pelo backup</button>
      <button class="btn block" data-act="close">Cancelar</button>`);
  };

  // ---------------- eventos ----------------
  function onAction(el, ev) {
    const act = el.dataset.act, k = el.dataset.k, id = el.dataset.id;
    switch (act) {
      case 'entry': entrySheet(id); break;
      case 'bullet': {
        const e = B.getEntry(S, id);
        if (e && e.type === 'task' && (e.status === 'open' || e.status === 'done')) { B.toggleDone(S, id); save(); renderView(); }
        else entrySheet(id);
        break;
      }
      case 'open': {
        const v = { name: k };
        if (k === 'month-days') v.month = view.month;
        go(v, true); break;
      }
      case 'close': closeSheet(); break;
      // dia
      case 'day-prev': view.date = B.addDays(view.date, -1); render(); break;
      case 'day-next': view.date = B.addDays(view.date, 1); render(); break;
      case 'day-today': view.date = B.today(); render(); break;
      case 'day-pick':
        sheetCtx = {};
        openSheet(`<h3>Ir para o dia</h3><label class="field"><input type="date" id="dp" value="${view.date}"></label><div class="btn-row"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="dp-ok">Abrir</button></div>`);
        break;
      case 'dp-ok': { const v = $('#dp').value; if (v) { closeSheet(); view.date = v; render(); } break; }
      case 'goto-day': go({ name: 'daily', date: k }, true); break;
      // mês
      case 'month-prev': view.month = B.addMonths(view.month, -1); comp.mDay = ''; render(); break;
      case 'month-next': view.month = B.addMonths(view.month, 1); comp.mDay = ''; render(); break;
      case 'month-now': view.month = B.currentMonth(); comp.mDay = ''; render(); break;
      case 'cal-day': comp.mDay = k; renderComposer(); $('#c-text').focus(); break;
      case 'pull-future': {
        const list = B.futureEntries(S, view.month).filter(e => e.status === 'open');
        list.forEach(e => B.migrate(S, e.id, { to: 'monthly', month: view.month, day: e.day }));
        save(); toast(`${list.length} item(ns) trazido(s) para o mês`); renderView(); break;
      }
      // futuro
      case 'future-prev': S.settings.futureStart = B.addMonths(futureStart(), -1); save(); render(); break;
      case 'future-next': S.settings.futureStart = B.addMonths(futureStart(), 1); save(); render(); break;
      case 'future-month': comp.fMonth = k; comp.fDay = ''; renderComposer(); $('#c-text').focus(); break;
      // compositor
      case 'comp-sig': comp.signifier = comp.signifier === k ? '' : k; renderComposer(); break;
      case 'comp-color': comp.color = comp.color === k ? null : k; renderComposer(); break;
      // coleções
      case 'new-collection': newCollectionSheet(); break;
      case 'suggest': $('#ts-in').value = k; break;
      case 'nc-color': sheetCtx.color = sheetCtx.color === k ? null : k; document.querySelectorAll('[data-act="nc-color"]').forEach(b => b.classList.toggle('on', b.dataset.k === sheetCtx.color)); break;
      case 'goto-collection': go({ name: 'collection', id: k }, true); break;
      case 'collection-menu': {
        const c = S.collections.find(c => c.id === view.id);
        sheetCtx = { cid: c.id };
        openSheet(`<h3>${esc(c.title)}</h3><div class="acts"><button class="btn" data-act="col-rename"><span class="sy">✎</span>Renomear</button><button class="btn" data-act="col-color"><span class="sy">●</span>Cor</button>
          <button class="btn" data-act="col-share"><span class="sy">⇪</span>Compartilhar</button><button class="btn danger" data-act="col-delete"><span class="sy">⌫</span>Excluir coleção</button></div>`);
        break;
      }
      case 'col-rename': { const c = S.collections.find(c => c.id === sheetCtx.cid); textSheet('Renomear coleção', c.title, v => { c.title = v; save(); closeSheet(); render(); }); break; }
      case 'col-color': { const c = S.collections.find(c => c.id === sheetCtx.cid); colorPickSheet(c.color, v => { c.color = v || null; save(); closeSheet(); render(); }); break; }
      case 'col-share': {
        const c = S.collections.find(c => c.id === sheetCtx.cid);
        const txt = `${c.title}\n\n` + B.collectionEntries(S, c.id).map(e => `${B.bulletFor(e)} ${e.text}`).join('\n');
        closeSheet();
        if (NATIVE) window.Native.share(c.title, txt); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Copiado'));
        break;
      }
      case 'col-delete': { const cid = sheetCtx.cid; confirmSheet('Excluir coleção?', 'A coleção e todos os seus itens serão apagados.', 'Excluir', () => { B.removeCollection(S, cid); save(); closeSheet(); back(); }); break; }
      // índice
      case 'goto-page': {
        const kind = el.dataset.kind;
        const map = { key: { name: 'key' }, index: { name: 'index' }, future: { name: 'future' }, daily: { name: 'daily', date: k }, monthly: { name: 'monthly', month: k }, collection: { name: 'collection', id: k }, tracker: { name: 'tracker', id: k } };
        if (kind === 'index') break;
        go(map[kind], true); break;
      }
      // migração
      case 'm-quick': {
        const e = B.getEntry(S, id);
        if (k === 'today') B.migrate(S, id, { to: 'daily', date: B.today() });
        if (k === 'monthly') B.migrate(S, id, { to: 'monthly', month: e.log === 'monthly' ? B.addMonths(e.month, 1) : (e.log === 'future' ? e.month : B.currentMonth()), day: e.log === 'future' ? e.day : null });
        if (k === 'done') B.toggleDone(S, id);
        if (k === 'cancel') B.updateEntry(S, id, { status: 'cancelled' });
        save(); renderView(); break;
      }
      case 'm-target': migrateSheet(id, k); break;
      case 'migrate-all-today': {
        const list = B.pendingMigration(S);
        confirmSheet('Migrar todas para hoje?', `${list.length} tarefa(s) serão marcadas com &gt; e copiadas para o daily log de hoje.`, 'Migrar', () => {
          list.forEach(e => B.migrate(S, e.id, { to: 'daily', date: B.today() })); save(); closeSheet(); renderView(); toast('Tarefas migradas');
        });
        break;
      }
      case 'mt-col': doMigrate(sheetCtx.id, { to: 'collection', collectionId: k }); break;
      case 'mt-ok': {
        const kind = sheetCtx.kind, eid = sheetCtx.id;
        if (kind === 'date') { const d = $('#mt-date').value; if (d) doMigrate(eid, { to: 'daily', date: d }); }
        else if (kind === 'monthly' || kind === 'future') {
          const m = $('#mt-month').value; let d = Number($('#mt-day').value) || null;
          if (d) d = Math.min(Math.max(1, d), B.daysInMonth(m));
          doMigrate(eid, { to: kind, month: m, day: d });
        } else if (kind === 'collection') {
          const nm = $('#mt-newcol').value.trim();
          if (nm) { const c = B.addCollection(S, nm); doMigrate(eid, { to: 'collection', collectionId: c.id }); } else toast('Escolha ou crie uma coleção');
        }
        break;
      }
      // ações da entrada
      case 'ea': {
        const eid = sheetCtx.id, e = B.getEntry(S, eid);
        if (!e) { closeSheet(); break; }
        if (k === 'toggle') { B.toggleDone(S, eid); save(); closeSheet(); renderView(); }
        else if (k === 'mig-tomorrow') doMigrate(eid, { to: 'tomorrow' });
        else if (k === 'mig-date') migrateSheet(eid, 'date');
        else if (k === 'mig-monthly') migrateSheet(eid, 'monthly');
        else if (k === 'mig-future') migrateSheet(eid, 'future');
        else if (k === 'mig-collection') migrateSheet(eid, 'collection');
        else if (k === 'edit') textSheet('Editar', e.text, v => { B.updateEntry(S, eid, { text: v }); save(); closeSheet(); renderView(); }, { multi: true });
        else if (k.startsWith('sig:')) { const s = k.slice(4); B.updateEntry(S, eid, { signifier: e.signifier === s ? '' : s }); save(); closeSheet(); renderView(); }
        else if (k === 'color') colorPickSheet(e.color, v => { B.updateEntry(S, eid, { color: v || null }); save(); closeSheet(); renderView(); });
        else if (k === 'type') { const nt = TYPE_NEXT[e.type]; B.updateEntry(S, eid, { type: nt, status: nt === 'task' ? 'open' : (e.status === 'cancelled' ? 'cancelled' : 'open') }); save(); closeSheet(); renderView(); }
        else if (k === 'cancel') { B.updateEntry(S, eid, { status: e.status === 'cancelled' ? 'open' : 'cancelled' }); save(); closeSheet(); renderView(); }
        else if (k === 'goto-to' || k === 'goto-from') { const t = B.getEntry(S, k === 'goto-to' ? e.migratedTo : e.migratedFrom); closeSheet(); gotoEntry(t); }
        else if (k === 'delete') confirmSheet('Excluir entrada?', esc(e.text), 'Excluir', () => { B.removeEntry(S, eid); save(); closeSheet(); renderView(); });
        break;
      }
      case 'ts-ok': { const v = $('#ts-in').value.trim(); if (v) sheetCtx.onOk(v); break; }
      case 'cf-ok': sheetCtx.onOk(); break;
      case 'pick-color': sheetCtx.onPick(k); break;
      // cores
      case 'color-edit': {
        const c = k ? S.colors.find(c => c.id === k) : null;
        sheetCtx = { cid: k || null };
        openSheet(`<h3>${c ? 'Editar cor' : 'Nova cor'}</h3><label class="field"><span>Nome</span><input id="ce-name" value="${c ? esc(c.name) : ''}" placeholder="Ex.: Projeto X" autofocus></label>
          <label class="field"><span>Cor</span><input type="color" id="ce-color" value="${c ? c.color : '#7A5FA8'}"></label>
          <div class="btn-row">${c ? '<button class="btn danger" data-act="ce-del">Excluir</button>' : ''}<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="ce-ok">Salvar</button></div>`);
        break;
      }
      case 'ce-ok': {
        const name = $('#ce-name').value.trim(), color = $('#ce-color').value;
        if (!name) { toast('Dê um nome à cor'); break; }
        if (sheetCtx.cid) Object.assign(S.colors.find(c => c.id === sheetCtx.cid), { name, color });
        else S.colors.push({ id: 'c-' + B.uid(), name, color });
        save(); closeSheet(); render(); break;
      }
      case 'ce-del': {
        const cid = sheetCtx.cid;
        S.colors = S.colors.filter(c => c.id !== cid);
        S.entries.forEach(e => { if (e.color === cid) e.color = null; });
        S.collections.forEach(c => { if (c.color === cid) c.color = null; });
        if (comp.color === cid) comp.color = null;
        save(); closeSheet(); render(); break;
      }
      // trackers
      case 'new-tracker': trackerSheet(); break;
      case 'tr-ok': {
        const title = $('#tr-title').value.trim(); if (!title) { toast('Dê um título'); break; }
        const t = B.addTracker(S, { title, kind: $('#tr-kind').value, month: $('#tr-month').value || B.currentMonth(), habits: $('#tr-habits').value.split('\n'), unit: $('#tr-unit').value.trim() });
        save(); closeSheet(); go({ name: 'tracker', id: t.id }, true); break;
      }
      case 'goto-tracker': go({ name: 'tracker', id: k }, true); break;
      case 'mark': {
        const t = S.trackers.find(t => t.id === view.id);
        B.toggleMark(t, k, Number(el.dataset.d)); save();
        const wrap = $('.tgrid-wrap'), sl = wrap ? wrap.scrollLeft : 0, st = $('#view').scrollTop;
        renderView();
        if ($('.tgrid-wrap')) $('.tgrid-wrap').scrollLeft = sl;
        $('#view').scrollTop = st;
        break;
      }
      case 'tracker-menu': {
        const t = S.trackers.find(t => t.id === view.id);
        sheetCtx = { tid: t.id };
        openSheet(`<h3>${esc(t.title)}</h3><div class="acts">${t.kind === 'habit' ? '<button class="btn" data-act="tr-add"><span class="sy">+</span>Adicionar hábito</button><button class="btn" data-act="tr-rmh"><span class="sy">−</span>Remover hábito</button>' : ''}
          <button class="btn" data-act="tr-rename"><span class="sy">✎</span>Renomear</button><button class="btn" data-act="tr-copy"><span class="sy">»</span>Copiar p/ próximo mês</button>
          <button class="btn danger" data-act="tr-del"><span class="sy">⌫</span>Excluir tracker</button></div>`);
        break;
      }
      case 'tr-add': { const t = S.trackers.find(t => t.id === sheetCtx.tid); textSheet('Novo hábito', '', v => { t.habits.push({ id: B.uid(), name: v }); save(); closeSheet(); render(); }, { ph: 'Ex.: Meditar' }); break; }
      case 'tr-rmh': {
        const t = S.trackers.find(t => t.id === sheetCtx.tid);
        openSheet(`<h3>Remover hábito</h3><div class="chips">${t.habits.map(h => `<button class="chip" data-act="tr-rmh-ok" data-k="${h.id}">${esc(h.name)} ✕</button>`).join('')}</div>`);
        break;
      }
      case 'tr-rmh-ok': { const t = S.trackers.find(t => t.id === sheetCtx.tid); t.habits = t.habits.filter(h => h.id !== k); delete t.marks[k]; save(); closeSheet(); render(); break; }
      case 'tr-rename': { const t = S.trackers.find(t => t.id === sheetCtx.tid); textSheet('Renomear tracker', t.title, v => { t.title = v; save(); closeSheet(); render(); }); break; }
      case 'tr-copy': {
        const t = S.trackers.find(t => t.id === sheetCtx.tid);
        const n = B.addTracker(S, { title: t.title, kind: t.kind, month: B.addMonths(t.month, 1), habits: t.habits.map(h => h.name), unit: t.unit });
        save(); closeSheet(); go({ name: 'tracker', id: n.id }, false); toast('Tracker criado para ' + B.monthLabel(n.month)); break;
      }
      case 'tr-del': { const tid = sheetCtx.tid; confirmSheet('Excluir tracker?', 'Os registros deste tracker serão apagados.', 'Excluir', () => { B.removeTracker(S, tid); save(); closeSheet(); back(); }); break; }
      // export
      case 'ex-scope': view.ex.scope = k; renderView(); break;
      case 'export': doExport(k); break;
      case 'import': startImport(); break;
      case 'imp': {
        try {
          const ns = B.importJSON(S, sheetCtx.text, k);
          const merged = ns._merged; delete ns._merged;
          S = ns; flush(); closeSheet(); applyTheme(); render();
          toast(k === 'merge' ? `${merged} item(ns) adicionados` : 'Backup restaurado');
        } catch (e) { toast('Erro: ' + e.message); }
        break;
      }
      case 'wipe': confirmSheet('Apagar tudo?', 'Todos os dados deste aparelho serão apagados. Faça um backup antes. Esta ação não pode ser desfeita.', 'Apagar tudo', () => { S = B.defaultState(); flush(); closeSheet(); tab('daily'); toast('Dados apagados'); }); break;
    }
  }

  function gotoEntry(e) {
    if (!e) return;
    if (e.log === 'daily') go({ name: 'daily', date: e.date }, true);
    else if (e.log === 'monthly') go({ name: 'monthly', month: e.month }, true);
    else if (e.log === 'future') { if (e.month < futureStart() || e.month > B.addMonths(futureStart(), 11)) { S.settings.futureStart = e.month; save(); } go({ name: 'future' }, true); }
    else if (e.log === 'collection') go({ name: 'collection', id: e.collectionId }, true);
  }

  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (el) { onAction(el, ev); return; }
    if (ev.target.classList.contains('scrim')) closeSheet();
  });
  document.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset.input;
    if (!k) return;
    if (k === 'search') {
      view.q = el.value;
      const pos = el.selectionStart;
      renderView();
      const s = $('#view .search'); s.focus(); try { s.setSelectionRange(pos, pos); } catch (e) { /* */ }
    } else if (k === 'val') {
      const t = S.trackers.find(t => t.id === view.id);
      const v = el.value.replace(',', '.').trim();
      if (v === '' || isNaN(Number(v))) delete t.values[el.dataset.d]; else t.values[el.dataset.d] = Number(v);
      save();
    } else if (k === 'set-name') { S.settings.name = el.value; save(); }
    else if (k === 'ex-from') view.ex.from = el.value;
    else if (k === 'ex-to') view.ex.to = el.value;
  });
  document.addEventListener('change', ev => {
    const el = ev.target, k = el.dataset.change;
    if (el.dataset.input === 'val' && view.name === 'tracker') { renderView(); return; }
    if (!k) return;
    if (k === 'mday') { comp.mDay = el.value; renderComposer(); }
    if (k === 'fmonth') { comp.fMonth = el.value; comp.fDay = ''; renderComposer(); }
    if (k === 'fday') comp.fDay = el.value;
    if (k === 'set-theme') { S.settings.theme = el.value; save(); applyTheme(); }
    if (k === 'set-future' && el.value) { S.settings.futureStart = el.value; save(); }
  });
  $('#composer').addEventListener('submit', submitComposer);
  $('#c-type').addEventListener('click', () => { comp.type = TYPE_NEXT[comp.type]; renderComposer(); $('#c-text').focus(); });
  $('#btn-back').addEventListener('click', back);
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') back(); });

  // virada do dia com o app aberto
  let lastDay = B.today();
  setInterval(() => { const t = B.today(); if (t !== lastDay) { if (view.name === 'daily' && view.date === lastDay) view.date = t; lastDay = t; render(); } }, 60000);

  applyTheme();
  render();
})();
