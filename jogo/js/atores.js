// Personagens e objetos do jogo: herói, ratos, projéteis, itens e efeitos visuais.
import { BASE_Y, GRAVIDADE, HEROI, Z_MAX, Z_MIN } from './config.js';
import { R, texturaTexto } from './recursos.js';
import { Sprite } from './sprite.js';
import { CAMADA, ordemMundo } from './cenario.js';

const aleat = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------------------
// Base comum: posição (x, z, h), física, sombra e ordenação.
// ---------------------------------------------------------------------------
class Ator {
  constructor(jogo, tex, escala) {
    this.jogo = jogo;
    this.x = 0;
    this.z = 60;
    this.h = 0;
    this.vx = 0;
    this.vz = 0;
    this.vh = 0;
    this.dir = 1;
    this.suporte = null; // sólido/plataforma sob os pés
    this.noChao = true;
    this.estado = 'parado';
    this.t = 0;
    this.invulneravel = 0;
    this.ignorarPlataforma = null;
    this.ignorarTempo = 0;
    this.sombra = new Sprite(jogo.mundo, R.tex.sombra, { centro: true });
    this.sprite = new Sprite(jogo.mundo, tex, { escala });
    this.alturaY = 0; // deslocamento visual extra
  }

  get chao() {
    return this.suporte ? this.suporte.topo : 0;
  }

  mudar(estado) {
    this.estado = estado;
    this.t = 0;
  }

  /** Move no plano do chão respeitando sólidos e limites. */
  mover(dx, dz, limites) {
    const cen = this.jogo.cenario;
    if (dx) {
      let nx = this.x + dx;
      if (limites) nx = Math.max(limites[0], Math.min(limites[1], nx));
      if (!cen.bloqueio(nx, this.z, this.h)) this.x = nx;
    }
    if (dz) {
      const nz = Math.max(Z_MIN, Math.min(Z_MAX, this.z + dz));
      if (!cen.bloqueio(this.x, nz, this.h)) this.z = nz;
    }
    // Saiu de cima do sólido/plataforma? Começa a cair.
    if (this.noChao && this.suporte) {
      const s = this.suporte;
      if (this.x < s.x0 || this.x > s.x1 || this.z < s.z0 || this.z > s.z1) {
        this.suporte = null;
        this.noChao = false;
        this.vh = 0;
      }
    }
  }

  fisica(dt) {
    if (this.ignorarTempo > 0 && (this.ignorarTempo -= dt) <= 0) this.ignorarPlataforma = null;
    if (this.noChao) return false;
    const antes = this.h;
    this.vh -= GRAVIDADE * dt;
    this.h += this.vh * dt;
    if (this.vh <= 0) {
      const s = this.jogo.cenario.superficie(this.x, this.z, antes, this.ignorarPlataforma);
      const topo = s ? s.topo : 0;
      if (this.h <= topo) {
        this.h = topo;
        this.vh = 0;
        this.noChao = true;
        this.suporte = s;
        return true; // aterrissou
      }
    }
    return false;
  }

  chaveOrdem() {
    const cen = this.jogo.cenario;
    if (this.suporte) return this.suporte.z0 - 0.5;
    for (const p of cen.plataformas) {
      if (this.x > p.x0 && this.x < p.x1 && this.z > p.z0 && this.z < p.z1 && this.h < p.topo) return p.z1 + 0.5;
    }
    for (const s of cen.solidos) {
      if (this.x > s.x0 && this.x < s.x1 && this.z >= s.z0 && this.z <= s.z1 && this.h >= s.topo - 4) return s.z0 - 0.5;
    }
    return this.z;
  }

  desenhar() {
    const ordem = ordemMundo(this.chaveOrdem());
    this.sprite.pos(this.x, BASE_Y + this.z + this.h + this.alturaY);
    this.sprite.ordem = ordem;
    this.sprite.virar(this.dir);
    // A sombra fica na superfície logo abaixo.
    const s = this.jogo.cenario.superficie(this.x, this.z, this.h);
    const base = s ? s.topo : 0;
    const larg = Math.abs(this.sprite.mesh.scale.x) * 0.8;
    const escala = Math.max(0.4, 1 - (this.h - base) / 300);
    this.sombra.mesh.scale.set(Math.min(larg, 90) * escala, 14 * escala, 1);
    this.sombra.pos(this.x, BASE_Y + this.z + base);
    this.sombra.ordem = ordem - 1;
    this.sombra.visivel = this.sprite.mesh.visible;
  }

  remover() {
    this.sprite.remover();
    this.sombra.remover();
  }
}

// ---------------------------------------------------------------------------
// Herói
// ---------------------------------------------------------------------------
const QUADROS_ANDAR = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => 'heroi_passo' + i);
const GUARDA = 'heroi_soco0';

// Sequência de golpes (apertando soco seguidas vezes): jab, direto, joelhada e chute lateral.
// quadros: [instante em s, quadro]; ativo: janela em que o golpe acerta.
const SOCOS = [
  {
    nome: 'jab', dur: 0.22, ativo: [0.05, 0.12], alcance: [16, 98], dano: 7, impulso: 70,
    quadros: [[0, 'heroi_soco1'], [0.05, 'heroi_soco2'], [0.15, 'heroi_soco1']],
  },
  {
    nome: 'direto', dur: 0.26, ativo: [0.06, 0.14], alcance: [16, 106], dano: 9, impulso: 110,
    quadros: [[0, 'heroi_soco3'], [0.06, 'heroi_soco4'], [0.19, 'heroi_soco5']],
  },
  {
    nome: 'joelhada', dur: 0.28, ativo: [0.06, 0.15], alcance: [8, 72], dano: 11, impulso: 150,
    quadros: [[0, 'heroi_chute1'], [0.06, 'heroi_chute2'], [0.21, 'heroi_chute1']],
  },
  {
    nome: 'chute', dur: 0.44, ativo: [0.08, 0.24], alcance: [10, 122], dano: 18, impulso: 210, derruba: true,
    quadros: [[0, 'heroi_chute1'], [0.08, 'heroi_chute3'], [0.3, 'heroi_chute4'], [0.37, 'heroi_chute5']],
  },
];
const ULTIMO_GOLPE = SOCOS.length - 1;

function quadroDoGolpe(golpe, t) {
  let q = golpe.quadros[0][1];
  for (const [inicio, nome] of golpe.quadros) if (t >= inicio) q = nome;
  return q;
}

export class Heroi extends Ator {
  constructor(jogo) {
    super(jogo, R.tex[GUARDA], HEROI.escala);
    this.vidaMax = HEROI.vidaMax;
    this.vida = this.vidaMax;
    this.vidas = HEROI.vidas;
    this.energia = 0;
    this.combo = 0;
    this.socoFila = false;
    this.ultimoSoco = -9;
    this.atingidos = new Set();
    this.segurando = null; // 'garrafa' | 'pedra'
    this.itemMao = new Sprite(jogo.mundo, R.tex.itens_garrafa, { escala: 0.7 });
    this.itemMao.visivel = false;
    this.relogio = 0;
  }

  get atacando() {
    return this.estado === 'soco' || this.estado === 'voadora';
  }

  atualizar(dt, ent, limites) {
    if (this.jet) return this.atualizarJet(dt, ent, limites);
    this.relogio += dt;
    this.t += dt;
    if (this.invulneravel > 0) this.invulneravel -= dt;
    const J = this.jogo;
    const e = this.estado;

    const dx = (ent.seg('direita') ? 1 : 0) - (ent.seg('esquerda') ? 1 : 0);
    const dz = (ent.seg('cima') ? 1 : 0) - (ent.seg('baixo') ? 1 : 0);
    const livre = e === 'parado' || e === 'andar';
    const noAr = e === 'pular';

    if (livre || noAr) {
      if (dx) this.dir = dx;
      const vel = noAr ? 0.9 : 1;
      this.mover(dx * HEROI.velX * vel * dt, dz * HEROI.velZ * vel * dt, limites);
      if (livre) {
        const andando = dx || dz;
        if (andando && e !== 'andar') this.mudar('andar');
        if (!andando && e !== 'parado') this.mudar('parado');
        if (!this.noChao) this.mudar('pular');
      }
    }

    // Ações
    if (livre) {
      if (ent.consumir('pular')) {
        if (ent.seg('baixo') && this.suporte && !this.suporte.solido) {
          // desce da plataforma atravessável
          this.ignorarPlataforma = this.suporte;
          this.ignorarTempo = 0.35;
          this.suporte = null;
          this.noChao = false;
          this.vh = 0;
        } else {
          this.vh = HEROI.pulo;
          this.noChao = false;
          this.suporte = null;
          J.audio.sfx('pulo');
        }
        this.mudar('pular');
      } else if (ent.consumir('especial') && this.energia >= 100) {
        this.especial();
      } else if (ent.consumir('pegar')) {
        if (this.segurando) this.mudar('arremessar');
        else {
          const item = J.itemProximo(this);
          if (item) {
            this.pegando = item.tipo;
            J.removerItem(item);
            this.mudar('pegar');
            J.audio.sfx('pegar');
          }
        }
      } else if (ent.consumir('soco')) {
        if (this.segurando) this.mudar('arremessar');
        else {
          this.combo = this.relogio - this.ultimoSoco < 0.5 ? (this.combo + 1) % SOCOS.length : 0;
          this.iniciarSoco();
        }
      }
    } else if (noAr) {
      if (ent.consumir('soco')) {
        this.mudar('voadora');
        this.atingidos.clear();
        J.audio.sfx('vento');
      }
    } else if (e === 'soco') {
      if (ent.consumir('soco')) this.socoFila = true;
    }

    // Física vertical
    if (this.fisica(dt)) {
      J.audio.sfx('aterrissar');
      J.efeitos.poeira(this.x, this.z + 1, this.h);
      if (this.estado === 'pular' || this.estado === 'voadora') this.mudar('parado');
    }

    // Estados
    switch (this.estado) {
      case 'soco': {
        const s = SOCOS[this.combo];
        if (this.t < s.ativo[1]) this.mover(this.dir * s.impulso * dt * (1 - this.t / s.dur), 0, limites);
        if (this.t >= s.ativo[0] && this.t <= s.ativo[1]) this.golpear(s.alcance, s.dano, s.derruba, 50);
        if (this.t >= s.dur) {
          this.ultimoSoco = this.relogio;
          if (this.socoFila && this.combo < ULTIMO_GOLPE) {
            this.combo++;
            this.iniciarSoco();
          } else {
            if (this.combo === ULTIMO_GOLPE) this.combo = -1;
            this.mudar(this.noChao ? 'parado' : 'pular');
          }
        }
        break;
      }
      case 'voadora':
        this.mover(this.dir * 120 * dt, 0, limites);
        this.golpear([0, 112], 16, true, 70);
        break;
      case 'pegar':
        if (this.t >= 0.42) {
          this.segurando = this.pegando;
          this.mudar('parado');
        }
        break;
      case 'arremessar':
        if (this.t >= 0.14 && this.segurando) {
          J.arremessar(this, this.segurando);
          this.segurando = null;
        }
        if (this.t >= 0.3) this.mudar('parado');
        break;
      case 'especial':
        if (this.t >= 0.7) this.mudar('parado');
        break;
      case 'dor':
        this.mover(-this.dir * 60 * dt, 0, limites);
        if (this.t >= 0.3) this.mudar('parado');
        break;
      case 'voando':
        this.mover(-this.dir * 200 * dt, 0, limites);
        if (this.noChao) {
          this.mudar('caido');
          J.audio.sfx('aterrissar');
          J.efeitos.poeira(this.x, this.z + 1, this.h);
        }
        break;
      case 'caido':
        if (this.t >= (this.vida <= 0 ? 1.4 : 0.8)) {
          if (this.vida <= 0) J.heroiMorreu();
          else {
            this.mudar('levantar');
            this.invulneravel = 1.2;
          }
        }
        break;
      case 'levantar':
        if (this.t >= 0.3) this.mudar('parado');
        break;
      default:
        break;
    }

    // Enxurrada (Belmira Marin): fora das áreas seguras, encostar no chão machuca e devolve para o alto.
    if (J.enxurradaEm(this.x) && this.noChao && !this.suporte && !['caido', 'voando', 'morto', 'vitoria'].includes(this.estado)) {
      if (this.invulneravel <= 0) {
        this.vida = Math.max(0, this.vida - 7);
        J.audio.sfx('dano');
        J.flashDano();
        this.invulneravel = 0.7;
      }
      J.efeitos.respingo(this.x, this.z, 0, 1.2);
      this.vh = 700;
      this.noChao = false;
      this.mudar('pular');
      if (this.vida <= 0) {
        this.mudar('voando');
        this.vh = 420;
      }
    }

    // Área de perigo (buraco): dano contínuo para quem está no chão.
    if (this.h <= 0.5 && this.invulneravel <= 0 && J.cenario.perigoEm(this.x, this.z) && this.estado !== 'caido' && this.estado !== 'voando') {
      this.sofrer(10, -this.dir, true);
    }

    this.animar();
  }

  iniciarSoco() {
    this.mudar('soco');
    this.socoFila = false;
    this.atingidos.clear();
    this.jogo.audio.sfx('vento');
  }

  golpear(alcance, dano, derruba, faixaH) {
    const J = this.jogo;
    for (const r of J.inimigos) {
      if (this.atingidos.has(r) || !r.atingivel) continue;
      const dx = (r.x - this.x) * this.dir;
      if (dx < alcance[0] - r.raio || dx > alcance[1] + r.raio) continue;
      if (Math.abs(r.z - this.z) > 24) continue;
      if (Math.abs(r.h - this.h) > faixaH) continue;
      this.atingidos.add(r);
      r.sofrer(dano, this.dir, derruba);
      J.acertou(this, r, dano, derruba);
    }
  }

  especial() {
    const J = this.jogo;
    this.energia = 0;
    this.mudar('especial');
    this.invulneravel = 1;
    J.audio.sfx('especial');
    J.efeitos.onda(this.x, this.z, this.h);
    J.tremer(0.4, 8);
    for (const r of J.inimigos) {
      if (!r.atingivel) continue;
      if (Math.abs(r.x - this.x) < 520) {
        r.sofrer(r.st.chefe ? 45 : 40, r.x >= this.x ? 1 : -1, true);
        J.acertou(this, r, 40, true);
      }
    }
  }

  sofrer(dano, dirGolpe, derruba) {
    if (this.invulneravel > 0 || this.estado === 'caido' || this.estado === 'voando' || this.estado === 'morto') return false;
    const J = this.jogo;
    this.vida = Math.max(0, this.vida - dano);
    this.energia = Math.min(100, this.energia + dano * 0.6);
    this.dir = -dirGolpe;
    J.audio.sfx('dano');
    J.flashDano();
    if (this.segurando) {
      J.soltarItem(this.segurando, this.x, this.z);
      this.segurando = null;
    }
    if (derruba || this.vida <= 0) {
      this.mudar('voando');
      this.vh = 420;
      this.noChao = false;
      this.suporte = null;
    } else {
      this.mudar('dor');
      this.invulneravel = 0.35;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Jet ski (BNH alagado): inércia na água, arrancada, salto e mergulho
  // -------------------------------------------------------------------------
  atualizarJet(dt, ent, limites) {
    this.relogio += dt;
    this.t += dt;
    if (this.invulneravel > 0) this.invulneravel -= dt;
    const J = this.jogo;
    const livre = ['parado', 'andar', 'pular'].includes(this.estado);
    const dx = (ent.seg('direita') ? 1 : 0) - (ent.seg('esquerda') ? 1 : 0);
    const dz = (ent.seg('cima') ? 1 : 0) - (ent.seg('baixo') ? 1 : 0);
    this.vx = this.vx || 0;
    if (livre) {
      this.vx += dx * 950 * dt;
      if (dx && !(this.estado === 'pular')) this.dir = dx;
    }
    this.vx *= Math.pow(0.3, dt);
    if (this.estado === 'arrancada') this.vx = this.dir * 560;
    if (this.estado === 'voando') this.vx = -this.dir * 220;
    this.vx = Math.max(-340, Math.min(340, this.vx));
    const antes = this.x;
    this.mover(this.vx * dt, livre ? dz * HEROI.velZ * 1.15 * dt : 0, limites);
    if (Math.abs(this.x - antes) < Math.abs(this.vx * dt) * 0.5) this.vx *= 0.5;

    if (livre && this.noChao) {
      if (ent.consumir('pular')) {
        this.vh = 780;
        this.noChao = false;
        this.mudar('pular');
        J.audio.sfx('pulo');
        J.efeitos.respingo(this.x - this.dir * 30, this.z, 0, 1);
      } else if (ent.consumir('especial') && this.energia >= 100) {
        this.especial();
      } else if (ent.consumir('soco')) {
        this.mudar('arrancada');
        this.atingidos.clear();
        J.audio.sfx('vento');
      } else {
        const anda = Math.abs(this.vx) > 40 || dz;
        if (anda && this.estado !== 'andar') this.mudar('andar');
        if (!anda && this.estado !== 'parado') this.mudar('parado');
      }
    } else if (this.estado === 'pular' && ent.consumir('soco')) {
      // mergulho: desce com tudo e espalha água em quem estiver embaixo
      this.mudar('mergulho');
      this.vh = -900;
    }

    if (this.fisica(dt)) {
      J.efeitos.respingo(this.x, this.z, 0, 1.3);
      J.efeitos.onda_agua(this.x, this.z);
      J.audio.sfx('aterrissar');
      if (this.estado === 'mergulho') {
        this.atingidos.clear();
        this.golpear([-70, 110], 20, true, 80);
        J.tremer(0.2, 7);
      }
      if (this.estado === 'pular' || this.estado === 'mergulho') this.mudar('parado');
      if (this.estado === 'voando') this.mudar('caido');
    }

    switch (this.estado) {
      case 'arrancada':
        this.golpear([0, 120], 13, true, 50);
        if (this.t >= 0.32) this.mudar('parado');
        break;
      case 'especial':
        if (this.t >= 0.7) this.mudar('parado');
        break;
      case 'dor':
        if (this.t >= 0.3) this.mudar('parado');
        break;
      case 'caido':
        if (this.t >= (this.vida <= 0 ? 1.2 : 0.6)) {
          if (this.vida <= 0) J.heroiMorreu();
          else {
            this.mudar('parado');
            this.invulneravel = 1.2;
          }
        }
        break;
      default:
        break;
    }

    // rastro de água e entulho boiando
    this.rastro = (this.rastro || 0) - dt;
    if (this.noChao && Math.abs(this.vx) > 150 && this.rastro <= 0) {
      this.rastro = 0.12;
      J.efeitos.respingo(this.x - this.dir * 60, this.z, 0, 0.55);
    }
    const ob = J.obstaculoEm(this.x, this.z);
    if (ob && this.h < 14 && this.invulneravel <= 0 && !['caido', 'voando'].includes(this.estado)) {
      this.sofrer(9, Math.sign(this.x - ob.x) || -this.dir, false);
      this.vx = -this.vx * 0.6;
      J.efeitos.respingo(ob.x, ob.z, 0, 1);
    }
    // chegou na área segura: desce do jet ski
    if (J.fase.jet && this.x >= J.fase.jet.terra && this.noChao && livre) {
      this.jet = false;
      this.vh = 520;
      this.noChao = false;
      this.mudar('pular');
      J.efeitos.respingo(this.x, this.z, 0, 1.4);
      J.mensagem('ÁREA SEGURA!');
    }
    this.animarJet();
  }

  animarJet() {
    const P = 'heroi_jet_';
    let q = P + 'acelerar0';
    let rot = 0;
    let cor = 0xffffff;
    this.alturaY = 0;
    const ciclo = (nome, vel) => P + nome + (Math.floor(this.t * vel) % 6);
    switch (this.estado) {
      case 'parado':
        q = P + 'acelerar' + (Math.floor(this.relogio * 3) % 2);
        this.alturaY = Math.sin(this.relogio * 5) * 2;
        break;
      case 'andar':
        q = Math.sign(this.vx) !== this.dir && Math.abs(this.vx) > 60 ? ciclo('frear', 10) : ciclo('acelerar', 12);
        this.alturaY = Math.sin(this.relogio * 9) * 1.5;
        break;
      case 'pular':
        q = P + (this.vh > 350 ? 'salto2' : this.vh > 0 ? 'salto3' : this.vh > -350 ? 'salto4' : 'salto5');
        break;
      case 'mergulho':
        q = P + 'salto4';
        rot = -0.25 * this.dir;
        break;
      case 'arrancada':
        q = P + 'acelerar' + (4 + (Math.floor(this.t * 16) % 2));
        break;
      case 'especial':
      case 'vitoria':
        q = P + 'curva' + (4 + (Math.floor(this.relogio * 3) % 2));
        break;
      case 'dor':
        q = P + 'frear1';
        cor = 0xff9090;
        break;
      case 'voando':
        q = P + 'salto3';
        rot = this.t * 12 * this.dir;
        break;
      case 'caido':
      case 'morto':
        q = P + 'frear0';
        cor = 0xff9090;
        break;
      default:
        break;
    }
    this.sprite.trocar(R.tex[q]);
    this.sprite.mesh.rotation.z = rot;
    this.sprite.material.color.setHex(cor);
    this.sprite.visivel = !(this.invulneravel > 0 && this.estado !== 'especial' && Math.floor(this.relogio * 20) % 2);
    this.itemMao.visivel = false;
  }

  animar() {
    if (this.jet) return this.animarJet();
    let quadro = GUARDA;
    let rot = 0;
    this.alturaY = 0;
    let cor = 0xffffff;
    switch (this.estado) {
      case 'andar':
        quadro = QUADROS_ANDAR[Math.floor(this.t * 12) % QUADROS_ANDAR.length];
        break;
      case 'pular':
        quadro = this.vh > 120 ? 'heroi_chute2' : 'heroi_chute1';
        break;
      case 'soco':
        quadro = quadroDoGolpe(SOCOS[this.combo], this.t);
        break;
      case 'voadora':
        quadro = 'heroi_chute3';
        break;
      case 'pegar':
        quadro = `heroi_pegar_${this.pegando}${Math.min(5, Math.floor(this.t / 0.07))}`;
        break;
      case 'arremessar':
        quadro = 'heroi_impulso';
        break;
      case 'especial':
        quadro = 'heroi_acenar';
        break;
      case 'dor':
        quadro = 'heroi_aterrissar';
        cor = 0xff9090;
        break;
      case 'voando':
      case 'caido':
      case 'morto':
        quadro = 'heroi_parado'; // o quadro fino deitado
        rot = (Math.PI / 2) * this.dir * (this.estado === 'voando' ? Math.min(1, this.t * 3) : 1);
        this.alturaY = 14;
        break;
      case 'levantar':
        quadro = 'heroi_chute1';
        break;
      case 'vitoria':
        quadro = Math.floor(this.t * 3) % 2 ? 'heroi_acenar' : 'heroi_frente_pose';
        break;
      default:
        break;
    }
    this.sprite.trocar(R.tex[quadro]);
    this.sprite.mesh.rotation.z = rot;
    this.sprite.material.color.setHex(cor);
    // pisca enquanto invulnerável
    this.sprite.visivel = !(this.invulneravel > 0 && this.estado !== 'especial' && Math.floor(this.relogio * 20) % 2);
    if (this.estado === 'parado') this.sprite.mesh.scale.y = this.sprite.tex.userData.h * HEROI.escala * (1 + Math.sin(this.relogio * 4) * 0.012);

    // objeto na mão
    this.itemMao.visivel = !!this.segurando && this.sprite.mesh.visible;
    if (this.segurando) {
      this.itemMao.trocar(R.tex['itens_' + this.segurando], 0.75);
      this.itemMao.virar(this.dir);
    }
  }

  desenhar() {
    super.desenhar();
    if (this.segurando) {
      this.itemMao.pos(this.x + this.dir * 24, BASE_Y + this.z + this.h + 56);
      this.itemMao.ordem = this.sprite.mesh.renderOrder + 1;
    }
  }

  reviver() {
    this.vida = this.vidaMax;
    this.mudar('parado');
    this.invulneravel = 2.5;
    this.h = 0;
    this.noChao = true;
    this.suporte = null;
  }

  remover() {
    super.remover();
    this.itemMao.remover();
  }
}

// ---------------------------------------------------------------------------
// Ratos (inimigos)
// ---------------------------------------------------------------------------
const STATS = {
  // porte: tamanho relativo (para posicionar impactos e números); os sprites já vêm no tamanho certo.
  ratinho: { nome: 'RATINHO DE ESGOTO', vida: 34, vel: 125, velZ: 85, dano: 7, alcance: 62, preparo: 0.32, porte: 1, pontos: 100, raio: 16 },
  ratazana: { nome: 'RATAZANA', vida: 72, vel: 95, velZ: 65, dano: 13, alcance: 86, preparo: 0.5, porte: 1.1, pontos: 200, raio: 20 },
  lixeiro: { nome: 'RATO DO LIXÃO', vida: 40, vel: 110, velZ: 75, dano: 9, alcance: 56, preparo: 0.55, porte: 1, pontos: 150, raio: 16, distancia: 280 },
  direitus: { nome: 'RATUS DIREITUS', vida: 300, vel: 115, velZ: 80, dano: 13, alcance: 104, preparo: 0.38, porte: 1.4, pontos: 2500, raio: 26, chefe: true, investida: true },
  rei: { nome: 'RATUS NUNES', chefe: true, investida: true, salto: true, invoca: true, vida: 720, vel: 135, velZ: 90, dano: 16, alcance: 104, preparo: 0.42, porte: 1.5, pontos: 5000, raio: 30 },
};

export class Rato extends Ator {
  constructor(jogo, tipo, x, z) {
    const st = STATS[tipo];
    super(jogo, R.ratos[tipo].parado0, 1);
    this.tipo = tipo;
    this.st = st;
    this.nome = st.nome;
    this.vida = st.vida;
    this.vidaMax = st.vida;
    this.raio = st.raio;
    this.x = x;
    this.z = z;
    this.dir = -1;
    this.mudar('entrar');
    this.espera = 0;
    this.alvoOffset = aleat(-30, 30);
    this.ladoRonda = Math.random() < 0.5 ? -1 : 1;
    this.recarga = aleat(0.3, 1.2);
    this.relogio = Math.random() * 3;
    this.golpeAcertou = false;
    this.invocacoes = 0;
    this.armadura = 0;
  }

  get atingivel() {
    return !['caido', 'morto', 'voando', 'entrar_bueiro'].includes(this.estado) && this.invulneravel <= 0;
  }

  get atacando() {
    return ['preparar', 'atacar', 'arremessar', 'investida', 'salto', 'preparar_investida'].includes(this.estado);
  }

  atualizar(dt, limites) {
    const J = this.jogo;
    const heroi = J.heroi;
    this.t += dt;
    this.relogio += dt;
    if (this.invulneravel > 0) this.invulneravel -= dt;
    if (this.recarga > 0) this.recarga -= dt;
    const st = this.st;
    const fator = (this.st.chefe && this.vida < this.vidaMax / 3 ? 1.25 : 1) * (this.jet ? 1.3 : 1);

    const aterrissou = this.fisica(dt);
    const dxH = heroi.x - this.x;
    const dzH = heroi.z - this.z;
    const heroiAtivo = heroi.estado !== 'morto' && heroi.estado !== 'vitoria';

    switch (this.estado) {
      case 'entrar_bueiro':
        this.alturaY = Math.min(0, -60 + this.t * 120);
        if (this.t >= 0.5) {
          this.alturaY = 0;
          this.mudar('perseguir');
        }
        break;
      case 'entrar': {
        // anda até entrar na tela
        const alvo = Math.max(limites[0] + 40, Math.min(limites[1] - 40, this.x));
        const d = alvo - this.x;
        this.dir = Math.sign(d) || this.dir;
        this.x += Math.sign(d) * Math.min(Math.abs(d), st.vel * 1.2 * dt);
        if (Math.abs(d) < 2) this.mudar('perseguir');
        break;
      }
      case 'perseguir':
      case 'rondar': {
        if (!heroiAtivo) {
          this.mudar('parado');
          break;
        }
        this.dir = Math.sign(dxH) || this.dir;
        // herói em cima de um veículo: o rato pula atrás dele
        if (heroi.suporte && heroi.h > 30 && this.noChao && this.h < heroi.h - 20 && Math.abs(dxH) < 190 && Math.abs(dzH) < 30 && Math.random() < 0.04) {
          this.mudar('saltar');
          this.vh = Math.sqrt(2 * 1900 * (heroi.h + 45));
          this.noChao = false;
          this.suporte = null;
          this.alvoSalto = heroi.x - Math.sign(dxH || 1) * 45;
          J.audio.sfx('guincho');
          break;
        }
        const lixeiro = this.tipo === 'lixeiro';
        const quer = this.estado === 'perseguir' || this.t > 1.2 || lixeiro;
        const podeAtacar = quer && this.recarga <= 0 && J.pedirTurno(this);
        if (this.estado === 'rondar' && podeAtacar) this.mudar('perseguir');
        let alvoX;
        let alvoZ = heroi.z + this.alvoOffset * 0.3;
        if (lixeiro) {
          alvoX = heroi.x - Math.sign(dxH || 1) * st.distancia;
          alvoZ = heroi.z;
          if (podeAtacar && Math.abs(dzH) < 16 && Math.abs(dxH) > 120) {
            this.mudar('arremessar');
            break;
          }
        } else if (this.estado === 'rondar') {
          alvoX = heroi.x + this.ladoRonda * (150 + Math.abs(this.alvoOffset) * 2);
          alvoZ = heroi.z + this.alvoOffset;
        } else {
          alvoX = heroi.x - Math.sign(dxH || 1) * (st.alcance * 0.75);
        }
        const ex = alvoX - this.x;
        const ez = alvoZ - this.z;
        const vx = Math.abs(ex) > 6 ? Math.sign(ex) * st.vel * fator : 0;
        const vz = Math.abs(ez) > 3 ? Math.sign(ez) * st.velZ * fator : 0;
        this.mover(vx * dt, vz * dt, [limites[0] - 20, limites[1] + 20]);
        this.andando = vx || vz;
        // ataque
        const alcanceH = Math.abs(heroi.h - this.h) < 50;
        if (!lixeiro && podeAtacar && Math.abs(dxH) < st.alcance && Math.abs(dzH) < 14 && alcanceH) {
          this.escolherAtaque();
        } else if (this.st.investida && podeAtacar && Math.abs(dxH) > 260 && Math.abs(dzH) < 20 && Math.random() < 0.02) {
          this.mudar('preparar_investida');
        } else if (this.st.salto && podeAtacar && this.vida < this.vidaMax * 0.66 && Math.random() < 0.006) {
          this.mudar('salto');
          this.vh = 760;
          this.noChao = false;
          this.suporte = null;
          this.saltoAlvo = heroi.x;
        }
        if (!podeAtacar && this.estado === 'perseguir' && !lixeiro) this.mudar('rondar');
        if (this.st.invoca) this.talvezInvocar();
        break;
      }
      case 'saltar': {
        const d = this.alvoSalto - this.x;
        this.x += Math.sign(d) * Math.min(Math.abs(d), 260 * dt);
        if (aterrissou) this.mudar('perseguir');
        break;
      }
      case 'parado':
        this.andando = false;
        if (heroiAtivo && this.t > 0.5) this.mudar('perseguir');
        break;
      case 'preparar':
        if (this.t >= st.preparo / fator) {
          this.mudar('atacar');
          this.golpeAcertou = false;
          J.audio.sfx('vento');
        }
        break;
      case 'atacar':
        if (this.t < 0.12) this.mover(this.dir * 140 * dt, 0);
        if (!this.golpeAcertou && this.t < 0.14) this.tentarAcertar(st.alcance + 10, st.dano, this.tipo === 'ratazana' || this.st.chefe);
        if (this.t >= 0.35) this.fimAtaque();
        break;
      case 'arremessar':
        if (this.t >= 0.45 && !this.arremessou) {
          this.arremessou = true;
          J.projetilInimigo(this);
        }
        if (this.t >= 0.75) {
          this.arremessou = false;
          this.fimAtaque(1.6);
        }
        break;
      case 'preparar_investida':
        this.andando = false;
        this.dir = Math.sign(dxH) || this.dir;
        if (this.t >= 0.65) {
          this.mudar('investida');
          this.golpeAcertou = false;
          J.audio.sfx('guincho');
        }
        break;
      case 'investida':
        this.mover(this.dir * 560 * dt, 0, [limites[0] + 10, limites[1] - 10]);
        if (!this.golpeAcertou) this.tentarAcertar(this.raio + 40, 18, true, -10);
        if (this.t >= 1.0 || this.x <= limites[0] + 12 || this.x >= limites[1] - 12) this.fimAtaque(1.2);
        break;
      case 'salto':
        if (!this.noChao) {
          const d = this.saltoAlvo - this.x;
          this.x += Math.sign(d) * Math.min(Math.abs(d), 300 * dt);
        }
        if (aterrissou) {
          J.tremer(0.35, 10);
          J.audio.sfx('tremor');
          J.efeitos.onda(this.x, this.z, 0);
          if (Math.abs(heroi.x - this.x) < 220 && Math.abs(heroi.z - this.z) < 60 && heroi.h < 12) {
            heroi.sofrer(14, Math.sign(heroi.x - this.x) || 1, true);
          }
          this.fimAtaque(1.5);
        }
        break;
      case 'dor':
        this.mover(-this.dir * 90 * dt * Math.max(0, 1 - this.t * 3), 0, limites);
        if (this.t >= (this.st.chefe ? 0.18 : 0.38)) this.mudar('perseguir');
        break;
      case 'voando':
        this.mover(-this.dir * 230 * dt, 0, [limites[0] - 30, limites[1] + 30]);
        if (aterrissou) {
          J.audio.sfx('aterrissar');
          J.efeitos.poeira(this.x, this.z + 1, this.h);
          this.mudar(this.vida <= 0 ? 'morto' : 'caido');
        }
        break;
      case 'caido':
        if (this.t >= 0.9) {
          this.mudar('levantar');
          this.invulneravel = 0.6;
        }
        break;
      case 'levantar':
        if (this.t >= 0.3) this.mudar('rondar');
        break;
      case 'morto':
        if (this.t >= 1.1) this.removido = true;
        break;
      default:
        break;
    }

    // Buraco: os ratos também se machucam
    if (this.h <= 0.5 && this.atingivel && !this.st.chefe && !this.jet && J.cenario.perigoEm(this.x, this.z)) {
      this.sofrer(12, -this.dir, true);
      J.efeitos.numero(this.x, this.z, this.h + 120, '12');
    }

    this.animar();
  }

  escolherAtaque() {
    this.variante = Math.random() < 0.4; // o subchefe alterna soco e chute
    this.mudar('preparar');
    this.jogo.audio.sfx('guincho');
  }

  fimAtaque(recarga = aleat(0.8, 1.6)) {
    this.recarga = recarga * (this.st.chefe ? 0.7 : 1);
    this.jogo.liberarTurno(this);
    this.mudar(Math.random() < 0.5 ? 'rondar' : 'perseguir');
    this.ladoRonda = Math.random() < 0.5 ? -1 : 1;
    this.alvoOffset = aleat(-40, 40);
  }

  tentarAcertar(alcance, dano, derruba, inicio = 0) {
    const h = this.jogo.heroi;
    const dx = (h.x - this.x) * this.dir;
    if (dx > inicio - 10 && dx < alcance && Math.abs(h.z - this.z) < 22 && Math.abs(h.h - this.h) < 60) {
      if (h.sofrer(dano, this.dir, derruba)) {
        this.golpeAcertou = true;
        this.jogo.efeitos.impacto(h.x - this.dir * 10, h.z, h.h + 80, 0.8);
        this.jogo.audio.sfx(derruba ? 'golpeForte' : 'soco');
      }
    }
  }

  talvezInvocar() {
    const fracao = this.vida / this.vidaMax;
    const limites = [0.66, 0.33];
    if (this.invocacoes < limites.length && fracao < limites[this.invocacoes]) {
      this.invocacoes++;
      const J = this.jogo;
      J.audio.sfx('guincho');
      J.mensagem('RATUS NUNES CHAMOU REFORÇOS');
      J.gerarInimigo('ratinho', 'bueiro');
      J.gerarInimigo(this.invocacoes === 2 ? 'lixeiro' : 'ratinho', 'bueiro');
      if (this.invocacoes === 2) J.gerarInimigo('ratazana', 'dir');
    }
  }

  sofrer(dano, dirGolpe, derruba) {
    const J = this.jogo;
    if (this.estado === 'atacar' || this.estado === 'preparar' || this.estado === 'arremessar' || this.estado === 'preparar_investida') {
      J.liberarTurno(this);
    }
    this.vida = Math.max(0, this.vida - dano);
    this.dir = -dirGolpe;
    J.audio.sfx('guincho');
    if (this.st.chefe) {
      // O chefe tem "armadura": só cai a cada três golpes fortes ou no especial.
      this.armadura += derruba ? 1 : 0;
      if (this.vida > 0 && (this.estado === 'investida' || this.estado === 'salto')) return;
      if (this.vida > 0 && this.armadura < 3) {
        this.mudar('dor');
        return;
      }
      this.armadura = 0;
    }
    if (derruba || this.vida <= 0) {
      this.mudar('voando');
      this.vh = this.vida <= 0 ? 520 : 420;
      this.noChao = false;
      this.suporte = null;
    } else {
      this.mudar('dor');
    }
  }

  animarJet() {
    const tex = R.ratos['jet' + this.tipo];
    const mapa = {
      parado: 'q0', entrar: 'q1', perseguir: 'q1', rondar: 'q2', preparar: 'q0', atacar: 'q2', arremessar: 'q2',
      segurar: 'q0', dor: 'q3', voando: 'q6', caido: 'q6', morto: 'q6', levantar: 'q7', investida: 'q2', saltar: 'q6',
    };
    let q = mapa[this.estado] ?? 'q0';
    if (q === 'q1' && Math.floor(this.relogio * 6) % 2) q = 'q2';
    this.sprite.trocar(tex[q]);
    this.alturaY = this.noChao ? Math.sin(this.relogio * 6) * 2 : 0;
    this.sprite.mesh.rotation.z = this.estado === 'voando' ? this.t * 10 * this.dir : 0;
    let cor = 0xffffff;
    if (this.estado === 'preparar') cor = Math.floor(this.t * 16) % 2 ? 0xffe0a0 : 0xffffff;
    if (this.estado === 'dor') cor = 0xff9a9a;
    this.sprite.material.color.setHex(cor);
    let visivel = true;
    if (this.estado === 'morto') visivel = Math.floor(this.t * 14) % 2 === 0;
    else if (this.invulneravel > 0) visivel = Math.floor(this.relogio * 20) % 2 === 0;
    this.sprite.visivel = visivel;
    if (this.estado === 'atacar' && this.t < 0.05) this.jogo.efeitos.respingo(this.x - this.dir * 40, this.z, 0, 0.7);
  }

  animar() {
    if (this.jet) return this.animarJet();
    const tex = R.ratos[this.tipo];
    let q = 'parado' + (Math.floor(this.relogio * 2.5) % 2);
    let cor = 0xffffff;
    switch (this.estado) {
      case 'entrar':
      case 'perseguir':
      case 'rondar':
        if (this.andando !== false || this.estado === 'entrar') q = 'andar' + (Math.floor(this.relogio * 10) % 6);
        break;
      case 'preparar':
        q = this.variante && tex.preparar2 ? 'preparar2' : 'preparar';
        cor = Math.floor(this.t * 16) % 2 ? 0xffe0a0 : 0xffffff;
        break;
      case 'preparar_investida':
        q = 'preparar';
        cor = Math.floor(this.t * 16) % 2 ? 0xff7070 : 0xffffff;
        break;
      case 'atacar':
        q = this.variante && tex.atacar2 ? 'atacar2' : 'atacar';
        break;
      case 'investida':
        q = 'investida';
        break;
      case 'salto':
        q = this.vh > 0 ? 'preparar' : 'atacar';
        break;
      case 'arremessar':
        q = this.t < 0.45 ? 'segurar' : 'arremessar';
        break;
      case 'dor':
        q = 'dor';
        cor = 0xff9a9a;
        break;
      case 'voando':
        q = 'dor';
        break;
      case 'caido':
      case 'morto':
        q = 'caido';
        break;
      case 'levantar':
        q = 'dor';
        break;
      default:
        break;
    }
    this.sprite.trocar(tex[q]);
    this.sprite.material.color.setHex(cor);
    let visivel = true;
    if (this.estado === 'morto') visivel = Math.floor(this.t * 14) % 2 === 0;
    else if (this.invulneravel > 0) visivel = Math.floor(this.relogio * 20) % 2 === 0;
    this.sprite.visivel = visivel;
  }
}

// ---------------------------------------------------------------------------
// Projéteis (garrafa, pedra, saco de lixo)
// ---------------------------------------------------------------------------
export class Projetil {
  constructor(jogo, tipo, dono, x, z, h, dir) {
    this.jogo = jogo;
    this.tipo = tipo;
    this.dono = dono; // 'heroi' | 'inimigo'
    this.x = x;
    this.z = z;
    this.h = h;
    this.dir = dir;
    const rapido = dono === 'heroi';
    this.vx = dir * (rapido ? 620 : 360);
    this.vh = rapido ? 120 : 260;
    this.g = rapido ? 500 : 900;
    this.dano = tipo === 'pedra' ? 22 : tipo === 'garrafa' ? 20 : 9;
    const tex = tipo === 'saco' ? R.tex.saco : R.tex['itens_' + tipo];
    this.sprite = new Sprite(jogo.mundo, tex, { centro: true, escala: tipo === 'saco' ? 1.6 : 0.75 });
    this.sombra = new Sprite(jogo.mundo, R.tex.sombra, { centro: true });
    this.sombra.mesh.scale.set(20, 6, 1);
    this.vivo = true;
    this.giro = 0;
  }

  atualizar(dt) {
    const J = this.jogo;
    this.x += this.vx * dt;
    this.vh -= this.g * dt;
    this.h += this.vh * dt;
    this.giro += dt * 18 * this.dir;
    // acerto
    const alvos = this.dono === 'heroi' ? J.inimigos.filter((r) => r.atingivel) : [J.heroi];
    for (const a of alvos) {
      if (Math.abs(a.x - this.x) < (a.raio || 18) + 10 && Math.abs(a.z - this.z) < 22 && this.h > a.h - 10 && this.h < a.h + 130) {
        if (this.dono === 'heroi') {
          a.sofrer(this.dano, this.dir, true);
          J.acertou(J.heroi, a, this.dano, true);
        } else {
          a.sofrer(this.dano, this.dir, false);
        }
        this.quebrar();
        return;
      }
    }
    if (this.h <= 0) this.quebrar();
    if (Math.abs(this.x - (J.camX + 480)) > 700) this.vivo = false;
  }

  quebrar() {
    const J = this.jogo;
    this.vivo = false;
    if (this.tipo === 'garrafa') {
      J.audio.sfx('vidro');
      J.efeitos.cacos(this.x, this.z, Math.max(0, this.h), R.tex.caco);
    } else if (this.tipo === 'pedra') {
      J.audio.sfx('pedra');
      J.efeitos.cacos(this.x, this.z, Math.max(0, this.h), R.tex.lasca, 5);
      // a pedra cai e pode ser usada de novo
      J.soltarItem('pedra', this.x - this.dir * 30, this.z);
    } else {
      J.audio.sfx('pedra');
      J.efeitos.cacos(this.x, this.z, Math.max(0, this.h), R.tex.lasca, 6);
    }
  }

  desenhar() {
    this.sprite.pos(this.x, BASE_Y + this.z + this.h + 50);
    this.sprite.mesh.rotation.z = this.giro;
    this.sprite.ordem = ordemMundo(this.z) + 2;
    this.sombra.pos(this.x, BASE_Y + this.z);
    this.sombra.ordem = ordemMundo(this.z) - 1;
  }

  remover() {
    this.sprite.remover();
    this.sombra.remover();
  }
}

// ---------------------------------------------------------------------------
// Itens no chão (armas e comidas)
// ---------------------------------------------------------------------------
const ITENS = {
  garrafa: { tex: 'itens_garrafa', escala: 0.75, arma: true },
  pedra: { tex: 'itens_pedra', escala: 0.75, arma: true },
  coxinha: { tex: 'coxinha', escala: 1.6, vida: 25 },
  pastel: { tex: 'pastel', escala: 1.4, vida: 45 },
  estrela: { tex: 'estrela', escala: 1.4, energia: 50 },
};

export class Item {
  constructor(jogo, tipo, x, z) {
    this.jogo = jogo;
    this.tipo = tipo;
    this.def = ITENS[tipo];
    this.x = x;
    this.sup = jogo.cenario.superficie(x, z, 9999); // em cima do ônibus, se houver
    this.h = this.sup?.topo ?? 0;
    this.z = z;
    this.t = Math.random() * 3;
    this.destaque = new Sprite(jogo.mundo, R.tex['ui_destaque-tile-verde'], { centro: true, opacidade: 0.75 });
    this.destaque.mesh.scale.set(44, 16, 1);
    this.sprite = new Sprite(jogo.mundo, R.tex[this.def.tex], { escala: this.def.escala });
  }

  atualizar(dt) {
    this.t += dt;
  }

  desenhar() {
    const o = ordemMundo(this.z);
    const o2 = this.sup ? ordemMundo(this.sup.z0 - 0.5) + 1 : o;
    this.destaque.pos(this.x, BASE_Y + this.z + this.h + 2);
    this.destaque.ordem = o2 - 1;
    this.destaque.material.opacity = 0.45 + Math.sin(this.t * 6) * 0.3;
    this.sprite.pos(this.x, BASE_Y + this.z + this.h + 2 + (this.def.arma ? 0 : Math.abs(Math.sin(this.t * 3)) * 6));
    this.sprite.ordem = o2;
  }

  remover() {
    this.sprite.remover();
    this.destaque.remover();
  }
}

// ---------------------------------------------------------------------------
// Efeitos visuais
// ---------------------------------------------------------------------------
export class Efeitos {
  constructor(jogo) {
    this.jogo = jogo;
    this.lista = [];
  }

  adicionar(e) {
    this.lista.push(e);
    return e;
  }

  impacto(x, z, h, escala = 1) {
    const s = new Sprite(this.jogo.mundo, R.tex.impacto, { centro: true, escala: 1.4 * escala });
    s.pos(x, BASE_Y + z + h);
    s.ordem = CAMADA.EFEITO;
    s.mesh.rotation.z = Math.random() * Math.PI;
    this.adicionar({ s, t: 0, dur: 0.16, tipo: 'impacto', esc: 1.4 * escala });
  }

  numero(x, z, h, texto, variante = 'roxa') {
    const s = new Sprite(this.jogo.mundo, texturaTexto(texto, variante), { centro: true, escala: 1.6 });
    s.pos(x, BASE_Y + z + h);
    s.ordem = CAMADA.EFEITO + 5;
    this.adicionar({ s, t: 0, dur: 0.8, tipo: 'subir', y: BASE_Y + z + h });
  }

  poeira(x, z, h) {
    for (let i = 0; i < 6; i++) {
      const s = new Sprite(this.jogo.mundo, R.tex.poeira, { centro: true, escala: aleat(0.6, 1.2), opacidade: 0.7 });
      s.ordem = ordemMundo(z) + 3;
      this.adicionar({
        s, t: 0, dur: 0.4, tipo: 'particula', x, y: BASE_Y + z + h + 4,
        vx: aleat(-90, 90), vy: aleat(10, 60), g: 0, desvanece: true,
      });
    }
  }

  cacos(x, z, h, tex, n = 10) {
    for (let i = 0; i < n; i++) {
      const s = new Sprite(this.jogo.mundo, tex, { centro: true, escala: aleat(1, 2) });
      s.ordem = CAMADA.EFEITO;
      this.adicionar({
        s, t: 0, dur: 0.7, tipo: 'particula', x, y: BASE_Y + z + h + 40,
        vx: aleat(-200, 200), vy: aleat(100, 360), g: 1200, chao: BASE_Y + z,
      });
    }
  }

  onda(x, z, h) {
    const s = new Sprite(this.jogo.mundo, R.tex.onda, { centro: true });
    s.ordem = CAMADA.EFEITO;
    s.pos(x, BASE_Y + z + h + 8);
    this.adicionar({ s, t: 0, dur: 0.6, tipo: 'onda' });
  }

  respingo(x, z, h, escala = 1) {
    const s = new Sprite(this.jogo.mundo, R.tex.itens_fx_jet_splash0, { escala: 0.55 * escala });
    s.pos(x, BASE_Y + z + h);
    s.ordem = ordemMundo(z) + 4;
    this.adicionar({ s, t: 0, dur: 0.35, tipo: 'quadros', quadros: [0, 1, 2, 3, 4].map((i) => R.tex['itens_fx_jet_splash' + i]), esc: 0.55 * escala });
  }

  onda_agua(x, z) {
    const s = new Sprite(this.jogo.mundo, R.tex.itens_fx_jet_ripple0, { centro: true, escala: 0.8 });
    s.pos(x, BASE_Y + z + 4);
    s.ordem = ordemMundo(z) - 2;
    this.adicionar({ s, t: 0, dur: 0.5, tipo: 'quadros', quadros: [0, 1, 2, 3, 4, 5].map((i) => R.tex['itens_fx_jet_ripple' + i]), esc: 0.8 });
  }

  bueiro(x, z) {
    const s = new Sprite(this.jogo.mundo, R.tex.sombra, { centro: true });
    s.material.color.setHex(0x000000);
    s.mesh.scale.set(70, 18, 1);
    s.pos(x, BASE_Y + z);
    s.ordem = ordemMundo(z) + 2;
    this.adicionar({ s, t: 0, dur: 1.2, tipo: 'fixo', desvanece: true });
  }

  atualizar(dt) {
    for (const e of this.lista) {
      e.t += dt;
      const k = e.t / e.dur;
      if (e.tipo === 'impacto') {
        const esc = e.esc * (1 + k * 0.6);
        e.s.mesh.scale.set(48 * esc, 48 * esc, 1);
        e.s.material.opacity = 1 - k;
      } else if (e.tipo === 'subir') {
        e.s.mesh.position.y = e.y + k * 50;
        e.s.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      } else if (e.tipo === 'particula') {
        e.vy -= e.g * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.chao !== undefined && e.y < e.chao) {
          e.y = e.chao;
          e.vy *= -0.3;
          e.vx *= 0.5;
        }
        e.s.pos(e.x, e.y);
        if (e.desvanece) e.s.material.opacity = 0.7 * (1 - k);
      } else if (e.tipo === 'onda') {
        e.s.mesh.scale.set(128 * (1 + k * 5), 40 * (1 + k * 5), 1);
        e.s.material.opacity = 1 - k;
      } else if (e.tipo === 'quadros') {
        const i = Math.min(e.quadros.length - 1, Math.floor(k * e.quadros.length));
        e.s.trocar(e.quadros[i], e.esc);
        e.s.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      } else if (e.tipo === 'fixo' && e.desvanece) {
        e.s.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      }
      if (e.t >= e.dur) {
        e.s.remover();
        e.morto = true;
      }
    }
    this.lista = this.lista.filter((e) => !e.morto);
  }

  limpar() {
    for (const e of this.lista) e.s.remover();
    this.lista = [];
  }
}
