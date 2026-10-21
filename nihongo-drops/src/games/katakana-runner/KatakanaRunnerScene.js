// Katakana Runner: o corredor troca de pista para estar no bloco com o
// katakana pedido quando a onda de blocos chegar. A velocidade aumenta aos
// poucos e o SRS decide quais katakana aparecem mais.
//
// Estados: 'inicio' → 'jogando' ⇄ 'pausado' / 'erro' → 'fim'.

import * as Phaser from 'phaser';
import { obterResumo, registrarFimDePartida, registrarResposta } from '../../core/progress.js';
import { animacoesReduzidas, obterConfig } from '../../core/settings.js';
import { falar } from '../../core/speech.js';
import { limitar } from '../../core/utils.js';
import { mostrarAcerto, mostrarErro } from '../../ui/feedback.js';
import { criarCamadaDoJogo } from '../gamePanel.js';
import { ouvirTeclado } from '../keyboard.js';
import {
  CONFIG,
  montarOnda,
  nivelDaPartida,
  pontosDoAcerto,
  poolDeKatakana,
  tempoDeTravessia,
} from './runnerLogic.js';
import { criarCorredor } from './runner.js';
import { criarOnda } from './wave.js';
import { criarCenario } from './scenery.js';
import { criarControles } from './controls.js';
import { painelFim, painelInicio, painelPausa } from './panels.js';

const ID_DO_JOGO = 'katakana-runner';
const FONTE = '"Noto Sans JP", system-ui, sans-serif';
const TOPO_DAS_PISTAS = 120; // abaixo do placar e da pergunta
const MARGEM_DO_CHAO = 8;
const POSICAO_DO_CORREDOR = 0.22; // fração da largura

export default class KatakanaRunnerScene extends Phaser.Scene {
  constructor() {
    super({ key: ID_DO_JOGO });
  }

  /** Recebe { conteiner, aoSair } do PhaserHost. */
  init(dados) {
    this.dados = dados;
    this.painel = null;
    this.limpo = false;
    this.onda = null;
    this.reiniciarPartida();
  }

  reiniciarPartida() {
    this.vidas = CONFIG.vidas;
    this.pontos = 0;
    this.acertos = 0;
    this.combo = 0;
    this.faixa = 1; // começa na pista do meio
    this.ultimoAlvoId = null;
    this.esperaAteProximaOnda = 0;
    this.errados = new Map();
    this.estado = 'inicio';
  }

  create() {
    this.cenario = criarCenario(this);
    this.corredor = criarCorredor(this);
    this.textoVidas = this.criarTexto(16, 14, 0);
    this.textoPlacar = this.criarTexto(0, 14, 1);
    this.camada = criarCamadaDoJogo(this.dados.conteiner);
    this.controles = criarControles(this.camada, {
      aoSubir: () => this.trocarDePista(1),
      aoDescer: () => this.trocarDePista(-1),
      aoPausar: () => this.pausar(),
    });

    this.scale.on('resize', this.aoRedimensionar, this);
    this.pararTeclado = ouvirTeclado((evento) => this.aoTeclar(evento));
    this.input.on('pointerdown', this.aoTocar, this);
    this.events.once('shutdown', this.limpar, this);
    this.events.once('destroy', this.limpar, this);

    this.aoRedimensionar();
    this.atualizarPlacar();
    this.mostrarInicio();
  }

  criarTexto(x, y, origemX) {
    return this.add
      .text(x, y, '', { fontFamily: FONTE, fontSize: '22px', fontStyle: 'bold', color: '#f4f6ff' })
      .setOrigin(origemX, 0)
      .setDepth(10);
  }

  // ---------- Layout ----------

  /** y do centro de cada pista (0 = baixa, 2 = alta). */
  posicaoDaFaixa(faixa) {
    return this.chaoY - this.espacoEntreFaixas * (faixa + 0.5);
  }

  aoRedimensionar() {
    const { width: largura, height: altura } = this.scale;
    const topoDosControles =
      this.controles.barra.getBoundingClientRect().top -
      this.game.canvas.getBoundingClientRect().top;
    this.chaoY = limitar(topoDosControles - MARGEM_DO_CHAO, altura * 0.5, altura);
    this.espacoEntreFaixas = (this.chaoY - TOPO_DAS_PISTAS) / CONFIG.faixas;
    this.tamanhoBloco = limitar(Math.min(this.espacoEntreFaixas * 0.72, largura * 0.17), 40, 92);
    this.corredorX = largura * POSICAO_DO_CORREDOR;

    const faixasY = [0, 1, 2].map((faixa) => this.posicaoDaFaixa(faixa));
    this.cenario.redesenhar(largura, altura, this.chaoY, faixasY, this.tamanhoBloco);
    this.corredor.posicionar(
      this.corredorX,
      this.posicaoDaFaixa(this.faixa),
      this.tamanhoBloco * 0.9,
    );
    this.onda?.posicionar(this.tamanhoBloco);
    this.textoPlacar.setX(largura - 16);
  }

  /** Converte coordenadas do jogo para a tela (para o feedback em HTML). */
  pontoNaTela(x, y) {
    const retangulo = this.game.canvas.getBoundingClientRect();
    return {
      x: retangulo.left + (x * retangulo.width) / this.scale.width,
      y: retangulo.top + (y * retangulo.height) / this.scale.height,
    };
  }

  // ---------- Painéis ----------

  fecharPainel() {
    this.painel?.fechar();
    this.painel = null;
  }

  mostrarInicio() {
    this.controles.mostrar(false);
    this.painel = painelInicio(this.camada, {
      pool: poolDeKatakana(),
      recorde: obterResumo().recordes[ID_DO_JOGO] ?? 0,
      aoComecar: () => this.comecar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  comecar() {
    this.fecharPainel();
    this.destruirOnda();
    this.reiniciarPartida();
    this.corredor.posicionar(
      this.corredorX,
      this.posicaoDaFaixa(this.faixa),
      this.tamanhoBloco * 0.9,
    );
    this.corredor.correr(!animacoesReduzidas());
    this.controles.mostrar(true);
    this.estado = 'jogando';
    this.atualizarPlacar();
    this.criarNovaOnda();
  }

  pausar() {
    if (this.estado !== 'jogando') {
      return;
    }
    this.estado = 'pausado';
    this.onda?.conteiner.setVisible(false);
    this.controles.mostrar(false);
    this.painel = painelPausa(this.camada, {
      aoContinuar: () => this.continuar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  continuar() {
    this.fecharPainel();
    this.onda?.conteiner.setVisible(true);
    this.controles.mostrar(true);
    this.estado = 'jogando';
  }

  /** Chamado pelo PhaserHost quando um modal (ex.: configurações) abre. */
  pausarExterno() {
    this.pausar();
  }

  /** O jogador volta pelo botão "Continuar" do painel de pausa. */
  continuarExterno() {}

  terminar() {
    this.estado = 'fim';
    this.destruirOnda();
    this.corredor.correr(false);
    this.controles.mostrar(false);
    const { novoRecorde, recordeAnterior } = registrarFimDePartida(ID_DO_JOGO, this.pontos);
    this.painel = painelFim(this.camada, {
      pontos: this.pontos,
      acertos: this.acertos,
      nivel: nivelDaPartida(this.acertos),
      recorde: Math.max(recordeAnterior, this.pontos),
      novoRecorde,
      errados: [...this.errados.values()],
      aoJogarDeNovo: () => this.comecar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  // ---------- Controles ----------

  /** +1 sobe, −1 desce. */
  trocarDePista(direcao) {
    if (this.estado !== 'jogando') {
      return;
    }
    const nova = limitar(this.faixa + direcao, 0, CONFIG.faixas - 1);
    if (nova === this.faixa) {
      return;
    }
    this.faixa = nova;
    this.corredor.irPara(this.posicaoDaFaixa(nova), !animacoesReduzidas());
  }

  aoTeclar(evento) {
    // Teclas em painéis, modais ou campos HTML não são do jogo.
    if (
      evento.target instanceof HTMLElement &&
      evento.target.closest('.jogo-painel, .modal, input')
    ) {
      return;
    }
    if (this.estado === 'erro' && (evento.key === 'Enter' || evento.key === ' ')) {
      evento.preventDefault();
      document.querySelector('.cartao-erro .botao')?.click(); // fecha o cartão de erro
      return;
    }
    const acoes = {
      ArrowUp: () => this.trocarDePista(1),
      w: () => this.trocarDePista(1),
      ArrowDown: () => this.trocarDePista(-1),
      s: () => this.trocarDePista(-1),
      Escape: () => this.pausar(),
    };
    const acao = acoes[evento.key] ?? acoes[evento.key.toLowerCase()];
    if (acao) {
      evento.preventDefault();
      acao();
    }
  }

  /** Toque acima do corredor sobe; abaixo, desce. */
  aoTocar(ponteiro) {
    this.trocarDePista(ponteiro.y < this.corredor.conteiner.y ? 1 : -1);
  }

  // ---------- Ondas ----------

  criarNovaOnda() {
    const nivel = nivelDaPartida(this.acertos);
    const dados = montarOnda(poolDeKatakana(), nivel, this.ultimoAlvoId);
    this.ultimoAlvoId = dados.alvo.id;
    const inicioX = this.scale.width + this.tamanhoBloco;
    this.onda = criarOnda(this, dados, {
      x: inicioX,
      tamanho: this.tamanhoBloco,
      posicaoDaFaixa: (faixa) => this.posicaoDaFaixa(faixa),
    });
    this.velocidade = (inicioX - this.corredorX) / tempoDeTravessia(nivel);
    this.controles.perguntar(dados.alvo, obterConfig().mostrarRomaji);
    falar(dados.alvo.kana);
  }

  destruirOnda() {
    this.onda?.conteiner.destroy();
    this.onda = null;
  }

  /** A onda chegou ao corredor: vale o bloco da pista em que ele está. */
  resolverOnda() {
    const onda = this.onda;
    this.onda = null;
    const escolhida = onda.pecas.find((peca) => peca.faixa === this.faixa);
    if (escolhida?.item.id === onda.alvo.id) {
      this.acertar(onda, escolhida);
    } else {
      this.errar(onda);
    }
  }

  acertar(onda, peca) {
    const animado = !animacoesReduzidas();
    const nivelAntes = nivelDaPartida(this.acertos);
    this.combo += 1;
    this.acertos += 1;
    const ganho = pontosDoAcerto(this.combo);
    this.pontos += ganho;
    registrarResposta(onda.alvo.id, true);
    falar(onda.alvo.kana);
    const y = this.posicaoDaFaixa(peca.faixa);
    mostrarAcerto({ texto: `+${ganho}`, ...this.pontoNaTela(onda.conteiner.x, y) });
    onda.estourar(peca, animado);
    this.corredor.comemorar(animado);
    if (nivelDaPartida(this.acertos) > nivelAntes) {
      this.anunciarNivel(nivelDaPartida(this.acertos));
    }
    this.esperaAteProximaOnda = CONFIG.pausaEntreOndasS;
    this.atualizarPlacar();
  }

  /** Pista errada (ou vazia): mostra o bloco certo e o cartão com a dica. */
  errar(onda) {
    const animado = !animacoesReduzidas();
    const { alvo } = onda;
    this.vidas -= 1;
    this.combo = 0;
    this.errados.set(alvo.id, alvo);
    registrarResposta(alvo.id, false);
    falar(alvo.kana);
    onda.mostrarCerto();
    this.corredor.tropecar(animado);
    if (animado) {
      this.cameras.main.shake(180, 0.006);
    }
    this.atualizarPlacar();

    this.estado = 'erro';
    const cartao = { ...alvo, pt: `Mesmo som do hiragana ${alvo.par}` };
    mostrarErro(cartao).then(() => {
      onda.conteiner.destroy();
      this.aposCartaoDeErro();
    });
  }

  aposCartaoDeErro() {
    if (this.estado !== 'erro') {
      return; // a cena pode ter sido destruída enquanto o cartão estava aberto
    }
    if (this.vidas <= 0) {
      this.terminar();
      return;
    }
    this.estado = 'jogando';
    this.esperaAteProximaOnda = CONFIG.pausaEntreOndasS;
  }

  // ---------- HUD dentro do canvas ----------

  atualizarPlacar() {
    const coracoes = '❤️'.repeat(Math.max(0, this.vidas)) + '🤍'.repeat(CONFIG.vidas - this.vidas);
    this.textoVidas.setText(coracoes);
    const combo = this.combo > 1 ? `   Combo x${this.combo}` : '';
    this.textoPlacar.setText(`Nível ${nivelDaPartida(this.acertos)}   ${this.pontos} pts${combo}`);
  }

  anunciarNivel(nivel) {
    const { width: largura, height: altura } = this.scale;
    const texto = this.add
      .text(largura / 2, altura * 0.4, `Nível ${nivel}!\nmais rápido`, {
        fontFamily: FONTE,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffd166',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: texto,
      alpha: 0,
      y: animacoesReduzidas() ? texto.y : texto.y - 40,
      delay: 700,
      duration: 600,
      onComplete: () => texto.destroy(),
    });
  }

  // ---------- Laço do jogo ----------

  update(_tempo, deltaMs) {
    if (this.estado !== 'jogando') {
      return;
    }
    const dt = Math.min(deltaMs, 100) / 1000;
    const velocidade = this.velocidade ?? 0;
    if (!animacoesReduzidas()) {
      this.cenario.rolar(velocidade * dt);
    }

    if (!this.onda) {
      this.esperaAteProximaOnda -= dt;
      if (this.esperaAteProximaOnda <= 0) {
        this.criarNovaOnda();
      }
      return;
    }
    this.onda.conteiner.x -= velocidade * dt;
    if (this.onda.conteiner.x <= this.corredorX) {
      this.resolverOnda();
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
    this.scale.off('resize', this.aoRedimensionar, this);
    this.pararTeclado?.();
    this.input.off('pointerdown', this.aoTocar, this);
    this.controles?.destroy();
    this.camada?.remove();
    document.querySelector('.cartao-erro')?.remove();
  }
}
