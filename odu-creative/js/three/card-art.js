/**
 * Arte das cartas desenhada em <canvas> (vira textura na carta 3D).
 * Proporção do canvas = proporção da carta do Blender (0,63 × 0,88).
 */
const W = 512;
const H = 716;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif';
export const CATEGORY = {
  drinks: { color: '#2f6fde', soft: '#dbe8ff', label: 'DRINKS · BEBIDAS' },
  food: { color: '#ff6b4a', soft: '#ffe3dc', label: 'FOOD · COMIDAS' },
  sizes: { color: '#12a586', soft: '#d6f5ec', label: 'SIZES · TAMANHOS' },
  chunks: { color: '#5b3df5', soft: '#e7e2ff', label: 'CHUNKS · EXPRESSÕES' },
};
const cat = (c) => CATEGORY[c] || CATEGORY.chunks;

function canvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return [c, c.getContext('2d')];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Escreve texto centralizado reduzindo a fonte até caber; quebra em até `maxLines` linhas. */
function fitText(ctx, text, { y, maxW = W - 70, size = 64, min = 26, weight = 800, color = '#1d1a2b', maxLines = 2, lineGap = 1.12 }) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let s = size; s >= min; s -= 2) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines || s === min) {
      const total = (lines.length - 1) * s * lineGap;
      lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, W / 2, y - total / 2 + i * s * lineGap));
      return s;
    }
  }
  return min;
}
function wrap(ctx, text, maxW) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function base(ctx, bg = '#ffffff') {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}
function footer(ctx, text, color) {
  ctx.fillStyle = color;
  ctx.font = `700 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H - 34);
}
/** Palco colorido onde o modelo 3D aparece (metade superior da carta). */
function stage(ctx, c, top = 34, h = 380) {
  const g = ctx.createRadialGradient(W / 2, top + h * 0.55, 20, W / 2, top + h * 0.55, h * 0.75);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, c.soft);
  ctx.fillStyle = g;
  roundRect(ctx, 30, top, W - 60, h, 34);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath();
  ctx.ellipse(W / 2, top + h - 50, 120, 22, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Frente com modelo 3D (palco) + palavra principal. */
export function frontWithModel({ word, article, sub, category }) {
  const [c, ctx] = canvas();
  const k = cat(category);
  base(ctx);
  stage(ctx, k);
  if (article) {
    ctx.fillStyle = k.color;
    ctx.font = `800 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(article, W / 2, 462);
  }
  fitText(ctx, word, { y: article ? 528 : 500, size: 66 });
  if (sub) fitText(ctx, sub, { y: 608, size: 30, min: 20, weight: 500, color: '#6c6884', maxLines: 1 });
  footer(ctx, k.label, k.color);
  return c;
}

/** Verso com a resposta (tradução ou palavra) e um exemplo em contexto. */
export function backAnswer({ title, kicker, pron, example, category }) {
  const [c, ctx] = canvas();
  const k = cat(category);
  base(ctx, k.color);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.arc(W - 40, 60, 140, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(30, H - 40, 110, 0, Math.PI * 2); ctx.fill();
  if (kicker) fitText(ctx, kicker, { y: 110, size: 28, min: 18, weight: 700, color: 'rgba(255,255,255,0.85)', maxLines: 1 });
  fitText(ctx, title, { y: 240, size: 64, color: '#ffffff', maxLines: 3 });
  if (pron) fitText(ctx, pron, { y: 360, size: 30, min: 18, weight: 500, color: 'rgba(255,255,255,0.9)', maxLines: 1 });
  if (example) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, 34, 420, W - 68, 210, 26);
    ctx.fill();
    ctx.fillStyle = k.color;
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('EXAMPLE', W / 2, 452);
    fitText(ctx, example, { y: 535, size: 34, min: 20, weight: 650, maxLines: 3, maxW: W - 110 });
  }
  footer(ctx, 'ODU CREATIVE', 'rgba(255,255,255,0.85)');
  return c;
}

/** Verso padrão (carta virada para baixo no jogo da memória). */
export function brandBack() {
  const [c, ctx] = canvas();
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#5b3df5');
  g.addColorStop(1, '#ff6b4a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  for (let i = -H; i < W + H; i += 46) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 22;
  ctx.beginPath(); ctx.arc(W / 2, H / 2 - 30, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath(); ctx.arc(W / 2, H / 2 - 30, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 46px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ODU', W / 2, H / 2 + 130);
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText('CREATIVE', W / 2, H / 2 + 168);
  return c;
}

/** Carta de palavra (memória): artigo + palavra, sem imagem. */
export function wordCard({ word, article, category }) {
  const [c, ctx] = canvas();
  const k = cat(category);
  base(ctx);
  ctx.fillStyle = k.soft;
  roundRect(ctx, 30, 30, W - 60, H - 60, 34);
  ctx.fill();
  ctx.fillStyle = k.color;
  ctx.font = `800 28px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('WORD', W / 2, 90);
  fitText(ctx, article ? `${article} ${word}` : word, { y: H / 2, size: 74, maxLines: 3 });
  // ícone de alto-falante: a palavra é falada ao virar
  ctx.fillStyle = k.color;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 34, H - 150); ctx.lineTo(W / 2 - 14, H - 150); ctx.lineTo(W / 2 + 10, H - 172);
  ctx.lineTo(W / 2 + 10, H - 108); ctx.lineTo(W / 2 - 14, H - 130); ctx.lineTo(W / 2 - 34, H - 130);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = k.color; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(W / 2 + 14, H - 140, 26, -0.8, 0.8); ctx.stroke();
  return c;
}

/** Carta de imagem (memória): só o palco, o modelo 3D aparece por cima. */
export function pictureCard({ category }) {
  const [c, ctx] = canvas();
  const k = cat(category);
  base(ctx);
  stage(ctx, k, 34, H - 140);
  footer(ctx, 'PICTURE', k.color);
  return c;
}
