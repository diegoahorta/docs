// Barra superior: nível, barra de XP, streak e botões principais.

import { criarElemento } from '../core/utils.js';
import { aoProgresso, obterResumo } from '../core/progress.js';
import { tocarNivel } from '../core/audio.js';
import { gsap, duracao, pulsar } from './motion.js';
import { mostrarMensagem } from './feedback.js';

function criarBotao(icone, rotulo, aoClicar) {
  return criarElemento(
    'button',
    { type: 'button', class: 'botao-hud', 'aria-label': rotulo, title: rotulo, onClick: aoClicar },
    [
      criarElemento('span', { 'aria-hidden': 'true', text: icone }),
      criarElemento('span', { class: 'botao-hud-texto', text: rotulo }),
    ],
  );
}

/**
 * Monta o HUD dentro de `raiz`.
 * Callbacks: aoVoltar, aoEstudar, aoConquistas, aoConfig.
 * Devolve { mostrarVoltar, destroy }.
 */
export function montarHud(raiz, { aoVoltar, aoEstudar, aoConquistas, aoConfig }) {
  const botaoVoltar = criarBotao('←', 'Menu', aoVoltar);
  botaoVoltar.hidden = true;

  const nivel = criarElemento('span', { class: 'hud-nivel' });
  const preenchimento = criarElemento('span', { class: 'hud-xp-preenchimento' });
  const barra = criarElemento(
    'span',
    { class: 'hud-xp', role: 'progressbar', 'aria-valuemin': '0', 'aria-label': 'XP do nível' },
    preenchimento,
  );
  const sequencia = criarElemento('span', { class: 'hud-sequencia' });

  raiz.replaceChildren(
    criarElemento('div', { class: 'hud-esquerda' }, [
      botaoVoltar,
      criarElemento('span', { class: 'hud-marca', lang: 'ja', text: '日本語' }),
      criarElemento('span', { class: 'hud-marca-texto', text: 'Drops' }),
    ]),
    criarElemento('div', { class: 'hud-status' }, [nivel, barra, sequencia]),
    criarElemento('nav', { class: 'hud-direita', 'aria-label': 'Atalhos' }, [
      criarBotao('📚', 'Estudar', aoEstudar),
      criarBotao('🏆', 'Conquistas', aoConquistas),
      criarBotao('⚙️', 'Configurações', aoConfig),
    ]),
  );

  function atualizar() {
    const resumo = obterResumo();
    nivel.textContent = `Nv ${resumo.nivel}`;
    barra.setAttribute('aria-valuemax', String(resumo.necessario));
    barra.setAttribute('aria-valuenow', String(resumo.atual));
    barra.title = `${resumo.atual} / ${resumo.necessario} XP`;
    gsap.to(preenchimento, {
      width: `${Math.round(resumo.fracao * 100)}%`,
      duration: duracao(0.4),
      ease: 'power2.out',
    });
    sequencia.textContent = `🔥 ${resumo.sequencia}`;
    sequencia.title = `Dias seguidos estudando: ${resumo.sequencia}`;
  }

  const cancelamentos = [
    aoProgresso('mudou', atualizar),
    aoProgresso('xp', () => pulsar(barra, 1.06)),
    aoProgresso('nivel', ({ nivel: novoNivel }) => {
      tocarNivel();
      pulsar(nivel, 1.4);
      mostrarMensagem(`🎉 Você chegou ao nível ${novoNivel}!`);
    }),
  ];
  atualizar();

  return {
    mostrarVoltar(visivel) {
      botaoVoltar.hidden = !visivel;
    },
    destroy() {
      cancelamentos.forEach((cancelar) => cancelar());
      raiz.replaceChildren();
    },
  };
}
