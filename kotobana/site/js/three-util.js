// Utilidades three.js compartilhadas pelos jogos (THREE vem do script global do cdnjs).
export async function fontsReady() {
  try {
    await Promise.race([
      Promise.all(['700 64px "Zen Old Mincho"', '500 48px "Zen Kaku Gothic New"', '600 40px "Instrument Sans"'].map(f => document.fonts.load(f))),
      new Promise(r => setTimeout(r, 1500)),
    ]);
  } catch {}
}

export function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  // palavras japonesas sem espaço: quebra por caractere
  const out = [];
  for (const l of lines) {
    if (ctx.measureText(l).width <= maxW) { out.push(l); continue; }
    let cur = "";
    for (const ch of l) { if (ctx.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; } else cur += ch; }
    out.push(cur);
  }
  if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = out[maxLines - 1].replace(/.?$/, "…"); }
  return out;
}

// Texto ajustado ao espaço: diminui a fonte até caber.
export function fitText(ctx, text, family, weight, maxW, maxH, startSize, maxLines = 3) {
  for (let size = startSize; size >= 14; size -= 2) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrapLines(ctx, text, maxW, 99);
    if (lines.length <= maxLines && lines.length * size * 1.2 <= maxH) return { size, lines };
  }
  ctx.font = `${weight} 14px ${family}`;
  return { size: 14, lines: wrapLines(ctx, text, maxW, maxLines) };
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  return t;
}

// Encurta significados longos para caber em lanternas e cartas.
export function shortPt(pt) {
  let s = String(pt).replace(/\s*\([^)]*\)/g, "").trim();
  if (s.length > 34) s = s.split(/[,;]/)[0].trim();
  return s || String(pt);
}

export function tween(ms, fn, ease = t => 1 - (1 - t) ** 3) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      fn(ease(t));
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

export function makeRenderer(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  stage.append(renderer.domElement);
  return renderer;
}
