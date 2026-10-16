// Constantes do jogo. O mundo usa pixels de uma tela virtual de 960×540.
export const LARGURA = 960;
export const ALTURA = 540;

// Pasta com os assets compartilhados do repositório (fontes, UI, áudio).
export const ASSETS = '../assets/';

// Faixa do chão onde os personagens andam (profundidade z, em px).
// Tela: y = BASE_Y + z + altura.
export const BASE_Y = 34;
export const Z_MIN = 4;
export const Z_MAX = 150;
export const Z_MEIO_FIO = 62; // divisa entre o asfalto e a calçada
export const FUNDO_Y = BASE_Y + Z_MAX + 14; // onde as fachadas encostam no chão

export const GRAVIDADE = 1900;

export const HEROI = {
  escala: 0.9,
  vidaMax: 100,
  vidas: 3,
  velX: 230,
  velZ: 140,
  pulo: 820,
};
