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
  grajau_onibus: { escala: 1.25, prof: 30, topo: 158, margem: 12 },
  grajau_carro_prata: { escala: 1.25, prof: 26, topo: 84, margem: 26 },
  grajau_carro_preto: { escala: 1.25, prof: 26, topo: 84, margem: 22 },
  parelheiros_onibus: { escala: 0.9, prof: 30, topo: 140, margem: 12 },
  dutra_onibus: { escala: 1.15, prof: 30, topo: 142, margem: 12 },
  dutra_carro: { escala: 1.25, prof: 26, topo: 80, margem: 24 },
  belmira_onibus_verde: { escala: 2, prof: 30, topo: 118, margem: 8 },
  belmira_onibus_azul: { escala: 2.1, prof: 30, topo: 120, margem: 8 },
  belmira_articulado: { escala: 2, prof: 30, topo: 116, margem: 8 },
  belmira_hb20: { escala: 1.9, prof: 26, topo: 66, margem: 22 },
  belmira_sedan: { escala: 1.85, prof: 26, topo: 64, margem: 24 },
  belmira_vermelho: { escala: 1.9, prof: 26, topo: 66, margem: 22 },
  belmira_cinza: { escala: 1.85, prof: 26, topo: 66, margem: 24 },
};

// Decoração padrão (quando a fase não define a sua) e escala de cada objeto.
const DECORACAO_DIA = ['arvore', 'poste_luz', 'lixeira', 'banco', 'orelhao', 'arvore', 'semaforo', 'placa_pedestre', 'jardineira'];
const DECORACAO_NOITE = ['poste_luz', 'lixeira', 'arvore', 'orelhao', 'poste_luz', 'jardineira', 'placa_rua'];
const SO_NO_FUNDO = ['banco', 'jardineira', 'grajau_portao', 'grajau_grade'];

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
    this.montarAgua();
    this.montarChuva();
  }

  // Água animada (BNH alagado), entulho boiando, área segura e a enxurrada da Belmira Marin.
  montarAgua() {
    const f = this.fase;
    this.animados = [];
    this.obstaculos = [];
    const x0 = -600;
    const x1 = f.comprimento + LARGURA + 600;
    const topo = FUNDO_Y + 4;
    if (f.jet) {
      const agua = plano(this.mundo, R.tex.texturas_alagado_agua, x0, 0, f.jet.terra, topo, { tileX: 103, tileY: 44, ordem: CAMADA.CHAO + 2 });
      this.animados.push({ m: agua, vx: 0.05, vy: 0.02 });
      const terra = plano(this.mundo, R.tex.texturas_alagado_calcada, f.jet.terra, 0, x1, topo, { tileX: 152, tileY: 44, ordem: CAMADA.CHAO + 2 });
      terra.renderOrder = CAMADA.CHAO + 3;
      this.decoracao('alagado_escada', f.jet.terra + 30, 150, 1.1);
      this.decoracao('alagado_bandeira', f.jet.terra + 200, 140, 1.3);
      this.decoracao('alagado_sacos', f.jet.terra + 20, 8, 1.2);
      for (const [tipo, x, z] of f.jet.obstaculos) {
        const s = this.decoracao('alagado_' + tipo, x, z, 1.2);
        this.obstaculos.push({ x, z, s, fase: Math.random() * 6 });
      }
    }
    if (f.enxurrada) {
      const seguro = [...f.enxurrada.seguro].sort((a, b) => a[0] - b[0]);
      let ini = x0;
      const trechos = [];
      for (const [a, b] of seguro) {
        if (a > ini) trechos.push([ini, a]);
        ini = Math.max(ini, b);
      }
      trechos.push([ini, x1]);
      for (const [a, b] of trechos) {
        const m = plano(this.mundo, R.tex.texturas_alagado_agua, a, 0, b, topo, { tileX: 103, tileY: 44, ordem: CAMADA.CHAO + 2, opacidade: 0.88 });
        this.animados.push({ m, vx: 0.12, vy: 0 });
      }
      for (const [a, b] of seguro) {
        plano(this.mundo, R.tex.texturas_dutra_calcada, Math.max(a, x0), 0, Math.min(b, x1), topo, { tileX: 89, tileY: 65, ordem: CAMADA.CHAO + 3 });
      }
    }
  }

  // Chuva em tela cheia (cresce ao longo da fase se `chuva.inicio` < `chuva.cheia`) e relâmpagos.
  montarChuva() {
    const f = this.fase;
    this.chuva = null;
    if (!f.chuva) return;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const l = 8 + Math.random() * 16;
      ctx.strokeStyle = `rgba(200,220,255,${0.25 + Math.random() * 0.45})`;
      ctx.lineWidth = Math.random() < 0.3 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - l * 0.3, y + l);
      ctx.stroke();
    }
    const tex = texturaDe(c, { repetir: true });
    tex.repeat.set(LARGURA / 256, ALTURA / 256);
    const mat = (map, cor, op) => new THREE.MeshBasicMaterial({ map, color: cor, transparent: true, opacity: op, depthTest: false, depthWrite: false });
    const geo = new THREE.PlaneGeometry(LARGURA, ALTURA);
    const escuro = new THREE.Mesh(geo, mat(null, 0x0a1430, 0));
    const gotas = new THREE.Mesh(geo, mat(tex, 0xffffff, 0));
    const clarao = new THREE.Mesh(geo, mat(null, 0xdde8ff, 0));
    for (const [m, o] of [[escuro, CAMADA.EFEITO + 40], [gotas, CAMADA.EFEITO + 41], [clarao, CAMADA.EFEITO + 42]]) {
      m.position.set(LARGURA / 2, ALTURA / 2, 0);
      m.renderOrder = o;
      this.fixo.add(m);
    }
    this.chuva = { tex, escuro, gotas, clarao, t: 0, proximo: 3 + Math.random() * 4, flash: 0 };
  }

  montarFundo() {
    const f = this.fase;
    const ceu = new Sprite(this.fixo, gradienteCeu(f.ceu, f.noite), { centro: true });
    ceu.mesh.scale.set(LARGURA, ALTURA, 1);
    ceu.pos(LARGURA / 2, ALTURA / 2);
    ceu.ordem = CAMADA.CEU;

    // Horizonte: o panorama da fase (ex.: os morros do Grajaú) ou uma silhueta gerada.
    let horiz;
    let alturaH = 200;
    if (f.panorama) {
      horiz = R.tex[f.panorama].clone();
      horiz.userData = { ...R.tex[f.panorama].userData };
      horiz.wrapS = THREE.MirroredRepeatWrapping;
      horiz.needsUpdate = true;
      alturaH = horiz.userData.h * f.escalaPanorama;
      this.larguraHorizonte = horiz.userData.w * f.escalaPanorama;
    } else {
      horiz = silhuetaHorizonte(f.horizonte, f.noite);
      this.larguraHorizonte = 1024;
    }
    this.texHorizonte = horiz;
    horiz.repeat.set(LARGURA / this.larguraHorizonte, 1);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(LARGURA, alturaH),
      new THREE.MeshBasicMaterial({ map: horiz, transparent: true, depthTest: false, depthWrite: false }),
    );
    m.position.set(LARGURA / 2, FUNDO_Y + (f.panorama ? f.alturaPanorama : 10) + alturaH / 2, 0);
    m.renderOrder = CAMADA.HORIZONTE;
    this.fixo.add(m);

    // Prédios distantes (paralaxe 0,5), tingidos com a cor do horizonte.
    const cor = new THREE.Color(f.horizonte).lerp(new THREE.Color(0xffffff), f.noite ? 0.25 : 0.45);
    let x = -100;
    let i = 0;
    while (f.distantes.length && x < f.comprimento * 0.5 + LARGURA + 200) {
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
      const escala = f.escalas?.[nome] ?? f.escalaFachada ?? (nome.startsWith('muro') ? 1.2 : 1.15);
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
    const chao = f.chao ?? {};
    const [calcada, tcx, tcy] = chao.calcada ?? [f.calcada, 64, 64];
    const [asfalto, tax, tay] = chao.asfalto ?? ['texturas_asfalto', 120, 80];
    const [meioFio, tmx, tmy] = chao.meioFio ?? ['texturas_calcada_meiofio', 64, 18];
    plano(this.mundo, R.tex[calcada], x0, meio - 4, x1, FUNDO_Y + 4, { tileX: tcx, tileY: tcy, ordem: CAMADA.CHAO, cor: f.tinta });
    plano(this.mundo, R.tex[asfalto], x0, 0, x1, meio - 12, { tileX: tax, tileY: tay, ordem: CAMADA.CHAO, cor: f.tinta });
    plano(this.mundo, R.tex[meioFio], x0, meio - 16, x1, meio + 2, { tileX: tmx, tileY: tmy, ordem: CAMADA.CHAO + 1, cor: f.tinta });
    // Faixas da rua e faixas de pedestre
    const corFaixa = f.noite ? 0x9a9ab8 : 0xf0ecd8;
    const faixasPedestre = [];
    for (let x = 600; x < f.comprimento; x += 1500) faixasPedestre.push(x);
    if (!chao.semFaixas) {
      for (let x = x0; x < x1; x += 140) {
        if (faixasPedestre.some((fx) => x + 60 > fx - 20 && x < fx + 170)) continue;
        retangulo(this.mundo, corFaixa, x, BASE_Y + 18, x + 60, BASE_Y + 24, CAMADA.MARCAS);
      }
    }
    for (const x of faixasPedestre) {
      if (chao.semFaixas && !chao.faixaPedestre) break; // estrada de terra, rio ou enxurrada: sem faixa
      if (chao.faixaPedestre) {
        plano(this.mundo, R.tex[chao.faixaPedestre], x, 4, x + 200, meio - 16, { tileX: 200, tileY: meio - 20, ordem: CAMADA.MARCAS, cor: f.tinta });
        continue;
      }
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
      if (chao.buraco) {
        // buraco com água desenhado (um pouco maior que a área que machuca)
        plano(this.mundo, R.tex[chao.buraco], p.x0 - 24, y0 - 10, p.x1 + 24, y1 + 10, {
          tileX: p.x1 - p.x0 + 48, tileY: p.z1 - p.z0 + 20, ordem: CAMADA.MARCAS, cor: f.tinta,
        });
        this.decoracao('cone', p.x0 - 30, p.z1 + 6, 0.8);
        this.decoracao('cone', p.x1 + 30, p.z0 - 2, 0.8);
        continue;
      }
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
    const opcoes = f.decoracao ?? (f.noite ? DECORACAO_NOITE : DECORACAO_DIA);
    let k = 0;
    for (let x = 380; x < f.comprimento + LARGURA; x += 230) {
      const livre = (z) => ![...this.solidos, ...this.plataformas].some((s) => x > s.x0 - 70 && x < s.x1 + 70 && Math.abs(z - s.z0) < 60);
      const nome = opcoes[k++ % opcoes.length];
      const fundo = k % 2 === 0;
      const z = fundo ? 148 : Z_MEIO_FIO + 6;
      if (!livre(z)) continue;
      if (!fundo && SO_NO_FUNDO.includes(nome)) continue;
      this.decoracao(nome, x, z, f.escalas?.[nome] ?? (nome === 'arvore' ? 1.1 : 1));
    }
  }

  /** Devolve true no instante de um relâmpago (para o som do trovão). */
  atualizar(camX, heroiX = 0, dt = 0) {
    for (const a of this.animados) {
      a.m.material.map.offset.x += a.vx * dt;
      a.m.material.map.offset.y += a.vy * Math.sin(performance.now() / 700) * dt;
    }
    for (const o of this.obstaculos) {
      o.fase += dt * 2.5;
      o.s.pos(o.x, BASE_Y + o.z + Math.sin(o.fase) * 3);
    }
    let trovao = false;
    const c = this.chuva;
    if (c) {
      const { inicio, cheia } = this.fase.chuva;
      const k = cheia <= inicio ? 1 : Math.min(1, Math.max(0, (heroiX - inicio) / (cheia - inicio)));
      c.t += dt;
      c.tex.offset.x += dt * 0.6;
      c.tex.offset.y += dt * 3.2;
      c.gotas.material.opacity = 0.9 * k;
      c.escuro.material.opacity = 0.38 * k;
      if (k > 0.5 && c.t > c.proximo) {
        c.t = 0;
        c.proximo = 5 + Math.random() * 6;
        c.flash = 1;
        trovao = true;
      }
      c.flash = Math.max(0, c.flash - dt * 4);
      c.clarao.material.opacity = 0.55 * c.flash * (Math.floor(c.flash * 10) % 2 ? 1 : 0.4);
    }
    this.fixo.position.x = camX;
    this.longe.position.x = camX * 0.5;
    this.texHorizonte.offset.x = (camX * 0.15) / this.larguraHorizonte;
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
