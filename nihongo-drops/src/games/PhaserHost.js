// Cria e destrói instâncias do Phaser para os minijogos.
// Cada minijogo é uma classe que estende Phaser.Scene e recebe `dados` no init().

import * as Phaser from 'phaser';

const COR_DE_FUNDO = '#0f1630';

/**
 * Inicia um jogo Phaser dentro de `conteiner`, com a cena `ClasseCena`.
 * `dados` chega em `init(dados)` da cena (ex.: callbacks para sair).
 * Devolve { jogo, pausar, continuar, destroy }.
 */
export function criarJogoPhaser(conteiner, ClasseCena, dados = {}) {
  const jogo = new Phaser.Game({
    type: Phaser.AUTO,
    parent: conteiner,
    backgroundColor: COR_DE_FUNDO,
    banner: false,
    // O áudio fica com o core/audio.js (Web Audio próprio), então o Phaser não cria outro contexto.
    audio: { noAudio: true },
    fps: { target: 60 },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: conteiner.clientWidth || 800,
      height: conteiner.clientHeight || 600,
    },
    callbacks: {
      postBoot: (instancia) => instancia.scene.add('principal', ClasseCena, true, dados),
    },
  });

  return {
    jogo,
    pausar() {
      jogo.scene.getScene('principal')?.scene.pause();
    },
    continuar() {
      jogo.scene.getScene('principal')?.scene.resume();
    },
    destroy() {
      // true = remove também o <canvas> do DOM.
      jogo.destroy(true);
    },
  };
}
