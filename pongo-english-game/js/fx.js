/* Pongo Learns English - celebration effects.
 * A full-screen canvas particle system: confetti, emoji bursts, shock-wave
 * rings, fireworks and sparkles, plus a giant motivational phrase. */
(function () {
  'use strict';

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, DPR = 1;
  let parts = [];
  let rings = [];
  let flash = 0;
  let running = false;

  const COLORS = ['#ff4b4b', '#ffc800', '#58cc02', '#1cb0f6', '#ce82ff', '#ff86d0', '#ff9600', '#ffffff', '#2f87a8', '#d23a4f'];
  const EMOJI = ['🦴', '🐾', '⭐', '❤️', '🎉', '✨', '🌟', '🐶', '🍓', '🫐', '🌈', '🎊', '💙', '🏆'];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function confetti(x, y, n, power) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(power * 0.3, power);
      parts.push({
        kind: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.35,
        w: rand(6, 13), h: rand(4, 8), rot: rand(0, 6), vr: rand(-0.3, 0.3),
        color: pick(COLORS), life: rand(90, 160), t: 0, g: 0.22, drag: 0.985,
      });
    }
  }

  function emojis(x, y, n, power) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(power * 0.3, power);
      parts.push({
        kind: 'emoji', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.3, rot: rand(-0.5, 0.5),
        vr: rand(-0.12, 0.12), size: rand(22, 46), ch: pick(EMOJI), life: rand(80, 140), t: 0, g: 0.18, drag: 0.98,
      });
    }
  }

  function firework(x, y) {
    const color = pick(COLORS);
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const v = rand(3.5, 6.5);
      parts.push({
        kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color, life: rand(45, 70), t: 0,
        g: 0.06, drag: 0.965, size: rand(2, 3.5),
      });
    }
    rings.push({ x, y, r: 4, max: 120, color, w: 5 });
  }

  function rain(n) {
    for (let i = 0; i < n; i++) {
      parts.push({
        kind: Math.random() < 0.4 ? 'emoji' : 'confetti', x: rand(0, W), y: rand(-H * 0.6, -20),
        vx: rand(-1, 1), vy: rand(2, 5), w: rand(6, 12), h: rand(4, 8), rot: rand(0, 6), vr: rand(-0.2, 0.2),
        size: rand(20, 38), ch: pick(EMOJI), color: pick(COLORS), life: 240, t: 0, g: 0.05, drag: 0.995,
      });
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash})`;
      ctx.fillRect(0, 0, W, H);
      flash *= 0.86;
      if (flash < 0.01) flash = 0;
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += (r.max - r.r) * 0.12 + 1;
      const k = 1 - r.r / r.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, k);
      ctx.lineWidth = r.w * k + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      if (r.r >= r.max - 2) rings.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t++;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr || 0;
      const fade = Math.min(1, (p.life - p.t) / 30);
      if (p.t > p.life || p.y > H + 60) {
        parts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, fade);
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.t * 0.2));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else if (p.kind === 'emoji') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (parts.length || rings.length || flash) {
      requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function kick() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  // ------------------------------------------------------------ public API
  const FX = {};

  /** small burst, e.g. a correct multiple-choice answer */
  FX.pop = function (x, y) {
    if (reduce) return;
    confetti(x ?? W / 2, y ?? H * 0.7, 40, 9);
    kick();
  };

  /** the big explosion for a correctly built sentence */
  FX.explode = function (phrase, sub) {
    const cx = W / 2, cy = H * 0.42;
    if (!reduce) {
      flash = 0.85;
      confetti(cx, cy, 220, 17);
      emojis(cx, cy, 34, 14);
      rings.push({ x: cx, y: cy, r: 10, max: Math.max(W, H) * 0.7, color: '#ffc800', w: 18 });
      rings.push({ x: cx, y: cy, r: 4, max: Math.max(W, H) * 0.45, color: '#ffffff', w: 12 });
      for (let i = 0; i < 6; i++) setTimeout(() => { firework(rand(W * 0.1, W * 0.9), rand(H * 0.1, H * 0.5)); kick(); }, 180 + i * 230);
      setTimeout(() => { rain(70); kick(); }, 500);
      [[0, H], [W, H]].forEach(([x, y], i) =>
        setTimeout(() => { confetti(x, y, 90, 20); kick(); }, 250 + i * 120));
      document.body.classList.remove('shake');
      void document.body.offsetWidth;
      document.body.classList.add('shake');
    }
    kick();

    const box = document.getElementById('celebrate');
    box.querySelector('.cel-main').textContent = phrase;
    box.querySelector('.cel-sub').textContent = sub;
    const main = box.querySelector('.cel-main');
    main.innerHTML = phrase
      .split('')
      .map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`)
      .join('');
    box.hidden = false;
    box.classList.remove('go');
    void box.offsetWidth;
    box.classList.add('go');
    clearTimeout(FX._t);
    FX._t = setTimeout(() => { box.hidden = true; }, 2600);
  };

  /** end-of-lesson party */
  FX.party = function () {
    if (reduce) return;
    flash = 0.5;
    rain(160);
    for (let i = 0; i < 10; i++) setTimeout(() => { firework(rand(W * 0.1, W * 0.9), rand(H * 0.1, H * 0.6)); kick(); }, i * 260);
    kick();
  };

  window.PongoFX = FX;
})();
