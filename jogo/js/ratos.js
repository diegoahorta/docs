// Gera em pixel art (desenho procedural em canvas) os membros da Gangue dos Ratos.
// Cada rato é desenhado de perfil, virado para a direita, numa grade de 64×66 pixels.

const L = 64;
const A = 66;
const CONTORNO = cor('#1a1426');

function cor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

class Arte {
  constructor(w = L, h = A) {
    this.w = w;
    this.h = h;
    this.px = new Uint8ClampedArray(w * h * 4);
  }
  ponto(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
    this.px[i + 3] = 255;
  }
  elipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(-ry); y <= Math.ceil(ry); y++) {
      for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
        if ((x * x) / (rx * rx + 0.4) + (y * y) / (ry * ry + 0.4) <= 1) this.ponto(cx + x, cy + y, c);
      }
    }
  }
  ret(x0, y0, w, h, c) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.ponto(x0 + x, y0 + y, c);
  }
  linha(x0, y0, x1, y1, c, esp = 1) {
    const passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
    const r = (esp - 1) / 2;
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      if (esp <= 1) this.ponto(x, y, c);
      else this.elipse(x, y, r, r, c);
    }
  }
  curva(pontos, c, esp) {
    for (let i = 0; i < pontos.length - 1; i++) {
      this.linha(pontos[i][0], pontos[i][1], pontos[i + 1][0], pontos[i + 1][1], c, esp);
    }
  }
  opaco(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.px[(y * this.w + x) * 4 + 3] > 0;
  }
  contornar() {
    const marcar = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.opaco(x, y)) continue;
        if (this.opaco(x + 1, y) || this.opaco(x - 1, y) || this.opaco(x, y + 1) || this.opaco(x, y - 1)) {
          marcar.push([x, y]);
        }
      }
    }
    for (const [x, y] of marcar) this.ponto(x, y, CONTORNO);
  }
  canvas() {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    c.getContext('2d').putImageData(new ImageData(this.px, this.w, this.h), 0, 0);
    return c;
  }
}

export const TIPOS = {
  ratinho: {
    nome: 'RATINHO DE ESGOTO',
    pelo: '#8d8c9e', sombra: '#5d5c72', barriga: '#cfc8d6', roupa: '#c83a3a', calca: '#2f3550',
    gordura: 1, acessorio: 'bandana', faixa: '#f0e0e0',
  },
  ratazana: {
    nome: 'RATAZANA',
    pelo: '#7d5c3c', sombra: '#553c26', barriga: '#caa886', roupa: '#2b2b38', calca: '#3c2a1e',
    gordura: 1.3, acessorio: 'bone', arma: 'taco', oculos: true,
  },
  lixeiro: {
    nome: 'RATO DO LIXÃO',
    pelo: '#7b8a68', sombra: '#55623f', barriga: '#c9cfa8', roupa: '#3f7a3a', calca: '#3a3a2a',
    gordura: 1.1, acessorio: 'capuz',
  },
  rei: {
    nome: 'REI RATO',
    pelo: '#9b90b4', sombra: '#665c80', barriga: '#ddd2ea', roupa: '#6a2a8a', calca: '#2a1f3a',
    gordura: 1.45, acessorio: 'coroa', capa: '#8a2a5a', corrente: true,
  },
};

const ROSA = cor('#e894aa');
const ROSA_ESC = cor('#b86a80');
const BRANCO = cor('#ffffff');
const OLHO = cor('#ff2b2b');
const PRETO = cor('#14101c');
const OURO = cor('#ffd23f');
const OURO_ESC = cor('#c08a1a');
const MADEIRA = cor('#a8743c');
const MADEIRA_ESC = cor('#6e4520');

function desenhar(t, pose) {
  const a = new Arte();
  const pelo = cor(t.pelo);
  const sombra = cor(t.sombra);
  const barriga = cor(t.barriga);
  const roupa = cor(t.roupa);
  const calca = cor(t.calca);
  const g = t.gordura;
  const oy = pose.bob || 0;
  const inc = pose.inclina || 0;

  const quadril = [28 + inc * 0.3, 44 + oy];
  const ombro = [31 + inc, 27 + oy];
  const ombroTras = [25 + inc, 28 + oy];
  const cabeca = [33 + inc * 1.3, 18 + oy];

  // Capa (atrás de tudo)
  if (t.capa) {
    const c = cor(t.capa);
    for (let y = 22; y <= 56; y++) {
      const larg = 4 + (y - 22) * 0.45;
      a.linha(24 + inc - larg, y + oy, 26 + inc, y + oy, y > 50 ? sombra : c, 1);
    }
  }

  // Rabo
  a.curva([[quadril[0] - 8, quadril[1] + 2], [9, 50], [4, 57], [7, 63], [14, 64]], ROSA_ESC, 2);

  // Perna de trás
  const pernas = pose.pernas || [[4, 0], [-4, 0]];
  const pe = (dx, lift, c) => {
    const fx = quadril[0] + dx;
    const fy = 63 - lift;
    const jx = (quadril[0] + fx) / 2 + 2;
    const jy = (quadril[1] + fy) / 2;
    a.curva([[quadril[0], quadril[1]], [jx, jy], [fx, fy - 2]], c, 4 + (g - 1) * 2);
    a.ret(fx - 2, fy - 1, 7, 2, ROSA);
  };
  pe(pernas[1][0], pernas[1][1], sombra);

  // Braço de trás
  const braco = (o, ang, c, comprimento = 13) => {
    const fim = [o[0] + Math.cos(ang) * comprimento, o[1] + Math.sin(ang) * comprimento];
    a.linha(o[0], o[1], fim[0], fim[1], c, 3);
    a.elipse(fim[0], fim[1], 2, 2, ROSA);
    return fim;
  };
  braco(ombroTras, pose.bracoTras ?? 1.4, sombra);

  // Corpo
  a.elipse(28 + inc, 33 + oy, 8.5 * g, 12, pelo);
  a.elipse(26 + inc, 37 + oy, 7 * g, 8, sombra);
  a.elipse(31 + inc, 35 + oy, 4 * g, 7, barriga);
  // Roupa: regata/jaqueta na metade de cima do tronco
  for (let y = 23; y <= 39; y++) {
    for (let x = 14; x <= 44; x++) {
      if (a.opaco(x, y + oy) && !(t.acessorio === 'bandana' && x > 29 + inc && y > 27)) {
        const dx = x - (28 + inc);
        const dy = y - 33;
        if ((dx * dx) / ((8.5 * g + 0.4) ** 2) + (dy * dy) / (12.4 ** 2) <= 1) {
          a.ponto(x, y + oy, y > 36 ? calca : roupa);
        }
      }
    }
  }
  if (t.acessorio === 'bandana') {
    // regata branca listrada
    for (let y = 26; y <= 37; y += 3) a.linha(20 + inc, y + oy, 28 + inc, y + oy, cor(t.faixa));
  }
  if (t.corrente) {
    for (let i = 0; i < 7; i++) a.ponto(27 + inc + i * 1.4, 24 + oy + Math.sin(i / 6 * Math.PI) * 4, i % 2 ? OURO_ESC : OURO);
    a.elipse(32 + inc, 29 + oy, 1.5, 1.5, OURO);
  }

  // Perna da frente
  pe(pernas[0][0], pernas[0][1], calca);

  // Cabeça
  const [cx, cy] = cabeca;
  a.elipse(cx - 7, cy - 10, 4, 4, sombra); // orelha de trás
  a.elipse(cx, cy, 9, 8, pelo);
  a.elipse(cx - 2, cy + 4, 7, 3.5, sombra);
  a.elipse(cx, cy - 1, 8, 6, pelo);
  // Focinho
  for (let i = 0; i <= 11; i++) {
    const meia = Math.max(1.5, 5.5 - i * 0.4);
    a.linha(cx + 5 + i, cy + 1 - meia + 1, cx + 5 + i, cy + 1 + meia, pelo);
  }
  a.ret(cx + 15, cy - 1, 3, 3, ROSA); // nariz
  a.ponto(cx + 17, cy, PRETO);
  // Bigodes
  a.linha(cx + 11, cy - 1, cx + 14, cy - 6, sombra);
  a.linha(cx + 11, cy + 3, cx + 14, cy + 7, sombra);
  // Dentes e boca
  if (pose.boca) {
    a.ret(cx + 8, cy + 4, 6, 2, PRETO);
    a.ret(cx + 10, cy + 4, 2, 2, BRANCO);
  } else {
    a.ret(cx + 10, cy + 4, 2, 2, BRANCO);
  }
  // Olho
  if (pose.olhoFechado) {
    a.linha(cx + 2, cy - 3, cx + 5, cy - 2, PRETO);
  } else if (t.oculos) {
    a.ret(cx, cy - 4, 8, 3, PRETO);
    a.ponto(cx + 2, cy - 4, BRANCO);
  } else {
    a.ret(cx + 2, cy - 4, 3, 3, OLHO);
    a.ponto(cx + 2, cy - 4, BRANCO);
    a.linha(cx + 1, cy - 7, cx + 6, cy - 5, PRETO); // sobrancelha brava
  }
  // Orelha da frente
  a.elipse(cx - 4, cy - 10, 4.5, 5, pelo);
  a.elipse(cx - 4, cy - 10, 2.5, 3, ROSA);

  // Acessórios de cabeça
  if (t.acessorio === 'bandana') {
    const c = cor(t.roupa);
    a.linha(cx - 8, cy - 4, cx + 5, cy - 6, c, 2);
    a.linha(cx - 9, cy - 4, cx - 13, cy + 1, c, 2);
  } else if (t.acessorio === 'bone') {
    const c = cor('#e0b020');
    for (let y = -7; y <= -3; y++) a.linha(cx - 7, cy + y, cx + 6, cy + y, c);
    a.ret(cx + 4, cy - 3, 9, 2, c);
    a.ret(cx - 7, cy - 3, 11, 1, cor('#a07a10'));
  } else if (t.acessorio === 'capuz') {
    const c = cor(t.roupa);
    for (let y = -8; y <= 4; y++) a.linha(cx - 9, cy + y, cx - 2 - Math.max(0, -y - 4), cy + y, c);
    a.linha(cx - 2, cy - 8, cx + 3, cy - 7, c, 2);
  } else if (t.acessorio === 'coroa') {
    a.ret(cx - 6, cy - 13, 12, 3, OURO);
    for (const dx of [-6, -1, 4]) {
      a.linha(cx + dx, cy - 13, cx + dx + 1, cy - 18, OURO, 2);
    }
    a.ponto(cx, cy - 12, OLHO);
    a.ret(cx - 6, cy - 11, 12, 1, OURO_ESC);
  }

  // Braço da frente (+ arma)
  const angulo = pose.braco ?? 1.2;
  const mao = braco(ombro, angulo, pelo);
  a.linha(ombro[0], ombro[1], ombro[0] + Math.cos(angulo) * 4, ombro[1] + Math.sin(angulo) * 4, roupa, 4);
  if (t.arma === 'taco') {
    const ang = pose.taco ?? angulo - 1.6;
    const fim = [mao[0] + Math.cos(ang) * 20, mao[1] + Math.sin(ang) * 20];
    a.linha(mao[0], mao[1], fim[0], fim[1], MADEIRA_ESC, 3);
    a.linha(mao[0] + Math.cos(ang) * 8, mao[1] + Math.sin(ang) * 8, fim[0], fim[1], MADEIRA, 4);
    a.elipse(mao[0], mao[1], 2, 2, ROSA);
  }
  if (pose.segura) {
    // saco de lixo na mão
    a.elipse(mao[0] + 1, mao[1] - 4, 4, 4, cor('#2a2a2a'));
    a.ponto(mao[0], mao[1] - 7, cor('#6a6a6a'));
  }

  a.contornar();
  return a.canvas();
}

function girarDeitado(canvas) {
  // Gira 90° no sentido anti-horário: o rato cai de costas, cabeça para trás.
  const c = document.createElement('canvas');
  c.width = canvas.height;
  c.height = canvas.width;
  const ctx = c.getContext('2d');
  ctx.translate(0, c.height);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(canvas, 0, 0);
  return aparar(c);
}

function aparar(canvas) {
  const ctx = canvas.getContext('2d');
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return canvas;
  const c = document.createElement('canvas');
  c.width = x1 - x0 + 1;
  c.height = y1 - y0 + 1;
  c.getContext('2d').drawImage(canvas, -x0, -y0);
  return c;
}

const POSES = {
  parado0: { pernas: [[4, 0], [-4, 0]], braco: 1.1, bracoTras: 1.4 },
  parado1: { pernas: [[4, 0], [-4, 0]], braco: 1.2, bracoTras: 1.5, bob: 1 },
  andar0: { pernas: [[7, 0], [-6, 0]], braco: 1.6, bracoTras: 0.8, inclina: 1 },
  andar1: { pernas: [[2, 3], [-2, 0]], braco: 1.3, bracoTras: 1.2, inclina: 1, bob: 1 },
  andar2: { pernas: [[-6, 0], [7, 0]], braco: 0.8, bracoTras: 1.7, inclina: 1 },
  andar3: { pernas: [[-2, 0], [2, 3]], braco: 1.2, bracoTras: 1.3, inclina: 1, bob: 1 },
  preparar: { pernas: [[6, 0], [-6, 0]], braco: -2.2, bracoTras: 1.0, inclina: -2, boca: true, taco: -2.6 },
  atacar: { pernas: [[9, 0], [-7, 0]], braco: 0.15, bracoTras: 1.7, inclina: 4, boca: true, taco: 0.25 },
  dor: { pernas: [[-2, 0], [5, 0]], braco: -0.7, bracoTras: -1.0, inclina: -3, boca: true, olhoFechado: true },
  arremessar: { pernas: [[8, 0], [-6, 0]], braco: -0.5, bracoTras: 1.6, inclina: 3, boca: true },
  segurar: { pernas: [[5, 0], [-5, 0]], braco: -2.4, bracoTras: 1.2, inclina: -1, segura: true },
  investida: { pernas: [[10, 2], [-9, 0]], braco: 0.0, bracoTras: 2.2, inclina: 5, boca: true, taco: 0.2 },
};

const cache = new Map();

/** Retorna { nome, quadros: { pose: canvas } } para o tipo de rato. */
export function gerarRato(tipo) {
  if (cache.has(tipo)) return cache.get(tipo);
  const t = TIPOS[tipo];
  const quadros = {};
  for (const [nome, pose] of Object.entries(POSES)) quadros[nome] = aparar(desenhar(t, pose));
  quadros.caido = girarDeitado(desenhar(t, POSES.dor));
  const r = { nome: t.nome, quadros };
  cache.set(tipo, r);
  return r;
}

/** Retrato (cabeça) para a caixa de diálogo. */
export function retratoRato(tipo) {
  const base = desenhar(TIPOS[tipo], { ...POSES.parado0, boca: true });
  const c = document.createElement('canvas');
  c.width = 120;
  c.height = 120;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 10, -2, 40, 40, 0, 0, 120, 120);
  return c;
}
