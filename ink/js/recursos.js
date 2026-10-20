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
    const suave = grupo !== 'texturas';
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
  R.ratos.elite = R.ratos.cacador; // o chefe da represa é um caçador de elite

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
  texturasDeNovaSaoPaulo(t);
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

// ---------- Nova São Paulo, 3030: chão, garras de tinta, tiros e o retrato da criatura ----------
function ruidoCanvas(w, h, base, desenho) {
  return canvas(w, h, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    desenho?.(ctx, w, h);
  });
}

function texturasDeNovaSaoPaulo(t) {
  // asfalto molhado com reflexos de neon
  t.texturas_neon = texturaDe(ruidoCanvas(128, 64, '#16151f', (ctx) => {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = ['rgba(255,40,70,0.18)', 'rgba(70,120,255,0.18)', 'rgba(170,80,255,0.15)'][i % 3];
      ctx.fillRect(Math.random() * 128, Math.random() * 64, 2 + Math.random() * 3, 10 + Math.random() * 22);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 30, 128, 2);
  }), { repetir: true });
  // placas de metal com rebites (calçadas do centro e da muralha)
  t.texturas_metal = texturaDe(ruidoCanvas(64, 64, '#2a2c35', (ctx) => {
    ctx.strokeStyle = '#121218';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
    ctx.fillStyle = '#4a4d5a';
    for (const [x, y] of [[6, 6], [57, 6], [6, 57], [57, 57]]) ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.fillStyle = 'rgba(90,140,255,0.25)';
    ctx.fillRect(0, 31, 64, 2);
  }), { repetir: true });
  // lama e entulho de Excidium Grajaú
  t.texturas_lama = texturaDe(ruidoCanvas(96, 64, '#2b2620', (ctx) => {
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = ['#3d352b', '#1e1b17', '#4a4136', '#2f3a2a'][i % 4];
      const r = 1 + Math.random() * 4;
      ctx.fillRect(Math.random() * 96, Math.random() * 64, r * 2, r);
    }
  }), { repetir: true });
  // água contaminada da represa (perigo)
  t.texturas_agua_toxica = texturaDe(ruidoCanvas(96, 48, '#1d3b26', (ctx) => {
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(120,255,120,0.25)' : 'rgba(20,60,30,0.6)';
      ctx.fillRect(Math.random() * 96, Math.random() * 48, 8 + Math.random() * 18, 2);
    }
  }), { repetir: true });
  t.texturas_meiofio_neon = texturaDe(canvas(64, 16, (ctx) => {
    ctx.fillStyle = '#3a3d48';
    ctx.fillRect(0, 0, 64, 16);
    ctx.fillStyle = '#1b1c22';
    ctx.fillRect(0, 12, 64, 4);
    ctx.fillStyle = 'rgba(80,140,255,0.8)';
    ctx.fillRect(0, 2, 64, 2);
  }), { repetir: true });

  // garras de tinta viva
  t.garras = texturaDe(canvas(64, 64, (ctx) => {
    ctx.lineCap = 'round';
    for (const [cor, larg] of [['rgba(120,60,255,0.55)', 9], ['rgba(70,170,255,0.9)', 4], ['#e8f2ff', 1.5]]) {
      ctx.strokeStyle = cor;
      ctx.lineWidth = larg;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(10 + k * 9, 6 + k * 4);
        ctx.quadraticCurveTo(46 + k * 3, 20 + k * 6, 30 + k * 8, 58 - k * 2);
        ctx.stroke();
      }
    }
  }), { suave: true });

  // disparo de energia das armas de Alpha
  t.bala = texturaDe(canvas(40, 10, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 40, 0);
    g.addColorStop(0, 'rgba(255,40,60,0)');
    g.addColorStop(0.7, 'rgba(255,60,80,0.9)');
    g.addColorStop(1, '#fff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 2, 40, 6);
  }), { suave: true });

  // retrato da criatura viscosa (sem olhos, dentes afiados)
  R.imagens.retrato_criatura = canvas(160, 160, (ctx) => {
    const g = ctx.createRadialGradient(80, 70, 10, 80, 90, 90);
    g.addColorStop(0, '#9be86b');
    g.addColorStop(0.6, '#2f7a2b');
    g.addColorStop(1, '#0d2210');
    ctx.fillStyle = '#0a120b';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(80, 85, 62, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#071007';
    ctx.beginPath();
    ctx.ellipse(80, 110, 42, 22, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#f2f6ea';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(44 + i * 9, 110);
      ctx.lineTo(48 + i * 9, 124 + (i % 2) * 4);
      ctx.lineTo(52 + i * 9, 110);
      ctx.fill();
    }
    ctx.strokeStyle = '#c0436a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(80, 120);
    ctx.bezierCurveTo(70, 150, 120, 150, 140, 135);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,255,170,0.35)';
    ctx.beginPath();
    ctx.ellipse(62, 52, 16, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
