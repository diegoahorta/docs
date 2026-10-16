// Laço principal, câmera, ondas de inimigos e fluxo da história.
import * as THREE from 'three';
import { ALTURA, HEROI, LARGURA, Z_MAX } from './config.js';
import { Cenario } from './cenario.js';
import { Efeitos, Heroi, Item, Projetil, Rato } from './atores.js';
import { FASES, FINAL, INTRO } from './fases.js';
import { lerPreferencia, salvarPreferencia } from './audio.js';

const MAX_ATACANTES = 2;

export class Jogo {
  constructor({ container, entrada, audio, hud, telas }) {
    this.entrada = entrada;
    this.audio = audio;
    this.hud = hud;
    this.telas = telas;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setClearColor(0x0d0b1a);
    container.appendChild(this.renderer.domElement);
    this.cena = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, LARGURA, ALTURA, 0, -10, 10);
    this.camera.position.z = 5;
    this.mundo = new THREE.Group();
    this.cena.add(this.mundo);

    this.camX = 0;
    this.estado = 'menu';
    this.pontos = 0;
    this.inimigos = [];
    this.projeteis = [];
    this.itens = [];
    this.turnos = new Map();
    this.tremor = { t: 0, forca: 0 };
    this.pausaGolpe = 0;
    this.comboN = 0;
    this.comboT = 0;
    this.scanlines = lerPreferencia('scanlines', 'sim') === 'sim';
    document.querySelector('#scanlines').classList.toggle('desligado', !this.scanlines);

    this.redimensionar();
    addEventListener('resize', () => this.redimensionar());
    this.ultimo = performance.now();
    this.renderer.setAnimationLoop((t) => this.quadro(t));
  }

  redimensionar() {
    const palco = document.querySelector('#palco');
    const w = palco.clientWidth;
    const h = palco.clientHeight;
    palco.style.setProperty('--u', w / LARGURA + 'px');
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    this.renderer.setSize(w, h, false);
  }

  // ---------------------------------------------------------------------------
  // Laço
  // ---------------------------------------------------------------------------
  quadro(agora) {
    const dt = Math.min(0.05, (agora - this.ultimo) / 1000);
    this.ultimo = agora;
    const ent = this.entrada;
    ent.lerControle();

    if (ent.consumir('musica')) {
      this.audio.iniciar();
      this.telas.aviso(this.audio.alternarModo(), 1.2) ;
    }
    if (ent.consumir('scanlines')) this.alternarScanlines();
    if (ent.consumir('telaCheia')) this.telaCheia();

    if (this.telas.aberta) this.telas.atualizar(dt);
    if (this.estado === 'jogando' && !this.telas.aberta) {
      if (ent.consumir('pausa')) this.pausar();
      else this.atualizar(dt);
    } else if (this.estado === 'cena' && this.heroi) {
      // durante diálogos e cartelas o herói e os efeitos continuam animados
      this.heroi.t += dt;
      this.heroi.animar();
      this.efeitos.atualizar(dt);
    } else if (this.estado === 'menu' && this.cenario) {
      // o título passeia pela Avenida Paulista
      this.camX = (this.camX + 40 * dt) % (this.fase.comprimento - LARGURA);
    }
    if (this.cenario) this.desenhar(dt);
    this.renderer.render(this.cena, this.camera);
    this.aoQuadro?.();
    ent.fimDoQuadro();
  }

  atualizar(dt) {
    if (this.pausaGolpe > 0) {
      this.pausaGolpe -= dt;
      return;
    }
    const h = this.heroi;
    const limites = [this.camX + 30, this.camX + LARGURA - 30];
    h.atualizar(dt, this.entrada, limites);
    for (const r of this.inimigos) r.atualizar(dt, limites);
    for (const p of this.projeteis) p.atualizar(dt);
    for (const i of this.itens) i.atualizar(dt);
    this.efeitos.atualizar(dt);

    // remove os mortos
    for (const r of this.inimigos.filter((r) => r.removido)) {
      r.remover();
      this.turnos.delete(r);
    }
    this.inimigos = this.inimigos.filter((r) => !r.removido);
    for (const p of this.projeteis.filter((p) => !p.vivo)) p.remover();
    this.projeteis = this.projeteis.filter((p) => p.vivo);

    // comidas: pega ao passar por cima
    for (const it of [...this.itens]) {
      if (it.def.arma) continue;
      if (Math.abs(it.x - h.x) < 34 && Math.abs(it.z - h.z) < 18 && h.h < 20 && h.vida > 0) {
        if (it.def.vida) h.vida = Math.min(h.vidaMax, h.vida + it.def.vida);
        if (it.def.energia) h.energia = Math.min(100, h.energia + it.def.energia);
        this.efeitos.numero(it.x, it.z, 80, it.def.vida ? String(it.def.vida) : '50', 'branca');
        this.audio.sfx('comer');
        this.removerItem(it);
      }
    }

    // turnos de ataque expiram
    const agora = performance.now();
    for (const [r, t] of this.turnos) if (agora - t > 3500 || r.vida <= 0) this.turnos.delete(r);

    if (this.comboT > 0 && (this.comboT -= dt) <= 0) this.comboN = 0;
    this.atualizarOndas(dt);
    this.atualizarCamera(dt);

    this.hud.atualizar({
      heroi: h,
      pontos: this.pontos,
      combo: this.comboN,
      foco: this.foco && this.foco.vida > 0 && !this.foco.removido ? this.foco : this.chefe && this.chefe.vida > 0 ? this.chefe : null,
      siga: this.mostrarSiga,
      fase: this.fase.titulo,
    });
  }

  desenhar(dt) {
    let ox = 0;
    let oy = 0;
    if (this.tremor.t > 0) {
      this.tremor.t -= dt;
      ox = (Math.random() - 0.5) * this.tremor.forca;
      oy = (Math.random() - 0.5) * this.tremor.forca;
    }
    this.camera.position.x = Math.round(this.camX + ox);
    this.camera.position.y = oy;
    this.cenario.atualizar(this.camX);
    this.heroi.desenhar();
    for (const r of this.inimigos) r.desenhar();
    for (const p of this.projeteis) p.desenhar();
    for (const i of this.itens) i.desenhar();
  }

  // ---------------------------------------------------------------------------
  // Câmera e ondas
  // ---------------------------------------------------------------------------
  atualizarCamera(dt) {
    const f = this.fase;
    const onda = this.ondas[this.ondaIdx];
    const limite = this.ondaAtiva ? this.ondaAtiva.camX : onda ? onda.camX : f.comprimento - LARGURA;
    const alvo = Math.min(limite, this.heroi.x - LARGURA * 0.42);
    if (alvo > this.camX) this.camX += Math.min(alvo - this.camX, 420 * dt);
    this.mostrarSiga = !this.ondaAtiva && this.inimigos.length === 0 && this.camX < limite - 4 && this.heroi.x > this.camX + LARGURA * 0.55;
    if (!this.ondaAtiva && !onda && this.inimigos.length === 0) this.mostrarSiga = this.heroi.x < f.comprimento - 140;
  }

  atualizarOndas(dt) {
    const onda = this.ondas[this.ondaIdx];
    if (!this.ondaAtiva && onda && this.camX >= onda.camX - 1) {
      this.ondaAtiva = onda;
      this.ondaIdx++;
      this.filaInimigos = onda.inimigos.map((d, i) => ({ d, t: i * 0.7 }));
      if (onda.chefe) this.introChefe();
    }
    if (this.filaInimigos?.length) {
      for (const item of this.filaInimigos) item.t -= dt;
      const prontos = this.filaInimigos.filter((i) => i.t <= 0);
      this.filaInimigos = this.filaInimigos.filter((i) => i.t > 0);
      for (const { d } of prontos) this.gerarInimigo(...d);
    }
    if (this.ondaAtiva && !this.filaInimigos?.length && this.inimigos.length === 0) {
      const eraChefe = this.ondaAtiva.chefe;
      this.ondaAtiva = null;
      if (eraChefe) this.vencerJogo();
      else if (this.ondaIdx < this.ondas.length) this.telas.aviso('SIGA!', 1.2);
    }
    // fim da fase
    if (!this.ondaAtiva && this.ondaIdx >= this.ondas.length && this.inimigos.length === 0 && this.heroi.x > this.fase.comprimento - 120) {
      this.concluirFase();
    }
  }

  gerarInimigo(tipo, lado, z) {
    let x;
    const zz = z ?? 20 + Math.random() * (Z_MAX - 40);
    const cont = this.inimigos.length;
    if (lado === 'esq') x = this.camX - 50 - (cont % 3) * 30;
    else if (lado === 'dir') x = this.camX + LARGURA + 50 + (cont % 3) * 30;
    else {
      // sai do bueiro, em algum ponto da tela longe do herói
      x = this.camX + 160 + Math.random() * (LARGURA - 320);
      if (Math.abs(x - this.heroi.x) < 150) x += x < this.heroi.x ? -150 : 150;
      x = Math.max(this.camX + 80, Math.min(this.camX + LARGURA - 80, x));
    }
    const zf = lado === 'bueiro' ? 20 + Math.random() * 40 : zz;
    const r = new Rato(this, tipo, x, zf);
    if (lado === 'bueiro') {
      r.mudar('entrar_bueiro');
      this.efeitos.bueiro(x, zf);
      this.audio.sfx('guincho');
    }
    if (tipo === 'rei') this.chefe = r;
    this.inimigos.push(r);
    return r;
  }

  pedirTurno(r) {
    if (r.tipo === 'rei' || this.turnos.has(r)) return true;
    const ativos = [...this.turnos.keys()].filter((k) => k.tipo !== 'rei').length;
    if (ativos >= MAX_ATACANTES) return false;
    this.turnos.set(r, performance.now());
    return true;
  }

  liberarTurno(r) {
    this.turnos.delete(r);
  }

  // ---------------------------------------------------------------------------
  // Combate
  // ---------------------------------------------------------------------------
  acertou(heroi, rato, dano, forte) {
    this.foco = rato;
    this.pontos += dano * 10;
    this.comboN++;
    this.comboT = 1.3;
    heroi.energia = Math.min(100, heroi.energia + 6);
    this.efeitos.impacto(rato.x - heroi.dir * 6, rato.z, rato.h + 70 * (rato.st.escala / 2), forte ? 1.2 : 0.9);
    this.efeitos.numero(rato.x, rato.z, rato.h + 120 * (rato.st.escala / 2), String(dano));
    this.audio.sfx(forte ? 'golpeForte' : 'soco');
    this.pausaGolpe = forte ? 0.07 : 0.04;
    if (forte) this.tremer(0.12, 5);
    if (rato.vida <= 0 && !rato.pontuado) {
      rato.pontuado = true;
      this.pontos += rato.st.pontos;
      this.efeitos.numero(rato.x, rato.z, rato.h + 150, String(rato.st.pontos), 'branca');
      if (rato.tipo !== 'rei' && Math.random() < 0.25) {
        this.soltarItem(['coxinha', 'estrela', 'pedra', 'garrafa'][Math.floor(Math.random() * 4)], rato.x, rato.z);
      }
    }
  }

  arremessar(heroi, tipo) {
    this.audio.sfx('arremesso');
    this.projeteis.push(new Projetil(this, tipo, 'heroi', heroi.x + heroi.dir * 30, heroi.z, heroi.h + 30, heroi.dir));
  }

  projetilInimigo(rato) {
    this.audio.sfx('arremesso');
    this.projeteis.push(new Projetil(this, 'saco', 'inimigo', rato.x + rato.dir * 24, rato.z, rato.h + 40, rato.dir));
  }

  itemProximo(heroi) {
    let melhor = null;
    let dist = 60;
    for (const it of this.itens) {
      if (!it.def.arma) continue;
      const d = Math.abs(it.x - heroi.x) + Math.abs(it.z - heroi.z) * 1.5;
      if (d < dist && Math.abs(heroi.h) < 4) {
        dist = d;
        melhor = it;
      }
    }
    return melhor;
  }

  soltarItem(tipo, x, z) {
    const xs = Math.max(this.camX + 30, Math.min(this.camX + LARGURA - 30, x));
    // não deixa cair dentro de sólidos ou buracos
    let zz = z;
    if (this.cenario.bloqueio(xs, zz, 0) || this.cenario.perigoEm(xs, zz)) zz = Math.min(Z_MAX, zz + 50);
    this.itens.push(new Item(this, tipo, xs, zz));
  }

  removerItem(it) {
    it.remover();
    this.itens = this.itens.filter((i) => i !== it);
  }

  tremer(t, forca) {
    this.tremor = { t, forca };
  }

  flashDano() {
    const el = document.querySelector('#efeito-dano');
    el.classList.add('ativo');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('ativo')));
  }

  mensagem(texto) {
    this.telas.aviso(texto, 1.4);
  }

  // ---------------------------------------------------------------------------
  // Fases e fluxo
  // ---------------------------------------------------------------------------
  carregarFase(i) {
    this.limparFase();
    this.faseIdx = i;
    this.fase = FASES[i];
    this.cenario = new Cenario(this.mundo, this.fase);
    this.efeitos = new Efeitos(this);
    const vidasAntes = this.heroi?.vidas;
    const energiaAntes = this.heroi?.energia;
    this.heroi?.remover();
    this.heroi = new Heroi(this);
    if (vidasAntes !== undefined) {
      this.heroi.vidas = vidasAntes;
      this.heroi.energia = energiaAntes;
    }
    this.heroi.x = 160;
    this.heroi.z = 70;
    this.camX = 0;
    this.ondas = this.fase.ondas;
    this.ondaIdx = 0;
    this.ondaAtiva = null;
    this.filaInimigos = [];
    this.chefe = null;
    this.foco = null;
    for (const [tipo, x, z] of this.fase.itens) this.itens.push(new Item(this, tipo, x, z));
    this.audio.tocar(this.fase.musica);
  }

  limparFase() {
    for (const r of this.inimigos) r.remover();
    for (const p of this.projeteis) p.remover();
    for (const i of this.itens) i.remover();
    this.efeitos?.limpar();
    this.cenario?.remover();
    this.inimigos = [];
    this.projeteis = [];
    this.itens = [];
    this.turnos.clear();
  }

  async menuPrincipal() {
    this.estado = 'menu';
    this.hud.mostrar(false);
    this.carregarFase(0);
    this.audio.tocar('menu');
    this.heroi.x = -500; // fora de cena durante o título
    this.camX = 0;
    for (;;) {
      const escolha = await this.telas.titulo({
        alternarMusica: () => this.audio.alternarModo(),
        alternarScanlines: () => this.alternarScanlines(),
        scanlinesLigado: () => this.scanlines,
      });
      if (escolha === 'controles') {
        await this.telas.controles();
        continue;
      }
      if (escolha === 'jogar') break;
    }
    await this.novoJogo();
  }

  async novoJogo() {
    this.pontos = 0;
    this.heroi.vidas = HEROI.vidas;
    this.heroi.energia = 0;
    this.audio.tocar('menu');
    await this.telas.dialogo(INTRO, { fundo: true });
    await this.jogarFase(0);
  }

  async jogarFase(i) {
    this.carregarFase(i);
    this.estado = 'cena';
    this.hud.mostrar(false);
    await this.telas.cartela(this.fase.nome, this.fase.titulo);
    await this.telas.dialogo(this.fase.historia);
    this.hud.mostrar(true);
    this.estado = 'jogando';
    const resultado = await new Promise((ok) => (this.aoFimFase = ok));
    if (resultado === 'proxima') {
      if (i + 1 < FASES.length) await this.jogarFase(i + 1);
    } else if (resultado === 'continuar') {
      this.heroi.vidas = 3;
      this.pontos = Math.floor(this.pontos / 2);
      await this.jogarFase(i);
    } else if (resultado === 'menu') {
      this.menuPrincipal();
    }
  }

  async concluirFase() {
    if (this.estado !== 'jogando') return;
    this.estado = 'cena';
    this.heroi.mudar('vitoria');
    this.pontos += Math.round(this.heroi.vida * 20);
    this.hud.atualizar({ heroi: this.heroi, pontos: this.pontos, combo: 0, foco: null, siga: false, fase: this.fase.titulo });
    await this.telas.cartela('FASE CONCLUÍDA!', `BÔNUS DE VIDA: ${Math.round(this.heroi.vida * 20)}`, 2.6);
    this.aoFimFase('proxima');
  }

  async introChefe() {
    this.estado = 'cena';
    this.audio.tocar('chefe');
    await this.telas.dialogo(this.fase.chefeFala);
    this.estado = 'jogando';
  }

  async vencerJogo() {
    this.estado = 'cena';
    this.heroi.mudar('vitoria');
    this.pontos += 10000;
    this.tremer(0.6, 10);
    this.audio.tocar('vitoria');
    await this.telas.cartela('VITÓRIA!', 'A GANGUE DOS RATOS FOI DERROTADA', 2.8);
    await this.telas.dialogo(FINAL);
    this.hud.mostrar(false);
    const recorde = Math.max(this.pontos, +lerPreferencia('recorde', 0));
    salvarPreferencia('recorde', recorde);
    await this.telas.menu({
      classe: 'escura',
      titulo: `<div class="titulo">FIM<small>OBRIGADO POR JOGAR!</small></div>
        <div class="subtitulo">PONTOS: ${this.pontos}</div><div class="subtitulo">RECORDE: ${recorde}</div>`,
      itens: [{ texto: 'VOLTAR AO TÍTULO', valor: 'menu' }],
    });
    this.aoFimFase('fim');
    this.menuPrincipal();
  }

  async heroiMorreu() {
    const h = this.heroi;
    if (h.estado === 'morto') return;
    h.vidas--;
    if (h.vidas > 0) {
      h.reviver();
      // derruba quem estiver por perto, como nos fliperamas
      for (const r of this.inimigos) {
        if (r.atingivel && r.tipo !== 'rei') r.sofrer(0, r.x >= h.x ? 1 : -1, true);
      }
      this.efeitos.onda(h.x, h.z, 0);
      return;
    }
    h.mudar('morto');
    this.estado = 'cena';
    const escolha = await this.telas.menu({
      classe: 'escura',
      titulo: `<div class="titulo">FIM DE JOGO</div><div class="subtitulo">PONTOS: ${this.pontos}</div>`,
      itens: [
        { texto: 'CONTINUAR', valor: 'continuar' },
        { texto: 'VOLTAR AO TÍTULO', valor: 'menu' },
      ],
    });
    this.aoFimFase(escolha);
  }

  async pausar() {
    this.estado = 'pausado';
    this.audio.sfx('confirmar');
    const escolha = await this.telas.menu({
      classe: 'escura',
      titulo: '<div class="titulo">PAUSA</div>',
      itens: [
        { texto: 'CONTINUAR', valor: 'continuar' },
        { texto: () => 'MÚSICA: ' + this.audio.descricaoModo(), acao: () => this.audio.alternarModo() },
        { texto: () => 'TELA CRT: ' + (this.scanlines ? 'LIGADA' : 'DESLIGADA'), acao: () => this.alternarScanlines() },
        { texto: 'CONTROLES', valor: 'controles' },
        { texto: 'SAIR PARA O TÍTULO', valor: 'sair' },
      ],
      voltar: 'continuar',
    });
    if (escolha === 'controles') {
      await this.telas.controles();
      return this.pausar();
    }
    if (escolha === 'sair') {
      this.estado = 'menu';
      this.aoFimFase('menu');
      return;
    }
    this.estado = 'jogando';
  }

  alternarScanlines() {
    this.scanlines = !this.scanlines;
    salvarPreferencia('scanlines', this.scanlines ? 'sim' : 'nao');
    document.querySelector('#scanlines').classList.toggle('desligado', !this.scanlines);
  }

  telaCheia() {
    const palco = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else palco.requestFullscreen?.().catch(() => {});
  }
}
