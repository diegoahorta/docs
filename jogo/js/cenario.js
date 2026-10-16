// Monta o cenário de uma fase: céu, horizonte, prédios, calçada, rua, objetos,
// plataformas e áreas de perigo.
import * as THREE from 'three';
import { BASE_Y, FUNDO_Y, LARGURA, ALTURA, Z_MEIO_FIO } from './config.js';
import { R, texturaDe } from './recursos.js';
import { Sprite, plano, retangulo } from './sprite.js';

export const CAMADA = { CEU: 0, HORIZONTE: 5, LONGE: 10, FACHADA: 20, CHAO: 30, MARCAS: 35, EFEITO: 8000 };

/** Ordem de desenho dos objetos do mundo: quanto maior a chave (mais ao fundo), antes desenha. */
export function ordemMundo(chave) {
  return 1000 + Math.round((260 - chave) * 10);
}

// Dimensões dos objetos sólidos: escala, profundidade (z) e altura do topo em que se pode subir.
const SOLIDOS = {
  onibus: { escala: 1.15, prof: 30, topo: 150, margem: 10 },
  carro: { escala: 1.1, prof: 26, topo: 78, margem: 30 },
  banca: { escala: 1.1, prof: 22, topo: 140, margem: 8 },
  ponto_onibus: { escala: 1.1, prof: 20, topo: 120, margem: 6 },
  feira: { escala: 1.1, prof: 20, topo: 138, margem: 10 },
};

function gradienteCeu(cores, noite) {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 270;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, cores[0]);
  g.addColorStop(1, cores[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, 270);
  if (noite) {
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
      ctx.fillRect(Math.floor(Math.random() * 480), Math.floor(Math.random() * 180), 1, 1);
    }
    ctx.fillStyle = '#f4f0d8';
    ctx.beginPath();
    ctx.arc(380, 50, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cores[0];
    ctx.beginPath();
    ctx.arc(372, 45, 16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const [x, y, w] of [[60, 50, 70], [250, 34, 90], [400, 70, 60]]) {
      ctx.fillRect(x, y, w, 8);
      ctx.fillRect(x + 10, y - 6, w - 30, 6);
    }
  }
  return texturaDe(c, { suave: true });
}

function silhuetaHorizonte(cor, noite) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 200;
  const ctx = c.getContext('2d');
  let x = 0;
  let semente = 7;
  const aleat = () => ((semente = (semente * 9301 + 49297) % 233280) / 233280);
  while (x < 1024) {
    const w = 30 + aleat() * 60;
    const h = 50 + aleat() * 140;
    ctx.fillStyle = cor;
    ctx.fillRect(x, 200 - h, w, h);
    if (aleat() > 0.7) ctx.fillRect(x + w / 2 - 1, 200 - h - 14, 2, 14); // antena
    ctx.fillStyle = noite ? 'rgba(255,220,120,0.8)' : 'rgba(255,255,255,0.18)';
    for (let wy = 200 - h + 6; wy < 196; wy += 8) {
      for (let wx = x + 4; wx < x + w - 4; wx += 7) if (aleat() > (noite ? 0.75 : 0.55)) ctx.fillRect(wx, wy, 3, 4);
    }
    x += w + aleat() * 6;
  }
  const t = texturaDe(c, { repetir: true });
  return t;
}

function bordaPerigo() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1426';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#ffd23f';
  for (let i = -16; i < 32; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 16);
    ctx.lineTo(i + 4, 16);
    ctx.lineTo(i + 20, 0);
    ctx.lineTo(i + 16, 0);
    ctx.fill();
  }
  return texturaDe(c, { repetir: true });
}

let texBrilho = null;
function brilho() {
  if (texBrilho) return texBrilho;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,230,150,0.75)');
  g.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  texBrilho = texturaDe(c, { suave: true });
  return texBrilho;
}

export class Cenario {
  constructor(cena, fase) {
    this.fase = fase;
    this.raiz = new THREE.Group();
    cena.add(this.raiz);
    this.fixo = new THREE.Group(); // acompanha a câmera
    this.longe = new THREE.Group(); // paralaxe
    this.mundo = new THREE.Group();
    this.raiz.add(this.fixo, this.longe, this.mundo);

    this.solidos = [];
    this.plataformas = [];
    this.perigos = [];
    this.ordenaveis = []; // { sprite, chave }

    this.montarFundo();
    this.montarChao();
    this.montarObjetos();
  }

  montarFundo() {
    const f = this.fase;
    const ceu = new Sprite(this.fixo, gradienteCeu(f.ceu, f.noite), { centro: true });
    ceu.mesh.scale.set(LARGURA, ALTURA, 1);
    ceu.pos(LARGURA / 2, ALTURA / 2);
    ceu.ordem = CAMADA.CEU;

    const horiz = silhuetaHorizonte(f.horizonte, f.noite);
    this.texHorizonte = horiz;
    horiz.repeat.set(LARGURA / 1024, 1);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(LARGURA, 200),
      new THREE.MeshBasicMaterial({ map: horiz, transparent: true, depthTest: false, depthWrite: false }),
    );
    m.position.set(LARGURA / 2, FUNDO_Y + 110, 0);
    m.renderOrder = CAMADA.HORIZONTE;
    this.fixo.add(m);

    // Prédios distantes (paralaxe 0,5), tingidos com a cor do horizonte.
    const cor = new THREE.Color(f.horizonte).lerp(new THREE.Color(0xffffff), f.noite ? 0.25 : 0.45);
    let x = -100;
    let i = 0;
    while (x < f.comprimento * 0.5 + LARGURA + 200) {
      const nome = f.distantes[i++ % f.distantes.length];
      const s = new Sprite(this.longe, R.tex['cenario_' + nome], { escala: 0.62, cor });
      s.pos(x, FUNDO_Y + 40);
      s.ordem = CAMADA.LONGE;
      x += s.mesh.scale.x + 40 + (i % 3) * 30;
    }

    // Fachadas na linha da calçada (paralaxe 1).
    x = -300;
    i = 0;
    this.postesNoite = [];
    while (x < f.comprimento + LARGURA + 300) {
      const nome = f.fachadas[i++ % f.fachadas.length];
      const escala = nome.startsWith('muro') ? 1.2 : 1.15;
      const s = new Sprite(this.mundo, R.tex['cenario_' + nome], { escala, cor: f.tinta });
      const w = s.mesh.scale.x;
      s.pos(x + w / 2, FUNDO_Y - 6);
      s.ordem = CAMADA.FACHADA;
      if (f.noite && !nome.startsWith('muro')) {
        // janelas acesas: um brilho suave sobre a fachada
        const b = new Sprite(this.mundo, brilho(), { centro: true, opacidade: 0.35 });
        b.mesh.scale.set(w * 0.8, s.mesh.scale.y * 0.5, 1);
        b.pos(x + w / 2, FUNDO_Y + s.mesh.scale.y * 0.45);
        b.material.blending = THREE.AdditiveBlending;
        b.ordem = CAMADA.FACHADA + 1;
      }
      x += w + 6;
    }
  }

  montarChao() {
    const f = this.fase;
    const x0 = -600;
    const x1 = f.comprimento + LARGURA + 600;
    const meio = BASE_Y + Z_MEIO_FIO;
    plano(this.mundo, R.tex[f.calcada], x0, meio - 4, x1, FUNDO_Y + 4, { tileX: 64, tileY: 64, ordem: CAMADA.CHAO, cor: f.tinta });
    plano(this.mundo, R.tex.texturas_asfalto, x0, 0, x1, meio - 12, { tileX: 120, tileY: 80, ordem: CAMADA.CHAO, cor: f.tinta });
    plano(this.mundo, R.tex.texturas_calcada_meiofio, x0, meio - 16, x1, meio + 2, { tileX: 64, tileY: 18, ordem: CAMADA.CHAO + 1, cor: f.tinta });
    // Faixas da rua e faixas de pedestre
    const corFaixa = f.noite ? 0x9a9ab8 : 0xf0ecd8;
    const faixasPedestre = [];
    for (let x = 600; x < f.comprimento; x += 1500) faixasPedestre.push(x);
    for (let x = x0; x < x1; x += 140) {
      if (faixasPedestre.some((fx) => x + 60 > fx - 20 && x < fx + 170)) continue;
      retangulo(this.mundo, corFaixa, x, BASE_Y + 18, x + 60, BASE_Y + 24, CAMADA.MARCAS);
    }
    for (const x of faixasPedestre) {
      for (let k = 0; k < 7; k++) {
        retangulo(this.mundo, corFaixa, x + k * 22, 6, x + k * 22 + 12, meio - 16, CAMADA.MARCAS);
      }
    }
    // Áreas de perigo (buracos na rua)
    const borda = bordaPerigo();
    for (const p of f.perigos) {
      this.perigos.push(p);
      const y0 = BASE_Y + p.z0;
      const y1 = BASE_Y + p.z1;
      plano(this.mundo, borda, p.x0 - 6, y0 - 6, p.x1 + 6, y1 + 6, { tileX: 12, tileY: 12, ordem: CAMADA.MARCAS });
      plano(this.mundo, R.tex['ui_area-de-perigo'], p.x0, y0, p.x1, y1, { tileX: 32, tileY: 32, ordem: CAMADA.MARCAS + 1 });
      for (const [cx, cz] of [[p.x0 - 14, p.z1 + 4], [p.x1 + 14, p.z1 + 4], [p.x0 - 14, p.z0 - 2], [p.x1 + 14, p.z0 - 2]]) {
        this.decoracao('cone', cx, cz, 0.8);
      }
    }
  }

  decoracao(nome, x, z, escala = 1) {
    const s = new Sprite(this.mundo, R.tex['cenario_' + nome], { escala, cor: this.fase.tinta });
    s.pos(x, BASE_Y + z);
    s.ordem = ordemMundo(z);
    if (this.fase.noite && nome === 'poste_luz') {
      const b = new Sprite(this.mundo, brilho(), { centro: true, opacidade: 0.9 });
      b.mesh.scale.set(260, 220, 1);
      b.pos(x + 20, BASE_Y + z + s.mesh.scale.y * 0.55);
      b.material.blending = THREE.AdditiveBlending;
      b.ordem = CAMADA.EFEITO - 10;
    }
    return s;
  }

  montarObjetos() {
    const f = this.fase;
    // Objetos sólidos (dá para subir em cima)
    for (const o of f.objetos) {
      const d = SOLIDOS[o.tipo];
      const s = new Sprite(this.mundo, R.tex['cenario_' + o.tipo], { escala: d.escala, cor: f.tinta });
      s.pos(o.x, BASE_Y + o.z);
      s.ordem = ordemMundo(o.z);
      const meia = s.mesh.scale.x / 2 - d.margem;
      this.solidos.push({ x0: o.x - meia, x1: o.x + meia, z0: o.z, z1: o.z + d.prof, topo: d.topo, solido: true });
    }

    // Plataformas atravessáveis (andaimes com o bloco atravessável)
    for (const p of f.plataformas) {
      const ordem = ordemMundo(p.z0);
      const poste = 0x3b1725;
      const yTopo0 = BASE_Y + p.z0 + p.topo;
      const yTopo1 = BASE_Y + p.z1 + p.topo;
      for (const x of [p.x0 + 6, p.x1 - 10]) {
        retangulo(this.mundo, 0x2a1020, x, BASE_Y + p.z1, x + 4, yTopo1, ordemMundo(p.z1));
        retangulo(this.mundo, poste, x, BASE_Y + p.z0, x + 5, yTopo0 - 10, ordem);
      }
      plano(this.mundo, R.tex['ui_bloco-atravessavel'], p.x0, yTopo0, p.x1, yTopo1, { tileX: 32, tileY: 32, ordem });
      retangulo(this.mundo, 0x3b1725, p.x0, yTopo0 - 10, p.x1, yTopo0, ordem);
      retangulo(this.mundo, 0x73172d, p.x0, yTopo0 - 3, p.x1, yTopo0, ordem);
      this.plataformas.push({ ...p, solido: false });
    }

    // Decoração: postes, árvores, lixeiras... evitando os sólidos.
    const opcoes = this.fase.noite
      ? ['poste_luz', 'lixeira', 'arvore', 'orelhao', 'poste_luz', 'jardineira', 'placa_rua']
      : ['arvore', 'poste_luz', 'lixeira', 'banco', 'orelhao', 'arvore', 'semaforo', 'placa_pedestre', 'jardineira'];
    let k = 0;
    for (let x = 380; x < f.comprimento + LARGURA; x += 230) {
      const livre = (z) => ![...this.solidos, ...this.plataformas].some((s) => x > s.x0 - 70 && x < s.x1 + 70 && Math.abs(z - s.z0) < 60);
      const nome = opcoes[k++ % opcoes.length];
      const fundo = k % 2 === 0;
      const z = fundo ? 148 : Z_MEIO_FIO + 6;
      if (!livre(z)) continue;
      if (!fundo && (nome === 'banco' || nome === 'jardineira')) continue;
      this.decoracao(nome, x, z, nome === 'arvore' ? 1.1 : 1);
    }
  }

  atualizar(camX) {
    this.fixo.position.x = camX;
    this.longe.position.x = camX * 0.5;
    this.texHorizonte.offset.x = (camX * 0.15) / 1024;
  }

  /** Superfície (sólido ou plataforma) sob (x, z) com topo até `alturaMax`. */
  superficie(x, z, alturaMax, ignorar) {
    let melhor = null;
    for (const s of [...this.solidos, ...this.plataformas]) {
      if (s === ignorar) continue;
      if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && s.topo <= alturaMax + 0.5) {
        if (!melhor || s.topo > melhor.topo) melhor = s;
      }
    }
    return melhor;
  }

  /** Sólido que bloqueia a posição (x, z) para quem está na altura h. */
  bloqueio(x, z, h, raio = 14) {
    for (const s of this.solidos) {
      if (x + raio > s.x0 && x - raio < s.x1 && z > s.z0 - 4 && z < s.z1 + 2 && h < s.topo - 2) return s;
    }
    return null;
  }

  perigoEm(x, z) {
    return this.perigos.some((p) => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1);
  }

  remover() {
    this.raiz.parent?.remove(this.raiz);
    this.raiz.traverse((o) => {
      // as texturas compartilhadas (R.tex) continuam em uso pelas próximas fases
      if (o.material) o.material.dispose();
    });
  }
}
