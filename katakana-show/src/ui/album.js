// 📒 Álbum de figurinhas: cada palavra acertada no quiz vira uma figurinha.
// As que faltam aparecem como "?" — dá vontade de completar!

import { CATEGORIAS, PALAVRAS_KATAKANA } from '../data/palavras.js';
import { palavrasDoAlbum } from '../core/placar.js';
import { criarElemento } from '../core/utils.js';
import { abrirModal } from './modal.js';
import { botaoFalar } from './falar.js';
import { silabasDaPalavra } from './guia.js';

function figurinha(palavra, conquistada) {
  if (!conquistada) {
    return criarElemento('li', { class: 'figurinha figurinha-vazia' }, [
      criarElemento('span', { class: 'figurinha-emoji', 'aria-hidden': 'true', text: '❔' }),
      criarElemento('span', { class: 'texto-suave', text: 'Ainda não' }),
    ]);
  }
  return criarElemento('li', { class: 'figurinha' }, [
    criarElemento('span', { class: 'figurinha-emoji', 'aria-hidden': 'true', text: palavra.emoji }),
    criarElemento('span', { class: 'figurinha-kana', lang: 'ja', text: palavra.kana }),
    criarElemento('span', { class: 'figurinha-romaji', text: palavra.romaji }),
    criarElemento('span', { class: 'figurinha-pt', text: palavra.pt }),
    botaoFalar(palavra.kana, { rotulo: `Ouvir ${palavra.pt}` }),
  ]);
}

/** Abre o álbum. */
export function abrirAlbum() {
  const album = palavrasDoAlbum();
  const total = PALAVRAS_KATAKANA.length;
  const conquistadas = PALAVRAS_KATAKANA.filter((palavra) => album.has(palavra.id)).length;
  const porcentagem = Math.round((conquistadas / total) * 100);

  const secoes = Object.entries(CATEGORIAS).map(([id, categoria]) => {
    const palavras = PALAVRAS_KATAKANA.filter((palavra) => palavra.categoria === id);
    const tem = palavras.filter((palavra) => album.has(palavra.id)).length;
    return criarElemento('section', { class: 'album-secao' }, [
      criarElemento('h3', {
        text: `${categoria.emoji} ${categoria.nome} — ${tem}/${palavras.length}`,
      }),
      criarElemento(
        'ul',
        { class: 'album-grade' },
        palavras.map((palavra) => figurinha(palavra, album.has(palavra.id))),
      ),
    ]);
  });

  const exemplo = PALAVRAS_KATAKANA.find((palavra) => album.has(palavra.id));
  return abrirModal({
    titulo: '📒 Álbum de palavras',
    classe: 'modal-album',
    conteudo: [
      criarElemento('div', { class: 'album-resumo' }, [
        criarElemento('p', {}, [
          criarElemento('strong', { text: `${conquistadas} de ${total}` }),
          ' figurinhas',
        ]),
        criarElemento(
          'div',
          {
            class: 'barra-progresso',
            role: 'progressbar',
            'aria-valuemin': '0',
            'aria-valuemax': '100',
            'aria-valuenow': String(porcentagem),
            'aria-label': 'Álbum completo',
          },
          criarElemento('span', { style: `width: ${porcentagem}%` }),
        ),
        criarElemento('p', {
          class: 'texto-suave',
          text: 'Acerte uma pergunta sobre uma palavra no quiz para colar a figurinha dela aqui.',
        }),
        exemplo
          ? criarElemento('p', { class: 'album-dica' }, [
              'Leia por sílabas: ',
              silabasDaPalavra(exemplo.kana),
            ])
          : null,
      ]),
      ...secoes,
    ],
  });
}
