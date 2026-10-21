// Caça-Palavras: palavras do vocabulário escondidas numa grade de kana.
// O jogador arrasta (ou usa o teclado) do primeiro ao último kana de cada
// palavra. São 5 níveis com grades maiores, mais palavras e diagonais.
//
// Estados: 'inicio' → 'jogando' ⇄ 'pausado' → 'entreNiveis' → ... → 'fim'.

import * as Phaser from 'phaser';
import { obterResumo, registrarFimDePartida, registrarResposta } from '../../core/progress.js';
import { animacoesReduzidas, obterConfig } from '../../core/settings.js';
import { falar } from '../../core/speech.js';
import { tocarErro } from '../../core/audio.js';
import { lerEmRomaji } from '../../data/kana.js';
import { mostrarAcerto } from '../../ui/feedback.js';
import { criarCamadaDoJogo, mostrarDica } from '../gamePanel.js';
import { ouvirTeclado } from '../keyboard.js';
import {
  CUSTO_DA_DICA,
  NIVEIS,
  alinharFim,
  bonusDoNivel,
  celulasEntre,
  conferirSelecao,
  gerarNivel,
  pontosDaPalavra,
  textoDasCelulas,
} from './wordSearchLogic.js';
import { criarListaDePalavras } from './wordList.js';
import { painelFim, painelInicio, painelNivelCompleto, painelPausa } from './panels.js';

const ID_DO_JOGO = 'word-search';
const FONTE = '"Noto Sans JP", system-ui, sans-serif';
const MARGEM = 16;
const TOPO_DA_GRADE = 48; // abaixo do placar
const CORES_ENCONTRADAS = [0xff8fb1, 0x8fd3ff, 0x5be49b, 0xffd166, 0xc3a6ff, 0xffa36b, 0x7be0d6];
const COR_SELECAO = 0xffd166;
const COR_ERRO = 0xff6b6b;

export default class WordSearchScene extends Phaser.Scene {
  constructor() {
    super({ key: ID_DO_JOGO });
  }

  /** Recebe { conteiner, aoSair } do PhaserHost. */
  init(dados) {
    this.dados = dados;
    this.painel = null;
    this.limpo = false;
    this.textos = [];
    this.nivelAtual = null;
    this.reiniciarPartida();
  }

  reiniciarPartida() {
    this.indiceDoNivel = 0;
    this.pontos = 0;
    this.palavrasTotais = 0;
    this.revisar = new Map();
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
    this.tabuleiro = this.add.container(0, 0);
    this.fundo = this.add.graphics();
    this.destaques = this.add.graphics();
    this.selecao = this.add.graphics();
    this.cursor = this.add.graphics();
    this.camada = criarCamadaDoJogo(this.dados.conteiner);
    this.lista = criarListaDePalavras(this.camada, {
      aoDica: () => this.usarDica(),
      aoPausar: () => this.pausar(),
    });
    this.lista.mostrar(false);

    this.scale.on('resize', this.organizar, this);
    this.input.on('pointerdown', this.aoPressionar, this);
    this.input.on('pointermove', this.aoMover, this);
    this.input.on('pointerup', this.aoSoltar, this);
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
    this.reiniciarPartida();
    this.comecarNivel();
  }

  /** Gera a grade, cria os textos dos kana e preenche a lista. */
  comecarNivel() {
    this.fecharPainel();
    // Os gráficos são reaproveitados; só os textos do nível anterior são destruídos.
    this.tabuleiro.removeAll(false);
    this.textos.flat().forEach((texto) => texto.destroy());
    this.nivelAtual = gerarNivel(this.indiceDoNivel);
    this.encontradas = new Set();
    this.dicasUsadas = new Set();
    this.marcadas = []; // [{ celulas, cor }]
    this.arraste = null;
    this.ancora = null;
    this.celulaComDica = null;
    this.posCursor = { l: 0, c: 0 };
    this.usandoTeclado = false;

    this.textos = this.nivelAtual.grade.map((linha) =>
      linha.map((kana) =>
        this.add
          .text(0, 0, kana, { fontFamily: FONTE, fontStyle: 'bold', color: '#141a33' })
          .setOrigin(0.5),
      ),
    );
    this.tabuleiro.add([
      this.fundo,
      this.destaques,
      this.selecao,
      ...this.textos.flat(),
      this.cursor,
    ]);
    this.lista.preencher(
      this.nivelAtual.palavras.map(({ palavra }) => palavra),
      obterConfig().mostrarRomaji,
    );
    this.lista.mostrar(true);
    this.tabuleiro.setVisible(true);
    this.estado = 'jogando';
    this.organizar();
    this.animarEntrada();
    this.atualizarPlacar();
  }

  concluirNivel() {
    this.estado = 'entreNiveis';
    const bonus = bonusDoNivel(this.dicasUsadas.size > 0);
    this.pontos += bonus;
    this.atualizarPlacar();
    if (this.indiceDoNivel === NIVEIS.length - 1) {
      this.time.delayedCall(700, () => this.terminar());
      return;
    }
    this.time.delayedCall(700, () => {
      this.painel = painelNivelCompleto(this.camada, {
        numero: this.indiceDoNivel + 1,
        pontos: this.pontos,
        bonus,
        aoProximo: () => {
          this.indiceDoNivel += 1;
          this.comecarNivel();
        },
        aoSair: () => this.dados.aoSair(),
      });
    });
  }

  terminar() {
    this.estado = 'fim';
    this.tabuleiro.setVisible(false);
    this.lista.mostrar(false);
    const { novoRecorde, recordeAnterior } = registrarFimDePartida(ID_DO_JOGO, this.pontos);
    this.painel = painelFim(this.camada, {
      pontos: this.pontos,
      palavras: this.palavrasTotais,
      recorde: Math.max(recordeAnterior, this.pontos),
      novoRecorde,
      revisar: [...this.revisar.values()],
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
    this.arraste = null;
    this.tabuleiro.setVisible(false);
    this.lista.mostrar(false);
    this.painel = painelPausa(this.camada, {
      aoContinuar: () => this.continuar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  continuar() {
    this.fecharPainel();
    this.tabuleiro.setVisible(true);
    this.lista.mostrar(true);
    this.estado = 'jogando';
  }

  /** Chamado pelo PhaserHost quando um modal (ex.: configurações) abre. */
  pausarExterno() {
    this.pausar();
  }

  /** O jogador volta pelo botão "Continuar" do painel de pausa. */
  continuarExterno() {}

  // ---------- Layout e desenho ----------

  /** Área livre para a grade: ao lado da lista (tela larga) ou acima dela (celular). */
  areaDaGrade() {
    const { width: largura, height: altura } = this.scale;
    const canvas = this.game.canvas.getBoundingClientRect();
    const lista = this.lista.elemento.getBoundingClientRect();
    const listaAoLado = lista.left - canvas.left > largura / 2;
    return listaAoLado
      ? {
          x: MARGEM,
          y: TOPO_DA_GRADE,
          largura: lista.left - canvas.left - MARGEM * 2,
          altura: altura - TOPO_DA_GRADE - MARGEM,
        }
      : {
          x: MARGEM,
          y: TOPO_DA_GRADE,
          largura: largura - MARGEM * 2,
          altura: lista.top - canvas.top - TOPO_DA_GRADE - MARGEM,
        };
  }

  organizar() {
    this.placar.setFontSize(Math.min(20, this.scale.width / 22));
    if (!this.nivelAtual) {
      return;
    }
    const { tamanho } = this.nivelAtual;
    const area = this.areaDaGrade();
    this.celula = Math.max(20, Math.floor(Math.min(area.largura, area.altura) / tamanho));
    this.origemX = area.x + (area.largura - this.celula * tamanho) / 2;
    this.origemY = area.y + Math.max(0, (area.altura - this.celula * tamanho) / 2);

    this.fundo.clear();
    this.textos.forEach((linha, l) =>
      linha.forEach((texto, c) => {
        const { x, y } = this.centroDaCelula({ l, c });
        this.fundo.fillStyle(0xfffaf0, 1);
        this.fundo.fillRoundedRect(
          x - this.celula / 2 + 2,
          y - this.celula / 2 + 2,
          this.celula - 4,
          this.celula - 4,
          6,
        );
        texto.setPosition(x, y).setFontSize(this.celula * 0.58);
      }),
    );
    this.desenharDestaques();
    this.desenharSelecao();
    this.desenharCursor();
  }

  centroDaCelula({ l, c }) {
    return {
      x: this.origemX + c * this.celula + this.celula / 2,
      y: this.origemY + l * this.celula + this.celula / 2,
    };
  }

  /** Célula sob um ponto do canvas (ou null fora da grade). */
  celulaEm(x, y) {
    const c = Math.floor((x - this.origemX) / this.celula);
    const l = Math.floor((y - this.origemY) / this.celula);
    const { tamanho } = this.nivelAtual;
    return l >= 0 && l < tamanho && c >= 0 && c < tamanho ? { l, c } : null;
  }

  /** Mantém a célula dentro da grade. */
  limitarCelula({ l, c }) {
    const maximo = this.nivelAtual.tamanho - 1;
    return { l: Phaser.Math.Clamp(l, 0, maximo), c: Phaser.Math.Clamp(c, 0, maximo) };
  }

  /** Alinha o fim numa das 8 direções e encurta até caber na grade. */
  fimAlinhado(inicio, alvo) {
    let fim = alinharFim(inicio, alvo);
    const dentro = ({ l, c }) =>
      l >= 0 && c >= 0 && l < this.nivelAtual.tamanho && c < this.nivelAtual.tamanho;
    while (!dentro(fim)) {
      fim = { l: fim.l - Math.sign(fim.l - inicio.l), c: fim.c - Math.sign(fim.c - inicio.c) };
    }
    return fim;
  }

  /** Desenha uma "cápsula" sobre as células (linha grossa com pontas redondas). */
  desenharCapsula(grafico, celulas, cor, alfa) {
    const inicio = this.centroDaCelula(celulas[0]);
    const fim = this.centroDaCelula(celulas[celulas.length - 1]);
    const espessura = this.celula * 0.72;
    grafico.lineStyle(espessura, cor, alfa);
    grafico.lineBetween(inicio.x, inicio.y, fim.x, fim.y);
    grafico.fillStyle(cor, alfa);
    grafico.fillCircle(inicio.x, inicio.y, espessura / 2);
    grafico.fillCircle(fim.x, fim.y, espessura / 2);
  }

  desenharDestaques() {
    this.destaques.clear();
    this.marcadas.forEach(({ celulas, cor }) =>
      this.desenharCapsula(this.destaques, celulas, cor, 0.55),
    );
    if (this.celulaComDica) {
      const { x, y } = this.centroDaCelula(this.celulaComDica);
      this.destaques.lineStyle(4, COR_ERRO, 1);
      this.destaques.strokeCircle(x, y, this.celula * 0.45);
    }
  }

  /** Seleção em andamento (arraste ou âncora do teclado). */
  desenharSelecao(cor = COR_SELECAO) {
    this.selecao.clear();
    const inicio = this.arraste?.inicio ?? this.ancora;
    if (!inicio) {
      return;
    }
    const fim = this.arraste?.fim ?? this.fimAlinhado(this.ancora, this.posCursor);
    this.desenharCapsula(this.selecao, celulasEntre(inicio, fim), cor, 0.5);
  }

  desenharCursor() {
    this.cursor.clear();
    if (!this.usandoTeclado || this.estado !== 'jogando') {
      return;
    }
    const { x, y } = this.centroDaCelula(this.posCursor);
    this.cursor.lineStyle(4, 0xffd166, 1);
    this.cursor.strokeRoundedRect(
      x - this.celula / 2,
      y - this.celula / 2,
      this.celula,
      this.celula,
      8,
    );
  }

  animarEntrada() {
    if (animacoesReduzidas()) {
      return;
    }
    this.textos.flat().forEach((texto, indice) => {
      texto.setScale(0);
      this.tweens.add({ targets: texto, scale: 1, delay: indice * 6, duration: 200 });
    });
  }

  // ---------- Ponteiro (mouse e toque) ----------

  aoPressionar(ponteiro) {
    if (this.estado !== 'jogando') {
      return;
    }
    const celula = this.celulaEm(ponteiro.x, ponteiro.y);
    if (celula) {
      this.usandoTeclado = false;
      this.ancora = null;
      this.arraste = { inicio: celula, fim: celula };
      this.desenharSelecao();
      this.desenharCursor();
    }
  }

  aoMover(ponteiro) {
    if (!this.arraste || !ponteiro.isDown) {
      return;
    }
    const alvo = this.limitarCelula({
      l: Math.floor((ponteiro.y - this.origemY) / this.celula),
      c: Math.floor((ponteiro.x - this.origemX) / this.celula),
    });
    this.arraste.fim = this.fimAlinhado(this.arraste.inicio, alvo);
    this.desenharSelecao();
  }

  aoSoltar() {
    if (!this.arraste) {
      return;
    }
    const { inicio, fim } = this.arraste;
    this.arraste = null;
    this.finalizarSelecao(celulasEntre(inicio, fim));
  }

  // ---------- Teclado ----------

  /** Setas movem o cursor; Enter marca início/fim; Esc cancela ou pausa. */
  aoTeclar(evento) {
    if (evento.target instanceof HTMLElement && evento.target.closest('button, input, a')) {
      return;
    }
    if (evento.key === 'Escape') {
      if (this.ancora) {
        this.ancora = null;
        this.desenharSelecao();
      } else {
        this.pausar();
      }
      return;
    }
    if (this.estado !== 'jogando') {
      return;
    }
    const movimentos = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };
    if (evento.key in movimentos) {
      evento.preventDefault();
      const [dl, dc] = movimentos[evento.key];
      this.usandoTeclado = true;
      this.posCursor = this.limitarCelula({ l: this.posCursor.l + dl, c: this.posCursor.c + dc });
      this.desenharCursor();
      this.desenharSelecao();
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      this.usandoTeclado = true;
      this.marcarComTeclado();
    }
  }

  marcarComTeclado() {
    if (!this.ancora) {
      this.ancora = { ...this.posCursor };
      this.desenharSelecao();
      this.desenharCursor();
      return;
    }
    const celulas = celulasEntre(this.ancora, this.fimAlinhado(this.ancora, this.posCursor));
    this.ancora = null;
    this.finalizarSelecao(celulas);
  }

  // ---------- Conferência ----------

  finalizarSelecao(celulas) {
    if (!celulas || celulas.length < 2) {
      this.desenharSelecao();
      return;
    }
    const achada = conferirSelecao(
      this.nivelAtual.grade,
      celulas,
      this.nivelAtual.palavras,
      this.encontradas,
    );
    if (achada) {
      this.encontrar(achada.palavra, celulas);
    } else {
      this.errarSelecao(celulas);
    }
  }

  encontrar(palavra, celulas) {
    this.encontradas.add(palavra.id);
    this.marcadas.push({
      celulas,
      cor: CORES_ENCONTRADAS[this.marcadas.length % CORES_ENCONTRADAS.length],
    });
    this.celulaComDica = null;
    this.palavrasTotais += 1;
    // Com dica, o erro já foi registrado no SRS; sem dica, conta como acerto.
    if (!this.dicasUsadas.has(palavra.id)) {
      registrarResposta(palavra.id, true);
    }
    const ganho = pontosDaPalavra(palavra);
    this.pontos += ganho;
    falar(palavra.kana);
    const meio = this.centroDaCelula(celulas[Math.floor(celulas.length / 2)]);
    mostrarAcerto({ texto: `+${ganho}`, ...this.pontoNaTela(meio.x, meio.y) });
    this.lista.marcarEncontrada(palavra);
    this.desenharSelecao();
    this.desenharDestaques();
    this.atualizarPlacar();
    if (this.encontradas.size === this.nivelAtual.palavras.length) {
      this.concluirNivel();
    }
  }

  /** Seleção que não é palavra da lista: mostra como se lê o que foi marcado. */
  errarSelecao(celulas) {
    tocarErro();
    const texto = textoDasCelulas(this.nivelAtual.grade, celulas);
    mostrarDica(this.camada, [
      `${texto} = ${lerEmRomaji(texto)}`,
      'Essa sequência não é uma das palavras da lista. Confira as pistas!',
    ]);
    this.desenharCapsula(this.selecao, celulas, COR_ERRO, 0.5);
    this.time.delayedCall(450, () => this.desenharSelecao());
  }

  /** Mostra onde começa uma palavra ainda não encontrada (custa pontos). */
  usarDica() {
    if (this.estado !== 'jogando') {
      return;
    }
    const faltando = this.nivelAtual.palavras.filter(
      ({ palavra }) => !this.encontradas.has(palavra.id),
    );
    const escolha =
      faltando.find(({ palavra }) => !this.dicasUsadas.has(palavra.id)) ?? faltando[0];
    if (!escolha) {
      return;
    }
    const { palavra, celulas } = escolha;
    if (!this.dicasUsadas.has(palavra.id)) {
      this.dicasUsadas.add(palavra.id);
      this.revisar.set(palavra.id, palavra);
      registrarResposta(palavra.id, false);
      this.pontos = Math.max(0, this.pontos - CUSTO_DA_DICA);
    }
    this.celulaComDica = celulas[0];
    const primeiro = Array.from(palavra.kana)[0];
    mostrarDica(this.camada, [
      `${palavra.emoji} ${palavra.pt}: começa com ${primeiro} (${lerEmRomaji(primeiro)}) — veja o círculo vermelho.`,
    ]);
    falar(palavra.kana);
    this.desenharDestaques();
    this.atualizarPlacar();
  }

  // ---------- Placar ----------

  atualizarPlacar() {
    const total = this.nivelAtual?.palavras.length ?? 0;
    this.placar.setText(
      `Nível ${this.indiceDoNivel + 1}/${NIVEIS.length}   Palavras ${this.encontradas?.size ?? 0}/${total}   ${this.pontos} pts`,
    );
  }

  /** Converte coordenadas do jogo para a tela (para o feedback em HTML). */
  pontoNaTela(x, y) {
    const retangulo = this.game.canvas.getBoundingClientRect();
    return {
      x: retangulo.left + (x * retangulo.width) / this.scale.width,
      y: retangulo.top + (y * retangulo.height) / this.scale.height,
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
    this.scale.off('resize', this.organizar, this);
    this.input.off('pointerdown', this.aoPressionar, this);
    this.input.off('pointermove', this.aoMover, this);
    this.input.off('pointerup', this.aoSoltar, this);
    this.pararTeclado?.();
    this.lista?.destroy();
    this.camada?.remove();
  }
}
