// Hangul Rain: letras e sílabas caem do céu e o jogador digita a romanização antes que
// cheguem ao chão. A velocidade aumenta aos poucos e o SRS decide quais
// itens aparecem mais.
//
// Estados da partida: 'inicio' → 'jogando' ⇄ 'pausado' / 'erro' → 'fim'.

import * as Phaser from 'phaser';
import { obterResumo, registrarFimDePartida, registrarResposta } from '../../core/progress.js';
import { animacoesReduzidas } from '../../core/settings.js';
import { falar } from '../../core/speech.js';
import { limitar, normalizarLeitura } from '../../core/utils.js';
import { mostrarAcerto, mostrarErro } from '../../ui/feedback.js';
import { criarCamadaDoJogo } from '../gamePanel.js';
import {
  CONFIG,
  escolherProximo,
  intervaloEntreGotas,
  maxGotasNaTela,
  nivelDaPartida,
  poolDaChuva,
  pontosDoAcerto,
  procurarAlvo,
  tempoDeQueda,
} from './rainLogic.js';
import { criarGota, estourarGota, respingarGota } from './drop.js';
import { criarCenario } from './scenery.js';
import { criarBarraDeEntrada } from './inputBar.js';
import { painelFim, painelInicio, painelPausa } from './panels.js';

const ID_DO_JOGO = 'hangul-rain';
const FONTE = '"Noto Sans KR", system-ui, sans-serif';
const MARGEM_DO_CHAO = 10;
const ALTURA_DO_PLACAR = 56; // as gotas nascem logo abaixo do placar, já legíveis

export default class HangulRainScene extends Phaser.Scene {
  constructor() {
    super({ key: ID_DO_JOGO });
  }

  /** Recebe { conteiner, aoSair } do PhaserHost. */
  init(dados) {
    this.dados = dados;
    this.painel = null;
    this.limpo = false;
    this.reiniciarPartida();
  }

  reiniciarPartida() {
    this.gotas = [];
    this.vidas = CONFIG.vidas;
    this.pontos = 0;
    this.acertos = 0;
    this.combo = 0;
    this.tempoDesdeUltimaGota = 0;
    this.errados = new Map();
    this.estado = 'inicio';
  }

  create() {
    this.cenario = criarCenario(this);
    this.textoVidas = this.criarTexto(16, 14, 0);
    this.textoPlacar = this.criarTexto(0, 14, 1);
    this.camada = criarCamadaDoJogo(this.dados.conteiner);
    this.barra = criarBarraDeEntrada(this.camada, {
      aoDigitar: (texto) => this.aoDigitar(texto),
      aoEnviar: (texto) => this.aoEnviar(texto),
      aoPausar: () => this.pausar(),
      aoMover: () => this.aoRedimensionar(),
    });

    this.scale.on('resize', this.aoRedimensionar, this);
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

  /** Recalcula tamanho das gotas e a linha do chão (logo acima da barra de digitação). */
  aoRedimensionar() {
    const { width: largura, height: altura } = this.scale;
    const topoDaBarra =
      this.barra.elemento.getBoundingClientRect().top -
      this.game.canvas.getBoundingClientRect().top;
    this.chaoY = limitar(topoDaBarra - MARGEM_DO_CHAO, altura * 0.45, altura);
    this.raio = limitar(largura / 14, 28, 44);
    this.cenario.redesenhar(largura, altura, this.chaoY);
    this.textoPlacar.setX(largura - 16);
    this.gotas.forEach((gota) => {
      gota.conteiner.x = limitar(gota.conteiner.x, gota.raio, largura - gota.raio);
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

  /** Altura onde as gotas nascem: a ponta da gota fica logo abaixo do placar. */
  inicioDaChuva() {
    return ALTURA_DO_PLACAR + this.raio * 1.5;
  }

  /** Escolhe um x livre: evita nascer em cima de outra gota que ainda está no alto. */
  escolherX() {
    const minimo = this.raio + 8;
    const maximo = this.scale.width - this.raio - 8;
    let x = Phaser.Math.Between(minimo, maximo);
    for (let tentativa = 0; tentativa < 6; tentativa += 1) {
      const ocupado = this.gotas.some(
        (gota) =>
          gota.y < this.inicioDaChuva() + this.raio * 3 &&
          Math.abs(gota.conteiner.x - x) < this.raio * 2.2,
      );
      if (!ocupado) {
        break;
      }
      x = Phaser.Math.Between(minimo, maximo);
    }
    return x;
  }

  // ---------- Painéis ----------

  fecharPainel() {
    this.painel?.fechar();
    this.painel = null;
  }

  mostrarInicio() {
    this.barra.mostrar(false);
    this.painel = painelInicio(this.camada, {
      pool: poolDaChuva(),
      recorde: obterResumo().recordes[ID_DO_JOGO] ?? 0,
      aoComecar: () => this.comecar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  comecar() {
    this.fecharPainel();
    this.gotas.forEach((gota) => gota.conteiner.destroy());
    this.reiniciarPartida();
    this.estado = 'jogando';
    this.barra.limpar();
    this.barra.mostrar(true);
    this.barra.focar(); // no celular, abre o teclado (precisa ser dentro do clique)
    this.atualizarPlacar();
    this.criarNovaGota();
  }

  pausar() {
    if (this.estado !== 'jogando') {
      return;
    }
    this.estado = 'pausado';
    // Escondemos as gotas para ninguém "estudar" com o jogo parado.
    this.gotas.forEach((gota) => gota.conteiner.setVisible(false));
    this.barra.mostrar(false);
    this.painel = painelPausa(this.camada, {
      aoContinuar: () => this.continuar(),
      aoSair: () => this.dados.aoSair(),
    });
  }

  continuar() {
    this.fecharPainel();
    this.gotas.forEach((gota) => gota.conteiner.setVisible(true));
    this.estado = 'jogando';
    this.barra.mostrar(true);
    this.barra.focar();
  }

  /** Chamado pelo PhaserHost quando um modal (ex.: configurações) abre. */
  pausarExterno() {
    this.pausar();
  }

  /** O jogador volta pelo botão "Continuar" do painel de pausa. */
  continuarExterno() {}

  terminar() {
    this.estado = 'fim';
    this.gotas.forEach((gota) => gota.conteiner.destroy());
    this.gotas = [];
    this.barra.mostrar(false);
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

  // ---------- Digitação ----------

  aoDigitar(texto) {
    if (this.estado !== 'jogando') {
      return;
    }
    const digitado = normalizarLeitura(texto);
    const { alvo, aguardar, possiveis } = procurarAlvo(this.gotas, digitado);
    this.gotas.forEach((gota) => gota.destacar(possiveis.includes(gota)));
    if (!digitado) {
      return;
    }
    if (alvo && !aguardar) {
      this.acertar(alvo);
    } else if (possiveis.length === 0) {
      this.barra.marcarInvalido();
    }
  }

  aoEnviar(texto) {
    if (this.estado === 'erro') {
      // Enter também fecha o cartão de erro, sem tirar o foco do campo.
      document.querySelector('.cartao-erro .botao')?.click();
      return;
    }
    if (this.estado !== 'jogando') {
      return;
    }
    const { alvo } = procurarAlvo(this.gotas, normalizarLeitura(texto));
    if (alvo) {
      this.acertar(alvo);
    } else {
      this.barra.marcarInvalido();
      this.gotas.forEach((gota) => gota.destacar(false));
    }
  }

  // ---------- Acerto e erro ----------

  removerGota(gota) {
    this.gotas = this.gotas.filter((outra) => outra !== gota);
  }

  acertar(gota) {
    const nivelAntes = nivelDaPartida(this.acertos);
    this.removerGota(gota);
    this.combo += 1;
    this.acertos += 1;
    const alturaRelativa = (this.chaoY - gota.y) / (this.chaoY - this.inicioDaChuva());
    const ganho = pontosDoAcerto(this.combo, alturaRelativa);
    this.pontos += ganho;

    registrarResposta(gota.item.id, true);
    falar(gota.item.fala);
    mostrarAcerto({ texto: `+${ganho}`, ...this.pontoNaTela(gota.conteiner.x, gota.y) });
    estourarGota(this, gota, animacoesReduzidas());

    this.barra.limpar();
    this.gotas.forEach((outra) => outra.destacar(false));
    if (nivelDaPartida(this.acertos) > nivelAntes) {
      this.anunciarNivel(nivelDaPartida(this.acertos));
    }
    this.atualizarPlacar();
  }

  /** Uma gota tocou o chão: perde vida, mostra a resposta e a dica. */
  gotaCaiu(gota) {
    const reduzido = animacoesReduzidas();
    this.removerGota(gota);
    respingarGota(this, gota, this.chaoY, reduzido);
    if (!reduzido) {
      this.cameras.main.shake(180, 0.008);
    }
    this.vidas -= 1;
    this.combo = 0;
    this.errados.set(gota.item.id, gota.item);
    registrarResposta(gota.item.id, false);
    falar(gota.item.fala);
    this.barra.limpar();
    this.gotas.forEach((outra) => outra.destacar(false));
    this.atualizarPlacar();

    // As outras gotas congelam enquanto o cartão com a dica está aberto.
    this.estado = 'erro';
    mostrarErro(gota.item).then(() => this.aposCartaoDeErro());
  }

  aposCartaoDeErro() {
    if (this.estado !== 'erro') {
      return; // a cena pode ter sido destruída enquanto o cartão estava aberto
    }
    if (this.vidas <= 0) {
      this.terminar();
    } else {
      this.estado = 'jogando';
      this.barra.focar();
    }
  }

  // ---------- HUD dentro do canvas ----------

  atualizarPlacar() {
    const coracoes = '❤️'.repeat(Math.max(0, this.vidas)) + '🤍'.repeat(CONFIG.vidas - this.vidas);
    this.textoVidas.setText(coracoes);
    const combo = this.combo > 1 ? `   Combo x${this.combo}` : '';
    this.textoPlacar.setText(`Nível ${nivelDaPartida(this.acertos)}   ${this.pontos} pts${combo}`);
  }

  /** Mensagem grande "Nível N" quando a velocidade aumenta. */
  anunciarNivel(nivel) {
    const { width: largura, height: altura } = this.scale;
    const texto = this.add
      .text(largura / 2, altura * 0.35, `Nível ${nivel}!\nmais rápido`, {
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

  criarNovaGota() {
    const nivel = nivelDaPartida(this.acertos);
    const item = escolherProximo(
      poolDaChuva(),
      this.gotas.map((gota) => gota.item),
    );
    const inicioY = this.inicioDaChuva();
    const gota = criarGota(this, item, {
      x: this.escolherX(),
      y: inicioY,
      raio: this.raio,
      velocidade: (this.chaoY - inicioY) / tempoDeQueda(nivel),
    });
    if (!animacoesReduzidas()) {
      gota.conteiner.setAlpha(0);
      this.tweens.add({ targets: gota.conteiner, alpha: 1, duration: 250 });
    }
    this.gotas.push(gota);
    this.tempoDesdeUltimaGota = 0;
  }

  update(_tempo, deltaMs) {
    if (this.estado !== 'jogando') {
      return;
    }
    const dt = Math.min(deltaMs, 100) / 1000;
    const nivel = nivelDaPartida(this.acertos);
    this.tempoDesdeUltimaGota += dt;
    const podeNascer = this.gotas.length < maxGotasNaTela(nivel);
    if (
      this.gotas.length === 0 ||
      (podeNascer && this.tempoDesdeUltimaGota >= intervaloEntreGotas(nivel))
    ) {
      this.criarNovaGota();
    }

    for (const gota of this.gotas) {
      gota.conteiner.y += gota.velocidade * dt;
      if (gota.y + gota.raio * 0.8 >= this.chaoY) {
        this.gotaCaiu(gota);
        break; // o jogo congela no cartão de erro
      }
    }
  }

  // ---------- Limpeza ----------

  /** Remove tudo o que foi criado fora do Phaser (HTML e listeners). */
  limpar() {
    if (this.limpo) {
      return;
    }
    this.limpo = true;
    this.estado = 'destruida';
    this.scale.off('resize', this.aoRedimensionar, this);
    this.barra?.destroy();
    this.camada?.remove();
    document.querySelector('.cartao-erro')?.remove();
  }
}
