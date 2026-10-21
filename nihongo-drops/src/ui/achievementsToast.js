// Avisos de conquista (toast) e painel com todas as conquistas.

import { criarElemento } from '../core/utils.js';
import { CONQUISTAS } from '../core/achievements.js';
import { aoProgresso, obterResumo } from '../core/progress.js';
import { tocarNivel } from '../core/audio.js';
import { entrar, sair } from './motion.js';
import { abrirModal } from './modal.js';
import { pilhaDeAvisos } from './feedback.js';

const TEMPO_TOAST_MS = 3500;

function mostrarToast(conquista) {
  const toast = criarElemento('div', { class: 'toast-conquista', role: 'status' }, [
    criarElemento('span', { class: 'toast-icone', 'aria-hidden': 'true', text: conquista.icone }),
    criarElemento('span', {}, [
      criarElemento('strong', { text: 'Conquista desbloqueada!' }),
      criarElemento('span', { text: conquista.titulo }),
    ]),
  ]);
  pilhaDeAvisos().append(toast);
  tocarNivel();
  entrar(toast, { y: -30 });
  setTimeout(async () => {
    await sair(toast);
    toast.remove();
  }, TEMPO_TOAST_MS);
}

/** Começa a escutar novas conquistas. Devolve a função para parar. */
export function iniciarAvisosDeConquista() {
  return aoProgresso('conquista', mostrarToast);
}

/** Abre o painel com todas as conquistas (desbloqueadas e bloqueadas). */
export function abrirPainelConquistas() {
  const { conquistas, estatisticas, melhorSequencia, xp } = obterResumo();
  const itens = CONQUISTAS.map((conquista) => {
    const data = conquistas[conquista.id];
    return criarElemento(
      'li',
      { class: `conquista ${data ? 'conquista-ok' : 'conquista-bloqueada'}` },
      [
        criarElemento('span', {
          class: 'conquista-icone',
          'aria-hidden': 'true',
          text: conquista.icone,
        }),
        criarElemento('span', {}, [
          criarElemento('strong', { text: conquista.titulo }),
          criarElemento('small', {
            text: data ? `${conquista.descricao} — ${data}` : conquista.descricao,
          }),
        ]),
        criarElemento('span', { class: 'sr-only', text: data ? 'Desbloqueada' : 'Bloqueada' }),
      ],
    );
  });
  abrirModal({
    titulo: 'Conquistas',
    conteudo: [
      criarElemento('p', {
        class: 'texto-suave',
        text: `XP total: ${xp} · Acertos: ${estatisticas.acertos} · Partidas: ${estatisticas.partidas} · Melhor streak: ${melhorSequencia} dia(s)`,
      }),
      criarElemento('ul', { class: 'lista-conquistas' }, itens),
    ],
  });
}
