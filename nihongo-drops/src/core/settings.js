// Configurações do jogador (romaji, animações, volume, fala).

import { lerJSON, salvarJSON } from './storage.js';
import { criarEmissor } from './utils.js';

const CHAVE = 'config';

const PADRAO = Object.freeze({
  mostrarRomaji: true,
  movimento: 'sistema', // 'sistema' | 'reduzido' | 'completo'
  volumeEfeitos: 0.6,
  velocidadeFala: 0.85,
  liberarTodasFases: false,
});

const emissor = criarEmissor();
const consultaMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
let config = carregar();

/** Aceita só chaves conhecidas e com o mesmo tipo do padrão. */
function carregar() {
  const salvo = lerJSON(CHAVE, {});
  const valido = { ...PADRAO };
  if (salvo && typeof salvo === 'object') {
    for (const chave of Object.keys(PADRAO)) {
      if (typeof salvo[chave] === typeof PADRAO[chave]) {
        valido[chave] = salvo[chave];
      }
    }
  }
  return valido;
}

/** Cópia das configurações atuais. */
export function obterConfig() {
  return { ...config };
}

/** Altera uma configuração, salva e avisa quem estiver ouvindo. */
export function alterarConfig(chave, valor) {
  if (!(chave in PADRAO) || typeof valor !== typeof PADRAO[chave]) {
    return;
  }
  config = { ...config, [chave]: valor };
  salvarJSON(CHAVE, config);
  aplicarNoDocumento();
  emissor.emit('mudou', obterConfig());
}

/** Registra uma função chamada sempre que algo mudar. Devolve a função para cancelar. */
export function aoMudarConfig(callback) {
  return emissor.on('mudou', callback);
}

/** Considera a escolha do jogador e, em "sistema", o prefers-reduced-motion. */
export function animacoesReduzidas() {
  if (config.movimento === 'reduzido') {
    return true;
  }
  if (config.movimento === 'completo') {
    return false;
  }
  return Boolean(consultaMovimento?.matches);
}

/** Reflete as configurações em atributos do <html>, usados pelo CSS. */
export function aplicarNoDocumento() {
  const raiz = document.documentElement;
  raiz.dataset.romaji = config.mostrarRomaji ? 'on' : 'off';
  raiz.dataset.movimento = animacoesReduzidas() ? 'reduzido' : 'completo';
}

// Se o jogador mudar a preferência do sistema com o jogo aberto, acompanhamos.
consultaMovimento?.addEventListener?.('change', () => {
  aplicarNoDocumento();
  emissor.emit('mudou', obterConfig());
});
