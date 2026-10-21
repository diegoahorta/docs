// Memory Kana: jogo da memória que liga cada kana ao seu romaji e cada
// palavra à sua imagem. São 4 níveis com cada vez mais pares.
//
// Estados: 'inicio' → 'jogando' ⇄ 'pausado' → 'entreNiveis' → ... → 'fim'.

import * as Phaser from 'phaser';
import { obterResumo, registrarFimDePartida, registrarResposta } from '../../core/progress.js';
import { animacoesReduzidas, obterConfig } from '../../core/settings.js';
import { falar } from '../../core/speech.js';
import { tocarErro } from '../../core/audio.js';
import { mostrarAcerto } from '../../ui/feedback.js';
import { criarCamadaDoJogo, mostrarDica } from '../gamePanel.js';
import {
  NIVEIS,
  bonusDeEstrelas,
  calcularEstrelas,
  calcularGrade,
  montarNivel,
  pontosDoPar,
} from './memoryLogic.js';
import { criarCarta } from './card.js';
import { painelFim, painelInicio, painelNivelCompleto, painelPausa } from './panels.js';

const ID_DO_JOGO = 'memory-kana';
const FONTE = '"Noto Sans JP", system-ui, sans-serif';
const ALTURA_DO_PLACAR = 52;
const ESPACO_ENTRE_CARTAS = 12;
const TEMPO_PARA_DESVIRAR_MS = 1000;
const ERROS_PARA_REVISAR = 2; // pares errados 2+ vezes vão para "Para revisar"

export default class MemoryKanaScene extends Phaser.Scene {
  constructor() {
    super({ key: ID_DO_JOGO });
  }

  /** Recebe { conteiner, aoSair } do PhaserHost. */
  init(dados) {
    this.dados = dados;
    this.painel = null;
    this.limpo = false;
    this.cartas = [];
    this.reiniciarPartida();
  }

  reiniciarPartida() {
    this.indiceDoNivel = 0;
    this.pontos = 0;
    this.estrelasTotais = 0;
    this.errosPorPar = new Map();
    this.itensPorPar = new Map();
    this.estado = 'inicio';
  }

  create() {
    this.placar = this.add
      .text(16, 14, '', {
        fontFamily: FONTE,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f4f6ff',
      })
      .setDepth(10);
    this.camada = criarCamadaDoJogo(this.dados.conteiner);

    this.scale.on('resize', this.organizarGrade, this);
    this.input.keyboard.on('keydown', this.aoTeclar, this);
    this.events.once('shutdown', this.limpar, this);
    this.events.once('destroy', this.limpar, this);

    this.organizarGrade();
    this.mostrarInicio();
  }

  // ---------- Níveis ----------

  mostrarInicio() {
    this.painel = painelInicio(this.camada, {
      recorde: obterResumo().recordes[ID_DO_JOGO] ?? 0,
      aoComecar: () => this.comecarPartida(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  fecharPainel() {
    this.painel?.fechar();
    this.painel = null;
  }

  comecarPartida() {
    this.reiniciarPartida();
    this.comecarNivel();
  }

  /** Monta as cartas do nível atual e começa a jogar. */
  comecarNivel() {
    this.fecharPainel();
    this.destruirCartas();
    const { pares, cartas } = montarNivel(this.indiceDoNivel, {
      mostrarRomaji: obterConfig().mostrarRomaji,
    });
    pares.forEach((par) => this.itensPorPar.set(par.id, par.item));
    this.totalDePares = pares.length;
    this.paresEncontrados = 0;
    this.jogadas = 0;
    this.combo = 0;
    this.viradas = [];
    this.bloqueado = false;
    this.foco = 0;
    this.usandoTeclado = false;
    this.cartas = cartas.map((dados) => criarCarta(this, dados, (carta) => this.aoClicar(carta)));
    this.organizarGrade();
    this.animarEntrada();
    this.estado = 'jogando';
    this.atualizarPlacar();
  }

  concluirNivel() {
    this.estado = 'entreNiveis';
    const estrelas = calcularEstrelas(this.jogadas, this.totalDePares);
    this.estrelasTotais += estrelas;
    this.pontos += bonusDeEstrelas(estrelas);
    this.atualizarPlacar();

    if (this.indiceDoNivel === NIVEIS.length - 1) {
      this.terminar();
      return;
    }
    this.painel = painelNivelCompleto(this.camada, {
      numero: this.indiceDoNivel + 1,
      estrelas,
      jogadas: this.jogadas,
      pontos: this.pontos,
      aoProximo: () => {
        this.indiceDoNivel += 1;
        this.comecarNivel();
      },
      aoSair: () => this.dados.aoSair(),
    });
  }

  terminar() {
    this.estado = 'fim';
    this.destruirCartas();
    const { novoRecorde, recordeAnterior } = registrarFimDePartida(ID_DO_JOGO, this.pontos);
    const revisar = [...this.errosPorPar]
      .filter(([, erros]) => erros >= ERROS_PARA_REVISAR)
      .map(([parId]) => this.itensPorPar.get(parId));
    this.painel = painelFim(this.camada, {
      pontos: this.pontos,
      estrelas: this.estrelasTotais,
      recorde: Math.max(recordeAnterior, this.pontos),
      novoRecorde,
      revisar,
      aoJogarDeNovo: () => this.comecarPartida(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  // ---------- Pausa ----------

  pausar() {
    // Com todos os pares achados, o painel de fim de nível já vai aparecer.
    if (this.estado !== 'jogando' || this.paresEncontrados === this.totalDePares) {
      return;
    }
    this.estado = 'pausado';
    this.cartas.forEach((carta) => carta.conteiner.setVisible(false));
    this.painel = painelPausa(this.camada, {
      aoContinuar: () => this.continuar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  continuar() {
    this.fecharPainel();
    this.cartas.forEach((carta) => carta.conteiner.setVisible(true));
    this.estado = 'jogando';
  }

  /** Chamado pelo PhaserHost quando um modal (ex.: configurações) abre. */
  pausarExterno() {
    this.pausar();
  }

  /** O jogador volta pelo botão "Continuar" do painel de pausa. */
  continuarExterno() {}

  // ---------- Grade ----------

  /** Distribui as cartas na maior grade que couber na tela. */
  organizarGrade() {
    const { width: largura, height: altura } = this.scale;
    this.placar.setFontSize(Math.min(20, largura / 24));
    if (this.cartas.length === 0) {
      return;
    }
    const alturaUtil = altura - ALTURA_DO_PLACAR;
    const grade = calcularGrade(this.cartas.length, largura, alturaUtil, ESPACO_ENTRE_CARTAS);
    this.colunas = grade.colunas;
    const larguraTotal = grade.colunas * grade.largura + (grade.colunas - 1) * ESPACO_ENTRE_CARTAS;
    const alturaTotal = grade.linhas * grade.altura + (grade.linhas - 1) * ESPACO_ENTRE_CARTAS;
    const inicioX = (largura - larguraTotal) / 2 + grade.largura / 2;
    const inicioY = ALTURA_DO_PLACAR + (alturaUtil - alturaTotal) / 2 + grade.altura / 2;

    this.cartas.forEach((carta, indice) => {
      const coluna = indice % grade.colunas;
      const linha = Math.floor(indice / grade.colunas);
      carta.posicionar(
        inicioX + coluna * (grade.largura + ESPACO_ENTRE_CARTAS),
        inicioY + linha * (grade.altura + ESPACO_ENTRE_CARTAS),
        grade.largura,
        grade.altura,
      );
    });
  }

  animarEntrada() {
    if (animacoesReduzidas()) {
      return;
    }
    this.cartas.forEach((carta, indice) => {
      carta.conteiner.setScale(0);
      this.tweens.add({
        targets: carta.conteiner,
        scale: 1,
        delay: indice * 35,
        duration: 260,
        ease: 'Back.easeOut',
      });
    });
  }

  destruirCartas() {
    this.cartas.forEach((carta) => carta.conteiner.destroy());
    this.cartas = [];
  }

  // ---------- Jogadas ----------

  aoClicar(carta) {
    if (this.estado !== 'jogando') {
      return;
    }
    this.foco = this.cartas.indexOf(carta);
    this.atualizarFoco();
    if (carta.encontrada) {
      falar(carta.dados.fala); // cartas já encontradas funcionam como botão 🔊
      return;
    }
    if (carta.virada || this.bloqueado) {
      return;
    }
    carta.virar(true, !animacoesReduzidas());
    falar(carta.dados.fala);
    this.viradas.push(carta);
    if (this.viradas.length === 2) {
      this.avaliarJogada();
    }
  }

  avaliarJogada() {
    const [primeira, segunda] = this.viradas;
    this.viradas = [];
    this.jogadas += 1;
    if (primeira.dados.parId === segunda.dados.parId) {
      this.acertarPar(primeira, segunda);
    } else {
      this.errarPar(primeira, segunda);
    }
    this.atualizarPlacar();
  }

  acertarPar(primeira, segunda) {
    primeira.marcarEncontrada();
    segunda.marcarEncontrada();
    this.combo += 1;
    this.paresEncontrados += 1;
    const ganho = pontosDoPar(this.combo);
    this.pontos += ganho;
    registrarResposta(primeira.dados.parId, true);
    mostrarAcerto({ texto: `+${ganho}`, ...this.pontoNaTela(segunda.conteiner) });
    this.comemorar([primeira, segunda]);

    if (this.paresEncontrados === this.totalDePares) {
      this.time.delayedCall(700, () => this.concluirNivel());
    }
  }

  /** Par errado: as cartas desviram e aparece a dica (sem tirar ponto do SRS). */
  errarPar(primeira, segunda) {
    this.combo = 0;
    this.bloqueado = true;
    tocarErro();
    [primeira, segunda].forEach((carta) => {
      const parId = carta.dados.parId;
      this.errosPorPar.set(parId, (this.errosPorPar.get(parId) ?? 0) + 1);
    });
    mostrarDica(
      this.camada,
      [primeira, segunda].map((carta) => this.textoDaDica(carta.dados.item)),
    );
    this.time.delayedCall(TEMPO_PARA_DESVIRAR_MS, () => {
      const animado = !animacoesReduzidas();
      primeira.virar(false, animado);
      segunda.virar(false, animado);
      this.bloqueado = false;
    });
  }

  /** "あ = a · 💡 dica" para kana, "いぬ (inu) = cachorro 🐶" para palavras. */
  textoDaDica(item) {
    if (item.mnemonico) {
      return `${item.kana} = ${item.romaji} · 💡 ${item.mnemonico}`;
    }
    return `${item.kana} (${item.romaji}) = ${item.pt} ${item.emoji}`;
  }

  comemorar(cartas) {
    if (animacoesReduzidas()) {
      return;
    }
    this.tweens.add({
      targets: cartas.map((carta) => carta.conteiner),
      scale: 1.12,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  // ---------- Teclado ----------

  /** Setas movem o foco, Enter/Espaço viram a carta, Esc pausa. */
  aoTeclar(evento) {
    // Teclas apertadas em botões/campos HTML (painéis, HUD) não são do jogo.
    if (evento.target instanceof HTMLElement && evento.target.closest('button, input, a')) {
      return;
    }
    if (evento.key === 'Escape') {
      this.pausar();
      return;
    }
    if (this.estado !== 'jogando' || this.cartas.length === 0) {
      return;
    }
    const movimentos = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -this.colunas,
      ArrowDown: this.colunas,
    };
    if (evento.key in movimentos) {
      evento.preventDefault();
      this.usandoTeclado = true;
      this.foco = Phaser.Math.Clamp(this.foco + movimentos[evento.key], 0, this.cartas.length - 1);
      this.atualizarFoco();
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      this.usandoTeclado = true;
      this.aoClicar(this.cartas[this.foco]);
    }
  }

  /** O contorno de foco só aparece para quem está usando o teclado. */
  atualizarFoco() {
    this.cartas.forEach((carta, indice) => {
      carta.focar(this.usandoTeclado && indice === this.foco);
    });
  }

  // ---------- Placar ----------

  atualizarPlacar() {
    const nivel = `Nível ${this.indiceDoNivel + 1}/${NIVEIS.length}`;
    const pares = `Pares ${this.paresEncontrados ?? 0}/${this.totalDePares ?? 0}`;
    const combo = this.combo > 1 ? `   Combo x${this.combo}` : '';
    this.placar.setText(
      `${nivel}   ${pares}   Jogadas ${this.jogadas ?? 0}   ${this.pontos} pts${combo}`,
    );
  }

  /** Converte a posição de um objeto do jogo para coordenadas da tela. */
  pontoNaTela(objeto) {
    const retangulo = this.game.canvas.getBoundingClientRect();
    return {
      x: retangulo.left + (objeto.x * retangulo.width) / this.scale.width,
      y: retangulo.top + (objeto.y * retangulo.height) / this.scale.height,
    };
  }

  // ---------- Limpeza ----------

  /** Remove o que foi criado fora do Phaser (HTML e listeners). */
  limpar() {
    if (this.limpo) {
      return;
    }
    this.limpo = true;
    this.estado = 'destruida';
    this.scale.off('resize', this.organizarGrade, this);
    this.input.keyboard?.off('keydown', this.aoTeclar, this);
    this.camada?.remove();
  }
}
