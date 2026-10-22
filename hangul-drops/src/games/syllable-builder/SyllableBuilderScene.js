// Monte a Sílaba: a sílaba pedida aparece no topo (romanização + 🔊) e o
// jogador junta uma consoante e uma vogal para formá-la (ㄱ + ㅏ = 가).
// O bloco vai se montando ao vivo no centro. Contra o relógio: errar custa
// segundos, e cada nível tem mais peças e mais sílabas.
//
// Estados: 'inicio' → 'jogando' ⇄ 'pausado' → 'entreNiveis' → ... → 'fim'.

import * as Phaser from 'phaser';
import { obterResumo, registrarFimDePartida, registrarResposta } from '../../core/progress.js';
import { animacoesReduzidas, obterConfig } from '../../core/settings.js';
import { falar } from '../../core/speech.js';
import { tocarErro } from '../../core/audio.js';
import { comporSilaba, romanizar } from '../../data/hangul.js';
import { mostrarAcerto } from '../../ui/feedback.js';
import { criarCamadaDoJogo, mostrarDica } from '../gamePanel.js';
import { criarCarta } from '../card.js';
import { calcularGrade } from '../gridLayout.js';
import { ouvirTeclado } from '../keyboard.js';
import { PENALIDADE_S, bonusDeTempo, montarNivel, pontosDoAcerto } from './builderLogic.js';
import { criarPergunta, painelFim, painelInicio, painelPausa } from './panels.js';

const ID_DO_JOGO = 'syllable-builder';
const FONTE = '"Noto Sans KR", system-ui, sans-serif';
const MARGEM = 16;
const TOPO_DO_BLOCO = 124; // abaixo do placar, do relógio e da pergunta
const ALTURA_DO_TITULO = 28;
const ESPACO_ENTRE_PECAS = 10;
const COR_BLOCO = 0xfffaf0;
const COR_CERTO = 0x5be49b;
const COR_ERRADO = 0xff6b6b;

export default class SyllableBuilderScene extends Phaser.Scene {
  constructor() {
    super({ key: ID_DO_JOGO });
  }

  /** Recebe { conteiner, aoSair } do PhaserHost. */
  init(dados) {
    this.dados = dados;
    this.painel = null;
    this.limpo = false;
    this.lados = { consoante: [], vogal: [] };
    this.reiniciarPartida();
  }

  reiniciarPartida() {
    this.nivel = 1;
    this.pontos = 0;
    this.silabasTotais = 0;
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
    this.fundoDoBloco = this.add.graphics();
    this.textoDoBloco = this.add
      .text(0, 0, '', { fontFamily: FONTE, fontStyle: 'bold', color: '#141a33' })
      .setOrigin(0.5);
    this.formula = this.add
      .text(0, 0, '', { fontFamily: FONTE, fontSize: '20px', fontStyle: 'bold', color: '#c3cbef' })
      .setOrigin(0.5, 0);
    this.titulos = ['Consoantes 자음', 'Vogais 모음'].map((texto) =>
      this.add
        .text(0, 0, texto, {
          fontFamily: FONTE,
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ff8fb1',
        })
        .setOrigin(0.5, 0)
        .setVisible(false),
    );
    this.camada = criarCamadaDoJogo(this.dados.conteiner);
    this.pergunta = criarPergunta(this.camada);

    this.scale.on('resize', this.organizar, this);
    this.pararTeclado = ouvirTeclado((evento) => this.aoTeclar(evento));
    this.events.once('shutdown', this.limpar, this);
    this.events.once('destroy', this.limpar, this);

    this.organizar();
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

  /** Cria as peças do nível, reinicia o relógio e pede a primeira sílaba. */
  comecarNivel() {
    this.destruirPecas();
    const nivel = montarNivel(this.nivel);
    const criar = (dados) => {
      const carta = criarCarta(this, dados, (alvo) => this.aoClicar(alvo));
      carta.virar(true, false);
      return carta;
    };
    this.lados = { consoante: nivel.consoantes.map(criar), vogal: nivel.vogais.map(criar) };
    this.alvos = nivel.alvos;
    this.indiceDoAlvo = 0;
    this.combo = 0;
    this.foco = 0;
    this.usandoTeclado = false;
    this.tempoTotal = nivel.tempoS;
    this.tempoRestante = nivel.tempoS;
    this.titulos.forEach((titulo) => titulo.setVisible(true));
    this.organizar();
    this.animarEntrada();
    this.estado = 'jogando';
    this.pedirProximaSilaba();
  }

  /** Mostra (e fala) a próxima sílaba a montar. */
  pedirProximaSilaba() {
    this.escolhidas = { consoante: null, vogal: null };
    this.errouEsteAlvo = false;
    this.todasAsPecas().forEach((peca) => peca.selecionar(false));
    this.desenharBloco();
    this.pergunta.mostrar(this.alvoAtual(), obterConfig().mostrarRomanizacao);
    falar(this.alvoAtual().fala);
    this.atualizarPlacar();
  }

  alvoAtual() {
    return this.alvos[this.indiceDoAlvo];
  }

  /** Todas as sílabas do nível montadas: bônus de tempo e próximo nível. */
  concluirNivel() {
    this.estado = 'entreNiveis';
    this.pergunta.esconder();
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
    this.pergunta.esconder();
    this.todasAsPecas().forEach((peca) => peca.conteiner.setVisible(false));
    this.fundoDoBloco.clear();
    this.textoDoBloco.setText('');
    this.formula.setText('');
    const { novoRecorde, recordeAnterior } = registrarFimDePartida(ID_DO_JOGO, this.pontos);
    this.painel = painelFim(this.camada, {
      pontos: this.pontos,
      nivel: this.nivel,
      silabas: this.silabasTotais,
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
    this.pergunta.esconder();
    this.todasAsPecas().forEach((peca) => peca.conteiner.setVisible(false));
    this.painel = painelPausa(this.camada, {
      aoContinuar: () => this.continuar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  continuar() {
    this.fecharPainel();
    this.todasAsPecas().forEach((peca) => peca.conteiner.setVisible(true));
    this.pergunta.mostrar(this.alvoAtual(), obterConfig().mostrarRomanizacao);
    this.estado = 'jogando';
  }

  /** Chamado pelo PhaserHost quando um modal (ex.: configurações) abre. */
  pausarExterno() {
    this.pausar();
  }

  /** O jogador volta pelo botão "Continuar" do painel de pausa. */
  continuarExterno() {}

  // ---------- Layout ----------

  todasAsPecas() {
    return [...this.lados.consoante, ...this.lados.vogal];
  }

  /** Bloco da sílaba no topo; consoantes e vogais divididas no resto da tela. */
  organizar() {
    const { width: largura, height: altura } = this.scale;
    this.placar.setFontSize(Math.min(20, largura / 22));
    this.desenharRelogio();
    this.tamanhoDoBloco = Math.min(130, altura * 0.17);
    this.blocoY = TOPO_DO_BLOCO + this.tamanhoDoBloco / 2;
    this.desenharBloco();
    if (this.lados.consoante.length === 0) {
      return;
    }
    const topo = this.blocoY + this.tamanhoDoBloco / 2 + 40;
    const alturaDasAreas = (altura - topo - MARGEM) / 2;
    const larguraUtil = largura - MARGEM * 2;
    this.colunasPorLado = [];
    [
      [this.lados.consoante, this.titulos[0], topo],
      [this.lados.vogal, this.titulos[1], topo + alturaDasAreas],
    ].forEach(([pecas, titulo, y]) => {
      this.organizarLado(
        pecas,
        { x: MARGEM, y, largura: larguraUtil, altura: alturaDasAreas },
        titulo,
      );
    });
  }

  organizarLado(pecas, area, titulo) {
    const alturaUtil = area.altura - ALTURA_DO_TITULO;
    const grade = calcularGrade(pecas.length, area.largura, alturaUtil, ESPACO_ENTRE_PECAS);
    const largura = Math.min(grade.largura, 96);
    const alturaDaPeca = Math.min(grade.altura, 110);
    this.colunasPorLado.push(grade.colunas);
    const larguraTotal = grade.colunas * largura + (grade.colunas - 1) * ESPACO_ENTRE_PECAS;
    const inicioX = area.x + (area.largura - larguraTotal) / 2 + largura / 2;
    const inicioY = area.y + ALTURA_DO_TITULO + alturaDaPeca / 2;
    titulo.setPosition(area.x + area.largura / 2, area.y);
    pecas.forEach((peca, indice) => {
      peca.posicionar(
        inicioX + (indice % grade.colunas) * (largura + ESPACO_ENTRE_PECAS),
        inicioY + Math.floor(indice / grade.colunas) * (alturaDaPeca + ESPACO_ENTRE_PECAS),
        largura,
        alturaDaPeca,
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

  /** O bloco do centro mostra o que já foi escolhido: ㄱ, ㅏ ou a sílaba 가. */
  desenharBloco(cor = COR_BLOCO) {
    const tamanho = this.tamanhoDoBloco;
    const x = this.scale.width / 2;
    this.fundoDoBloco.clear();
    this.fundoDoBloco.fillStyle(cor, 1);
    this.fundoDoBloco.fillRoundedRect(
      x - tamanho / 2,
      this.blocoY - tamanho / 2,
      tamanho,
      tamanho,
      16,
    );
    const { consoante, vogal } = this.escolhidas ?? {};
    const c = consoante?.dados.texto;
    const v = vogal?.dados.texto;
    const silaba = c && v ? comporSilaba(c, v) : (c ?? v ?? '?');
    this.textoDoBloco
      .setText(silaba)
      .setFontSize(tamanho * 0.62)
      .setPosition(x, this.blocoY);
    this.formula
      .setText(`${c ?? '◻'} + ${v ?? '◻'}${c && v ? ` = ${silaba}` : ''}`)
      .setPosition(x, this.blocoY + tamanho / 2 + 8);
  }

  animarEntrada() {
    if (animacoesReduzidas()) {
      return;
    }
    this.todasAsPecas().forEach((peca, indice) => {
      peca.conteiner.setScale(0);
      this.tweens.add({
        targets: peca.conteiner,
        scale: 1,
        delay: indice * 30,
        duration: 240,
        ease: 'Back.easeOut',
      });
    });
  }

  destruirPecas() {
    this.todasAsPecas().forEach((peca) => peca.conteiner.destroy());
    this.lados = { consoante: [], vogal: [] };
  }

  // ---------- Jogadas ----------

  /** Escolhe a peça do seu lado (trocando a anterior) e confere quando houver as duas. */
  aoClicar(peca) {
    if (this.estado !== 'jogando') {
      return;
    }
    this.foco = this.todasAsPecas().indexOf(peca);
    this.atualizarFoco();
    const lado = peca.dados.lado;
    this.escolhidas[lado]?.selecionar(false);
    this.escolhidas[lado] = this.escolhidas[lado] === peca ? null : peca;
    this.escolhidas[lado]?.selecionar(true);
    this.desenharBloco();
    const { consoante, vogal } = this.escolhidas;
    if (consoante && vogal) {
      this.conferir(comporSilaba(consoante.dados.texto, vogal.dados.texto));
    }
  }

  conferir(montada) {
    falar(montada); // ouve o que montou, certo ou errado
    if (montada === this.alvoAtual().hangul) {
      this.acertar();
    } else {
      this.errar(montada);
    }
  }

  acertar() {
    const alvo = this.alvoAtual();
    this.combo += 1;
    this.silabasTotais += 1;
    const ganho = pontosDoAcerto(this.combo);
    this.pontos += ganho;
    // Se já errou esta sílaba, o erro foi registrado no SRS; não conta acerto.
    if (!this.errouEsteAlvo) {
      registrarResposta(alvo.id, true);
    }
    this.desenharBloco(COR_CERTO);
    mostrarAcerto({ texto: `+${ganho}`, ...this.pontoNaTela(this.scale.width / 2, this.blocoY) });
    this.estado = 'conferindo';
    this.time.delayedCall(550, () => {
      if (this.estado !== 'conferindo') {
        return;
      }
      this.indiceDoAlvo += 1;
      if (this.indiceDoAlvo >= this.alvos.length) {
        this.concluirNivel();
      } else {
        this.estado = 'jogando';
        this.pedirProximaSilaba();
      }
    });
  }

  /** Montou outra sílaba: mostra o que montou e como montar a certa. */
  errar(montada) {
    const alvo = this.alvoAtual();
    this.combo = 0;
    this.tempoRestante -= PENALIDADE_S;
    if (!this.errouEsteAlvo) {
      this.errouEsteAlvo = true;
      this.errados.set(alvo.id, alvo);
      registrarResposta(alvo.id, false);
    }
    tocarErro();
    this.desenharBloco(COR_ERRADO);
    const [consoante, vogal] = alvo.partes;
    mostrarDica(this.camada, [
      `Você montou ${montada} (${romanizar(montada)}).`,
      `Para "${alvo.romanizacao}": ${consoante} + ${vogal} = ${alvo.hangul}`,
    ]);
    this.anunciarPenalidade();
    this.time.delayedCall(450, () => {
      if (this.estado !== 'jogando') {
        return;
      }
      Object.values(this.escolhidas).forEach((peca) => peca?.selecionar(false));
      this.escolhidas = { consoante: null, vogal: null };
      this.desenharBloco();
    });
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
    const pecas = this.todasAsPecas();
    if (this.estado !== 'jogando' || pecas.length === 0) {
      return;
    }
    const totalDeConsoantes = this.lados.consoante.length;
    const ladoAtual = this.foco < totalDeConsoantes ? 0 : 1;
    const colunas = this.colunasPorLado[ladoAtual];
    const inicioDoLado = ladoAtual === 0 ? 0 : totalDeConsoantes;
    const fimDoLado = ladoAtual === 0 ? totalDeConsoantes - 1 : pecas.length - 1;
    const movimentos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -colunas, ArrowDown: colunas };

    if (evento.key in movimentos) {
      evento.preventDefault();
      this.usandoTeclado = true;
      let destino = this.foco + movimentos[evento.key];
      if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
        // Para cima/baixo atravessa para o outro lado quando sai da grade.
        if (destino < inicioDoLado || destino > fimDoLado) {
          destino = evento.key === 'ArrowDown' ? totalDeConsoantes : 0;
        }
      }
      this.foco = Phaser.Math.Clamp(destino, 0, pecas.length - 1);
      this.atualizarFoco();
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      this.usandoTeclado = true;
      this.aoClicar(pecas[this.foco]);
    }
  }

  atualizarFoco() {
    this.todasAsPecas().forEach((peca, indice) => {
      peca.focar(this.usandoTeclado && indice === this.foco);
    });
  }

  // ---------- Placar e avisos ----------

  atualizarPlacar() {
    const total = this.alvos?.length ?? 0;
    const feitas = Math.min(this.indiceDoAlvo ?? 0, total);
    const combo = this.combo > 1 ? `   Combo x${this.combo}` : '';
    this.placar.setText(
      `Nível ${this.nivel}   Sílabas ${feitas}/${total}   ${this.pontos} pts${combo}`,
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

  /** Converte coordenadas do jogo para a tela (para o feedback em HTML). */
  pontoNaTela(x, y) {
    const retangulo = this.game.canvas.getBoundingClientRect();
    return {
      x: retangulo.left + (x * retangulo.width) / this.scale.width,
      y: retangulo.top + (y * retangulo.height) / this.scale.height,
    };
  }

  // ---------- Laço do jogo ----------

  update(_tempo, deltaMs) {
    if (this.estado !== 'jogando' && this.estado !== 'conferindo') {
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
