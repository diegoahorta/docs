// Carrega sprites, texturas, fontes e gera as texturas procedurais.
import * as THREE from 'three';
import { ASSETS, recurso } from './config.js';

export const R = {
  manifesto: null,
  tex: {}, // 'heroi_andar0' -> THREE.Texture (com .userData.w/.h)
  ratos: {}, // tipo -> { pose: Texture }
  fonte: null,
  imagens: {},
};

function carregarImagem(url) {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error('Falha ao carregar ' + url));
    img.src = recurso(url);
  });
}

export function texturaDe(fonte, { repetir = false, suave = false } = {}) {
  const t = fonte instanceof HTMLCanvasElement ? new THREE.CanvasTexture(fonte) : new THREE.Texture(fonte);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = suave ? THREE.LinearFilter : THREE.NearestFilter;
  t.generateMipmaps = false;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  t.userData.w = fonte.width;
  t.userData.h = fonte.height;
  return t;
}

export async function carregarTudo(progresso = () => {}) {
  const manifesto = await (await fetch(recurso('sprites/manifesto.json'))).json();
  R.manifesto = manifesto;

  const pedidos = [];
  for (const [grupo, itens] of Object.entries(manifesto)) {
    for (const [nome, info] of Object.entries(itens)) {
      pedidos.push([`${grupo}_${nome}`, info.arquivo, grupo, info.ax]);
    }
  }
  const ui = ['area-de-perigo', 'bloco-atravessavel', 'destaque-tile-verde', 'botao-seta-baixo'];
  for (const n of ui) pedidos.push([`ui_${n}`, `${ASSETS}sprites/ui/${n}.png`, 'ui']);
  pedidos.push(['fonte_roxa', `${ASSETS}fontes/Fonte_jogo.png`, 'fonte']);
  pedidos.push(['fonte_branca', `${ASSETS}fontes/Fonte_jogo_branca.png`, 'fonte']);

  let feitos = 0;
  await Promise.all(pedidos.map(async ([chave, url, grupo, ancora]) => {
    const img = await carregarImagem(url);
    R.imagens[chave] = img;
    const repetir = grupo === 'texturas' || chave === 'ui_area-de-perigo' || chave === 'ui_bloco-atravessavel';
    // Os quadros do herói e do cenário são reduzidos na tela: filtragem linear evita serrilhado.
    const suave = grupo === 'heroi' || grupo === 'cenario' || grupo === 'itens' || grupo === 'ratos';
    R.tex[chave] = texturaDe(img, { repetir, suave });
    if (ancora !== undefined) R.tex[chave].userData.ax = ancora;
    progresso(++feitos / pedidos.length);
  }));

  const fnt = await (await fetch(recurso(`${ASSETS}fontes/Fonte_jogo.fnt`))).text();
  R.fonte = lerBMFont(fnt);

  // Ratos: 'ratos_rei_andar0' -> R.ratos.rei.andar0
  for (const nome of Object.keys(manifesto.ratos)) {
    const [tipo, ...pose] = nome.split('_');
    (R.ratos[tipo] ??= {})[pose.join('_')] = R.tex['ratos_' + nome];
  }
  // Ratus Direitus tem folha própria: liga as poses do jogo aos quadros dela.
  const d = R.ratos.direitus;
  Object.assign(d, {
    parado0: d.guarda0, parado1: d.guarda3, preparar: d.soco1, atacar: d.soco2,
    preparar2: d.chute2, atacar2: d.chute3, dor: d.dano0, caido: d.dano4, investida: d.investida3,
  });

  gerarTexturasProcedurais();
  await Promise.all([
    document.fonts.load('20px Upheaval'),
    document.fonts.load('16px SmallPixel'),
  ]).catch(() => {});
}

// ---------- Fonte bitmap (formato BMFont / AngelCode) ----------
function lerBMFont(texto) {
  const fonte = { chars: {}, lineHeight: 20, base: 15 };
  for (const linha of texto.split('\n')) {
    const campos = Object.fromEntries([...linha.matchAll(/(\w+)=("[^"]*"|\S+)/g)].map((m) => [m[1], m[2]]));
    if (linha.startsWith('common')) {
      fonte.lineHeight = +campos.lineHeight;
      fonte.base = +campos.base;
    } else if (linha.startsWith('char ')) {
      fonte.chars[+campos.id] = {
        x: +campos.x, y: +campos.y, w: +campos.width, h: +campos.height,
        xo: +campos.xoffset, yo: +campos.yoffset, adv: +campos.xadvance,
      };
    }
  }
  return fonte;
}

const cacheTexto = new Map();
/** Desenha um texto com a fonte bitmap do jogo e devolve uma textura. */
export function texturaTexto(texto, variante = 'roxa') {
  const chave = variante + ':' + texto;
  if (cacheTexto.has(chave)) return cacheTexto.get(chave);
  const f = R.fonte;
  const img = R.imagens['fonte_' + variante];
  let largura = 4;
  for (const ch of texto) largura += (f.chars[ch.charCodeAt(0)] || f.chars[32]).adv;
  const c = document.createElement('canvas');
  c.width = largura + 4;
  c.height = f.lineHeight + 2;
  const ctx = c.getContext('2d');
  let x = 2;
  for (const ch of texto) {
    const g = f.chars[ch.charCodeAt(0)] || f.chars[32];
    if (g.w) ctx.drawImage(img, g.x, g.y, g.w, g.h, x + g.xo, g.yo, g.w, g.h);
    x += g.adv;
  }
  const t = texturaDe(c);
  cacheTexto.set(chave, t);
  return t;
}

// ---------- Texturas procedurais (sombras, efeitos, comidas) ----------
function canvas(w, h, desenho) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  desenho(ctx, w, h);
  return c;
}

function pixelArte(linhas, paleta, escala = 1) {
  const h = linhas.length;
  const w = Math.max(...linhas.map((l) => l.length));
  return canvas(w * escala, h * escala, (ctx) => {
    linhas.forEach((linha, y) => {
      [...linha].forEach((ch, x) => {
        if (ch === '.' || ch === ' ') return;
        ctx.fillStyle = paleta[ch];
        ctx.fillRect(x * escala, y * escala, escala, escala);
      });
    });
  });
}

function gerarTexturasProcedurais() {
  const t = R.tex;
  t.sombra = texturaDe(canvas(32, 10, (ctx) => {
    ctx.fillStyle = 'rgba(10,8,25,0.45)';
    ctx.beginPath();
    ctx.ellipse(16, 5, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }), { suave: true });

  t.impacto = texturaDe(canvas(48, 48, (ctx) => {
    const pontas = 10;
    const desenhar = (r1, r2, cor) => {
      ctx.fillStyle = cor;
      ctx.beginPath();
      for (let i = 0; i < pontas * 2; i++) {
        const r = i % 2 ? r2 : r1;
        const a = (i / (pontas * 2)) * Math.PI * 2;
        ctx.lineTo(24 + Math.cos(a) * r, 24 + Math.sin(a) * r);
      }
      ctx.fill();
    };
    desenhar(23, 10, '#1e1844');
    desenhar(20, 8, '#ffd23f');
    desenhar(12, 5, '#ffffff');
  }));

  t.onda = texturaDe(canvas(128, 40, (ctx) => {
    ctx.strokeStyle = '#7fe0d0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(64, 20, 60, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }), { suave: true });

  t.poeira = texturaDe(canvas(16, 16, (ctx) => {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();
  }));
  t.caco = texturaDe(canvas(4, 4, (ctx) => {
    ctx.fillStyle = '#58b058';
    ctx.fillRect(0, 0, 4, 4);
    ctx.fillStyle = '#c8ffc8';
    ctx.fillRect(0, 0, 2, 2);
  }));
  t.lasca = texturaDe(canvas(4, 4, (ctx) => {
    ctx.fillStyle = '#7a7a80';
    ctx.fillRect(0, 0, 4, 4);
  }));

  const pal = {
    k: '#1a1426', o: '#d8892e', O: '#f2b24a', y: '#ffd98a', b: '#9a5a1e', w: '#fff3d6',
    g: '#2a2a2a', G: '#4a4a4a', l: '#6a6a6a', q: '#ffd23f', Q: '#e0a020', h: '#b07a10',
  };
  t.coxinha = texturaDe(pixelArte([
    '.....kk.....',
    '....kOOk....',
    '...kOyOok...',
    '...kOOOok...',
    '..kOyOOook..',
    '..kOOOOOok..',
    '.kOyOOOOOok.',
    '.kOOOOOOook.',
    'kOOOOOOOoook',
    'kboooooooobk',
    '.kbbbbbbbbk.',
    '..kkkkkkkk..',
  ], pal, 2));
  t.pastel = texturaDe(pixelArte([
    '..kkkkkkkkkkkk..',
    '.kyOOOOOOOOOOOk.',
    'kOyOyOyOyOyOyOOk',
    'kOOOOOOOOOOOOOok',
    'kOOOwOOOOOwOOOok',
    'kOOOOOOOOOOOOook',
    '.kbbbbbbbbbbbbk.',
    '..kkkkkkkkkkkk..',
  ], pal, 2));
  t.saco = texturaDe(pixelArte([
    '...kk...',
    '..kllk..',
    '.kkGGkk.',
    'kGGgGGgk',
    'kGgggGgk',
    'kggggggk',
    'kgggggGk',
    '.kkkkkk.',
  ], pal, 2));
  t.queijo = texturaDe(pixelArte([
    '......kk',
    '....kkqk',
    '..kkqqQk',
    'kkqhqqqk',
    'kqqqqhQk',
    'kQqhqqQk',
    'kQQQQQQk',
    'kkkkkkkk',
  ], pal, 2));
  t.estrela = texturaDe(pixelArte([
    '....kk....',
    '...kqqk...',
    'kkkkqqkkkk',
    'kqqqqqqqqk',
    '.kqqQQqqk.',
    '..kqQQqk..',
    '.kqqkkqqk.',
    'kqqk..kqqk',
    'kkk....kkk',
  ], pal, 2));
}
