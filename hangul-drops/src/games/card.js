// Carta usada pelos jogos de cartas (Memory Hangul e Monte a Sílaba):
// verso com 🌸, frente com hangul, romanização, palavra ou emoji.
// Vira com uma animação de "flip" (escala horizontal) feita por tweens do Phaser.
// `dados.cor` (opcional) troca a cor da frente.

import * as Phaser from 'phaser';

const FONTE = '"Noto Sans KR", system-ui, sans-serif';

const CORES = {
  verso: 0x2a3a78,
  versoBorda: 0x3d4c8f,
  frente: { hangul: 0xfffaf0, romanizacao: 0xffe7ef, palavra: 0xfffaf0, imagem: 0xe8f6ff },
  texto: '#141a33',
  legenda: '#4a4f6b',
  encontrada: 0x5be49b,
  selecionada: 0xff8fb1,
  foco: 0xffd166,
};

/** Tamanho da fonte principal conforme o tipo da carta. */
function tamanhoDaFonte(dados, largura, altura) {
  if (dados.tipo === 'hangul') {
    return altura * 0.48;
  }
  if (dados.tipo === 'imagem') {
    return altura * 0.38;
  }
  // romanizacao e palavras: cabe na largura
  const porLargura = (largura * 0.85) / Math.max(1, dados.texto.length * 0.62);
  const limite = dados.tipo === 'palavra' ? altura * 0.36 : altura * 0.3;
  return Math.min(porLargura, limite);
}

/**
 * Cria uma carta. `aoClicar(carta)` é chamado no clique/toque.
 * Devolve um objeto com estado e métodos (posicionar, virar, marcarEncontrada...).
 */
export function criarCarta(cena, dados, aoClicar) {
  const fundo = cena.add.graphics();
  const texto = cena.add
    .text(0, 0, '', { fontFamily: FONTE, fontStyle: 'bold', color: CORES.texto, align: 'center' })
    .setOrigin(0.5);
  const legenda = cena.add
    .text(0, 0, '', { fontFamily: FONTE, color: CORES.legenda, align: 'center' })
    .setOrigin(0.5);
  const conteiner = cena.add.container(0, 0, [fundo, texto, legenda]);
  const area = new Phaser.Geom.Rectangle(0, 0, 1, 1);
  conteiner.setInteractive(area, Phaser.Geom.Rectangle.Contains);
  conteiner.input.cursor = 'pointer';
  conteiner.on('pointerup', () => aoClicar(carta));

  const carta = {
    dados,
    conteiner,
    virada: false,
    encontrada: false,
    selecionada: false,
    focada: false,
    largura: 1,
    altura: 1,

    /** Coloca a carta na grade com um novo tamanho. */
    posicionar(x, y, largura, altura) {
      carta.largura = largura;
      carta.altura = altura;
      conteiner.setPosition(x, y);
      area.setTo(-largura / 2, -altura / 2, largura, altura);
      desenhar();
    },

    /** Vira para cima ou para baixo, com ou sem animação. */
    virar(paraCima, animado) {
      if (!animado) {
        carta.virada = paraCima;
        desenhar();
        return;
      }
      cena.tweens.add({
        targets: conteiner,
        scaleX: 0,
        duration: 110,
        ease: 'Sine.easeIn',
        onComplete: () => {
          carta.virada = paraCima;
          desenhar();
          cena.tweens.add({ targets: conteiner, scaleX: 1, duration: 110, ease: 'Sine.easeOut' });
        },
      });
    },

    marcarEncontrada() {
      carta.encontrada = true;
      desenhar();
    },

    focar(sim) {
      carta.focada = sim;
      desenhar();
    },

    /** Destaque de "escolhida, esperando o par". */
    selecionar(sim) {
      carta.selecionada = sim;
      desenhar();
    },
  };

  function desenharVerso(largura, altura) {
    fundo.fillStyle(CORES.verso, 1);
    fundo.fillRoundedRect(-largura / 2, -altura / 2, largura, altura, 12);
    fundo.lineStyle(3, CORES.versoBorda, 1);
    fundo.strokeRoundedRect(-largura / 2 + 6, -altura / 2 + 6, largura - 12, altura - 12, 8);
    texto
      .setText('🌸')
      .setFontSize(altura * 0.3)
      .setY(0);
    legenda.setText('');
  }

  function desenharFrente(largura, altura) {
    fundo.fillStyle(dados.cor ?? CORES.frente[dados.tipo], 1);
    fundo.fillRoundedRect(-largura / 2, -altura / 2, largura, altura, 12);
    const borda = carta.encontrada ? CORES.encontrada : carta.selecionada && CORES.selecionada;
    if (borda) {
      fundo.lineStyle(6, borda, 1);
      fundo.strokeRoundedRect(-largura / 2, -altura / 2, largura, altura, 12);
    }
    const temLegenda = Boolean(dados.legenda);
    texto
      .setText(dados.texto)
      .setFontSize(tamanhoDaFonte(dados, largura, altura))
      .setY(temLegenda ? -altura * 0.08 : 0);
    legenda
      .setText(dados.legenda ?? '')
      .setFontSize(Math.max(11, altura * 0.11))
      .setY(altura * 0.33)
      .setWordWrapWidth(largura * 0.9);
  }

  function desenhar() {
    const { largura, altura } = carta;
    fundo.clear();
    if (carta.virada) {
      desenharFrente(largura, altura);
    } else {
      desenharVerso(largura, altura);
    }
    if (carta.focada) {
      fundo.lineStyle(4, CORES.foco, 1);
      fundo.strokeRoundedRect(-largura / 2 - 5, -altura / 2 - 5, largura + 10, altura + 10, 15);
    }
    conteiner.setAlpha(carta.encontrada ? 0.85 : 1);
  }

  return carta;
}
