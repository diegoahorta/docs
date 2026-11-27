/* Engine — regras do jogo sem DOM: estado, XP, níveis, vidas, sequência, revisão espaçada (Leitner 1-2-4-8-16),
   montagem das lições, correção das respostas, medalhas e liga semanal. */
(function () {
  'use strict';
  const D = window.PQ_DATA;
  const KEY = 'pq_state_v1';
  const DAY = 86400000;
  const HEART_MS = 20 * 60 * 1000;
  const MAX_HEARTS = 5;
  const XP = D.meta.xp;
  const SRS_DAYS = D.meta.srs_days;
  const TIERS = ['Bronze', 'Prata', 'Ouro', 'Safira', 'Rubi', 'Esmeralda', 'Diamante'];
  const BOT_NAMES = ['Ana Clara', 'Bruno', 'Camila', 'Davi', 'Eduarda', 'Felipe', 'Gabi', 'Heitor', 'Isa', 'João Pedro', 'Larissa', 'Mateus', 'Nina', 'Otávio', 'Rafa', 'Sofia', 'Theo', 'Yasmin', 'Lucas', 'Bia'];
  const reducedMotion = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

  /* ---------- índices ---------- */
  const units = D.units;
  const byId = {};
  const unitOf = {};
  units.forEach((u) => u.items.forEach((it, i) => {
    if (!it.id) it.id = u.id + '-' + i;
    byId[it.id] = it; unitOf[it.id] = u.id;
  }));

  /* ---------- utilidades ---------- */
  const z = (n) => String(n).padStart(2, '0');
  function dayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function dayDiff(a, b) {
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / DAY);
  }
  function weekStart(d) { d = d || new Date(); const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function weekKey(d) { return dayStr(weekStart(d)); }
  function uid() { return 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function shuffle(a, rnd) { a = a.slice(); rnd = rnd || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function seeded(seedStr) { let h = 2166136261; for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return function () { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- estado ---------- */
  function defaults() {
    return {
      v: 1, id: uid(), name: 'Você', created: Date.now(), saved: 0,
      xp: 0, gems: 60, hearts: MAX_HEARTS, heartsTs: Date.now(),
      streak: 0, best: 0, lastDay: null, freeze: 0, goal: D.meta.daily_goal, days: {},
      crowns: {}, srs: {}, ach: {},
      stats: { lessons: 0, perfect: 0, correct: 0, wrong: 0, bestCombo: 0, irregular: 0, reviews: 0, cards: 0, dictPerfect: 0, shadow: 0, mocks: 0, firstRight: 0 },
      league: { week: weekKey(), tier: 0, xp: 0, note: null },
      boostUntil: 0, sound: true, motion: !reducedMotion, rate: 0.9,
    };
  }
  let S = defaults();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const o = JSON.parse(raw); const d = defaults(); S = Object.assign(d, o); S.stats = Object.assign(d.stats, o.stats || {}); S.league = Object.assign(d.league, o.league || {}); }
    } catch (e) { /* armazenamento indisponível: segue em memória */ }
    tickHearts(); checkStreak(); rolloverLeague();
    return S;
  }
  let saveHook = null;
  function save() {
    S.saved = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ok */ }
    if (saveHook) saveHook(S);
  }
  function reset() { const keep = { id: S.id, name: S.name, sound: S.sound, motion: S.motion, rate: S.rate }; S = Object.assign(defaults(), keep); save(); }
  function adopt(remote) { if (remote && remote.v === 1) { S = Object.assign(defaults(), remote); save(); } }

  /* ---------- vidas ---------- */
  function tickHearts() {
    if (S.hearts >= MAX_HEARTS) { S.hearts = MAX_HEARTS; return 0; }
    const n = Math.floor((Date.now() - S.heartsTs) / HEART_MS);
    if (n > 0) { S.hearts = Math.min(MAX_HEARTS, S.hearts + n); S.heartsTs += n * HEART_MS; if (S.hearts >= MAX_HEARTS) S.heartsTs = Date.now(); }
    return S.hearts >= MAX_HEARTS ? 0 : HEART_MS - ((Date.now() - S.heartsTs) % HEART_MS);
  }
  function loseHeart() { if (S.hearts >= MAX_HEARTS) S.heartsTs = Date.now(); S.hearts = Math.max(0, S.hearts - 1); }
  function gainHeart(n) { S.hearts = Math.min(MAX_HEARTS, S.hearts + (n || 1)); if (S.hearts >= MAX_HEARTS) S.heartsTs = Date.now(); }

  /* ---------- sequência ---------- */
  function checkStreak() {
    if (!S.lastDay) return;
    const gap = dayDiff(S.lastDay, dayStr());
    if (gap <= 1) return;
    if (gap === 2 && S.freeze > 0) { S.freeze -= 1; S.lastDay = dayStr(new Date(Date.now() - DAY)); S.freezeUsed = dayStr(); return; }
    S.streak = 0;
  }
  function markActivity() {
    const today = dayStr();
    if (S.lastDay === today) return false;
    S.streak = S.lastDay && dayDiff(S.lastDay, today) === 1 ? S.streak + 1 : 1;
    S.lastDay = today; S.best = Math.max(S.best, S.streak);
    return true;
  }

  /* ---------- XP e níveis ---------- */
  function levelFloor(n) { return 50 * (n - 1) * n; } // 1:0 · 2:100 · 3:300 · 4:600 · 5:1000 · 6:1500
  function levelInfo(xp) {
    xp = xp == null ? S.xp : xp;
    let n = 1; while (xp >= levelFloor(n + 1)) n++;
    const lo = levelFloor(n), hi = levelFloor(n + 1);
    const names = D.meta.levels;
    return { n, name: names[Math.min(n - 1, names.length - 1)], pct: (xp - lo) / (hi - lo), toNext: hi - xp };
  }
  function todayXp() { return S.days[dayStr()] || 0; }
  function boostOn() { return Date.now() < S.boostUntil; }
  function addXp(n) {
    if (boostOn()) n *= 2;
    S.xp += n; S.league.xp += n;
    const k = dayStr(); S.days[k] = (S.days[k] || 0) + n;
    // guarda só as últimas 5 semanas
    const keys = Object.keys(S.days).sort(); while (keys.length > 35) delete S.days[keys.shift()];
    return n;
  }

  /* ---------- revisão espaçada ---------- */
  function grade(id, ok) {
    const it = byId[id]; if (!it || it.t === 'shadow') return;
    const c = S.srs[id] || { b: 0, due: 0, w: 0, r: 0 };
    if (ok) { c.r++; if (Date.now() >= c.due) { c.b = Math.min(5, c.b + 1); c.due = Date.now() + SRS_DAYS[c.b] * DAY; } }
    else { c.w++; c.b = 0; c.due = Date.now(); }
    S.srs[id] = c;
  }
  function srsBoxes() {
    const boxes = [0, 0, 0, 0, 0, 0]; let due = 0; const t = Date.now();
    Object.keys(S.srs).forEach((id) => { if (!byId[id]) return; const c = S.srs[id]; boxes[c.b]++; if (c.due <= t) due++; });
    return { boxes, due };
  }
  function dueIds() {
    const t = Date.now();
    return Object.keys(S.srs).filter((id) => byId[id] && S.srs[id].due <= t)
      .sort((a, b) => S.srs[a].b - S.srs[b].b || S.srs[a].due - S.srs[b].due);
  }
  function mastered() { return Object.keys(S.srs).filter((id) => S.srs[id].b >= 5).length; }

  /* ---------- unidades ---------- */
  function unitById(id) { return units.find((u) => u.id === id); }
  function isUnlocked(i) { return i === 0 || (S.crowns[units[i - 1].id] || 0) >= 1; }
  function currentIndex() {
    let last = 0;
    for (let i = 0; i < units.length; i++) {
      if (!isUnlocked(i)) break;
      last = i;
      if (!(S.crowns[units[i].id] || 0)) return i;
    }
    for (let i = 0; i <= last; i++) if ((S.crowns[units[i].id] || 0) < 3) return i;
    return last;
  }

  function spreadTypes(list) {
    // evita o mesmo tipo de exercício três vezes seguidas
    const out = list.slice();
    for (let i = 2; i < out.length; i++) {
      if (out[i].t === out[i - 1].t && out[i].t === out[i - 2].t) {
        const j = out.findIndex((x, k) => k > i && x.t !== out[i].t);
        if (j > 0) [out[i], out[j]] = [out[j], out[i]];
      }
    }
    return out;
  }
  function pick(pool, n) { return shuffle(pool).slice(0, n); }

  function buildLesson(unitId) {
    const u = unitById(unitId);
    if (u.checkpoint) {
      const own = pick(u.items, 8);
      const others = [];
      units.forEach((x) => { if (x.id !== u.id) x.items.forEach((it) => { if (it.lvl >= 2 && it.t !== 'shadow') others.push(it); }); });
      return { mode: 'checkpoint', unit: u, items: spreadTypes(shuffle(own.concat(pick(others, 4)))) };
    }
    const c = S.crowns[unitId] || 0;
    const L = Math.min(3, c + 1);
    const size = 8;
    const main = shuffle(u.items.filter((it) => it.lvl === L));
    const lower = shuffle(u.items.filter((it) => it.lvl < L));
    const nMain = L === 1 ? size : Math.ceil(size * 0.6);
    let chosen = main.slice(0, nMain).concat(lower.slice(0, size - Math.min(nMain, main.length)));
    if (chosen.length < size) chosen = chosen.concat(shuffle(u.items.filter((it) => chosen.indexOf(it) < 0 && it.lvl <= L + 1)).slice(0, size - chosen.length));
    // mistura 1 cartão vencido de outra unidade (revisão intercalada)
    const due = dueIds().filter((id) => unitOf[id] !== unitId && byId[id].t !== 'shadow');
    if (due.length && chosen.length >= size) chosen[chosen.length - 1] = byId[due[0]];
    return { mode: 'learn', unit: u, level: L, items: spreadTypes(shuffle(chosen.slice(0, size))) };
  }

  function buildReview() {
    let ids = dueIds().slice(0, 10);
    if (ids.length < 6) {
      const weak = Object.keys(S.srs).filter((id) => byId[id] && ids.indexOf(id) < 0)
        .sort((a, b) => (S.srs[b].w - S.srs[b].r * 0.3) - (S.srs[a].w - S.srs[a].r * 0.3) || S.srs[a].b - S.srs[b].b);
      ids = ids.concat(weak.slice(0, 6 - ids.length));
    }
    let items = ids.map((id) => byId[id]).filter((it) => it.t !== 'shadow');
    if (items.length < 6) items = items.concat(pick(units[0].items.filter((it) => it.lvl === 1 && items.indexOf(it) < 0), 6 - items.length));
    return { mode: 'review', unit: null, items: spreadTypes(shuffle(items)) };
  }

  /* ---------- correção ---------- */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[’‘`´]/g, "'")
      .replace(/\b(was|were|did|do|does|is|are|has|have)n't\b/g, '$1 not')
      .replace(/\bit's\b/g, 'it is').replace(/\bi'm\b/g, 'i am')
      .replace(/[.,!?;:"“”()]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function fillQ(q, a) { const parts = String(a).split(' / '); let i = 0; return q.replace(/___/g, () => parts[Math.min(i++, parts.length - 1)]); }
  function answerText(it) {
    switch (it.t) {
      case 'choice': return it.q.indexOf('___') >= 0 ? fillQ(it.q, it.a) : it.a;
      case 'chat': return fillQ(it.lines[it.lines.length - 1][1], it.a);
      case 'sound': return it.a;
      case 'listen': return it.o[0];
      case 'type': return it.q.replace('___', it.a[0]);
      case 'build': return it.a;
      case 'dict': case 'shadow': return it.say;
      case 'fix': return it.fixed;
      default: return '';
    }
  }
  function check(it, resp) {
    switch (it.t) {
      case 'choice': case 'chat': case 'sound': return { ok: resp === it.a };
      case 'listen': return { ok: resp === it.o[0] };
      case 'type': return { ok: it.a.some((a) => norm(a) === norm(resp)) };
      case 'build': return { ok: norm(resp) === norm(it.a) };
      case 'fix': return { ok: resp === it.bad };
      case 'dict': {
        const a = norm(it.say), b = norm(resp);
        if (a === b) return { ok: true, perfect: true };
        if (a.length > 14 && lev(a, b) <= 1) return { ok: true, near: true };
        return { ok: false };
      }
      case 'match': case 'shadow': return { ok: true };
      default: return { ok: false };
    }
  }

  /* ---------- medalhas ---------- */
  const MEDALS = [
    { id: 'first', name: 'Primeiro acerto', desc: 'Acerte sua primeira questão', ico: 'star', test: () => S.stats.firstRight > 0 },
    { id: 'combo5', name: 'Combo ×5', desc: '5 acertos seguidos', ico: 'bolt', test: () => S.stats.bestCombo >= 5 },
    { id: 'combo10', name: 'Combo ×10', desc: '10 acertos seguidos', ico: 'bolt', test: () => S.stats.bestCombo >= 10 },
    { id: 'goal', name: 'Meta do dia', desc: 'Bata a meta diária de XP', ico: 'target', test: () => todayXp() >= S.goal },
    { id: 'perfect', name: 'Sem tropeços', desc: 'Termine uma lição sem errar', ico: 'check', test: () => S.stats.perfect > 0 },
    { id: 'streak3', name: '3 dias seguidos', desc: 'Estude 3 dias sem parar', ico: 'flame', test: () => S.best >= 3 },
    { id: 'streak7', name: '7 dias seguidos', desc: 'Uma semana inteira', ico: 'flame', test: () => S.best >= 7 },
    { id: 'rev20', name: '20 revisões', desc: 'Revise 20 cartões', ico: 'cards', test: () => S.stats.cards >= 20 },
    { id: 'rev100', name: '100 revisões', desc: 'Revise 100 cartões', ico: 'cards', test: () => S.stats.cards >= 100 },
    { id: 'master10', name: '10 cartões dominados', desc: 'Leve 10 cartões à caixa 16 dias', ico: 'crown', test: () => mastered() >= 10 },
    { id: 'ear5', name: 'Ouvido afiado', desc: '5 ditados perfeitos', ico: 'ear', test: () => S.stats.dictPerfect >= 5 },
    { id: 'shadow10', name: 'Sombra', desc: 'Faça shadowing de 10 frases', ico: 'mic', test: () => S.stats.shadow >= 10 },
    { id: 'irreg', name: 'Domador de irregulares', desc: '40 acertos nas unidades de irregulares', ico: 'paw', test: () => S.stats.irregular >= 40 },
    { id: 'mock', name: 'Simulado', desc: 'Passe no Checkpoint A2 Key', ico: 'trophy', test: () => S.stats.mocks > 0 },
    { id: 'lvl5', name: 'Nível 5', desc: 'Chegue ao nível 5', ico: 'medal', test: () => levelInfo().n >= 5 },
  ];
  function checkMedals() {
    const fresh = [];
    MEDALS.forEach((m) => { if (!S.ach[m.id] && m.test()) { S.ach[m.id] = Date.now(); S.gems += 10; fresh.push(m); } });
    return fresh;
  }

  /* ---------- liga semanal ---------- */
  function bots(week, tier) {
    const rnd = seeded('pq-' + week + '-' + tier);
    const names = shuffle(BOT_NAMES, rnd).slice(0, 9);
    return names.map((name) => ({ name, target: Math.round((70 + rnd() * 520) * (1 + tier * 0.25)), curve: 0.75 + rnd() * 0.6, hue: Math.floor(rnd() * 360) }));
  }
  function botXp(b, frac) { return Math.round(b.target * Math.pow(Math.max(0, Math.min(1, frac)), b.curve)); }
  function weekFrac() { const ws = weekStart().getTime(); return (Date.now() - ws) / (7 * DAY); }
  function standings(final) {
    const L = S.league;
    const frac = final ? 1 : weekFrac();
    const list = bots(L.week, L.tier).map((b) => ({ name: b.name, xp: botXp(b, frac), hue: b.hue, me: false }));
    list.push({ name: S.name || 'Você', xp: L.xp, me: true, hue: 12 });
    list.sort((a, b) => b.xp - a.xp || (a.me ? -1 : 1));
    return list;
  }
  function rolloverLeague() {
    const wk = weekKey();
    if (S.league.week === wk) return;
    const final = standings(true);
    const rank = final.findIndex((x) => x.me) + 1;
    let tier = S.league.tier, note;
    if (rank <= 3 && S.league.xp > 0) { tier = Math.min(TIERS.length - 1, tier + 1); note = 'Você terminou em ' + rank + 'º e subiu para a liga ' + TIERS[tier] + '!'; S.gems += 20; }
    else if (rank >= 9 && tier > 0) { tier -= 1; note = 'Você terminou em ' + rank + 'º e voltou para a liga ' + TIERS[tier] + '.'; }
    else note = 'Semana passada: ' + rank + 'º lugar na liga ' + TIERS[tier] + '.';
    S.league = { week: wk, tier, xp: 0, note };
  }

  /* ---------- servidor Python (opcional) ---------- */
  const server = { online: false };
  async function api(path, opts) {
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const tm = ctl ? setTimeout(() => ctl.abort(), 2500) : 0;
    try {
      const r = await fetch('api/' + path, Object.assign({ headers: { 'Content-Type': 'application/json' }, signal: ctl && ctl.signal }, opts || {}));
      if (!r.ok) return null;
      const ct = r.headers.get('content-type') || '';
      return ct.indexOf('json') >= 0 ? await r.json() : null;
    } catch (e) { return null; } finally { clearTimeout(tm); }
  }
  async function ping() {
    if (location.protocol === 'file:') return false;
    const r = await api('health');
    server.online = !!(r && r.ok && r.app === 'pongo-past-quest');
    return server.online;
  }
  function publicScore() {
    return { id: S.id, name: S.name, xp: S.xp, week: S.league.week, week_xp: S.league.xp, streak: S.streak, level: levelInfo().n, crowns: Object.values(S.crowns).reduce((a, b) => a + b, 0) };
  }
  async function pushScore() { if (server.online) await api('score', { method: 'POST', body: JSON.stringify(publicScore()) }); }
  async function board() { return server.online ? api('leaderboard?week=' + encodeURIComponent(S.league.week)) : null; }
  async function cloudPull() {
    if (!server.online) return false;
    const r = await api('progress/' + encodeURIComponent(S.id));
    if (r && r.state && r.state.saved > S.saved) { adopt(r.state); return true; }
    return false;
  }
  let pushT = 0;
  saveHook = function () {
    if (!server.online) return;
    clearTimeout(pushT);
    pushT = setTimeout(() => api('progress/' + encodeURIComponent(S.id), { method: 'PUT', body: JSON.stringify({ state: S }) }), 800);
  };

  window.PQ = {
    D, units, byId, unitOf, TIERS, MEDALS, MAX_HEARTS, HEART_MS, XP,
    get S() { return S; },
    load, save, reset, tickHearts, loseHeart, gainHeart, markActivity, levelInfo, todayXp, addXp, boostOn,
    grade, srsBoxes, dueIds, mastered, unitById, isUnlocked, currentIndex, buildLesson, buildReview,
    norm, check, answerText, fillQ, checkMedals, standings, weekFrac, shuffle, dayStr, weekStart,
    server, ping, pushScore, board, cloudPull,
  };
})();
