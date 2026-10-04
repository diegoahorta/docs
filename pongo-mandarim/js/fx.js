// Comemorações visuais: confete, serpentina, fogos de artifício, chuva de emojis,
// flashes coloridos, tremor de tela e textos voadores. Tudo num canvas 2D sobre o jogo.

const COLORS = ['#D0384E', '#3A86A0', '#2563EB', '#C2600A', '#0E8A8A', '#C0392B', '#1E8449', '#6D28D9', '#C05070', '#F2B631', '#FFD23F', '#FF8FB1', '#8FD0F0'];
const EMOJIS = ['🎉', '🧧', '🏮', '🐶', '🥟', '✨', '🎆', '🐼', '⭐', '💥', '🎊', '🍵', '🐉', '🦴'];

let canvas, g, W = 0, H = 0, dpr = 1;
let parts = [];
let running = false;
let intensityScale = 1; // 0.25 no modo calmo

export function initFx(c) {
  canvas = c;
  g = c.getContext('2d');
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
}

export function setFxIntensity(v) {
  intensityScale = v;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function loop() {
  if (!parts.length) {
    running = false;
    g.clearRect(0, 0, W, H);
    return;
  }
  running = true;
  g.clearRect(0, 0, W, H);
  const next = [];
  for (const p of parts) {
    p.life -= 1;
    if (p.life <= 0 || p.y > H + 60) continue;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.grav;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    const a = Math.min(1, p.life / 30);
    g.globalAlpha = a;
    if (p.kind === 'conf') {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.scale(1, Math.cos(p.rot * 2.3));
      g.fillStyle = p.c;
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    } else if (p.kind === 'streamer') {
      g.strokeStyle = p.c;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(p.x, p.y);
      for (let k = 1; k < 6; k++) g.lineTo(p.x - p.vx * k * 1.5 + Math.sin(p.rot + k) * 6, p.y - p.vy * k * 1.5);
      g.stroke();
    } else if (p.kind === 'spark') {
      g.fillStyle = p.c;
      g.beginPath();
      g.arc(p.x, p.y, p.s, 0, 6.283);
      g.fill();
    } else if (p.kind === 'rocket') {
      g.fillStyle = '#fff6c8';
      g.beginPath();
      g.arc(p.x, p.y, 3, 0, 6.283);
      g.fill();
      if (p.vy > -1.5) {
        burst(p.x, p.y, 70, p.c);
        p.life = 0;
      }
    } else if (p.kind === 'emoji') {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.font = `${p.s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(p.e, 0, 0);
      g.restore();
    } else if (p.kind === 'ring') {
      g.strokeStyle = p.c;
      g.lineWidth = 6 * a;
      g.beginPath();
      g.arc(p.x, p.y, (p.max - p.life) * p.s, 0, 6.283);
      g.stroke();
    }
    next.push(p);
  }
  g.globalAlpha = 1;
  parts = next;
  requestAnimationFrame(loop);
}

function kick() {
  if (!running) requestAnimationFrame(loop);
}

function burst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.283);
    const sp = rnd(2, 7);
    parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 0.06, drag: 0.97, rot: 0, vr: 0, s: rnd(1.5, 3.2), c: Math.random() < 0.7 ? color : '#fff', life: rnd(50, 90) });
  }
  parts.push({ kind: 'ring', x, y, vx: 0, vy: 0, grav: 0, drag: 1, rot: 0, vr: 0, s: 3, c: color, life: 28, max: 28 });
}

/** Confete a partir de um ponto (acerto). */
export function confettiAt(x, y, n = 80) {
  n = Math.round(n * intensityScale);
  for (let i = 0; i < n; i++) {
    const a = rnd(-Math.PI, 0);
    const sp = rnd(4, 13);
    parts.push({ kind: Math.random() < 0.15 ? 'streamer' : 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, grav: 0.22, drag: 0.985, rot: rnd(0, 6), vr: rnd(-0.3, 0.3), s: rnd(7, 14), c: pick(COLORS), life: rnd(90, 160) });
  }
  kick();
}

/** Canhões de confete dos dois cantos + chuva do topo. */
export function confettiStorm(level = 2) {
  const n = Math.round(160 * level * intensityScale);
  for (let i = 0; i < n; i++) {
    const left = i % 2 === 0;
    const x = left ? -10 : W + 10;
    const a = left ? rnd(-1.35, -0.55) : rnd(-Math.PI + 0.55, -Math.PI + 1.35);
    const sp = rnd(10, 24);
    parts.push({ kind: Math.random() < 0.12 ? 'streamer' : 'conf', x, y: H * 0.85, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 0.25, drag: 0.982, rot: rnd(0, 6), vr: rnd(-0.4, 0.4), s: rnd(8, 16), c: pick(COLORS), life: rnd(140, 240) });
  }
  for (let i = 0; i < n / 2; i++) {
    parts.push({ kind: 'conf', x: rnd(0, W), y: rnd(-H * 0.6, -10), vx: rnd(-1, 1), vy: rnd(1, 4), grav: 0.05, drag: 0.995, rot: rnd(0, 6), vr: rnd(-0.2, 0.2), s: rnd(8, 14), c: pick(COLORS), life: 320 });
  }
  kick();
}

export function emojiRain(n = 40) {
  n = Math.round(n * intensityScale);
  for (let i = 0; i < n; i++) {
    parts.push({ kind: 'emoji', e: pick(EMOJIS), x: rnd(0, W), y: rnd(-H, -20), vx: rnd(-1.2, 1.2), vy: rnd(2, 6), grav: 0.08, drag: 0.995, rot: rnd(-0.5, 0.5), vr: rnd(-0.05, 0.05), s: rnd(26, 56), life: 300 });
  }
  kick();
}

export function fireworks(n = 6) {
  n = Math.round(n * intensityScale) || 1;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      parts.push({ kind: 'rocket', x: rnd(W * 0.1, W * 0.9), y: H + 10, vx: rnd(-1.5, 1.5), vy: rnd(-15, -11), grav: 0.2, drag: 0.995, rot: 0, vr: 0, s: 3, c: pick(COLORS), life: 200 });
      kick();
    }, i * 260);
  }
}

/** Texto gigante que entra girando. */
export function bigText(main, sub = '', color = '#D0384E') {
  const el = document.createElement('div');
  el.className = 'fx-bigtext';
  el.style.setProperty('--c', color);
  el.innerHTML = `<span class="fx-main">${main}</span>${sub ? `<span class="fx-sub">${sub}</span>` : ''}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function floatText(x, y, txt, color = '#1E8449') {
  const el = document.createElement('div');
  el.className = 'fx-float';
  el.textContent = txt;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

export function flash(times = 6) {
  if (intensityScale < 0.5) return;
  const el = document.createElement('div');
  el.className = 'fx-flash';
  el.style.animationIterationCount = String(times);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), times * 160 + 50);
}

export function shake(el, strong = false) {
  if (intensityScale < 0.5) return;
  el.classList.remove('shake', 'shake-strong');
  void el.offsetWidth;
  el.classList.add(strong ? 'shake-strong' : 'shake');
}

/** Pacote completo. level 1 = acerto, 2 = missão, 3 = fase. */
export function celebrate(level, x, y, app) {
  if (level === 1) {
    confettiAt(x ?? W / 2, y ?? H / 2, 90);
    return;
  }
  confettiStorm(level);
  emojiRain(level === 3 ? 90 : 45);
  fireworks(level === 3 ? 14 : 6);
  flash(level === 3 ? 10 : 6);
  if (app) shake(app, true);
  if (level === 3) setTimeout(() => { confettiStorm(2); emojiRain(50); }, 1600);
}
