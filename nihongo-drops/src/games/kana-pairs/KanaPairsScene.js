// Pares de Kana: todas as cartas ficam à mostra, hiragana de um lado e
// katakana do outro. O jogador liga cada par de mesmo som contra o relógio.
// Errar custa segundos; cada nível tem mais pares e menos tempo.
//
// Estados: 'inicio' → 'jogando' ⇄ 'pausado' → 'entreNiveis' → ... → 'fim'.

import * as Phaser from 'phaser';
import { obterResumo, registrarFimDePartida, registrarResposta } from '../../core/progress.js';
import { animacoesReduzidas } from '../../core/settings.js';
import { falar } from '../../core/speech.js';
import { tocarErro } from '../../core/audio.js';
import { mostrarAcerto } from '../../ui/feedback.js';
import { criarCamadaDoJogo, mostrarDica } from '../gamePanel.js';
import { criarCarta } from '../card.js';
import { ouvirTeclado } from '../keyboard.js';
import { calcularGrade } from '../gridLayout.js';
import {
  PENALIDADE_S,
  bonusDeTempo,
  configDoNivel,
  dividirArea,
  montarNivel,
  pontosDoPar,
} from './pairsLogic.js';
import { painelFim, painelInicio, painelPausa } from './panels.js';

const ID_DO_JOGO = 'kana-pairs';
const FONTE = '"Noto Sans JP", system-ui, sans-serif';
const MARGEM = 16;
const TOPO_DA_AREA = 66; // abaixo do placar e da barra de tempo
const ALTURA_DO_TITULO = 30; // "ひらがな" / "カタカナ" acima de cada lado
const ESPACO_ENTRE_CARTAS = 10;
const ESPACO_ENTRE_LADOS = 24;

export default class KanaPairsScene extends Phaser.Scene {
  constructor() {
    super({ key: ID_DO_JOGO });
  }

  /** Recebe { conteiner, aoSair } do PhaserHost. */
  init(dados) {
    this.dados = dados;
    this.painel = null;
    this.limpo = false;
    this.lados = { hiragana: [], katakana: [] };
    this.reiniciarPartida();
  }

  reiniciarPartida() {
    this.nivel = 1;
    this.pontos = 0;
    this.paresTotais = 0;
    this.errados = new Map();
    this.estado = 'inicio';
  }

  create() {
    this.placar = this.add
      .text(MARGEM, 12, '', {
        fontFamily: FONTE,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f4f6ff',
      })
      .setDepth(10);
    this.barraDeTempo = this.add.graphics().setDepth(10);
    this.titulos = ['ひらがな', 'カタカナ'].map((texto) =>
      this.add
        .text(0, 0, texto, {
          fontFamily: FONTE,
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ff8fb1',
        })
        .setOrigin(0.5, 0)
        .setVisible(false),
    );
    this.camada = criarCamadaDoJogo(this.dados.conteiner);

    this.scale.on('resize', this.organizar, this);
    this.pararTeclado = ouvirTeclado((evento) => this.aoTeclar(evento));
    this.events.once('shutdown', this.limpar, this);
    this.events.once('destroy', this.limpar, this);

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
    this.fecharPainel();
    this.reiniciarPartida();
    this.comecarNivel();
  }

  /** Cria as cartas do nível e reinicia o relógio. */
  comecarNivel() {
    this.destruirCartas();
    const cartas = montarNivel(this.nivel);
    const criar = (dados) => {
      const carta = criarCarta(this, dados, (alvo) => this.aoClicar(alvo));
      carta.virar(true, false);
      return carta;
    };
    this.lados = { hiragana: cartas.hiragana.map(criar), katakana: cartas.katakana.map(criar) };
    this.selecionada = null;
    this.paresFeitos = [];
    this.combo = 0;
    this.foco = 0;
    this.usandoTeclado = false;
    const { tempoS } = configDoNivel(this.nivel);
    this.tempoTotal = tempoS;
    this.tempoRestante = tempoS;
    this.titulos.forEach((titulo) => titulo.setVisible(true));
    this.organizar();
    this.animarEntrada();
    this.estado = 'jogando';
    this.atualizarPlacar();
  }

  /** Todos os pares ligados: bônus de tempo e próximo nível. */
  concluirNivel() {
    this.estado = 'entreNiveis';
    const bonus = bonusDeTempo(this.tempoRestante);
    this.pontos += bonus;
    this.atualizarPlacar();
    this.anunciar(`Nível ${this.nivel} completo!\n+${bonus} pelo tempo`);
    this.time.delayedCall(1400, () => {
      if (this.estado === 'entreNiveis') {
        this.nivel += 1;
        this.comecarNivel();
      }
    });
  }

  terminar() {
    this.estado = 'fim';
    this.selecionada = null;
    this.todasAsCartas().forEach((carta) => carta.conteiner.setVisible(false));
    const { novoRecorde, recordeAnterior } = registrarFimDePartida(ID_DO_JOGO, this.pontos);
    this.painel = painelFim(this.camada, {
      pontos: this.pontos,
      nivel: this.nivel,
      pares: this.paresTotais,
      recorde: Math.max(recordeAnterior, this.pontos),
      novoRecorde,
      errados: [...this.errados.values()],
      aoJogarDeNovo: () => this.comecarPartida(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  // ---------- Pausa ----------

  pausar() {
    if (this.estado !== 'jogando') {
      return;
    }
    this.estado = 'pausado';
    this.todasAsCartas().forEach((carta) => carta.conteiner.setVisible(false));
    this.painel = painelPausa(this.camada, {
      aoContinuar: () => this.continuar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  continuar() {
    this.fecharPainel();
    this.todasAsCartas().forEach((carta) => carta.conteiner.setVisible(true));
    this.estado = 'jogando';
  }

  /** Chamado pelo PhaserHost quando um modal (ex.: configurações) abre. */
  pausarExterno() {
    this.pausar();
  }

  /** O jogador volta pelo botão "Continuar" do painel de pausa. */
  continuarExterno() {}

  // ---------- Layout ----------

  todasAsCartas() {
    return [...this.lados.hiragana, ...this.lados.katakana];
  }

  /** Posiciona os dois lados (lado a lado ou empilhados) e redesenha o relógio. */
  organizar() {
    const { width: largura, height: altura } = this.scale;
    this.placar.setFontSize(Math.min(20, largura / 22));
    this.desenharRelogio();
    if (this.lados.hiragana.length === 0) {
      return;
    }
    const areas = dividirArea(
      MARGEM,
      TOPO_DA_AREA,
      largura - MARGEM * 2,
      altura - TOPO_DA_AREA - MARGEM,
      ESPACO_ENTRE_LADOS,
    );
    this.colunasPorLado = [];
    ['hiragana', 'katakana'].forEach((lado, indice) => {
      this.organizarLado(this.lados[lado], areas[indice], this.titulos[indice]);
    });
  }

  organizarLado(cartas, area, titulo) {
    const alturaUtil = area.altura - ALTURA_DO_TITULO;
    const grade = calcularGrade(cartas.length, area.largura, alturaUtil, ESPACO_ENTRE_CARTAS);
    this.colunasPorLado.push(grade.colunas);
    const larguraTotal = grade.colunas * grade.largura + (grade.colunas - 1) * ESPACO_ENTRE_CARTAS;
    const alturaTotal = grade.linhas * grade.altura + (grade.linhas - 1) * ESPACO_ENTRE_CARTAS;
    const inicioX = area.x + (area.largura - larguraTotal) / 2 + grade.largura / 2;
    const inicioY = area.y + ALTURA_DO_TITULO + (alturaUtil - alturaTotal) / 2 + grade.altura / 2;
    titulo.setPosition(area.x + area.largura / 2, inicioY - grade.altura / 2 - ALTURA_DO_TITULO);

    cartas.forEach((carta, indice) => {
      carta.posicionar(
        inicioX + (indice % grade.colunas) * (grade.largura + ESPACO_ENTRE_CARTAS),
        inicioY + Math.floor(indice / grade.colunas) * (grade.altura + ESPACO_ENTRE_CARTAS),
        grade.largura,
        grade.altura,
      );
    });
  }

  /** Barra do relógio: verde → amarela → vermelha. */
  desenharRelogio() {
    const largura = this.scale.width - MARGEM * 2;
    const fracao = this.tempoTotal ? Math.max(0, this.tempoRestante / this.tempoTotal) : 1;
    let cor = 0x5be49b;
    if (fracao < 0.5) {
      cor = fracao < 0.25 ? 0xff6b6b : 0xffd166;
    }
    this.barraDeTempo.clear();
    this.barraDeTempo.fillStyle(0x1f2b5c, 1);
    this.barraDeTempo.fillRoundedRect(MARGEM, 44, largura, 10, 5);
    this.barraDeTempo.fillStyle(cor, 1);
    this.barraDeTempo.fillRoundedRect(MARGEM, 44, Math.max(10, largura * fracao), 10, 5);
  }

  animarEntrada() {
    if (animacoesReduzidas()) {
      return;
    }
    this.todasAsCartas().forEach((carta, indice) => {
      carta.conteiner.setScale(0);
      this.tweens.add({
        targets: carta.conteiner,
        scale: 1,
        delay: indice * 25,
        duration: 240,
        ease: 'Back.easeOut',
      });
    });
  }

  destruirCartas() {
    this.todasAsCartas().forEach((carta) => carta.conteiner.destroy());
    this.lados = { hiragana: [], katakana: [] };
    this.paresFeitos = [];
  }

  // ---------- Jogadas ----------

  aoClicar(carta) {
    if (this.estado !== 'jogando') {
      return;
    }
    this.foco = this.todasAsCartas().indexOf(carta);
    this.atualizarFoco();
    falar(carta.dados.fala);
    if (carta.encontrada) {
      return; // cartas já ligadas funcionam como botão 🔊
    }
    const anterior = this.selecionada;
    if (!anterior || anterior.dados.lado === carta.dados.lado) {
      // Primeira escolha, ou troca de escolha no mesmo lado.
      anterior?.selecionar(false);
      this.selecionada = anterior === carta ? null : carta;
      this.selecionada?.selecionar(true);
      return;
    }
    this.selecionada = null;
    anterior.selecionar(false);
    const [hiragana, katakana] =
      anterior.dados.lado === 'hiragana' ? [anterior, carta] : [carta, anterior];
    if (hiragana.dados.parId === katakana.dados.parId) {
      this.acertarPar(hiragana, katakana);
    } else {
      this.errarPar(hiragana, katakana);
    }
    this.atualizarPlacar();
  }

  acertarPar(hiragana, katakana) {
    hiragana.marcarEncontrada();
    katakana.marcarEncontrada();
    this.paresFeitos.push([hiragana, katakana]);
    this.combo += 1;
    this.paresTotais += 1;
    const ganho = pontosDoPar(this.combo);
    this.pontos += ganho;
    registrarResposta(katakana.dados.parId, true);
    mostrarAcerto({ texto: `+${ganho}`, ...this.pontoNaTela(katakana.conteiner) });
    if (!animacoesReduzidas()) {
      this.tweens.add({
        targets: [hiragana.conteiner, katakana.conteiner],
        scale: 1.12,
        duration: 130,
        yoyo: true,
      });
    }
    if (this.paresFeitos.length === this.lados.katakana.length) {
      this.concluirNivel();
    }
  }

  /**
   * Par errado: quem não foi reconhecido é o katakana escolhido, então é ele
   * que volta para a caixa 1 do SRS. Mostra a dica e tira segundos do relógio.
   */
  errarPar(hiragana, katakana) {
    const item = katakana.dados.item;
    this.combo = 0;
    this.tempoRestante -= PENALIDADE_S;
    this.errados.set(item.id, item);
    registrarResposta(item.id, false);
    tocarErro();
    const certo = hiragana.dados.item;
    mostrarDica(this.camada, [
      `${certo.par} ↔ ${certo.kana}  (${certo.romaji})`,
      `${item.kana} = ${item.romaji}, par de ${item.par} · 💡 ${item.mnemonico}`,
    ]);
    this.anunciarPenalidade();
    if (!animacoesReduzidas()) {
      [hiragana, katakana].forEach((carta) => {
        this.tweens.add({
          targets: carta.conteiner,
          x: carta.conteiner.x + 8,
          duration: 50,
          yoyo: true,
          repeat: 3,
        });
      });
    }
  }

  // ---------- Teclado ----------

  /** Setas movem o foco (dentro de cada lado), Enter/Espaço seleciona, Esc pausa. */
  aoTeclar(evento) {
    if (evento.target instanceof HTMLElement && evento.target.closest('button, input, a')) {
      return;
    }
    if (evento.key === 'Escape') {
      this.pausar();
      return;
    }
    const cartas = this.todasAsCartas();
    if (this.estado !== 'jogando' || cartas.length === 0) {
      return;
    }
    const porLado = this.lados.hiragana.length;
    const ladoAtual = this.foco < porLado ? 0 : 1;
    const colunas = this.colunasPorLado[ladoAtual];
    const inicioDoLado = ladoAtual * porLado;
    const movimentos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -colunas, ArrowDown: colunas };

    if (evento.key in movimentos) {
      evento.preventDefault();
      this.usandoTeclado = true;
      let destino = this.foco + movimentos[evento.key];
      if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
        destino = Phaser.Math.Clamp(destino, inicioDoLado, inicioDoLado + porLado - 1);
      }
      this.foco = Phaser.Math.Clamp(destino, 0, cartas.length - 1);
      this.atualizarFoco();
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      this.usandoTeclado = true;
      this.aoClicar(cartas[this.foco]);
    }
  }

  atualizarFoco() {
    this.todasAsCartas().forEach((carta, indice) => {
      carta.focar(this.usandoTeclado && indice === this.foco);
    });
  }

  // ---------- Placar e avisos ----------

  atualizarPlacar() {
    const total = this.lados.katakana.length;
    const combo = this.combo > 1 ? `   Combo x${this.combo}` : '';
    this.placar.setText(
      `Nível ${this.nivel}   Pares ${this.paresFeitos?.length ?? 0}/${total}   ${this.pontos} pts${combo}`,
    );
  }

  anunciar(mensagem) {
    const { width: largura, height: altura } = this.scale;
    const texto = this.add
      .text(largura / 2, altura / 2, mensagem, {
        fontFamily: FONTE,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffd166',
        align: 'center',
        stroke: '#0f1630',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: texto,
      alpha: 0,
      delay: 900,
      duration: 400,
      onComplete: () => texto.destroy(),
    });
  }

  /** "−3 s" vermelho perto do relógio. */
  anunciarPenalidade() {
    const texto = this.add
      .text(this.scale.width - MARGEM, 58, `−${PENALIDADE_S} s`, {
        fontFamily: FONTE,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ff6b6b',
      })
      .setOrigin(1, 0)
      .setDepth(20);
    this.tweens.add({
      targets: texto,
      alpha: 0,
      y: animacoesReduzidas() ? texto.y : texto.y + 20,
      duration: 900,
      onComplete: () => texto.destroy(),
    });
  }

  /** Converte a posição de um objeto do jogo para coordenadas da tela. */
  pontoNaTela(objeto) {
    const retangulo = this.game.canvas.getBoundingClientRect();
    return {
      x: retangulo.left + (objeto.x * retangulo.width) / this.scale.width,
      y: retangulo.top + (objeto.y * retangulo.height) / this.scale.height,
    };
  }

  // ---------- Laço do jogo ----------

  update(_tempo, deltaMs) {
    if (this.estado !== 'jogando') {
      return;
    }
    this.tempoRestante -= Math.min(deltaMs, 100) / 1000;
    this.desenharRelogio();
    if (this.tempoRestante <= 0) {
      this.terminar();
    }
  }

  // ---------- Limpeza ----------

  /** Remove o que foi criado fora do Phaser (HTML e listeners). */
  limpar() {
    if (this.limpo) {
      return;
    }
    this.limpo = true;
    this.estado = 'destruida';
    this.scale.off('resize', this.organizar, this);
    this.pararTeclado?.();
    this.camada?.remove();
  }
}
