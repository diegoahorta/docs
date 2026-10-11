/* Pongo - mapa 2D em estilo cartoon.
 * Mesmo jardim da versão 3D (portão, canteiro, lago, árvore grande, casinha,
 * horta e a casa do dono), desenhado em canvas no traço dos sprites do Pongo:
 * contorno escuro grosso, cores chapadas e quentes. O Pongo anda pelo caminho
 * com os quadros de caminhada e pula com os quadros de pulo (js/sprites-data.js).
 * Expõe a mesma API do mapa 3D (window.PongoMap), então o game.js não muda. */
(function () {
  'use strict';
  const SP = window.PongoSprites;
  if (!SP) return;

  const WORLD = { w: 1600, h: 1000 };
  const STOPS = [[230, 880], [520, 785], [395, 615], [690, 560], [990, 690], [1180, 545], [1300, 405]];
  const PATH = [[150, 1010], [230, 880], [390, 850], [520, 785], [500, 690], [395, 615], [520, 560], [690, 560],
    [850, 650], [990, 690], [1110, 630], [1180, 545], [1255, 470], [1300, 405]];
  const OUT = '#2b1a12';
  const C = {
    sky1: '#7fcdfb', sky2: '#d6f1ff', hill1: '#9fd77a', hill2: '#7cc35a', grass: '#8fd15c', grass2: '#7bc04a',
    grass3: '#a9e07a', path: '#f3dfb2', path2: '#e4c58f', stone: '#e9e2d4', wall: '#fff3dc', wall2: '#f4dfbd',
    roof: '#e2574c', roof2: '#b9403a', door: '#2f86c9', glass: '#bfe8ff', wood: '#b8743c', wood2: '#8e5426',
    water: '#5cc4ef', water2: '#a3e3fb', leaf: '#5fb94a', leaf2: '#479a3a', leaf3: '#86d05f', trunk: '#8a5530',
    red: '#ff5a4f', yellow: '#ffc93c', pink: '#ff8fcf', purple: '#a96bf0', white: '#ffffff', orange: '#ff9a2e',
    blue: '#2c6fb7', berry: '#6a2bd9', soil: '#7a4a2a', teal: '#3fae9a',
  };

  const M = { ready: false, active: true, levels: STOPS.map(([x, y]) => ({ x, y })), current: null, pongoAt: 0 };
  let canvas, ctx, bg, W = 0, H = 0, DPR = 1;
  let markersEl, markerEls = [];
  let onSelect = () => {}, onPongo = () => {};
  const cam = { x: 0, y: 0, s: 1 };
  let camGoal = null;
  let pts = [], lens = [], total = 0, stopLen = [];
  const pongo = { x: 0, y: 0, dir: 1, mode: 'idle', t: 0, walk: null, jumpT: 0 };
  const imgs = {};
  let clouds = [], flies = [], last = 0;

  // ------------------------------------------------------------ helpers
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function shape(c, draw, fill, lw = 4, stroke = OUT) {
    c.beginPath();
    draw(c);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
  }
  const circle = (c, x, y, r, fill, lw = 4) => shape(c, (k) => k.arc(x, y, r, 0, Math.PI * 2), fill, lw);
  const ellipse = (c, x, y, rx, ry, fill, lw = 4) => shape(c, (k) => k.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), fill, lw);
  const rrect = (c, x, y, w, h, r, fill, lw = 4) => shape(c, (k) => k.roundRect(x, y, w, h, r), fill, lw);
  function blob(c, x, y, r, n, fill, lw = 4) { // nuvem de bolinhas com um contorno só
    const parts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      parts.push([x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.5, r * (0.5 + rnd() * 0.2)]);
    }
    parts.push([x, y, r * 0.75]);
    c.save();
    c.lineWidth = lw * 2; c.strokeStyle = OUT; c.lineJoin = 'round';
    parts.forEach(([px, py, pr]) => { c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.stroke(); });
    c.fillStyle = fill;
    parts.forEach(([px, py, pr]) => { c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill(); });
    c.restore();
    return parts;
  }

  function catmull(p, steps) {
    const q = [p[0], ...p, p[p.length - 1]], out = [];
    for (let i = 1; i < q.length - 2; i++) {
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * q[i][k] + (-q[i - 1][k] + q[i + 1][k]) * t
          + (2 * q[i - 1][k] - 5 * q[i][k] + 4 * q[i + 1][k] - q[i + 2][k]) * t2
          + (-q[i - 1][k] + 3 * q[i][k] - 3 * q[i + 1][k] + q[i + 2][k]) * t3)));
      }
    }
    out.push(p[p.length - 1]);
    return out;
  }
  function pointAt(d) {
    d = Math.max(0, Math.min(total, d));
    let i = 1;
    while (i < lens.length && lens[i] < d) i++;
    const a = pts[i - 1], b = pts[Math.min(i, pts.length - 1)];
    const seg = (lens[i] - lens[i - 1]) || 1, k = (d - lens[i - 1]) / seg;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  }

  // ------------------------------------------------------------ static scene
  function flower(c, x, y, col, r = 7) {
    c.save(); c.lineWidth = 2.5; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(x, y + r); c.lineTo(x, y + r * 3); c.strokeStyle = '#3e8a2f'; c.lineWidth = 3; c.stroke();
    c.restore();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      circle(c, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.62, col, 2.2);
    }
    circle(c, x, y, r * 0.45, col === C.yellow ? C.orange : C.yellow, 2.2);
  }
  function tree(c, x, y, s = 1, kind = 'round') {
    if (kind === 'pine') {
      rrect(c, x - 8 * s, y - 30 * s, 16 * s, 34 * s, 4, C.trunk, 3.5);
      [[0, 70, 46], [-38, 58, 36], [-70, 44, 26]].forEach(([dy, h, w]) =>
        shape(c, (k) => { k.moveTo(x - w * s, y - 22 * s + dy * s); k.lineTo(x, y - 22 * s + dy * s - h * s); k.lineTo(x + w * s, y - 22 * s + dy * s); k.closePath(); }, '#3f9a55', 4));
      return;
    }
    rrect(c, x - 10 * s, y - 50 * s, 20 * s, 54 * s, 5, C.trunk, 3.5);
    blob(c, x, y - 82 * s, 52 * s, 6, [C.leaf, C.leaf2, C.leaf3][(rnd() * 3) | 0], 3);
  }
  function bush(c, x, y, s, col = C.leaf2) { blob(c, x, y, 34 * s, 5, col, 3); }

  function drawScene(c) {
    seed = 7;
    // céu
    const g = c.createLinearGradient(0, 0, 0, 360);
    g.addColorStop(0, C.sky1); g.addColorStop(1, C.sky2);
    c.fillStyle = g; c.fillRect(0, 0, WORLD.w, 380);
    // sol com raios
    c.save(); c.translate(120, 95);
    for (let i = 0; i < 12; i++) {
      c.rotate(Math.PI / 6);
      shape(c, (k) => { k.moveTo(58, -9); k.lineTo(92, 0); k.lineTo(58, 9); k.closePath(); }, C.yellow, 3);
    }
    c.restore();
    circle(c, 120, 95, 56, '#ffd84a', 4);
    shape(c, (k) => k.arc(120, 100, 26, 0.15 * Math.PI, 0.85 * Math.PI), null, 4);
    circle(c, 104, 84, 5, OUT, 0); circle(c, 136, 84, 5, OUT, 0);
    // morros
    shape(c, (k) => { k.moveTo(0, 330); k.bezierCurveTo(250, 170, 520, 300, 760, 250); k.bezierCurveTo(1000, 200, 1300, 150, 1600, 260); k.lineTo(1600, 420); k.lineTo(0, 420); k.closePath(); }, C.hill1, 4);
    shape(c, (k) => { k.moveTo(0, 380); k.bezierCurveTo(300, 290, 600, 360, 900, 320); k.bezierCurveTo(1200, 280, 1400, 300, 1600, 330); k.lineTo(1600, 440); k.lineTo(0, 440); k.closePath(); }, C.hill2, 4);
    for (let i = 0; i < 14; i++) tree(c, 40 + i * 118 + rnd() * 30, 330 + rnd() * 20, 0.55 + rnd() * 0.2, i % 3 ? 'pine' : 'round');
    // gramado
    shape(c, (k) => { k.moveTo(0, 400); k.bezierCurveTo(400, 360, 1100, 380, 1600, 360); k.lineTo(1600, 1000); k.lineTo(0, 1000); k.closePath(); }, C.grass, 4);
    c.save(); c.globalAlpha = 0.35;
    for (let i = 0; i < 9; i++) {
      c.fillStyle = i % 2 ? C.grass3 : C.grass2;
      c.beginPath(); c.ellipse(rnd() * 1600, 470 + rnd() * 500, 180 + rnd() * 160, 40 + rnd() * 30, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // cerca do fundo
    for (let x = 10; x < 1600; x += 34) {
      const y = 392 - Math.sin(x / 300) * 10;
      if (x > 1080 && x < 1530) continue;
      shape(c, (k) => { k.moveTo(x, y + 44); k.lineTo(x, y + 6); k.lineTo(x + 10, y - 4); k.lineTo(x + 20, y + 6); k.lineTo(x + 20, y + 44); k.closePath(); }, C.white, 3);
    }
    rrect(c, 0, 400, 1080, 9, 3, C.white, 3);
    // varal
    [[110, 470], [330, 455]].forEach(([x, y]) => rrect(c, x - 5, y - 90, 10, 92, 3, '#9aa5ad', 3));
    shape(c, (k) => { k.moveTo(110, 384); k.quadraticCurveTo(220, 400, 330, 368); }, null, 3);
    [[140, C.red], [190, C.blue], [240, C.yellow], [285, C.pink]].forEach(([x, col], i) =>
      rrect(c, x, 386 + (i === 1 ? 4 : 0), 34, 40, 4, col, 3));
    // casa
    const hx = 1300, hy = 400;
    rrect(c, hx - 210, hy - 190, 420, 200, 8, C.wall, 5);
    c.fillStyle = C.wall2; c.fillRect(hx - 205, hy - 20, 410, 26);
    rrect(c, hx + 110, hy - 330, 46, 120, 4, '#b5523b', 4);
    rrect(c, hx + 102, hy - 340, 62, 18, 4, '#8f3f2e', 4);
    shape(c, (k) => { k.moveTo(hx - 250, hy - 180); k.lineTo(hx, hy - 330); k.lineTo(hx + 250, hy - 180); k.closePath(); }, C.roof, 5);
    c.save(); c.strokeStyle = C.roof2; c.lineWidth = 3;
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(hx - 250 + i * 50, hy - 180 - i * 30); c.lineTo(hx + 250 - i * 50, hy - 180 - i * 30); c.stroke(); }
    c.restore();
    circle(c, hx, hy - 250, 26, C.glass, 4);
    shape(c, (k) => { k.moveTo(hx - 26, hy - 250); k.lineTo(hx + 26, hy - 250); k.moveTo(hx, hy - 276); k.lineTo(hx, hy - 224); }, null, 3);
    [-130, 130].forEach((dx) => {
      rrect(c, hx + dx - 50, hy - 150, 100, 80, 6, C.glass, 4);
      shape(c, (k) => { k.moveTo(hx + dx, hy - 150); k.lineTo(hx + dx, hy - 70); k.moveTo(hx + dx - 50, hy - 110); k.lineTo(hx + dx + 50, hy - 110); }, null, 3);
      c.save(); c.globalAlpha = 0.6; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(hx + dx - 40, hy - 140); c.lineTo(hx + dx - 20, hy - 140); c.lineTo(hx + dx - 40, hy - 120); c.fill(); c.restore();
      rrect(c, hx + dx - 58, hy - 70, 116, 24, 4, C.wood, 4);
      [C.red, C.yellow, C.pink, C.purple, C.red].forEach((col, i) => circle(c, hx + dx - 44 + i * 22, hy - 74, 9, col, 3));
    });
    shape(c, (k) => { k.moveTo(hx - 52, hy); k.lineTo(hx - 52, hy - 120); k.quadraticCurveTo(hx, hy - 160, hx + 52, hy - 120); k.lineTo(hx + 52, hy); k.closePath(); }, C.white, 5);
    shape(c, (k) => { k.moveTo(hx - 40, hy); k.lineTo(hx - 40, hy - 112); k.quadraticCurveTo(hx, hy - 144, hx + 40, hy - 112); k.lineTo(hx + 40, hy); k.closePath(); }, C.door, 4);
    circle(c, hx + 26, hy - 54, 6, C.yellow, 3);
    circle(c, hx, hy - 100, 13, C.glass, 3);
    rrect(c, hx - 80, hy - 4, 160, 20, 5, C.wall2, 4);
    rrect(c, hx - 100, hy + 12, 200, 20, 5, '#e8d6b4', 4);
    rrect(c, hx - 44, hy + 2, 88, 12, 4, C.orange, 3);
    bush(c, hx - 240, hy + 6, 1.1); bush(c, hx + 240, hy + 6, 1.1);
    // caminho de terra com pedras
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const trace = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
    trace(); c.strokeStyle = OUT; c.lineWidth = 72; c.stroke();
    trace(); c.strokeStyle = C.path; c.lineWidth = 64; c.stroke();
    trace(); c.strokeStyle = C.path2; c.lineWidth = 18; c.setLineDash([2, 40]); c.stroke();
    c.restore();
    for (let d = 20; d < total; d += 46) {
      const [x, y] = pointAt(d);
      if (STOPS.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 60)) continue;
      ellipse(c, x + (rnd() - 0.5) * 18, y + (rnd() - 0.5) * 10, 14, 9, C.stone, 3);
    }
    // plataformas das paradas
    STOPS.forEach(([x, y]) => {
      ellipse(c, x, y + 6, 64, 30, '#b9ab92', 4);
      ellipse(c, x, y, 60, 27, '#f6ead1', 4);
    });
    // lago
    const px = 205, py = 610;
    ellipse(c, px, py, 150, 78, '#b9ab92', 5);
    ellipse(c, px, py - 4, 136, 66, C.water, 4);
    c.save(); c.globalAlpha = 0.7; ellipse(c, px - 30, py - 20, 70, 24, C.water2, 0); c.restore();
    [[-70, 14], [40, 24], [85, -18]].forEach(([dx, dy]) => {
      shape(c, (k) => { k.moveTo(px + dx, py + dy); k.arc(px + dx, py + dy, 20, 0.3, Math.PI * 2 - 0.3); k.closePath(); }, '#58cc02', 3);
    });
    circle(c, px + 40, py + 18, 7, C.pink, 2.5);
    ellipse(c, px - 10, py - 6, 26, 18, C.yellow, 3.5);
    circle(c, px + 12, py - 26, 13, C.yellow, 3.5);
    shape(c, (k) => { k.moveTo(px + 22, py - 30); k.lineTo(px + 38, py - 24); k.lineTo(px + 22, py - 20); k.closePath(); }, C.orange, 3);
    circle(c, px + 14, py - 30, 2.6, OUT, 0);
    for (let i = 0; i < 6; i++) {
      const x = px - 150 + i * 9, y = py - 40 + i * 4;
      shape(c, (k) => { k.moveTo(x, y + 50); k.quadraticCurveTo(x - 4, y + 10, x + 2, y - 10); }, null, 4, '#3e8a2f');
      ellipse(c, x + 2, y - 12, 5, 13, C.trunk, 2.5);
    }
    // canteiros de flores
    [[560, 875, 200, 60], [330, 750, 120, 46], [830, 820, 170, 56]].forEach(([x, y, w, h]) => {
      rrect(c, x - w / 2, y - h / 2, w, h, 8, C.soil, 4);
      rrect(c, x - w / 2 - 6, y + h / 2 - 8, w + 12, 14, 4, C.wood, 3.5);
      for (let i = 0; i < w / 26; i++) flower(c, x - w / 2 + 16 + i * 26, y - h / 2 + 8 + (i % 2) * 14, [C.red, C.yellow, C.pink, C.purple, C.white][i % 5], 8);
    });
    // árvore grande com balanço
    const tx = 790, ty = 520;
    shape(c, (k) => { k.moveTo(tx - 30, ty); k.quadraticCurveTo(tx - 20, ty - 90, tx - 26, ty - 170); k.lineTo(tx + 26, ty - 170); k.quadraticCurveTo(tx + 20, ty - 90, tx + 34, ty); k.closePath(); }, C.trunk, 5);
    shape(c, (k) => { k.moveTo(tx + 10, ty - 140); k.quadraticCurveTo(tx + 70, ty - 150, tx + 120, ty - 175); }, null, 14);
    shape(c, (k) => { k.moveTo(tx + 10, ty - 140); k.quadraticCurveTo(tx + 70, ty - 150, tx + 120, ty - 175); }, null, 8, C.trunk);
    blob(c, tx, ty - 230, 120, 8, C.leaf, 4);
    blob(c, tx - 70, ty - 200, 60, 5, C.leaf2, 3);
    blob(c, tx + 80, ty - 210, 64, 5, C.leaf3, 3);
    for (let i = 0; i < 7; i++) circle(c, tx - 90 + rnd() * 180, ty - 290 + rnd() * 120, 10, C.orange, 3);
    shape(c, (k) => { k.moveTo(tx + 92, ty - 166); k.lineTo(tx + 92, ty - 70); k.moveTo(tx + 122, ty - 176); k.lineTo(tx + 122, ty - 70); }, null, 3, '#6b4a2a');
    ellipse(c, tx + 107, ty - 52, 32, 22, '#333', 5);
    ellipse(c, tx + 107, ty - 52, 15, 9, C.grass2, 3);
    // banco e bola
    rrect(c, 560, 640, 110, 14, 4, C.wood, 3.5);
    rrect(c, 560, 610, 110, 22, 4, C.wood, 3.5);
    [570, 650].forEach((x) => rrect(c, x, 654, 8, 22, 2, '#9aa5ad', 3));
    circle(c, 640, 720, 15, C.yellow, 3.5);
    shape(c, (k) => k.arc(640, 720, 15, -0.6, 0.6), null, 3, C.white);
    // casinha do Pongo
    const dx = 1095, dy = 715;
    rrect(c, dx - 75, dy - 110, 150, 112, 6, C.red, 5);
    shape(c, (k) => { k.moveTo(dx - 95, dy - 100); k.lineTo(dx, dy - 180); k.lineTo(dx + 95, dy - 100); k.closePath(); }, C.blue, 5);
    shape(c, (k) => { k.moveTo(dx - 34, dy); k.lineTo(dx - 34, dy - 50); k.arc(dx, dy - 50, 34, Math.PI, 0); k.lineTo(dx + 34, dy); k.closePath(); }, '#3a2a22', 4);
    rrect(c, dx - 52, dy - 150, 104, 30, 6, '#f6ead1', 4);
    c.fillStyle = OUT; c.font = '800 22px "Baloo 2", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.fillText('PONGO', dx, dy - 128);
    ellipse(c, dx - 110, dy - 4, 26, 11, C.blue, 3.5); ellipse(c, dx - 110, dy - 8, 18, 6, C.trunk, 2.5);
    ellipse(c, dx + 110, dy - 2, 26, 11, C.red, 3.5); ellipse(c, dx + 110, dy - 6, 18, 6, C.water, 2.5);
    // osso
    const bx = 920, by = 760;
    rrect(c, bx - 22, by - 6, 44, 12, 5, C.white, 3);
    [[-22, -6], [-22, 6], [22, -6], [22, 6]].forEach(([ox, oy]) => circle(c, bx + ox, by + oy, 8, C.white, 3));
    rrect(c, bx - 20, by - 5, 40, 10, 4, C.white, 0);
    // horta de frutinhas
    [[1340, 600], [1430, 590], [1520, 610], [1380, 680], [1480, 690]].forEach(([x, y]) => {
      const parts = blob(c, x, y, 52, 5, C.leaf2, 3);
      parts.slice(0, 5).forEach(([qx, qy], i) => { circle(c, qx, qy, 7, i % 2 ? C.berry : C.red, 2.5); circle(c, qx + 12, qy + 8, 6, C.berry, 2.5); });
    });
    rrect(c, 1250, 640, 56, 40, 8, C.wood, 4);
    [0, 1, 2].forEach((i) => circle(c, 1262 + i * 16, 640, 8, C.berry, 2.5));
    // cerca da frente com portão
    for (let x = 0; x < 1600; x += 34) {
      if (x > 105 && x < 245) continue;
      const y = 948;
      shape(c, (k) => { k.moveTo(x, y + 52); k.lineTo(x, y + 8); k.lineTo(x + 11, y - 4); k.lineTo(x + 22, y + 8); k.lineTo(x + 22, y + 52); k.closePath(); }, C.white, 3);
    }
    rrect(c, 0, 966, 108, 10, 3, C.white, 3); rrect(c, 242, 966, 1360, 10, 3, C.white, 3);
    [100, 250].forEach((x) => rrect(c, x - 14, 860, 28, 140, 6, C.wood, 4));
    shape(c, (k) => k.arc(175, 880, 90, Math.PI * 1.08, Math.PI * 1.92), null, 16);
    shape(c, (k) => k.arc(175, 880, 90, Math.PI * 1.08, Math.PI * 1.92), null, 10, C.leaf);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.12 + i * 0.12);
      flower(c, 175 + Math.cos(a) * 90, 880 + Math.sin(a) * 90, [C.pink, C.yellow, C.red][i % 3], 7);
    }
    // caixa de correio
    rrect(c, 300, 905, 8, 60, 2, C.wood, 3);
    rrect(c, 282, 880, 44, 30, 10, C.blue, 3.5);
    rrect(c, 322, 872, 4, 18, 1, C.red, 2);
    // árvores e arbustos das bordas
    tree(c, 1560, 520, 1.1); tree(c, 40, 700, 1.0, 'pine'); tree(c, 1555, 860, 1.0, 'pine');
    bush(c, 470, 470, 1); bush(c, 980, 470, 0.9, C.leaf); bush(c, 60, 860, 1.1); bush(c, 1450, 870, 1);
    // tufos de grama e florzinhas soltas
    for (let i = 0; i < 160; i++) {
      const x = rnd() * 1600, y = 440 + rnd() * 520;
      if (pts.some(([qx, qy]) => Math.hypot(qx - x, qy - y) < 50)) continue;
      if (i % 5 === 0) { circle(c, x, y, 4.5, [C.white, C.yellow, C.pink][i % 3], 2); continue; }
      shape(c, (k) => { k.moveTo(x - 7, y); k.lineTo(x - 3, y - 10); k.lineTo(x, y); k.lineTo(x + 3, y - 12); k.lineTo(x + 7, y); }, null, 2.5, '#3e8a2f');
    }
  }

  // ------------------------------------------------------------ setup
  function load(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  M.init = function (opts) {
    onSelect = opts.onSelect || onSelect;
    onPongo = opts.onPongo || onPongo;
    markersEl = opts.markers;
    canvas = opts.canvas;
    ctx = canvas.getContext('2d');
    pts = catmull(PATH, 24);
    lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    total = lens[lens.length - 1];
    stopLen = STOPS.map(([x, y]) => {
      let best = 0, bd = Infinity;
      pts.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = lens[i]; } });
      return best;
    });
    return Promise.all([load(SP.walk), load(SP.jump)]).then(([w, j]) => {
      imgs.walk = w; imgs.jump = j;
      const RES = 2;
      bg = document.createElement('canvas');
      bg.width = WORLD.w * RES; bg.height = WORLD.h * RES;
      const b = bg.getContext('2d');
      b.scale(RES, RES); b.lineJoin = 'round'; b.lineCap = 'round';
      drawScene(b);
      for (let i = 0; i < 6; i++) clouds.push({ x: rnd() * 1700 - 100, y: 30 + rnd() * 110, s: 0.5 + rnd() * 0.5, v: 8 + rnd() * 10 });
      for (let i = 0; i < 4; i++) flies.push({ x: 300 + rnd() * 1000, y: 480 + rnd() * 380, p: rnd() * 6, c: [C.yellow, C.pink, C.white, C.orange][i] });
      buildMarkers();
      bindInput();
      resize();
      window.addEventListener('resize', resize);
      M.ready = true;
      requestAnimationFrame(tick);
    });
  };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    if (M.ready) { Object.assign(cam, centerOn(pongo.x, pongo.y - 60, cover() * 1.35)); camGoal = null; }
    clampCam();
  }
  const cover = () => Math.max(W / WORLD.w, H / WORLD.h);
  function clampCam() {
    const minS = cover();
    cam.s = Math.max(minS, Math.min(minS * 2.6, cam.s));
    const vw = W / cam.s, vh = H / cam.s;
    cam.x = Math.max(0, Math.min(WORLD.w - vw, cam.x));
    cam.y = Math.max(0, Math.min(WORLD.h - vh, cam.y));
  }
  function centerOn(x, y, s) {
    return { s, x: x - W / s / 2, y: y - H / s / 2 };
  }

  // ------------------------------------------------------------ markers (same look as the 3D map)
  function buildMarkers() {
    markersEl.innerHTML = '';
    markerEls = STOPS.map((_, i) => {
      const b = document.createElement('button');
      b.className = 'marker locked';
      b.type = 'button';
      b.innerHTML = `<span class="marker-disc"><span class="marker-num">${i + 1}</span></span><span class="marker-label"></span>`;
      b.addEventListener('click', (ev) => { ev.stopPropagation(); onSelect(i, b); });
      markersEl.appendChild(b);
      return b;
    });
  }
  M.setMarkers = function (states, labels) {
    markerEls.forEach((b, i) => {
      b.className = 'marker ' + states[i].state;
      b.setAttribute('aria-label', `Lição ${i + 1}: ${labels[i]} (${states[i].text})`);
      b.querySelector('.marker-label').textContent = labels[i];
      b.querySelector('.marker-num').innerHTML = states[i].state === 'locked'
        ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"/></svg>'
        : states[i].state === 'done'
          ? '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7Z"/></svg>'
          : String(i + 1);
      b.dataset.stars = states[i].stars ? '★'.repeat(states[i].stars) + '☆'.repeat(3 - states[i].stars) : '';
    });
  };
  function placeMarkers() {
    STOPS.forEach(([x, y], i) => {
      const el = markerEls[i];
      // marcador ao lado da plataforma, à esquerda, para não cobrir o Pongo
      const sx = (x - 100 - cam.x) * cam.s, sy = (y - 45 - cam.y) * cam.s;
      el.style.visibility = sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80 ? 'hidden' : '';
      el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
    });
  }

  // ------------------------------------------------------------ input: arrastar, zoom e tocar no Pongo
  function bindInput() {
    const ptr = new Map();
    let down = null, pinch = 0;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
      down = { x: e.clientX, y: e.clientY, moved: false };
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
      camGoal = null;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId)) return;
      const prev = ptr.get(e.pointerId);
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptr.size === 2) {
        const [a, b] = [...ptr.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / pinch);
        pinch = d;
      } else {
        cam.x -= (e.clientX - prev[0]) / cam.s;
        cam.y -= (e.clientY - prev[1]) / cam.s;
        clampCam();
      }
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
    });
    const up = (e) => {
      ptr.delete(e.pointerId);
      if (ptr.size < 2) pinch = 0;
      if (down && !down.moved && ptr.size === 0) {
        const wx = e.clientX / cam.s + cam.x, wy = e.clientY / cam.s + cam.y;
        if (Math.abs(wx - pongo.x) < 60 && wy < pongo.y + 10 && wy > pongo.y - 130) { M.jump(); onPongo(); }
      }
      if (ptr.size === 0) down = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 0.9); }, { passive: false });
  }
  function zoomAt(sx, sy, f) {
    const wx = sx / cam.s + cam.x, wy = sy / cam.s + cam.y;
    cam.s *= f;
    clampCam();
    cam.x = wx - sx / cam.s; cam.y = wy - sy / cam.s;
    clampCam();
  }

  // ------------------------------------------------------------ Pongo
  M.placePongo = function (i) {
    M.pongoAt = i;
    const [x, y] = pointAt(stopLen[i]);
    pongo.x = x; pongo.y = y; pongo.mode = 'idle'; pongo.dir = 1;
    M.focus(i, true);
  };
  M.walkTo = function (i) {
    return new Promise((resolve) => {
      const from = stopLen[M.pongoAt], to = stopLen[i];
      pongo.walk = { from, to, d: 0, len: Math.abs(to - from), resolve };
      pongo.mode = 'walk';
      M.pongoAt = i;
    });
  };
  M.jump = function () { if (pongo.mode !== 'walk') { pongo.mode = 'jump'; pongo.jumpT = 0; } };
  M.focus = function (i, instant) {
    const [x, y] = STOPS[i];
    const g = centerOn(x, y - 60, cover() * 1.35);
    if (instant) { Object.assign(cam, g); clampCam(); } else camGoal = g;
  };
  M.overview = function () { camGoal = centerOn(WORLD.w / 2, WORLD.h / 2, cover()); };
  M.setActive = function (on) { M.active = on; if (markersEl) markersEl.hidden = !on; last = 0; };

  function drawPongo(c, time) {
    const k = 0.62;
    let img = imgs.jump, meta = SP.meta.jump, f = meta.n - 1, bob = Math.sin(time * 3) * 1.5;
    if (pongo.mode === 'walk') { img = imgs.walk; meta = SP.meta.walk; f = Math.floor(time * 12) % meta.n; bob = 0; }
    if (pongo.mode === 'jump') { f = Math.min(meta.n - 1, Math.floor(pongo.jumpT * 11)); bob = 0; }
    const w = meta.w * k, h = meta.h * k;
    c.save();
    c.globalAlpha = 0.22; c.fillStyle = OUT;
    c.beginPath(); c.ellipse(pongo.x, pongo.y + 4, 44, 12, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.save();
    c.translate(pongo.x, pongo.y + 8 + bob);
    c.scale(pongo.dir, 1);
    c.drawImage(img, f * meta.w, 0, meta.w, meta.h, -w / 2, -h, w, h);
    c.restore();
  }

  // ------------------------------------------------------------ loop
  function tick(now) {
    requestAnimationFrame(tick);
    if (!M.active || !M.ready) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const time = now / 1000;

    if (pongo.mode === 'walk' && pongo.walk) {
      const wk = pongo.walk;
      wk.d += dt * 210;
      const dirSign = Math.sign(wk.to - wk.from) || 1;
      const pos = wk.from + dirSign * Math.min(wk.d, wk.len);
      const [x, y] = pointAt(pos);
      const [nx] = pointAt(pos + dirSign * 6);
      if (Math.abs(nx - x) > 0.3) pongo.dir = nx > x ? 1 : -1;
      pongo.x = x; pongo.y = y;
      camGoal = centerOn(x, y - 60, Math.max(cam.s, cover() * 1.2));
      if (wk.d >= wk.len) { const r = wk.resolve; pongo.walk = null; pongo.mode = 'jump'; pongo.jumpT = 0; pongo.dir = 1; r(); }
    }
    if (pongo.mode === 'jump') { pongo.jumpT += dt; if (pongo.jumpT > 0.8) pongo.mode = 'idle'; }
    if (camGoal) {
      cam.x += (camGoal.x - cam.x) * 0.08; cam.y += (camGoal.y - cam.y) * 0.08; cam.s += (camGoal.s - cam.s) * 0.08;
      clampCam();
      if (Math.abs(camGoal.x - cam.x) + Math.abs(camGoal.y - cam.y) < 1 && pongo.mode !== 'walk') camGoal = null;
    }

    const c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = C.grass; c.fillRect(0, 0, W, H);
    c.setTransform(DPR * cam.s, 0, 0, DPR * cam.s, -cam.x * cam.s * DPR, -cam.y * cam.s * DPR);
    c.drawImage(bg, 0, 0, WORLD.w, WORLD.h);
    c.lineJoin = 'round';
    // nuvens
    clouds.forEach((cl) => {
      cl.x += cl.v * dt; if (cl.x > 1750) cl.x = -150;
      c.save(); c.translate(cl.x, cl.y); c.scale(cl.s, cl.s);
      seed = 99; blob(c, 0, 0, 60, 5, C.white, 3);
      c.restore();
    });
    // fumaça da chaminé
    for (let i = 0; i < 3; i++) {
      const t = (time * 0.4 + i / 3) % 1;
      c.save(); c.globalAlpha = 0.7 * (1 - t);
      circle(c, 1433 + Math.sin(t * 6) * 10, 50 - t * 90, 10 + t * 18, '#f2f2f2', 3);
      c.restore();
    }
    // brilho no lago
    for (let i = 0; i < 3; i++) {
      const a = (Math.sin(time * 2 + i * 2) + 1) / 2;
      c.save(); c.globalAlpha = a; c.fillStyle = '#fff';
      c.beginPath(); c.arc(150 + i * 60, 600 + (i % 2) * 20, 3 + a * 2, 0, Math.PI * 2); c.fill(); c.restore();
    }
    // borboletas
    flies.forEach((b, i) => {
      b.p += dt;
      const x = b.x + Math.sin(b.p * 0.6) * 120, y = b.y + Math.sin(b.p * 1.3) * 40;
      const wing = 8 * Math.abs(Math.sin(b.p * 14));
      ellipse(c, x - wing / 2 - 2, y, wing / 2 + 2, 7, b.c, 2.5);
      ellipse(c, x + wing / 2 + 2, y, wing / 2 + 2, 7, b.c, 2.5);
      shape(c, (k) => { k.moveTo(x, y - 6); k.lineTo(x, y + 6); }, null, 3);
    });
    // anel pulsando na parada atual
    if (M.current != null) {
      const [x, y] = STOPS[M.current];
      const p = (Math.sin(time * 4) + 1) / 2;
      c.save(); c.globalAlpha = 0.5 + p * 0.4;
      c.lineWidth = 6; c.strokeStyle = '#ffc93c';
      c.beginPath(); c.ellipse(x, y, 66 + p * 10, 31 + p * 5, 0, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
    drawPongo(c, time);
    placeMarkers();
  }

  window.PongoMap = M;
})();
