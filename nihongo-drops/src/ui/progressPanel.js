// Painel de progresso do hiragana e do katakana, a partir do SRS:
// resumo (dominados, vistos, a revisar, precisão), distribuição pelas
// caixas, progresso de cada grupo (あ行, か行...) e os kana mais errados.
//
// Cores das caixas: escala ordinal de um só tom (mais claro = mais dominado),
// validada contra os fundos escuros; "não visto" fica em cinza neutro.

import { criarElemento } from '../core/utils.js';
import { GRUPOS_BASICOS, GRUPOS_DAKUTEN, gruposDeEstudo, listarKana } from '../data/kana.js';
import { gruposLiberados, obterRegistro, TOTAL_CAIXAS } from '../core/srs.js';
import { abrirModal } from './modal.js';
import { abrirDetalheKana } from './kanaChart.js';
import { criarBotaoFala } from './speakButton.js';
import { entrar } from './motion.js';

const CAIXA_DOMINADA = 3; // a partir da caixa 3 o kana conta como dominado
const MAIS_ERRADOS = 5;
const ROTULOS_DOS_NIVEIS = ['Não visto', 'Caixa 1', 'Caixa 2', 'Caixa 3', 'Caixa 4', 'Caixa 5'];
const NOMES = { hiragana: 'Hiragana ひらがな', katakana: 'Katakana カタカナ' };

/** 0 = nunca visto; 1 a 5 = caixa do SRS. */
function nivelDoItem(item) {
  return obterRegistro(item.id)?.caixa ?? 0;
}

/** Números gerais de um alfabeto. */
function resumir(itens) {
  const porNivel = Array(TOTAL_CAIXAS + 1).fill(0);
  let acertos = 0;
  let erros = 0;
  itens.forEach((item) => {
    porNivel[nivelDoItem(item)] += 1;
    const registro = obterRegistro(item.id);
    acertos += registro?.acertos ?? 0;
    erros += registro?.erros ?? 0;
  });
  const vistos = itens.length - porNivel[0];
  const dominados = porNivel.slice(CAIXA_DOMINADA).reduce((soma, valor) => soma + valor, 0);
  return {
    total: itens.length,
    porNivel,
    vistos,
    dominados,
    revisar: vistos - dominados,
    precisao: acertos + erros > 0 ? Math.round((acertos / (acertos + erros)) * 100) : null,
  };
}

function cartaoDeNumero(rotulo, valor, detalhe) {
  return criarElemento('div', { class: 'progresso-numero' }, [
    criarElemento('span', { class: 'progresso-numero-valor', text: valor }),
    criarElemento('span', { class: 'progresso-numero-rotulo', text: rotulo }),
    detalhe ? criarElemento('span', { class: 'texto-suave', text: detalhe }) : null,
  ]);
}

function criarResumo(resumo) {
  return criarElemento('div', { class: 'progresso-numeros' }, [
    cartaoDeNumero('Dominados', String(resumo.dominados), `de ${resumo.total} (caixa 3+)`),
    cartaoDeNumero('Vistos', String(resumo.vistos), `de ${resumo.total}`),
    cartaoDeNumero('Para revisar', String(resumo.revisar), 'caixas 1 e 2'),
    cartaoDeNumero(
      'Precisão',
      resumo.precisao === null ? '—' : `${resumo.precisao}%`,
      'acertos / respostas',
    ),
  ]);
}

/**
 * Barra empilhada com quantos kana há em cada nível (não visto, caixa 1...5).
 * A legenda logo abaixo traz os mesmos números em texto.
 */
function criarDistribuicao(resumo) {
  const segmentos = resumo.porNivel
    .map((quantidade, nivel) => ({ quantidade, nivel }))
    .filter(({ quantidade }) => quantidade > 0)
    .map(({ quantidade, nivel }) => {
      const descricao = `${ROTULOS_DOS_NIVEIS[nivel]}: ${quantidade} kana`;
      const segmento = criarElemento('span', {
        class: 'progresso-segmento',
        dataset: { nivel: String(nivel) },
        title: descricao,
        'aria-label': descricao,
      });
      segmento.style.flexGrow = String(quantidade);
      return segmento;
    });
  const legenda = criarElemento(
    'ul',
    { class: 'progresso-legenda' },
    resumo.porNivel.map((quantidade, nivel) =>
      criarElemento('li', {}, [
        criarElemento('span', {
          class: 'progresso-amostra',
          dataset: { nivel: String(nivel) },
          'aria-hidden': 'true',
        }),
        `${ROTULOS_DOS_NIVEIS[nivel]}: `,
        criarElemento('strong', { text: String(quantidade) }),
      ]),
    ),
  );
  return criarElemento('section', { class: 'progresso-secao' }, [
    criarElemento('h3', { text: 'Caixas do SRS' }),
    criarElemento(
      'div',
      { class: 'progresso-barra', role: 'img', 'aria-label': 'Distribuição pelas caixas' },
      segmentos,
    ),
    legenda,
  ]);
}

/** Quadradinho de um kana, colorido pelo nível; abre o detalhe ao clicar. */
function criarCelula(item) {
  const nivel = nivelDoItem(item);
  return criarElemento(
    'button',
    {
      type: 'button',
      class: 'progresso-kana',
      lang: 'ja',
      dataset: { nivel: String(nivel) },
      title: `${item.kana} (${item.romaji}) — ${ROTULOS_DOS_NIVEIS[nivel]}`,
      'aria-label': `${item.kana}, ${item.romaji}, ${ROTULOS_DOS_NIVEIS[nivel]}`,
      onClick: () => abrirDetalheKana(item),
    },
    item.kana,
  );
}

/** Uma linha por grupo: nome, liberado/bloqueado, os kana e quantos já domina. */
function criarGrupos(script) {
  const liberados = new Set(gruposLiberados(gruposDeEstudo(script, true)).map((grupo) => grupo.id));
  const linhas = [...GRUPOS_BASICOS, ...GRUPOS_DAKUTEN].map((grupo) => {
    const itens = listarKana(script, [grupo]);
    const dominados = itens.filter((item) => nivelDoItem(item) >= CAIXA_DOMINADA).length;
    const liberado = liberados.has(grupo);
    return criarElemento('li', { class: `progresso-grupo ${liberado ? '' : 'bloqueado'}` }, [
      criarElemento('span', { class: 'progresso-grupo-nome' }, [
        criarElemento('strong', { lang: 'ja', text: `${itens[0].kana}行` }),
        criarElemento('span', {
          class: 'texto-suave',
          text: liberado ? `${dominados}/${itens.length}` : '🔒',
          title: liberado
            ? 'Dominados neste grupo'
            : 'Libera quando você dominar os grupos anteriores',
        }),
      ]),
      criarElemento('span', { class: 'progresso-grupo-kana' }, itens.map(criarCelula)),
    ]);
  });
  return criarElemento('section', { class: 'progresso-secao' }, [
    criarElemento('h3', { text: 'Grupos' }),
    criarElemento('ul', { class: 'progresso-grupos' }, linhas),
  ]);
}

/** Os kana com mais erros (desempate: menos acertos). */
function criarMaisErrados(itens) {
  const errados = itens
    .map((item) => ({ item, registro: obterRegistro(item.id) }))
    .filter(({ registro }) => registro?.erros > 0)
    .sort((a, b) => b.registro.erros - a.registro.erros || a.registro.acertos - b.registro.acertos)
    .slice(0, MAIS_ERRADOS);
  const conteudo =
    errados.length === 0
      ? criarElemento('p', {
          class: 'texto-suave',
          text: 'Nenhum erro ainda. Continue jogando! 🎉',
        })
      : criarElemento(
          'ul',
          { class: 'progresso-errados' },
          errados.map(({ item, registro }) =>
            criarElemento('li', {}, [
              criarElemento('button', {
                type: 'button',
                class: 'progresso-errado-kana',
                lang: 'ja',
                'aria-label': `Ver ${item.kana}`,
                text: item.kana,
                onClick: () => abrirDetalheKana(item),
              }),
              criarElemento('span', { class: 'revisao-romaji', text: item.romaji }),
              criarElemento('span', {
                class: 'texto-suave',
                text: `✔ ${registro.acertos} · ✖ ${registro.erros}`,
              }),
              criarBotaoFala(item.kana),
            ]),
          ),
        );
  return criarElemento('section', { class: 'progresso-secao' }, [
    criarElemento('h3', { text: 'Mais errados' }),
    conteudo,
  ]);
}

function criarConteudoDoScript(script) {
  const itens = listarKana(script);
  const resumo = resumir(itens);
  return criarElemento('div', { role: 'tabpanel' }, [
    criarResumo(resumo),
    criarDistribuicao(resumo),
    criarGrupos(script),
    criarMaisErrados(itens),
  ]);
}

/** Abre o painel de progresso. */
export function abrirPainelProgresso(scriptInicial = 'hiragana') {
  const conteiner = criarElemento('div');
  const abas = Object.entries(NOMES).map(([script, nome]) =>
    criarElemento('button', {
      type: 'button',
      role: 'tab',
      class: 'aba',
      dataset: { script },
      text: nome,
    }),
  );
  const selecionar = (script) => {
    abas.forEach((aba) => aba.setAttribute('aria-selected', String(aba.dataset.script === script)));
    const painel = criarConteudoDoScript(script);
    conteiner.replaceChildren(painel);
    entrar(painel.children, { y: 12, duracao: 0.3, intervalo: 0.05 });
  };
  abas.forEach((aba) => aba.addEventListener('click', () => selecionar(aba.dataset.script)));
  abrirModal({
    titulo: 'Seu progresso',
    classe: 'modal-largo',
    conteudo: [criarElemento('div', { class: 'abas', role: 'tablist' }, abas), conteiner],
  });
  selecionar(scriptInicial);
}
