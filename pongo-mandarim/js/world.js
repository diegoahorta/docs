// Mundo 2D cartoon: rolagem lateral com camadas em parallax desenhadas em canvas
// (contorno escuro, cores chapadas, no estilo dos sprites do Pongo).
// O Pongo é animado com as folhas de sprites (andar e pular) recortadas das artes.
import { LEVELS } from './data.js';
import { asset, expr, SPRITES } from './assets.js';

// ---------------------------------------------------------------- medidas (unidades de desenho)
const DH = 700; // altura de referência
const GY = 560; // linha do chão
const START = 220;
const GATES = [1000, 1950, 2900];
const STOP = 270; // o Pongo para esta distância antes do portal
const END = 3800;
const SPEED = 230; // unidades por segundo
const PONGO_H = 175; // altura do Pongo em pé
const INK = '#2b2135';

export const GATE_FRAC = GATES.map((g) => (g - STOP - START) / (END - START));

// ---------------------------------------------------------------- utilidades
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a, b, t) => a + (b - a) * t;

function ink(c, w = 4) {
  c.lineWidth = w;
  c.strokeStyle = INK;
  c.lineJoin = 'round';
  c.lineCap = 'round';
}
function fs(c, fill, w = 4) {
  c.fillStyle = fill;
  c.fill();
  if (w) {
    ink(c, w);
    c.stroke();
  }
}
// várias bolas unidas com contorno só por fora (truque de cartoon)
function blob(c, circles, fill, w = 4) {
  ink(c, w * 2);
  c.beginPath();
  for (const [x, y, r] of circles) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
  }
  c.stroke();
  c.fillStyle = fill;
  c.fill();
}
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}
function ellipse(c, x, y, rx, ry, fill, w = 4) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  fs(c, fill, w);
}

// ---------------------------------------------------------------- peças do cenário
const D = {
  cloud(c, it, t) {
    const x = it.x + ((t * 6 * it.s) % 400) - 200;
    const y = it.y;
    const w = 60 * it.s;
    blob(c, [[x, y, w * 0.55], [x + w * 0.6, y - w * 0.25, w * 0.6], [x + w * 1.2, y, w * 0.5], [x + w * 0.6, y + w * 0.12, w * 0.5]], '#ffffff', 3);
  },
  sun(c, it, t) {
    c.save();
    c.translate(it.x, it.y);
    c.rotate(t * 0.15);
    c.fillStyle = 'rgba(255,214,90,0.55)';
    for (let i = 0; i < 12; i++) {
      c.rotate(Math.PI / 6);
      c.beginPath();
      c.moveTo(0, -70);
      c.lineTo(12, -100);
      c.lineTo(-12, -100);
      c.closePath();
      c.fill();
    }
    c.restore();
    ellipse(c, it.x, it.y, 55, 55, '#ffd65a', 4);
    ellipse(c, it.x - 16, it.y - 16, 14, 10, '#fff1b0', 0);
  },
  hill(c, it) {
    const { x, w, h } = it;
    c.beginPath();
    c.moveTo(x - w / 2, GY + 60);
    c.bezierCurveTo(x - w * 0.3, GY - h, x + w * 0.3, GY - h, x + w / 2, GY + 60);
    c.closePath();
    fs(c, it.color, 4);
  },
  karst(c, it) {
    const { x, w, h } = it;
    const b = it.base ?? GY + 40;
    c.beginPath();
    c.moveTo(x - w / 2, b);
    c.bezierCurveTo(x - w * 0.55, b - h * 0.7, x - w * 0.3, b - h, x, b - h);
    c.bezierCurveTo(x + w * 0.3, b - h, x + w * 0.55, b - h * 0.7, x + w / 2, b);
    c.closePath();
    fs(c, it.color, 4);
    // faixas de vegetação
    c.save();
    c.clip();
    c.fillStyle = it.shade;
    c.beginPath();
    c.ellipse(x - w * 0.25, b - h * 0.55, w * 0.18, h * 0.3, 0.2, 0, Math.PI * 2);
    c.fill();
    c.restore();
  },
  snowpeak(c, it) {
    const { x, w, h } = it;
    const b = GY + 40;
    c.beginPath();
    c.moveTo(x - w / 2, b);
    c.lineTo(x - w * 0.08, b - h);
    c.quadraticCurveTo(x, b - h - 14, x + w * 0.08, b - h);
    c.lineTo(x + w / 2, b);
    c.closePath();
    fs(c, it.color, 4);
    c.beginPath();
    c.moveTo(x - w * 0.18, b - h * 0.62);
    c.lineTo(x - w * 0.08, b - h);
    c.quadraticCurveTo(x, b - h - 14, x + w * 0.08, b - h);
    c.lineTo(x + w * 0.2, b - h * 0.6);
    c.lineTo(x + w * 0.08, b - h * 0.68);
    c.lineTo(x, b - h * 0.58);
    c.lineTo(x - w * 0.08, b - h * 0.67);
    c.closePath();
    fs(c, '#ffffff', 3);
  },
  tree(c, it, t) {
    const { x, s } = it;
    const sway = Math.sin(t * 1.2 + x) * 2;
    rrect(c, x - 10 * s, GY - 90 * s, 20 * s, 95 * s, 6);
    fs(c, '#8a5a36', 4);
    const fy = GY - 140 * s;
    const leaf = it.pink ? '#ffb3cf' : it.dark ? '#3f9a4c' : '#5fbf5a';
    blob(c, [[x - 45 * s + sway, fy + 15 * s, 45 * s], [x + sway, fy - 25 * s, 55 * s], [x + 48 * s + sway, fy + 12 * s, 44 * s], [x + sway, fy + 25 * s, 45 * s]], leaf, 4);
    c.fillStyle = it.pink ? '#ffd9e8' : '#8fe07f';
    c.beginPath();
    c.arc(x - 18 * s + sway, fy - 35 * s, 14 * s, 0, Math.PI * 2);
    c.arc(x + 30 * s + sway, fy - 5 * s, 9 * s, 0, Math.PI * 2);
    c.fill();
    if (it.pink) {
      c.fillStyle = '#ff7fae';
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.arc(x + Math.sin(i * 2.3) * 50 * s + sway, fy + Math.cos(i * 1.7) * 35 * s, 5 * s, 0, Math.PI * 2);
        c.fill();
      }
    }
  },
  bush(c, it) {
    const { x, s } = it;
    blob(c, [[x - 25 * s, GY - 18 * s, 26 * s], [x, GY - 32 * s, 30 * s], [x + 28 * s, GY - 16 * s, 24 * s]], it.color || '#4fae4f', 4);
  },
  flower(c, it, t) {
    const { x, s } = it;
    const y = (it.y ?? GY) - 34 * s;
    const sw = Math.sin(t * 2 + x) * 3;
    ink(c, 3);
    c.beginPath();
    c.moveTo(x, (it.y ?? GY) + 2);
    c.quadraticCurveTo(x + sw, y + 18 * s, x + sw, y);
    c.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t * 0.2;
      ellipse(c, x + sw + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 7 * s, 7 * s, it.color, 2.5);
    }
    ellipse(c, x + sw, y, 6 * s, 6 * s, '#ffd23f', 2.5);
  },
  tuft(c, it, t) {
    const { x, s } = it;
    const y = it.y ?? GY + 120;
    const sw = Math.sin(t * 1.6 + x * 0.1) * 4;
    c.beginPath();
    c.moveTo(x - 30 * s, y);
    c.quadraticCurveTo(x - 20 * s, y - 40 * s, x - 34 * s + sw, y - 70 * s);
    c.quadraticCurveTo(x - 8 * s, y - 40 * s, x - 4 * s, y - 20 * s);
    c.quadraticCurveTo(x, y - 60 * s, x + sw, y - 90 * s);
    c.quadraticCurveTo(x + 14 * s, y - 50 * s, x + 10 * s, y - 20 * s);
    c.quadraticCurveTo(x + 22 * s, y - 45 * s, x + 36 * s + sw, y - 64 * s);
    c.quadraticCurveTo(x + 30 * s, y - 30 * s, x + 30 * s, y);
    c.closePath();
    fs(c, it.color || '#3f9a4c', 4);
  },
  rock(c, it) {
    const { x, s } = it;
    c.beginPath();
    c.moveTo(x - 40 * s, GY + 4);
    c.quadraticCurveTo(x - 38 * s, GY - 34 * s, x - 6 * s, GY - 40 * s);
    c.quadraticCurveTo(x + 36 * s, GY - 38 * s, x + 42 * s, GY + 4);
    c.closePath();
    fs(c, '#a9adbb', 4);
    ellipse(c, x - 10 * s, GY - 26 * s, 10 * s, 5 * s, '#d4d7e0', 0);
  },
  fence(c, it) {
    const { x, w } = it;
    const y = it.y ?? GY;
    for (let px = x; px <= x + w; px += 34) {
      c.beginPath();
      c.moveTo(px - 9, y);
      c.lineTo(px - 9, y - 70);
      c.lineTo(px, y - 84);
      c.lineTo(px + 9, y - 70);
      c.lineTo(px + 9, y);
      c.closePath();
      fs(c, '#ffffff', 3.5);
    }
    for (const ry of [y - 58, y - 26]) {
      rrect(c, x - 14, ry, w + 28, 10, 3);
      fs(c, '#f4f0e8', 3);
    }
  },
  doghouse(c, it) {
    const { x } = it;
    rrect(c, x - 80, GY - 120, 160, 122, 8);
    fs(c, '#d0384e', 4);
    c.beginPath();
    c.moveTo(x - 100, GY - 112);
    c.lineTo(x, GY - 190);
    c.lineTo(x + 100, GY - 112);
    c.closePath();
    fs(c, '#3a86a0', 4);
    c.beginPath();
    c.moveTo(x - 32, GY + 2);
    c.lineTo(x - 32, GY - 50);
    c.arc(x, GY - 50, 32, Math.PI, 0);
    c.lineTo(x + 32, GY + 2);
    c.closePath();
    fs(c, '#3b2230', 4);
    rrect(c, x - 40, GY - 112, 80, 24, 6);
    fs(c, '#f2b631', 3);
    c.fillStyle = INK;
    c.font = '900 17px Nunito, sans-serif';
    c.textAlign = 'center';
    c.fillText('PONGO', x, GY - 94);
    // tigela e osso
    c.beginPath();
    c.moveTo(x + 110, GY - 22);
    c.lineTo(x + 170, GY - 22);
    c.lineTo(x + 160, GY + 2);
    c.lineTo(x + 120, GY + 2);
    c.closePath();
    fs(c, '#2449c6', 4);
  },
  bamboo(c, it, t) {
    const { x, h } = it;
    const sw = Math.sin(t * 0.9 + x * 0.01) * 6;
    const segs = Math.ceil(h / 70);
    for (let i = 0; i < segs; i++) {
      const y0 = GY - i * 70;
      const off = (sw * i) / segs;
      rrect(c, x - 11 + off, y0 - 70, 22, 72, 8);
      fs(c, it.color, 3.5);
      ink(c, 3.5);
      c.beginPath();
      c.moveTo(x - 13 + off, y0 - 70);
      c.lineTo(x + 13 + off, y0 - 70);
      c.stroke();
    }
    const top = GY - segs * 70;
    for (let i = 0; i < 5; i++) {
      const ly = top + 30 + i * 28;
      const dir = i % 2 ? 1 : -1;
      c.save();
      c.translate(x + sw + dir * 8, ly);
      c.rotate(dir * (0.5 + Math.sin(t + i) * 0.08));
      c.beginPath();
      c.ellipse(dir * 34, 0, 36, 9, 0, 0, Math.PI * 2);
      fs(c, '#8bd16a', 3);
      c.restore();
    }
  },
  terrace(c, it) {
    const { x, w } = it;
    for (let i = 0; i < 5; i++) {
      const y = GY + 30 - i * 34;
      const ww = w - i * 60;
      c.beginPath();
      c.moveTo(x - ww / 2, y + 10);
      c.quadraticCurveTo(x, y - 18, x + ww / 2, y + 10);
      c.lineTo(x + ww / 2, y + 36);
      c.quadraticCurveTo(x, y + 8, x - ww / 2, y + 36);
      c.closePath();
      fs(c, i % 2 ? '#a6d86a' : '#8cc95a', 3.5);
      ink(c, 2);
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.beginPath();
      c.moveTo(x - ww / 3, y + 20);
      c.quadraticCurveTo(x, y + 2, x + ww / 3, y + 20);
      c.stroke();
    }
  },
  hat(c, it, t) {
    const { x } = it;
    const y = GY - 8 + Math.sin(t * 2 + x) * 3;
    ink(c, 4);
    c.beginPath();
    c.moveTo(x, GY + 10);
    c.lineTo(x, y - 40);
    c.stroke();
    c.beginPath();
    c.moveTo(x - 44, y - 40);
    c.lineTo(x, y - 74);
    c.lineTo(x + 44, y - 40);
    c.closePath();
    fs(c, '#e7c46a', 4);
  },
  boat(c, it, t) {
    const { x, s } = it;
    const y = GY + 40 * s + Math.sin(t * 1.4 + x) * 5;
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(t * 1.1 + x) * 0.03);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(-110, -30);
    c.lineTo(120, -40);
    c.quadraticCurveTo(100, 10, 60, 14);
    c.lineTo(-80, 14);
    c.quadraticCurveTo(-110, 0, -110, -30);
    c.closePath();
    fs(c, '#8a4b2a', 4);
    ink(c, 4);
    c.beginPath();
    c.moveTo(0, -36);
    c.lineTo(0, -210);
    c.stroke();
    c.beginPath();
    c.moveTo(4, -200);
    c.quadraticCurveTo(90, -150, 80, -50);
    c.lineTo(4, -50);
    c.closePath();
    fs(c, '#e2723a', 4);
    ink(c, 2.5);
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.moveTo(4, -70 - k * 28);
      c.lineTo(80 - k * 6, -70 - k * 28 + 6);
      c.stroke();
    }
    c.restore();
  },
  lighthouse(c, it) {
    const { x } = it;
    c.beginPath();
    c.moveTo(x - 40, GY + 20);
    c.lineTo(x - 26, GY - 230);
    c.lineTo(x + 26, GY - 230);
    c.lineTo(x + 40, GY + 20);
    c.closePath();
    fs(c, '#ffffff', 4);
    for (const y of [GY - 60, GY - 160]) {
      c.beginPath();
      c.moveTo(x - 36, y);
      c.lineTo(x - 31, y - 40);
      c.lineTo(x + 31, y - 40);
      c.lineTo(x + 36, y);
      c.closePath();
      fs(c, '#d0384e', 3);
    }
    rrect(c, x - 22, GY - 270, 44, 40, 6);
    fs(c, '#ffd65a', 4);
    c.beginPath();
    c.moveTo(x - 30, GY - 270);
    c.lineTo(x, GY - 300);
    c.lineTo(x + 30, GY - 270);
    c.closePath();
    fs(c, '#d0384e', 4);
  },
  greatwall(c, it, t, x0, x1) {
    const yAt = (x) => GY - 120 - 70 * Math.sin(x * 0.0035) - 30 * Math.sin(x * 0.011);
    const a = Math.max(x0, it.x);
    const b = Math.min(x1, it.x + it.w);
    if (b <= a) return;
    c.beginPath();
    for (let x = a; x <= b; x += 12) c.lineTo(x, yAt(x));
    for (let x = b; x >= a; x -= 12) c.lineTo(x, yAt(x) + 34);
    c.closePath();
    fs(c, '#d8c39a', 3.5);
    for (let x = Math.ceil(a / 26) * 26; x <= b; x += 26) {
      rrect(c, x - 6, yAt(x) - 12, 12, 13, 2);
      fs(c, '#d8c39a', 2.5);
    }
    for (let x = Math.ceil(a / 520) * 520 + 140; x <= b; x += 520) {
      const y = yAt(x);
      rrect(c, x - 26, y - 56, 52, 70, 4);
      fs(c, '#cdb486', 3.5);
      c.beginPath();
      c.moveTo(x - 34, y - 54);
      c.lineTo(x, y - 78);
      c.lineTo(x + 34, y - 54);
      c.closePath();
      fs(c, '#5d7186', 3.5);
    }
  },
  pine(c, it) {
    const { x, s } = it;
    const b = it.base ?? GY;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x - (56 - i * 12) * s, b - (20 + i * 46) * s);
      c.lineTo(x, b - (110 + i * 46) * s);
      c.lineTo(x + (56 - i * 12) * s, b - (20 + i * 46) * s);
      c.closePath();
      fs(c, i % 2 ? '#3f9a4c' : '#2f7d45', 3.5);
    }
  },
  house(c, it) {
    const { x } = it;
    const w = 300;
    rrect(c, x - w / 2, GY - 170, w, 172, 4);
    fs(c, '#f3e9d8', 4);
    for (const px of [x - w / 2 + 14, x - 40, x + 40, x + w / 2 - 14]) {
      rrect(c, px - 10, GY - 170, 20, 172, 3);
      fs(c, '#c8283c', 3.5);
    }
    rrect(c, x - 28, GY - 110, 56, 112, 4);
    fs(c, '#9d1f2f', 3.5);
    ellipse(c, x - 8, GY - 55, 4, 4, '#f2b631', 2);
    ellipse(c, x + 8, GY - 55, 4, 4, '#f2b631', 2);
    for (const wx of [x - 95, x + 95]) {
      rrect(c, wx - 28, GY - 130, 56, 56, 4);
      fs(c, '#f7d9a0', 3.5);
      ink(c, 2.5);
      c.beginPath();
      c.moveTo(wx, GY - 130);
      c.lineTo(wx, GY - 74);
      c.moveTo(wx - 28, GY - 102);
      c.lineTo(wx + 28, GY - 102);
      c.stroke();
    }
    // telhado com beirais curvos
    c.beginPath();
    c.moveTo(x - w / 2 - 50, GY - 200);
    c.quadraticCurveTo(x - w / 2 - 30, GY - 172, x - w / 2 - 6, GY - 176);
    c.lineTo(x + w / 2 + 6, GY - 176);
    c.quadraticCurveTo(x + w / 2 + 30, GY - 172, x + w / 2 + 50, GY - 200);
    c.quadraticCurveTo(x + w / 2 - 10, GY - 210, x + w / 2 - 40, GY - 250);
    c.lineTo(x - w / 2 + 40, GY - 250);
    c.quadraticCurveTo(x - w / 2 + 10, GY - 210, x - w / 2 - 50, GY - 200);
    c.closePath();
    fs(c, '#6b7f96', 4);
    ink(c, 2);
    for (let k = -5; k <= 5; k++) {
      c.beginPath();
      c.moveTo(x + k * 30, GY - 246);
      c.lineTo(x + k * 33, GY - 180);
      c.stroke();
    }
    rrect(c, x - w / 2 + 30, GY - 262, w - 60, 16, 6);
    fs(c, '#55677d', 3.5);
    rrect(c, x - 40, GY - 196, 80, 22, 4);
    fs(c, '#f2b631', 3);
  },
  pagoda(c, it) {
    const { x, s } = it;
    let y = GY;
    for (let i = 0; i < 6; i++) {
      const w = (150 - i * 18) * s;
      rrect(c, x - w / 2, y - 60 * s, w, 60 * s, 3);
      fs(c, i % 2 ? '#f3e9d8' : '#c8283c', 3.5);
      c.beginPath();
      c.moveTo(x - w / 2 - 34 * s, y - 52 * s);
      c.quadraticCurveTo(x, y - 92 * s, x + w / 2 + 34 * s, y - 52 * s);
      c.lineTo(x + w / 2, y - 70 * s);
      c.lineTo(x - w / 2, y - 70 * s);
      c.closePath();
      fs(c, '#2b7a8c', 3.5);
      y -= 76 * s;
    }
    ink(c, 4);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y - 50 * s);
    c.stroke();
    ellipse(c, x, y - 50 * s, 7 * s, 7 * s, '#f2b631', 3);
  },
  lanterns(c, it, t) {
    const { x, w } = it;
    const y = GY - 300;
    rrect(c, x - 8, y - 10, 16, 312, 4);
    fs(c, '#c8283c', 3.5);
    ink(c, 2.5);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + w / 2, y + 60, x + w, y);
    c.stroke();
    for (let k = 1; k < 5; k++) {
      const lx = x + (w * k) / 5;
      const tt = k / 5;
      const ly = y + 120 * tt * (1 - tt);
      const sw = Math.sin(t * 2 + lx * 0.05) * 0.15;
      c.save();
      c.translate(lx, ly);
      c.rotate(sw);
      ink(c, 2.5);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, 14);
      c.stroke();
      ellipse(c, 0, 38, 24, 26, '#ff3b3b', 3.5);
      ink(c, 2);
      c.beginPath();
      c.ellipse(0, 38, 10, 26, 0, 0, Math.PI * 2);
      c.stroke();
      rrect(c, -12, 10, 24, 7, 2);
      fs(c, '#f2b631', 2.5);
      rrect(c, -10, 62, 20, 6, 2);
      fs(c, '#f2b631', 2.5);
      c.strokeStyle = '#f2b631';
      c.beginPath();
      c.moveTo(0, 68);
      c.lineTo(0, 86);
      c.stroke();
      c.restore();
    }
  },
  sign(c, it) {
    const { x } = it;
    rrect(c, x - 8, GY - 130, 16, 132, 4);
    fs(c, '#8a5a36', 4);
    c.beginPath();
    c.moveTo(x - 70, GY - 150);
    c.lineTo(x + 60, GY - 150);
    c.lineTo(x + 84, GY - 126);
    c.lineTo(x + 60, GY - 102);
    c.lineTo(x - 70, GY - 102);
    c.closePath();
    fs(c, '#f2c27a', 4);
    c.fillStyle = INK;
    c.textAlign = 'center';
    c.font = `40px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif`;
    c.fillText(it.text, x + 4, GY - 112);
    if (it.sub) {
      c.font = '800 15px Nunito, sans-serif';
      c.fillText(it.sub, x, GY - 160);
    }
  },
  table(c, it) {
    const { x } = it;
    rrect(c, x - 70, GY - 62, 140, 16, 6);
    fs(c, '#a8683a', 4);
    rrect(c, x - 10, GY - 48, 20, 50, 4);
    fs(c, '#8a5a36', 4);
    c.beginPath();
    c.moveTo(x - 30, GY - 62);
    c.quadraticCurveTo(x - 34, GY - 96, x - 14, GY - 96);
    c.lineTo(x + 6, GY - 96);
    c.quadraticCurveTo(x + 18, GY - 90, x + 14, GY - 62);
    c.closePath();
    fs(c, '#ffffff', 3.5);
    for (const cx of [x + 34, x + 52]) {
      rrect(c, cx - 8, GY - 80, 16, 18, 4);
      fs(c, '#ffffff', 3);
    }
  },
};

// Lili, a panda (desenhada em canvas no mesmo traço)
function drawPanda(c, x, t, waving) {
  const bob = Math.sin(t * 2) * 3;
  const y = GY + bob;
  ellipse(c, x, GY + 4, 70, 12, 'rgba(43,33,53,0.18)', 0);
  ellipse(c, x - 30, y - 18, 30, 22, '#1d1b22', 4);
  ellipse(c, x + 30, y - 18, 30, 22, '#1d1b22', 4);
  ellipse(c, x, y - 90, 66, 76, '#f7f5f0', 4);
  ellipse(c, x, y - 70, 60, 26, '#1d1b22', 0);
  // braço esquerdo
  c.save();
  c.translate(x - 54, y - 118);
  c.rotate(0.5);
  ellipse(c, 0, 32, 18, 38, '#1d1b22', 4);
  c.restore();
  // braço direito acenando
  c.save();
  c.translate(x + 52, y - 118);
  c.rotate(waving ? -2.3 + Math.sin(t * 10) * 0.35 : -0.5);
  ellipse(c, 0, 32, 18, 38, '#1d1b22', 4);
  c.restore();
  // cabeça
  ellipse(c, x - 42, y - 220, 22, 22, '#1d1b22', 4);
  ellipse(c, x + 42, y - 220, 22, 22, '#1d1b22', 4);
  ellipse(c, x, y - 175, 62, 54, '#f7f5f0', 4);
  for (const s of [-1, 1]) {
    c.save();
    c.translate(x + s * 24, y - 180);
    c.rotate(s * -0.5);
    ellipse(c, 0, 0, 16, 22, '#1d1b22', 0);
    c.restore();
    ellipse(c, x + s * 24, y - 182, 7, 7, '#ffffff', 0);
    ellipse(c, x + s * 26, y - 184, 3, 3, '#1d1b22', 0);
    ellipse(c, x + s * 38, y - 156, 10, 6, 'rgba(255,120,150,0.55)', 0);
  }
  ellipse(c, x, y - 160, 9, 6, '#1d1b22', 0);
  ink(c, 3);
  c.beginPath();
  c.arc(x - 6, y - 150, 6, 0.2, Math.PI - 0.6);
  c.arc(x + 6, y - 150, 6, 0.6, Math.PI - 0.2);
  c.stroke();
  // laço vermelho
  c.beginPath();
  c.moveTo(x + 30, y - 222);
  c.lineTo(x + 6, y - 240);
  c.lineTo(x + 8, y - 206);
  c.closePath();
  fs(c, '#d0384e', 3);
  c.beginPath();
  c.moveTo(x + 30, y - 222);
  c.lineTo(x + 56, y - 244);
  c.lineTo(x + 54, y - 206);
  c.closePath();
  fs(c, '#d0384e', 3);
  ellipse(c, x + 30, y - 222, 8, 8, '#ff5b72', 3);
}

// Portal chinês 牌坊 com portas que se abrem
function drawGate(c, gx, open, label, t) {
  const top = GY - 340;
  for (const s of [-1, 1]) {
    rrect(c, gx + s * 140 - 16, top + 70, 32, 272, 6);
    fs(c, '#c8283c', 4);
    rrect(c, gx + s * 140 - 26, GY - 24, 52, 26, 6);
    fs(c, '#f2b631', 4);
  }
  // portas
  const dw = 118 * (1 - open * 0.82);
  for (const s of [-1, 1]) {
    const hinge = gx + s * 124;
    const x0 = s < 0 ? hinge : hinge - dw;
    rrect(c, x0, GY - 230, dw, 230, 4);
    fs(c, open > 0.5 ? '#7d1726' : '#9d1f2f', 4);
    if (dw > 30) {
      c.fillStyle = '#f2b631';
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(x0 + dw * (0.22 + k * 0.28), GY - 200 + r * 50, 5 * (1 - open * 0.6), 0, Math.PI * 2);
          c.fill();
        }
      }
      ellipse(c, s < 0 ? x0 + dw - 16 : x0 + 16, GY - 115, 9 * (1 - open * 0.5), 9, '#f2b631', 3);
    }
  }
  if (open < 0.05) {
    // cadeado
    rrect(c, gx - 18, GY - 130, 36, 30, 6);
    fs(c, '#f2b631', 4);
    ink(c, 5);
    c.beginPath();
    c.arc(gx, GY - 130, 11, Math.PI, 0);
    c.stroke();
  }
  // vigas, placa e telhado
  rrect(c, gx - 175, top + 62, 350, 26, 6);
  fs(c, '#c8283c', 4);
  rrect(c, gx - 160, top + 34, 320, 22, 6);
  fs(c, '#c8283c', 4);
  rrect(c, gx - 62, top + 26, 124, 66, 8);
  fs(c, '#f2b631', 4);
  c.fillStyle = INK;
  c.textAlign = 'center';
  c.font = `40px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif`;
  c.fillText(label, gx, top + 74);
  c.beginPath();
  c.moveTo(gx - 220, top + 4);
  c.quadraticCurveTo(gx - 190, top + 30, gx - 150, top + 26);
  c.lineTo(gx + 150, top + 26);
  c.quadraticCurveTo(gx + 190, top + 30, gx + 220, top + 4);
  c.quadraticCurveTo(gx + 150, top - 6, gx + 120, top - 40);
  c.lineTo(gx - 120, top - 40);
  c.quadraticCurveTo(gx - 150, top - 6, gx - 220, top + 4);
  c.closePath();
  fs(c, '#1e6f6a', 4);
  rrect(c, gx - 130, top - 54, 260, 18, 8);
  fs(c, '#185a56', 4);
  // lanternas
  for (const s of [-1, 1]) {
    const lx = gx + s * 85;
    const sw = Math.sin(t * 2.2 + s) * 0.12;
    c.save();
    c.translate(lx, top + 88);
    c.rotate(sw);
    ellipse(c, 0, 28, 20, 22, '#ff3b3b', 3.5);
    rrect(c, -9, 4, 18, 6, 2);
    fs(c, '#f2b631', 2.5);
    c.restore();
  }
}

// ---------------------------------------------------------------- cenários por fase
function buildScenery(level) {
  const R = rng(level.id * 977);
  const r = (a, b) => a + R() * (b - a);
  const L = { far: [], mid: [], front: [], fg: [], sky: [] };
  const span = END + 2600;
  L.sky.push({ k: 'sun', x: r(200, 500), y: 120 });
  for (let x = -200; x < span * 0.15 + 1600; x += r(260, 420)) L.sky.push({ k: 'cloud', x, y: r(60, 220), s: r(0.7, 1.4) });
  const id = level.id;
  let ground = { color: '#7cc46a', band: '#d9b07a', bandH: 26 };

  if (id === 1) {
    for (let x = -300; x < span * 0.35; x += r(260, 380)) L.far.push({ k: 'hill', x, w: r(400, 640), h: r(90, 170), color: R() < 0.5 ? '#9bd68a' : '#86cb79' });
    for (let x = -200; x < span * 0.65; x += r(140, 240)) L.mid.push({ k: 'tree', x, s: r(0.75, 1.1), pink: R() < 0.35 });
    L.front.push({ k: 'doghouse', x: -20 });
    L.front.push({ k: 'fence', x: -400, w: GATES[0] - 140 - -400 + 10, y: GY - 6 });
    for (let x = 300; x < END; x += r(60, 140)) L.front.push({ k: 'flower', x, s: r(0.8, 1.2), color: ['#ff8fb1', '#ffffff', '#ffd23f', '#b48cff'][Math.floor(r(0, 4))], y: GY - 4 });
    for (let x = 0; x < span * 1.25; x += r(180, 320)) L.fg.push({ k: R() < 0.5 ? 'tuft' : 'flower', x, s: r(0.9, 1.3), color: '#ff8fb1', y: GY + 140 });
  } else if (id === 2) {
    ground = { color: '#4f9a4f', band: '#c9a06a', bandH: 26 };
    for (let x = -300; x < span * 0.35; x += r(240, 360)) L.far.push({ k: 'karst', x, w: r(260, 380), h: r(220, 330), color: '#a9cfb0', shade: '#97c1a0' });
    for (let x = -200; x < span * 0.65; x += r(60, 150)) L.mid.push({ k: 'bamboo', x, h: r(300, 520), color: R() < 0.5 ? '#79b843' : '#6aa83a' });
    for (let x = 200; x < END; x += r(260, 480)) L.front.push({ k: R() < 0.5 ? 'rock' : 'bush', x, s: r(0.7, 1.1) });
    for (let x = 0; x < span * 1.25; x += r(160, 300)) L.fg.push({ k: 'tuft', x, s: r(0.9, 1.4), color: '#2f7d45', y: GY + 140 });
  } else if (id === 3) {
    ground = { color: '#4fb3d9', band: '#7cc46a', bandH: 40, water: true };
    for (let x = -300; x < span * 0.3; x += r(150, 240)) L.far.push({ k: 'karst', x, w: r(160, 260), h: r(260, 420), color: R() < 0.5 ? '#6e9f86' : '#5c8f76', shade: '#7fb091' });
    for (let x = -200; x < span * 0.6; x += r(320, 460)) L.mid.push({ k: 'terrace', x, w: r(420, 560) });
    for (let x = 300; x < END; x += r(380, 620)) L.front.push({ k: 'hat', x });
    for (let x = 0; x < span * 1.25; x += r(200, 360)) L.fg.push({ k: 'tuft', x, s: r(0.9, 1.3), color: '#5aa856', y: GY + 150 });
  } else if (id === 4) {
    ground = { color: '#3fa3cf', band: '#a8683a', bandH: 24, water: true, pier: true };
    for (let x = -200; x < span * 0.25; x += r(300, 500)) L.far.push({ k: 'karst', x, w: r(160, 240), h: r(120, 200), color: '#7fb3a0', shade: '#91c2ae', base: GY + 30 });
    L.far.push({ k: 'lighthouse', x: 160 });
    for (let x = 200; x < span * 0.6; x += r(360, 560)) L.mid.push({ k: 'boat', x, s: r(0.7, 1.0) });
    L.front.push({ k: 'boat', x: END + 260, s: 1.7 });
  } else if (id === 5) {
    ground = { color: '#b9a074', band: '#d8c39a', bandH: 30, wall: true };
    for (let x = -300; x < span * 0.25; x += r(300, 420)) L.far.push({ k: 'snowpeak', x, w: r(380, 520), h: r(260, 360), color: '#7c9bb0' });
    L.mid.push({ k: 'greatwall', x: -400, w: span });
    for (let x = -200; x < span * 0.6; x += r(90, 200)) L.mid.push({ k: 'pine', x, s: r(0.6, 1.0) });
  } else {
    ground = { color: '#c9b9a0', band: '#c8283c', bandH: 22 };
    for (let x = 500; x < span * 0.35; x += 1100) L.far.push({ k: 'pagoda', x, s: 1.25 });
    for (let x = -300; x < span * 0.35; x += r(500, 700)) L.far.push({ k: 'tree', x, s: r(0.8, 1.0), pink: true });
    for (let x = -100; x < span * 0.7; x += 330) L.mid.push({ k: 'house', x });
    for (let x = 0; x < END + 600; x += 520) L.front.push({ k: 'lanterns', x, w: 520 });
    L.front.push({ k: 'table', x: END + 330 });
  }
  // placa de início e de chegada
  L.front.push({ k: 'sign', x: id === 1 ? 420 : 40, text: level.zh, sub: `Fase ${level.id}` });
  const next = LEVELS.find((l) => l.id === level.id + 1);
  if (next) L.front.push({ k: 'sign', x: END + 140, text: next.zh, sub: 'Próxima parada' });
  return { L, ground };
}

function drawGroundLayer(c, g, x0, x1, t) {
  const top = GY;
  if (g.water) {
    c.fillStyle = g.color;
    c.fillRect(x0, top - 10, x1 - x0, 900);
    ink(c, 3);
    c.strokeStyle = 'rgba(255,255,255,0.65)';
    for (let y = top + 70; y < top + 400; y += 46) {
      c.beginPath();
      for (let x = Math.floor(x0 / 80) * 80; x < x1; x += 80) {
        const o = Math.sin(t * 1.5 + x * 0.02 + y) * 6;
        c.moveTo(x + o, y);
        c.quadraticCurveTo(x + 20 + o, y - 8, x + 40 + o, y);
      }
      c.stroke();
    }
  } else {
    c.fillStyle = g.color;
    c.fillRect(x0, top, x1 - x0, 900);
  }
  if (g.pier) {
    for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) {
      rrect(c, x - 10, top, 20, 120, 4);
      fs(c, '#6e3b22', 3.5);
    }
  }
  // faixa do caminho
  c.fillStyle = g.band;
  c.fillRect(x0, top, x1 - x0, g.bandH);
  ink(c, 4);
  c.beginPath();
  c.moveTo(x0, top);
  c.lineTo(x1, top);
  c.moveTo(x0, top + g.bandH);
  c.lineTo(x1, top + g.bandH);
  c.stroke();
  ink(c, 2.5);
  if (g.pier) {
    for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) {
      c.beginPath();
      c.moveTo(x, top + 2);
      c.lineTo(x, top + g.bandH - 2);
      c.stroke();
    }
  } else if (g.wall) {
    for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) {
      c.beginPath();
      c.moveTo(x, top);
      c.lineTo(x, top + g.bandH);
      c.stroke();
    }
    c.strokeStyle = 'rgba(43,33,53,0.35)';
    for (let y = top + 60; y < top + 300; y += 40) {
      c.beginPath();
      for (let x = Math.floor(x0 / 80) * 80 + ((y / 40) % 2) * 40; x < x1; x += 80) {
        c.moveTo(x, y);
        c.lineTo(x, y + 40);
      }
      c.moveTo(x0, y);
      c.lineTo(x1, y);
      c.stroke();
    }
  } else {
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) {
      c.beginPath();
      c.ellipse(x + 30, top + g.bandH / 2, 18, 5, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function drawWallBack(c, x0, x1) {
  // ameias atrás do caminho, na Grande Muralha
  for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) {
    rrect(c, x, GY - 44, 40, 46, 4);
    fs(c, '#d8c39a', 3.5);
  }
  c.fillStyle = '#d8c39a';
  c.fillRect(x0, GY - 14, x1 - x0, 16);
  ink(c, 3.5);
  c.beginPath();
  c.moveTo(x0, GY - 14);
  c.lineTo(x1, GY - 14);
  c.stroke();
}

// ---------------------------------------------------------------- mundo
export function createWorld(canvas, hooks = {}) {
  const c = canvas.getContext('2d');
  let dpr = 1;
  let W = 0;
  let H = 0;
  let level = null;
  let scene = null;
  let px = START;
  let walking = false;
  let autoWalk = false;
  let busy = false;
  let ended = false;
  let gateOpen = [0, 0, 0];
  let gateTarget = [0, 0, 0];
  let frame = 0;
  let anim = 'idle';
  let animT = 0;
  let stepT = 0;
  let camX = 0;
  let view = { s: 1, oy: 0, vw: 800, vh: 600 };
  let reaction = null; // { img, until, born }
  let squash = 0;
  let pandaWaving = false;
  let parts = [];
  let raf = 0;
  let last = performance.now();
  let t = 0;

  const imgs = {};
  const loadImg = (src) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`imagem não carregou: ${src}`));
    im.src = asset(src);
  });
  const ready = Promise.all([
    loadImg(SPRITES.walk.src).then((i) => (imgs.walk = i)),
    loadImg(SPRITES.jump.src).then((i) => (imgs.jump = i)),
  ]);
  const exprCache = {};
  function exprImg(name) {
    if (!exprCache[name]) {
      const im = new Image();
      im.src = expr(name);
      exprCache[name] = im;
    }
    return exprCache[name];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  window.addEventListener('resize', resize);

  // área visível (o painel de missão cobre parte da tela)
  function targetView() {
    let vw = W;
    let vh = H;
    const panel = document.getElementById('panel');
    if (panel && !panel.hidden) {
      const r = panel.getBoundingClientRect();
      if (r.width >= W - 2) vh = Math.max(140, r.top);
      else vw = Math.max(200, r.left);
    }
    const s = Math.min(vh / DH, vw / (vw < 600 ? 560 : 820)) * (vh < 330 ? 1.25 : 1);
    const groundScreen = vh < H ? vh * 0.9 : vh * 0.8;
    return { s, oy: groundScreen - GY * s, vw, vh };
  }

  function groundAt() {
    return GY;
  }

  function nextStop() {
    for (let i = 0; i < 3; i++) if (!gateTarget[i]) return { x: GATES[i] - STOP, gate: i };
    return { x: END, gate: -1 };
  }

  function setAnim(a) {
    if (anim === a) return;
    anim = a;
    animT = 0;
  }

  function react(name, ms = 1500) {
    reaction = { img: exprImg(name), until: t + ms / 1000, born: t };
  }

  function sparkle(x, y, n = 26) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 260;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: 1 + Math.random() * 0.6, c: ['#ffd23f', '#d0384e', '#3a86a0', '#ffffff', '#ff8fb1'][i % 5], r: 5 + Math.random() * 6, star: i % 3 === 0 });
    }
  }

  async function loadLevel(lv) {
    await ready;
    level = lv;
    scene = buildScenery(lv);
    px = START;
    walking = autoWalk = busy = ended = false;
    gateOpen = [0, 0, 0];
    gateTarget = [0, 0, 0];
    pandaWaving = false;
    reaction = null;
    parts = [];
    setAnim('idle');
    resize();
    view = targetView();
    camX = px - (view.vw / view.s) * 0.33;
  }

  // ---------------------------------------------------------------- desenho
  function drawStar(x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }

  function drawLayer(items, f, extra) {
    const { s, oy } = view;
    c.setTransform(dpr * s, 0, 0, dpr * s, -camX * f * s * dpr, oy * dpr);
    const x0 = camX * f - 300;
    const x1 = camX * f + W / s + 300;
    extra?.(x0, x1);
    for (const it of items) {
      if (it.k === 'greatwall') D.greatwall(c, it, t, x0, x1);
      else if (it.x > x0 - 300 && it.x < x1 + 300) D[it.k](c, it, t);
    }
  }

  function drawPongo() {
    const { s, oy } = view;
    c.setTransform(dpr * s, 0, 0, dpr * s, -camX * s * dpr, oy * dpr);
    const gy = groundAt(px);
    const k = PONGO_H / SPRITES.walk.h;
    // sombra
    let lift = 0;
    let sheet = SPRITES.walk;
    let img = imgs.walk;
    let fr = 0;
    if (anim === 'walk') fr = Math.floor(animT * 13) % 8;
    else if (anim === 'jump') {
      sheet = SPRITES.jump;
      img = imgs.jump;
      fr = Math.min(7, Math.floor(animT * 13));
      if (animT * 13 >= 8.5) setAnim(walking || autoWalk ? 'walk' : 'idle');
    } else {
      sheet = SPRITES.jump;
      img = imgs.jump;
      fr = 7;
    }
    const dw = sheet.w * k;
    const dh = sheet.h * k;
    const shadowW = anim === 'jump' ? 48 : 62;
    c.fillStyle = 'rgba(43,33,53,0.22)';
    c.beginPath();
    c.ellipse(px, gy + 6, shadowW, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(px, gy + 8);
    const breathe = anim === 'idle' ? 1 + Math.sin(t * 3) * 0.015 : 1;
    const sq = 1 - squash * 0.12;
    c.scale((2 - sq) * 1, breathe * sq);
    c.drawImage(img, fr * sheet.w, 0, sheet.w, sheet.h, -dw / 2, -dh - lift, dw, dh);
    c.restore();

    // balão de reação com a expressão do Pongo
    if (reaction && t < reaction.until && reaction.img.complete) {
      const age = t - reaction.born;
      const pop = Math.min(1, age * 6);
      const sc = pop < 1 ? 0.4 + pop * 0.75 : 1.15 - Math.min(0.15, (age - 0.17) * 0.6);
      const bx = px + 95;
      const by = gy - PONGO_H - 70;
      c.save();
      c.translate(bx, by);
      c.scale(sc, sc);
      c.beginPath();
      c.moveTo(-40, 40);
      c.lineTo(-70, 70);
      c.lineTo(-18, 52);
      c.closePath();
      fs(c, '#ffffff', 4);
      c.beginPath();
      c.arc(0, 0, 62, 0, Math.PI * 2);
      fs(c, '#ffffff', 5);
      c.save();
      c.beginPath();
      c.arc(0, 0, 54, 0, Math.PI * 2);
      c.clip();
      const im = reaction.img;
      const side = Math.min(im.width, im.height);
      c.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, -54, -54, 108, 108);
      c.restore();
      c.restore();
    }
  }

  function render(dt) {
    // fundo do céu (tela inteira)
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, level.ceu[0]);
    sky.addColorStop(1, level.ceu[1]);
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    const { L, ground } = scene;
    drawLayer(L.sky, 0.06);
    drawLayer(L.far, 0.25);
    drawLayer(L.mid, 0.55);
    if (ground.wall) drawLayer([], 1, (x0, x1) => drawWallBack(c, x0, x1));
    drawLayer([], 1, (x0, x1) => drawGroundLayer(c, ground, x0, x1, t));
    drawLayer(L.front, 1);
    // portais
    drawLayer([], 1, () => {
      GATES.forEach((gx, i) => drawGate(c, gx, gateOpen[i], level.missoes[i].zh, t));
      if (level.amiga) drawPanda(c, END + 180, t, pandaWaving || ended);
    });
    drawPongo();
    // partículas do mundo (estrelinhas)
    c.setTransform(dpr * view.s, 0, 0, dpr * view.s, -camX * view.s * dpr, view.oy * dpr);
    parts = parts.filter((p) => (p.life -= dt) > 0);
    for (const p of parts) {
      p.vy += 600 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      c.globalAlpha = Math.min(1, p.life * 2);
      if (p.star) {
        drawStar(p.x, p.y, p.r * 1.6);
        fs(c, p.c, 2);
      } else {
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = p.c;
        c.fill();
      }
    }
    c.globalAlpha = 1;
    drawLayer(L.fg, 1.25);
    drawAmbient(dt);
  }

  // partículas do ambiente (pétalas, vaga-lumes, neve, bolhas) em coordenadas de tela
  let amb = [];
  function drawAmbient(dt) {
    const kind = level.particulas;
    const n = kind === 'vagalumes' ? 40 : 60;
    while (amb.length < n) amb.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6, s: 0.6 + Math.random() * 0.8 });
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const moving = (walking || autoWalk) && !busy && !ended;
    for (const a of amb) {
      a.p += dt;
      if (kind === 'bolhas') a.y -= 30 * a.s * dt;
      else if (kind === 'vagalumes') {
        a.x += Math.sin(a.p) * 20 * dt;
        a.y += Math.cos(a.p * 0.7) * 14 * dt;
      } else a.y += (kind === 'neve' ? 40 : 55) * a.s * dt;
      a.x += Math.sin(a.p * 1.3) * 18 * dt - (moving ? 60 * a.s * dt : 0);
      if (a.y > H + 10) a.y = -10;
      if (a.y < -10) a.y = H + 10;
      if (a.x < -10) a.x = W + 10;
      if (a.x > W + 10) a.x = -10;
      if (kind === 'petalas') {
        c.save();
        c.translate(a.x, a.y);
        c.rotate(a.p);
        c.fillStyle = '#ffb3cf';
        c.beginPath();
        c.ellipse(0, 0, 6 * a.s, 3.5 * a.s, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      } else if (kind === 'vagalumes') {
        c.fillStyle = `rgba(255,242,122,${0.5 + Math.sin(a.p * 3) * 0.4})`;
        c.beginPath();
        c.arc(a.x, a.y, 3.5 * a.s, 0, Math.PI * 2);
        c.fill();
      } else if (kind === 'neve') {
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.beginPath();
        c.arc(a.x, a.y, 3 * a.s, 0, Math.PI * 2);
        c.fill();
      } else {
        c.strokeStyle = 'rgba(255,255,255,0.8)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(a.x, a.y, 5 * a.s, 0, Math.PI * 2);
        c.stroke();
      }
    }
  }

  function update(now) {
    raf = requestAnimationFrame(update);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    animT += dt;
    if (!level) return;
    if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize();

    const want = (walking || autoWalk) && !busy && !ended;
    if (want) {
      const stop = nextStop();
      const nx = px + SPEED * dt;
      if (nx >= stop.x) {
        px = stop.x;
        walking = autoWalk = false;
        setAnim('idle');
        if (stop.gate >= 0) {
          busy = true;
          react('curioso', 1800);
          hooks.onGate?.(stop.gate);
        } else {
          ended = true;
          pandaWaving = true;
          react(level.amiga ? 'carinhoso' : 'empolgado', 2500);
          hooks.onEnd?.();
        }
      } else {
        px = nx;
        if (anim !== 'jump') setAnim('walk');
        stepT -= dt;
        if (stepT <= 0) {
          stepT = 0.3;
          hooks.onStep?.();
        }
      }
      hooks.onProgress?.((px - START) / (END - START));
    } else if (anim === 'walk') setAnim('idle');

    for (let i = 0; i < 3; i++) gateOpen[i] += (gateTarget[i] - gateOpen[i]) * Math.min(1, dt * 2.5);
    squash = Math.max(0, squash - dt * 1.5);

    // câmera e área visível suaves
    const tv = targetView();
    const k = Math.min(1, dt * 4);
    view = { s: lerp(view.s, tv.s, k), oy: lerp(view.oy, tv.oy, k), vw: lerp(view.vw, tv.vw, k), vh: tv.vh };
    const lead = busy || ended ? 0.42 : 0.33;
    const camTarget = px - (view.vw / view.s) * lead;
    camX = lerp(camX, camTarget, Math.min(1, dt * 3));

    render(dt);
  }
  raf = requestAnimationFrame(update);

  return {
    loadLevel,
    resize,
    setWalking(on) {
      walking = on;
    },
    toggleAuto() {
      if (busy || ended) return;
      autoWalk = !autoWalk;
      if (!autoWalk) walking = false;
    },
    isAuto: () => autoWalk,
    isBusy: () => busy,
    skipTo(doneCount) {
      for (let i = 0; i < doneCount; i++) gateOpen[i] = gateTarget[i] = 1;
      if (doneCount > 0) px = GATES[doneCount - 1] + 160;
      camX = px - (view.vw / view.s) * 0.33;
      hooks.onProgress?.((px - START) / (END - START));
    },
    openGate(i) {
      gateTarget[i] = 1;
      busy = false;
      react('empolgado', 1400);
    },
    celebrate() {
      setAnim('jump');
      react(['feliz', 'empolgado', 'piscando', 'brincalhao'][Math.floor(Math.random() * 4)], 1300);
      sparkle(px, groundAt(px) - PONGO_H * 0.6);
    },
    sad() {
      squash = 1;
      react(Math.random() < 0.5 ? 'triste' : 'assustado', 1500);
    },
    react,
    pandaWave() {
      pandaWaving = true;
    },
    pause(on) {
      cancelAnimationFrame(raf);
      if (!on) {
        last = performance.now();
        raf = requestAnimationFrame(update);
      }
    },
  };
}
