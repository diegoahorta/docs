/* Chunking Royale · Chrono Knight Arena
   Future Continuous × Future Perfect — material autoral ODU · Professor Diego Horta */
(() => {
  'use strict';

  // ---------- Banco de desafios (de build/content.json) ----------
  const DATA = {
    monte: [
      { pt: 'Semana que vem, a esta hora, estarei deitado numa praia na Bahia.',
        blocks: [['ADV', 'this time next week'], ['S', 'I'], ['AUX', 'will be'], ['V', 'lying'], ['ADV', 'on a beach in Bahia']],
        answer: 'This time next week I will be lying on a beach in Bahia.', alt: true,
        trap: ['AUX', 'will have'],
        why: 'Ação em andamento num ponto do futuro → will be + -ing. Truque ODU: AT / THIS TIME → continuous (fotografia).' },
      { pt: 'Até o fim do ano, ela já terá economizado dinheiro suficiente para a viagem.',
        blocks: [['ADV', 'by the end of the year'], ['S', 'she'], ['AUX', 'will have'], ['V', 'saved'], ['O', 'enough money for the trip']],
        answer: 'By the end of the year she will have saved enough money for the trip.', alt: true,
        trap: ['AUX', 'will be'],
        why: 'Ação concluída antes de um momento futuro → will have + particípio. BY = prazo final.' },
      { pt: 'Você vai estar usando o seu notebook hoje à tarde? (pergunta educada)',
        blocks: [['AUX', 'will'], ['S', 'you'], ['AUX', 'be'], ['V', 'using'], ['O', 'your laptop'], ['ADV', 'this afternoon']],
        answer: 'Will you be using your laptop this afternoon?', alt: false,
        trap: ['AUX', 'have'],
        why: '"Will you be using...?" pergunta sobre planos de forma educada, sem soar como pedido direto.' },
      { pt: 'Ele não terá chegado quando a festa começar.',
        blocks: [['S', 'he'], ['AUX', "won't have"], ['V', 'arrived'], ['ADV', 'by the time the party starts']],
        answer: "He won't have arrived by the time the party starts.", alt: true,
        trap: ['AUX', "won't be"],
        why: 'Negativa do Future Perfect: won\'t have + particípio. "By the time" pede o perfect.' }
    ],
    lacuna: [
      { q: 'By the time you arrive, the film ______ (start).', opts: ['will be starting', 'will start', 'has been starting', 'will have started'], ok: 3,
        why: 'BY THE TIME → prazo final → Future Perfect: a ação já estará concluída.' },
      { q: "Don't call me at 8 — we ______ dinner then.", opts: ['had had', 'are going to have had', 'will be having', 'will have had'], ok: 2,
        why: 'No momento exato (at 8) a ação estará EM ANDAMENTO → Future Continuous.' },
      { q: 'At 10 p.m. the guests ______, but by 11 they ______ the whole cake.', opts: ['are dancing / have eaten', 'will be dancing / will have eaten', 'will have danced / will be eating', 'will dance / will eat'], ok: 1,
        why: 'AT 10 → fotografia (continuous). BY 11 → já concluído (perfect).' },
      { q: 'By midnight we ______ everything, so the house will be spotless.', opts: ['will have cleaned', 'will be cleaning', 'will clean', 'are cleaning'], ok: 0,
        why: 'Com BY + ideia de conclusão, use o Future Perfect.' },
      { q: 'This time tomorrow I ______ (fly) to Lisbon.', opts: ['will have flown', 'will be flying', 'will have flying'], ok: 1,
        why: 'THIS TIME tomorrow → fotografia → continuous.' },
      { q: 'By Friday she ______ (finish) the report.', opts: ['will be finishing', 'will have finished', 'will have finish'], ok: 1,
        why: 'BY Friday → prazo → perfect.' },
      { q: "Don't worry, I ______ (not / sleep) when you get home.", opts: ["won't have slept", "won't be sleeping", "won't sleeping"], ok: 1,
        why: "Negativa do continuous: won't be + -ing." },
      { q: '______ they ______ (arrive) by 6?', opts: ['Will … be arriving', 'Will … have arrived', 'Have … will arrived'], ok: 1,
        why: 'Pergunta do perfect: Will + S + have + particípio. BY 6 = prazo.' },
      { q: 'In ten years, robots ______ (do) most of our housework.', opts: ['will doing', 'will be doing', 'have been doing'], ok: 1,
        why: 'Situação em andamento num período futuro → will be + -ing.' },
      { q: 'By the time you read this, I ______ (leave).', opts: ['will be leaving', 'will have left', 'will have leave'], ok: 1,
        why: 'By the time → perfect. leave → left.' },
      { q: 'At noon we ______ (have) lunch with the director.', opts: ['will have had', 'will be having', 'will having'], ok: 1,
        why: 'AT noon → ação em andamento.' },
      { q: 'By next month, he ______ (work) here for ten years.', opts: ['will be working', 'will have worked', 'will worked'], ok: 1,
        why: 'Duração até um ponto do futuro → perfect (for ten years).' }
    ],
    corrija: [
      { wrong: 'At 9 tomorrow I will working.', opts: ['At 9 tomorrow I will be working.', 'At 9 tomorrow I will have working.', 'At 9 tomorrow I am will working.'], ok: 0,
        why: 'O BE não pode sumir: will + be + -ing.' },
      { wrong: 'By June we will have finish the course.', opts: ['By June we will be finish the course.', 'By June we will finished the course.', 'By June we will have finished the course.'], ok: 2,
        why: 'Future Perfect = will have + PARTICÍPIO (finished).' },
      { wrong: 'By 2030 they will be built the new bridge.', opts: ['By 2030 they will being built the new bridge.', 'By 2030 they will have built the new bridge.', 'By 2030 they will have build the new bridge.'], ok: 1,
        why: 'BY 2030 = conclusão → will have + built.' },
      { wrong: 'Will you have be working tomorrow?', opts: ['Will you be working tomorrow?', 'Will you have working tomorrow?', 'Will you be have working tomorrow?'], ok: 0,
        why: 'Não misture os dois tempos: escolha be + -ing OU have + particípio.' }
    ]
  };

  const COLORS = { ADV: '#C8476B', S: '#1E2A5E', AUX: '#D4A83A', V: '#2E8B8B', O: '#E8735A' };

  // ---------- Mundo ----------
  const W = 360, H = 560;
  const RIVER_TOP = 268, RIVER_BOT = 292, RIVER_MID = 280;
  const LANES = [80, 280];
  const COST = 3, ELIXIR_MAX = 10, ELIXIR_RATE = 1 / 2.8;
  const MATCH_TIME = 180;

  const UNIT = { hp: 620, dmg: 80, atkInt: 1.0, speed: 38, range: 20, aggro: 80, r: 12 };
  const TOWER = {
    princess: { hp: 1400, r: 22, range: 112, dmg: 48, atkInt: 0.9 },
    king: { hp: 2400, r: 28, range: 104, dmg: 60, atkInt: 1.0 }
  };

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const canvas = $('arena'), ctx = canvas.getContext('2d');
  const stage = $('stage');
  const knightImg = new Image();
  knightImg.src = '../assets/chrono-knight.png';

  let view = { scale: 1, dpr: 1 };

  function resize() {
    const r = stage.getBoundingClientRect();
    const availW = Math.max(100, r.width - 8), availH = Math.max(100, r.height - 8);
    const scale = Math.min(availW / W, availH / H);
    const cssW = Math.floor(W * scale), cssH = Math.floor(H * scale);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    view = { scale: cssW / W, dpr };
    if (state !== 'playing') draw();
  }

  // ---------- Estado ----------
  let state = 'menu';
  let G = null;

  function makeTower(side, kind, x, y) {
    const t = TOWER[kind];
    return { type: 'tower', side, kind, x, y, r: t.r, hp: t.hp, maxHp: t.hp, range: t.range, dmg: t.dmg, atkInt: t.atkInt, cd: 0, alive: true, flash: 0 };
  }

  function newGame() {
    G = {
      time: MATCH_TIME,
      elixir: 5, enemyElixir: 5,
      units: [], arrows: [], fx: [], floaters: [],
      towers: [
        makeTower('enemy', 'princess', LANES[0], 96), makeTower('enemy', 'princess', LANES[1], 96), makeTower('enemy', 'king', 180, 44),
        makeTower('player', 'princess', LANES[0], 464), makeTower('player', 'princess', LANES[1], 464), makeTower('player', 'king', 180, 516)
      ],
      crowns: { player: 0, enemy: 0 },
      aiTimer: 6, freezeT: 0,
      streak: 0, maxCombo: 0, hits: 0, misses: 0, freezeCharges: 0,
      missed: [], deck: [], pendingLane: 0, shake: 0, over: false, t: 0
    };
    refillDeck();
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function refillDeck() {
    const all = [];
    DATA.monte.forEach(d => all.push({ kind: 'monte', d }));
    DATA.lacuna.forEach(d => all.push({ kind: 'lacuna', d }));
    DATA.corrija.forEach(d => all.push({ kind: 'corrija', d }));
    G.deck = shuffle(all);
  }

  // ---------- Unidades ----------
  function spawnUnit(side, lane, boosted) {
    const x = LANES[lane] + (Math.random() * 10 - 5);
    const y = side === 'player' ? 430 : 130;
    G.units.push({
      type: 'unit', side, x, y, lane, r: UNIT.r,
      hp: UNIT.hp, maxHp: UNIT.hp, dmg: UNIT.dmg, atkInt: UNIT.atkInt, cd: 0.4,
      speed: UNIT.speed * (boosted ? 1.5 : 1), boosted: !!boosted, alive: true,
      walk: Math.random() * 6, atkAnim: 0, flash: 0, spawnT: 0.6
    });
    burst(x, y, side === 'player' ? '#4FE3FF' : '#ff6b6b', 14);
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const sideOf = y => (y < RIVER_MID ? 'top' : 'bottom');

  function enemiesOf(side) {
    const foe = side === 'player' ? 'enemy' : 'player';
    return {
      units: G.units.filter(u => u.alive && u.side === foe),
      towers: G.towers.filter(t => t.alive && t.side === foe)
    };
  }

  function pickTarget(u) {
    const e = enemiesOf(u.side);
    let best = null, bd = Infinity;
    for (const o of e.units) {
      const d = dist(u, o);
      if (d < UNIT.aggro && d < bd) { bd = d; best = o; }
    }
    if (best) return best;
    // torre princesa da mesma pista; se caiu, o rei
    const princess = e.towers.find(t => t.kind === 'princess' && Math.abs(t.x - LANES[u.lane]) < 5);
    if (princess) return princess;
    const king = e.towers.find(t => t.kind === 'king');
    if (king) return king;
    return e.towers[0] || null;
  }

  // Ponto intermediário: atravessar o rio só pela ponte
  function steerPoint(u, tx, ty) {
    if (sideOf(u.y) !== sideOf(ty) || (u.y > RIVER_TOP - 6 && u.y < RIVER_BOT + 6)) {
      const bx = Math.abs(u.x - LANES[0]) < Math.abs(u.x - LANES[1]) ? LANES[0] : LANES[1];
      if (Math.abs(u.x - bx) > 3 && !(u.y > RIVER_TOP - 2 && u.y < RIVER_BOT + 2)) {
        const ny = u.side === 'player' ? Math.max(u.y, RIVER_BOT + 8) : Math.min(u.y, RIVER_TOP - 8);
        return { x: bx, y: ny };
      }
      return { x: bx, y: u.side === 'player' ? RIVER_TOP - 14 : RIVER_BOT + 14 };
    }
    return { x: tx, y: ty };
  }

  function damage(target, amount, from) {
    if (!target.alive) return;
    target.hp -= amount;
    target.flash = 0.12;
    sparks(target.x + (Math.random() * 8 - 4), target.y - 6, '#ffe28a', 5);
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      if (target.type === 'unit') {
        puff(target.x, target.y, target.side === 'player' ? '#9fe9ff' : '#ffb3b3');
      } else {
        towerDown(target, from);
      }
    }
  }

  function towerDown(t) {
    const winner = t.side === 'player' ? 'enemy' : 'player';
    puff(t.x, t.y, '#ffd56b', 2.2);
    G.shake = 0.35;
    if (t.kind === 'king') {
      G.crowns[winner] = 3;
      floater(t.x, t.y, '👑👑👑', '#ffd56b');
      updateTop();
      endGame();
      return;
    }
    G.crowns[winner] += 1;
    floater(t.x, t.y, '+1 👑', '#ffd56b');
    toast(winner === 'player' ? '+1 👑 Torre derrubada!' : 'Você perdeu uma torre!');
    updateTop();
  }

  // ---------- Efeitos ----------
  function sparks(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 60;
      G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35, max: 0.35, color, size: 2 });
    }
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, s = 50;
      G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5, color, size: 3 });
    }
    G.fx.push({ k: 'ring', x, y, life: 0.5, max: 0.5, color, r: 24 });
  }
  function puff(x, y, color, scale = 1) {
    for (let i = 0; i < 4; i++) G.fx.push({ k: 'puff', x: x + (Math.random() * 12 - 6) * scale, y: y + (Math.random() * 10 - 5) * scale, life: 0.6, max: 0.6, color, r: 10 * scale });
    sparks(x, y, color, 10);
  }
  function floater(x, y, text, color) { G.floaters.push({ x, y, text, color, life: 1.4, max: 1.4 }); }

  // ---------- Atualização ----------
  function update(dt) {
    G.t += dt;
    G.time -= dt;
    if (G.time <= 0) { G.time = 0; endGame(); return; }

    G.elixir = Math.min(ELIXIR_MAX, G.elixir + ELIXIR_RATE * dt);
    const pace = G.time < 60 ? 1.6 : 1; // elixir em dobro no último minuto (ritmo maior)
    G.enemyElixir = Math.min(ELIXIR_MAX, G.enemyElixir + ELIXIR_RATE * pace * dt);
    if (G.freezeT > 0) G.freezeT -= dt;
    if (G.shake > 0) G.shake -= dt;

    enemyAI(dt);

    for (const u of G.units) {
      if (!u.alive) continue;
      u.flash = Math.max(0, u.flash - dt);
      u.atkAnim = Math.max(0, u.atkAnim - dt);
      if (u.spawnT > 0) { u.spawnT -= dt; continue; }
      if (u.side === 'enemy' && G.freezeT > 0) continue;
      const tgt = pickTarget(u);
      if (!tgt) continue;
      const d = dist(u, tgt);
      const reach = u.r + tgt.r + (tgt.type === 'tower' ? 4 : UNIT.range - u.r);
      if (d <= reach && (sideOf(u.y) === sideOf(tgt.y) || tgt.type === 'unit' && d < reach)) {
        u.cd -= dt;
        if (u.cd <= 0) {
          u.cd = u.atkInt;
          u.atkAnim = 0.25;
          damage(tgt, u.dmg, u);
        }
      } else {
        const p = steerPoint(u, tgt.x, tgt.y);
        const dx = p.x - u.x, dy = p.y - u.y, L = Math.hypot(dx, dy) || 1;
        u.x += (dx / L) * u.speed * dt;
        u.y += (dy / L) * u.speed * dt;
        u.walk += dt * 10;
        u.cd = Math.min(u.cd, 0.4);
      }
    }
    // Separação simples entre unidades
    for (let i = 0; i < G.units.length; i++) {
      const a = G.units[i]; if (!a.alive) continue;
      for (let j = i + 1; j < G.units.length; j++) {
        const b = G.units[j]; if (!b.alive) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r - 4;
        if (d > 0 && d < min) {
          const push = (min - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        }
      }
      a.x = Math.max(12, Math.min(W - 12, a.x));
      // não cair no rio fora da ponte
      if (a.y > RIVER_TOP - 4 && a.y < RIVER_BOT + 4) {
        const bx = Math.abs(a.x - LANES[0]) < Math.abs(a.x - LANES[1]) ? LANES[0] : LANES[1];
        if (Math.abs(a.x - bx) > 18) a.x += Math.sign(bx - a.x) * 2;
      }
    }

    // Torres
    for (const t of G.towers) {
      if (!t.alive) continue;
      t.flash = Math.max(0, t.flash - dt);
      if (t.side === 'enemy' && G.freezeT > 0) continue;
      t.cd -= dt;
      if (t.cd > 0) continue;
      const foes = G.units.filter(u => u.alive && u.side !== t.side && dist(u, t) <= t.range);
      if (!foes.length) continue;
      foes.sort((a, b) => dist(a, t) - dist(b, t));
      t.cd = t.atkInt;
      G.arrows.push({ x: t.x, y: t.y - t.r, target: foes[0], dmg: t.dmg, side: t.side });
    }
    for (const a of G.arrows) {
      if (!a.target.alive) { a.done = true; continue; }
      const dx = a.target.x - a.x, dy = a.target.y - a.y, L = Math.hypot(dx, dy);
      const step = 320 * dt;
      if (L <= step) { damage(a.target, a.dmg); a.done = true; }
      else { a.x += dx / L * step; a.y += dy / L * step; a.ang = Math.atan2(dy, dx); }
    }
    G.arrows = G.arrows.filter(a => !a.done);
    G.units = G.units.filter(u => u.alive);

    for (const f of G.fx) { f.life -= dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } }
    G.fx = G.fx.filter(f => f.life > 0);
    for (const f of G.floaters) { f.life -= dt; f.y -= 22 * dt; }
    G.floaters = G.floaters.filter(f => f.life > 0);

    updateHud();
  }

  function enemyAI(dt) {
    G.aiTimer -= dt;
    if (G.aiTimer > 0 || G.enemyElixir < COST) return;
    const elapsed = MATCH_TIME - G.time;
    const base = Math.max(4.5, 10 - elapsed / 30); // dificuldade sobe aos poucos
    G.aiTimer = base + Math.random() * 3;
    G.enemyElixir -= COST;
    // defende a pista mais ameaçada; senão ataca a torre mais fraca do jogador
    const threat = [0, 0];
    G.units.forEach(u => { if (u.side === 'player' && u.y < 330) threat[u.x < 180 ? 0 : 1]++; });
    let lane;
    if (threat[0] !== threat[1]) lane = threat[0] > threat[1] ? 0 : 1;
    else {
      const pt = G.towers.filter(t => t.side === 'player' && t.kind === 'princess');
      const hp = LANES.map(x => { const t = pt.find(t => t.x === x); return t && t.alive ? t.hp : -1; });
      lane = hp[0] === hp[1] ? (Math.random() < 0.5 ? 0 : 1) : (hp[0] < 0 ? 0 : hp[1] < 0 ? 1 : hp[0] < hp[1] ? 0 : 1);
    }
    spawnUnit('enemy', lane, elapsed > 120 && Math.random() < 0.3);
  }

  // ---------- Desenho ----------
  function draw() {
    const s = view.scale * view.dpr;
    let ox = 0, oy = 0;
    if (G && G.shake > 0) { ox = (Math.random() - 0.5) * 6; oy = (Math.random() - 0.5) * 6; }
    ctx.setTransform(s, 0, 0, s, ox * s, oy * s);
    drawArena();
    if (!G) return;
    G.towers.forEach(drawTower);
    const sorted = G.units.slice().sort((a, b) => a.y - b.y);
    sorted.forEach(drawUnit);
    G.arrows.forEach(drawArrow);
    drawFx();
    if (G.freezeT > 0) {
      ctx.fillStyle = `rgba(79,227,255,${0.12 + 0.05 * Math.sin(G.t * 10)})`;
      ctx.fillRect(0, 0, W, RIVER_MID);
      ctx.fillStyle = '#bff4ff';
      ctx.font = '900 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⏳ TIME FREEZE ${G.freezeT.toFixed(1)}s`, W / 2, RIVER_TOP - 10);
    }
  }

  function drawArena() {
    // gramado em xadrez (navy) — identidade Chunking Royale
    for (let y = 0; y < H; y += 20) {
      for (let x = 0; x < W; x += 20) {
        ctx.fillStyle = ((x + y) / 20) % 2 === 0 ? '#2A3C93' : '#26378A';
        ctx.fillRect(x, y, 20, 20);
      }
    }
    // zona do jogador (onde pode enviar)
    ctx.fillStyle = 'rgba(79,227,255,0.06)';
    ctx.fillRect(0, RIVER_BOT, W, H - RIVER_BOT);
    // caminhos
    ctx.fillStyle = 'rgba(224,169,46,0.18)';
    LANES.forEach(x => ctx.fillRect(x - 14, 60, 28, H - 120));
    ctx.fillRect(LANES[0], 40, LANES[1] - LANES[0], 20);
    ctx.fillRect(LANES[0], H - 60, LANES[1] - LANES[0], 20);
    // rio
    const g = ctx.createLinearGradient(0, RIVER_TOP, 0, RIVER_BOT);
    g.addColorStop(0, '#1ba7d6'); g.addColorStop(0.5, '#4FE3FF'); g.addColorStop(1, '#1ba7d6');
    ctx.fillStyle = g;
    ctx.fillRect(0, RIVER_TOP, W, RIVER_BOT - RIVER_TOP);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    const tt = G ? G.t : 0;
    for (let x = -20; x < W; x += 30) {
      ctx.beginPath();
      const xx = x + ((tt * 20) % 30);
      ctx.moveTo(xx, RIVER_MID); ctx.quadraticCurveTo(xx + 7, RIVER_MID - 4, xx + 14, RIVER_MID);
      ctx.stroke();
    }
    // pontes
    LANES.forEach(x => {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(x - 20, RIVER_TOP - 6, 40, RIVER_BOT - RIVER_TOP + 12);
      ctx.fillStyle = '#b07a3e';
      for (let y = RIVER_TOP - 4; y < RIVER_BOT + 6; y += 6) ctx.fillRect(x - 18, y, 36, 4);
      ctx.fillStyle = '#E0A92E';
      ctx.fillRect(x - 22, RIVER_TOP - 6, 4, RIVER_BOT - RIVER_TOP + 12);
      ctx.fillRect(x + 18, RIVER_TOP - 6, 4, RIVER_BOT - RIVER_TOP + 12);
    });
    // linha central tracejada
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.moveTo(180, 70); ctx.lineTo(180, H - 70); ctx.stroke();
    ctx.setLineDash([]);
  }

  function hpBar(x, y, w, ratio, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), 4);
  }

  function drawTower(t) {
    const blue = t.side === 'player';
    const main = blue ? '#3a6cf0' : '#d8424f', dark = blue ? '#1d3a9a' : '#8f1f2a';
    const { x, y, r } = t;
    if (!t.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y + 6, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b6f80';
      for (let i = 0; i < 5; i++) ctx.fillRect(x - r + i * (r / 2.5), y - 2 + (i % 2) * 4, 8, 6);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.7, r * 1.05, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    // base de pedra
    ctx.fillStyle = '#9aa3bd';
    ctx.fillRect(x - r, y - r * 0.6, r * 2, r * 1.4);
    ctx.fillStyle = '#7d86a3';
    ctx.fillRect(x - r, y + r * 0.4, r * 2, r * 0.4);
    // topo colorido
    ctx.fillStyle = t.flash > 0 ? '#ffffff' : main;
    ctx.fillRect(x - r - 2, y - r, r * 2 + 4, r * 0.55);
    ctx.fillStyle = dark;
    for (let i = 0; i < 4; i++) ctx.fillRect(x - r - 2 + i * ((2 * r + 4) / 3.5), y - r - 6, 7, 7);
    // relógio dourado (identidade Chrono)
    ctx.fillStyle = '#E0A92E';
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0F1E4A';
    ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4FE3FF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.22); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.17, y + r * 0.08); ctx.stroke();
    if (t.kind === 'king') {
      ctx.fillStyle = '#ffd56b';
      ctx.beginPath();
      const cy = y - r - 10;
      ctx.moveTo(x - 10, cy + 8); ctx.lineTo(x - 10, cy); ctx.lineTo(x - 5, cy + 4); ctx.lineTo(x, cy - 3);
      ctx.lineTo(x + 5, cy + 4); ctx.lineTo(x + 10, cy); ctx.lineTo(x + 10, cy + 8); ctx.closePath(); ctx.fill();
    }
    hpBar(x, y - r - (t.kind === 'king' ? 22 : 14), r * 2, t.hp / t.maxHp, blue ? '#4FE3FF' : '#ff6b6b');
    ctx.fillStyle = '#fff';
    ctx.font = '700 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(t.hp), x, y - r - (t.kind === 'king' ? 24 : 16));
  }

  function drawUnit(u) {
    const blue = u.side === 'player';
    const frozen = !blue && G.freezeT > 0;
    const bob = Math.sin(u.walk) * 1.5;
    const x = u.x, y = u.y + bob;
    const cape = blue ? '#1FB6D9' : '#c0303d';
    const visor = blue ? '#4FE3FF' : '#ff5a5a';
    const sc = u.spawnT > 0 ? 1 - u.spawnT * 0.8 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 12, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (u.boosted) {
      ctx.strokeStyle = `rgba(255,213,107,${0.5 + 0.3 * Math.sin(G.t * 12)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
    }
    // capa
    ctx.fillStyle = cape;
    ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-11, 11); ctx.lineTo(11, 11); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill();
    // corpo
    ctx.fillStyle = u.flash > 0 ? '#ffffff' : (blue ? '#b9c4dc' : '#d99aa1');
    ctx.fillRect(-7, -4, 14, 13);
    ctx.fillStyle = '#5d6e8e';
    ctx.fillRect(-6, 9, 5, 4); ctx.fillRect(1, 9, 5, 4);
    // espada
    const swing = u.atkAnim > 0 ? (u.atkAnim / 0.25) * 1.4 : 0;
    ctx.save();
    ctx.translate(8, 0);
    ctx.rotate((blue ? -0.5 : 0.5 + Math.PI) + (blue ? swing : -swing));
    ctx.fillStyle = '#e9fdff'; ctx.fillRect(-1.5, -16, 3, 14);
    ctx.fillStyle = '#E0A92E'; ctx.fillRect(-4, -3, 8, 2.5);
    ctx.restore();
    // capacete
    ctx.fillStyle = u.flash > 0 ? '#ffffff' : (blue ? '#d5deef' : '#f2b8bd');
    ctx.beginPath(); ctx.arc(0, -10, 8, Math.PI, 0); ctx.lineTo(8, -4); ctx.lineTo(-8, -4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#33415E'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#0F1E4A'; ctx.fillRect(-6, -11, 12, 4);
    ctx.fillStyle = visor; ctx.fillRect(-5, -10, 10, 2);
    ctx.fillStyle = '#E0A92E'; ctx.fillRect(-1, -18, 2, 7);
    // escudo-engrenagem
    ctx.fillStyle = '#E0A92E';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + (G.t * (frozen ? 0 : 1));
      ctx.fillRect(-9 + Math.cos(a) * 7 - 1.5, 2 + Math.sin(a) * 7 - 1.5, 3, 3);
    }
    ctx.beginPath(); ctx.arc(-9, 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0F1E4A'; ctx.beginPath(); ctx.arc(-9, 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = visor; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(-9, -1); ctx.moveTo(-9, 2); ctx.lineTo(-7, 3); ctx.stroke();
    if (frozen) {
      ctx.fillStyle = 'rgba(159,243,255,0.45)';
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    hpBar(u.x, u.y - 26, 22, u.hp / u.maxHp, blue ? '#4FE3FF' : '#ff6b6b');
  }

  function drawArrow(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.ang || 0);
    ctx.fillStyle = a.side === 'player' ? '#bff4ff' : '#ffc2c2';
    ctx.fillRect(-6, -1, 10, 2);
    ctx.fillStyle = '#E0A92E';
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    for (const f of G.fx) {
      const k = f.life / f.max;
      ctx.globalAlpha = Math.max(0, k);
      if (f.k === 'p') { ctx.fillStyle = f.color; ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size); }
      else if (f.k === 'ring') { ctx.strokeStyle = f.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.4 - k), 0, Math.PI * 2); ctx.stroke(); }
      else if (f.k === 'puff') { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.6 - k), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (const f of G.floaters) {
      ctx.globalAlpha = Math.min(1, f.life / f.max * 2);
      ctx.font = '900 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = '#0B1440';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- HUD ----------
  function updateTop() {
    $('crownsPlayer').textContent = G.crowns.player;
    $('crownsEnemy').textContent = G.crowns.enemy;
  }
  function updateHud() {
    const t = Math.ceil(G.time);
    $('timer').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    $('timer').classList.toggle('hurry', G.time <= 30);
    $('elixirFill').style.width = (G.elixir / ELIXIR_MAX * 100) + '%';
    $('elixirNum').textContent = Math.floor(G.elixir);
    const can = G.elixir >= COST;
    $('card').classList.toggle('dim', !can);
    document.querySelectorAll('.lane-btn').forEach(b => { b.disabled = !can; });
    $('btnFreeze').disabled = G.freezeCharges <= 0 || G.freezeT > 0;
    $('freezeCount').textContent = G.freezeCharges;
    $('comboNum').textContent = G.streak;
    $('hitsNum').textContent = G.hits;
    $('missNum').textContent = G.misses;
  }

  let toastT = null;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 1600);
  }

  function show(id, on) { $(id).classList.toggle('show', on); }

  // ---------- Desafio ----------
  let CH = null;

  function requestDeploy(lane) {
    if (state !== 'playing') return;
    if (G.elixir < COST) { toast('💧 Elixir insuficiente (precisa de 3)'); return; }
    if (!G.deck.length) refillDeck();
    const item = G.deck.pop();
    G.pendingLane = lane;
    openChallenge(item, lane);
  }

  function openChallenge(item, lane) {
    state = 'challenge';
    CH = { item, lane, picked: [], sel: -1, answered: false };
    $('chLane').textContent = lane === 0 ? '⬅ Pista esquerda' : 'Pista direita ➡';
    $('chFeedback').innerHTML = '';
    $('chCheck').classList.remove('hidden');
    $('chNext').classList.add('hidden');
    const body = $('chBody');
    body.innerHTML = '';
    const d = item.d;
    if (item.kind === 'monte') {
      $('chType').textContent = 'Monte a frase';
      $('chPrompt').innerHTML = `<span class="pt">Frase em português</span>“${esc(d.pt)}”`;
      const slots = el('div', 'slots'); slots.id = 'slots';
      const pool = el('div', 'pool');
      CH.pool = shuffle(d.blocks.map((b, i) => ({ type: b[0], text: b[1], idx: i })).concat([{ type: d.trap[0], text: d.trap[1], idx: -1 }]));
      CH.pool.forEach((b, pi) => {
        const btn = chunkBtn(b);
        btn.addEventListener('click', () => {
          if (!CH || CH.answered || btn.classList.contains('used')) return;
          btn.classList.add('used');
          CH.picked.push(pi);
          renderSlots();
        });
        b.btn = btn;
        pool.appendChild(btn);
      });
      body.append(slots, pool);
      renderSlots();
    } else {
      const isLac = item.kind === 'lacuna';
      $('chType').textContent = isLac ? 'Complete a lacuna' : 'Corrija o erro';
      $('chPrompt').innerHTML = isLac
        ? esc(d.q).replace(/_{3,}/g, '<b style="color:#ffd56b">______</b>')
        : `<span class="pt">Frase com erro</span><span class="wrong">${esc(d.wrong)}</span>`;
      const opts = el('div', 'opts');
      d.opts.forEach((o, i) => {
        const b = el('button', 'opt');
        b.innerHTML = `<b>${'ABCD'[i]}</b><span>${esc(o)}</span>`;
        b.addEventListener('click', () => {
          if (!CH || CH.answered) return;
          CH.sel = i;
          opts.querySelectorAll('.opt').forEach((x, j) => x.classList.toggle('sel', j === i));
          $('chCheck').disabled = false;
        });
        opts.appendChild(b);
      });
      body.appendChild(opts);
      $('chCheck').disabled = true;
    }
    show('challenge', true);
  }

  function renderSlots() {
    const slots = $('slots');
    slots.innerHTML = '';
    CH.picked.forEach((pi, k) => {
      const b = CH.pool[pi];
      const btn = chunkBtn(b);
      btn.addEventListener('click', () => {
        if (!CH || CH.answered) return;
        CH.picked.splice(k, 1);
        b.btn.classList.remove('used');
        renderSlots();
      });
      slots.appendChild(btn);
    });
    $('chCheck').disabled = CH.picked.length !== CH.item.d.blocks.length;
  }

  function chunkBtn(b) {
    const btn = el('button', 'chunk ' + b.type);
    btn.innerHTML = `<small>${b.type}</small>${esc(b.text)}`;
    return btn;
  }

  function checkChallenge() {
    if (!CH || CH.answered) return;
    const { item } = CH, d = item.d;
    let ok, correctText;
    if (item.kind === 'monte') {
      const seq = CH.picked.map(pi => CH.pool[pi].idx);
      const n = d.blocks.length;
      const base = [...Array(n).keys()];
      const accepted = [base];
      if (d.alt) {
        if (d.blocks[0][0] === 'ADV') accepted.push(base.slice(1).concat([0]));
        if (d.blocks[n - 1][0] === 'ADV') accepted.push([n - 1].concat(base.slice(0, n - 1)));
      }
      ok = accepted.some(a => a.join(',') === seq.join(','));
      correctText = d.answer;
      // destaca o bloco-armadilha (na reserva ou já colocado)
      CH.pool.forEach(b => { if (b.idx === -1) b.btn.classList.add('trap'); });
      document.querySelectorAll('#slots .chunk').forEach((c, k) => {
        if (CH.pool[CH.picked[k]].idx === -1) c.classList.add('trap');
      });
    } else {
      ok = CH.sel === d.ok;
      correctText = item.kind === 'lacuna' ? fillLacuna(d.q, d.opts[d.ok]) : d.opts[d.ok];
      document.querySelectorAll('#chBody .opt').forEach((x, j) => {
        if (j === d.ok) x.classList.add('right');
        else if (j === CH.sel) x.classList.add('wrongsel');
      });
    }
    CH.answered = true;
    CH.ok = ok;
    G.elixir -= COST;
    let extra = '';
    if (ok) {
      G.hits++; G.streak++;
      G.maxCombo = Math.max(G.maxCombo, G.streak);
      if (G.streak > 0 && G.streak % 3 === 0) { G.freezeCharges++; extra = ' ⏳ +1 Time Freeze!'; }
      const boost = G.streak >= 3;
      CH.boost = boost;
      $('chFeedback').innerHTML = `<div class="fb"><b>✓ Correto!</b>${boost ? ' ⚡ Time Boost ativo!' : ''}${extra}<span class="ans">${esc(correctText)}</span><span class="why"><b>Por quê?</b> ${esc(d.why)}</span></div>`;
    } else {
      G.misses++; G.streak = 0;
      const prompt = item.kind === 'monte' ? d.pt : item.kind === 'lacuna' ? d.q : d.wrong;
      G.missed.push({ prompt, correct: correctText, why: d.why });
      const trapNote = item.kind === 'monte' ? ` <b>Bloco-armadilha:</b> “${esc(d.trap[1])}” (${d.trap[0]}).` : '';
      $('chFeedback').innerHTML = `<div class="fb bad"><b>✗ Ainda não.</b> O elixir foi gasto e o cavaleiro não entrou.${trapNote}<span class="ans">✓ ${esc(correctText)}</span><span class="why"><b>Por quê?</b> ${esc(d.why)}</span></div>`;
    }
    $('chCheck').classList.add('hidden');
    $('chNext').classList.remove('hidden');
    $('chNext').textContent = ok ? '⚔️ Enviar Chrono Knight' : 'Continuar ▶';
    updateHud();
  }

  function closeChallenge() {
    show('challenge', false);
    if (CH && CH.ok) {
      spawnUnit('player', CH.lane, CH.boost);
      if (CH.boost) toast(`⚡ Combo x${G.streak}! Time Boost!`);
    }
    CH = null;
    state = 'playing';
    last = performance.now();
  }

  // Preenche as lacunas com a resposta ("will be dancing / will have eaten", "Will … have arrived")
  function fillLacuna(q, opt) {
    const parts = opt.split(/ \/ | … /);
    let i = 0;
    return q.replace(/ \([^)]*\)/g, '').replace(/_{3,}/g, () => parts[Math.min(i++, parts.length - 1)]);
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // ---------- Fim de jogo ----------
  function endGame() {
    if (G.over) return;
    G.over = true;
    state = 'over';
    const p = G.crowns.player, e = G.crowns.enemy;
    let title;
    if (p > e) title = '🏆 Vitória!';
    else if (p < e) title = '💥 Derrota';
    else {
      // desempate pelo menor HP restante das torres
      const hp = side => G.towers.filter(t => t.side === side && t.alive).reduce((m, t) => Math.min(m, t.hp / t.maxHp), 1);
      const hpP = hp('player'), hpE = hp('enemy');
      title = Math.abs(hpP - hpE) < 0.01 ? '🤝 Empate' : hpP > hpE ? '🏆 Vitória (no detalhe)!' : '💥 Derrota (no detalhe)';
    }
    $('endTitle').textContent = title;
    $('endScore').textContent = `Você ${p} 👑 × ${e} 👑 Rival`;
    const total = G.hits + G.misses;
    $('stHits').textContent = G.hits;
    $('stMiss').textContent = G.misses;
    $('stAcc').textContent = total ? Math.round(G.hits / total * 100) + '%' : '—';
    $('stCombo').textContent = G.maxCombo;
    const list = $('missedList');
    list.innerHTML = '';
    if (!G.missed.length) {
      $('missedTitle').textContent = total ? 'Nenhum erro — perfeito! ✨' : 'Responda desafios para treinar!';
    } else {
      $('missedTitle').textContent = 'Revise estas frases';
      G.missed.forEach(m => {
        const li = el('li');
        li.innerHTML = `<span>${esc(m.prompt)}</span><span class="ok">✓ ${esc(m.correct)}</span><span class="why">Por quê? ${esc(m.why)}</span>`;
        list.appendChild(li);
      });
    }
    updateHud();
    draw();
    setTimeout(() => show('endScreen', true), 600);
  }

  // ---------- Loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === 'playing') update(dt);
    if (G && state !== 'menu') {
      // efeitos continuam no fim de jogo
      if (state === 'over') { for (const f of G.fx) f.life -= dt; G.fx = G.fx.filter(f => f.life > 0); }
    }
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- Entrada ----------
  canvas.addEventListener('pointerdown', ev => {
    if (state !== 'playing') return;
    const r = canvas.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W;
    const y = (ev.clientY - r.top) / r.height * H;
    if (y < RIVER_BOT) { toast('Toque na SUA metade da arena (abaixo do rio)'); return; }
    requestDeploy(x < W / 2 ? 0 : 1);
  });
  document.querySelectorAll('.lane-btn').forEach(b => b.addEventListener('click', () => requestDeploy(+b.dataset.lane)));
  $('btnFreeze').addEventListener('click', () => {
    if (state !== 'playing' || G.freezeCharges <= 0 || G.freezeT > 0) return;
    G.freezeCharges--;
    G.freezeT = 3;
    toast('⏳ Time Freeze! Inimigos congelados por 3 s');
    G.units.forEach(u => { if (u.side === 'enemy') sparks(u.x, u.y, '#9ff3ff', 8); });
  });
  $('chCheck').addEventListener('click', checkChallenge);
  $('chNext').addEventListener('click', closeChallenge);
  $('btnStart').addEventListener('click', start);
  $('btnAgain').addEventListener('click', () => { show('endScreen', false); start(); });
  $('btnPause').addEventListener('click', () => {
    if (state === 'playing') { state = 'paused'; show('pauseScreen', true); }
  });
  $('btnResume').addEventListener('click', () => { show('pauseScreen', false); state = 'playing'; last = performance.now(); });
  $('btnQuit').addEventListener('click', () => { show('pauseScreen', false); start(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') { state = 'paused'; show('pauseScreen', true); }
  });

  function start() {
    newGame();
    updateTop();
    updateHud();
    show('startScreen', false);
    state = 'playing';
    last = performance.now();
    toast('⚔️ Batalha iniciada! Envie seu Chrono Knight');
  }

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  newGame();
  resize();
  updateHud();
  requestAnimationFrame(frame);

  // Gancho para testes automatizados
  window.__CK = { get G() { return G; }, get state() { return state; }, get CH() { return CH; } };
})();
