// Tela do menu: cena 3D ao fundo + camada HTML acessível com a lista de fases.
// Os botões HTML garantem uso por teclado/leitor de tela e servem de
// alternativa caso o navegador não tenha WebGL.

import { aguardarFontes, criarElemento } from '../core/utils.js';
import { aoMudarConfig } from '../core/settings.js';
import { aoProgresso, jogoLiberado, obterResumo } from '../core/progress.js';
import { JAMO, SILABAS } from '../data/hangul.js';
import { JOGOS } from '../games/registry.js';
import { entrar, tremer } from '../ui/motion.js';
import { mostrarMensagem } from '../ui/feedback.js';
import { abrirModal } from '../ui/modal.js';
import { Menu3D } from './Menu3D.js';

/** Estado atual de cada fase (liberada? já tem jogo?). */
function estadoDasFases() {
  return JOGOS.map((jogo) => ({
    ...jogo,
    liberada: jogoLiberado(jogo),
    disponivel: Boolean(jogo.carregar),
  }));
}

/** Caracteres da decoração flutuante: letras e algumas sílabas. */
function caracteresDecorativos() {
  return [
    ...JAMO.filter((_, indice) => indice % 2 === 0),
    ...SILABAS.filter((_, indice) => indice % 9 === 0),
  ].map((item) => item.hangul);
}

function rotuloDoStatus(fase) {
  if (!fase.liberada) {
    const falta = Math.max(0, fase.xpNecessario - obterResumo().xp);
    return `🔒 faltam ${falta} XP`;
  }
  return fase.disponivel ? '▶ Jogar' : '⏳ Em breve';
}

function criarBotaoFase(fase, indice, { aoClicar, aoFocar }) {
  const botao = criarElemento(
    'button',
    {
      type: 'button',
      class: 'botao-fase',
      dataset: { fase: fase.id },
      onClick: () => aoClicar(fase.id, botao),
      onFocus: () => aoFocar(fase.id),
      onBlur: () => aoFocar(null),
      onMouseenter: () => aoFocar(fase.id),
      onMouseleave: () => aoFocar(null),
    },
    [
      criarElemento('span', { class: 'botao-fase-numero', text: String(indice + 1) }),
      criarElemento('span', { class: 'botao-fase-textos' }, [
        criarElemento('strong', { text: fase.nome }),
        criarElemento('span', { class: 'botao-fase-jp', lang: 'ko', text: fase.nomeNativo }),
        criarElemento('span', { class: 'botao-fase-status' }),
      ]),
    ],
  );
  botao.style.setProperty('--cor-fase', fase.cor);
  return botao;
}

/** Atualiza textos e estados dos botões sem recriá-los (mantém o foco). */
function atualizarBotoes(botoes, fases) {
  fases.forEach((fase, indice) => {
    const botao = botoes[indice];
    botao.querySelector('.botao-fase-status').textContent = rotuloDoStatus(fase);
    botao.classList.toggle('bloqueada', !fase.liberada);
    botao.setAttribute(
      'aria-label',
      `Fase ${indice + 1}: ${fase.nome}. ${fase.descricao} ${rotuloDoStatus(fase)}`,
    );
  });
}

function mostrarEmBreve(fase) {
  abrirModal({
    titulo: `${fase.nome} — em breve`,
    conteudo: [
      criarElemento('p', { class: 'hangul-medio', lang: 'ko', text: fase.nomeNativo }),
      criarElemento('p', { text: fase.descricao }),
      criarElemento('p', {
        class: 'texto-suave',
        text: 'Este minijogo será adicionado na próxima etapa. Enquanto isso, use 📚 Estudar para conhecer o hangul!',
      }),
    ],
  });
}

/**
 * Monta a tela do menu. `aoEscolherJogo(id)` é chamado quando o jogador abre um jogo.
 * Devolve { destroy }.
 */
export async function montarTelaMenu(conteiner, { aoEscolherJogo }) {
  const palco3d = criarElemento('div', { class: 'menu-palco' });
  const listaFases = criarElemento('ol', { class: 'lista-fases' });
  const raiz = criarElemento('section', { class: 'tela-menu', 'aria-labelledby': 'titulo-menu' }, [
    palco3d,
    criarElemento('div', { class: 'menu-sobreposicao' }, [
      criarElemento('header', { class: 'menu-cabecalho' }, [
        criarElemento('h1', { id: 'titulo-menu', tabindex: '-1', text: 'Hangul Drops' }),
        criarElemento('p', { lang: 'ko', class: 'menu-subtitulo-ko', text: '한글 드롭스' }),
        criarElemento('p', {
          class: 'menu-subtitulo',
          text: 'Aprenda o alfabeto coreano jogando.',
        }),
      ]),
      criarElemento('nav', { class: 'menu-fases', 'aria-label': 'Fases' }, listaFases),
    ]),
  ]);
  conteiner.append(raiz);

  let menu3d = null;
  let fases = estadoDasFases();

  function escolher(faseId, botao) {
    const fase = fases.find((item) => item.id === faseId);
    if (!fase.liberada) {
      const falta = Math.max(0, fase.xpNecessario - obterResumo().xp);
      mostrarMensagem(`🔒 ${fase.nome}: faltam ${falta} XP. Jogue as outras fases!`);
      tremer(botao ?? listaFases);
    } else if (!fase.disponivel) {
      mostrarEmBreve(fase);
    } else {
      aoEscolherJogo(fase.id);
    }
  }

  function destacarBotao(faseId) {
    botoes.forEach((botao) => botao.classList.toggle('destacada', botao.dataset.fase === faseId));
  }

  const botoes = fases.map((fase, indice) =>
    criarBotaoFase(fase, indice, {
      aoClicar: escolher,
      aoFocar: (faseId) => menu3d?.definirDestaque(faseId, false),
    }),
  );
  listaFases.append(...botoes.map((botao) => criarElemento('li', {}, botao)));
  atualizarBotoes(botoes, fases);

  await aguardarFontes();
  try {
    menu3d = new Menu3D(palco3d, {
      fases,
      caracteres: caracteresDecorativos(),
      aoEscolher: (faseId) =>
        escolher(
          faseId,
          botoes.find((b) => b.dataset.fase === faseId),
        ),
      aoDestacar: destacarBotao,
    });
  } catch (erro) {
    console.warn('WebGL indisponível; usando apenas o menu em HTML.', erro);
    raiz.classList.add('sem-3d');
  }

  const atualizar = () => {
    fases = estadoDasFases();
    atualizarBotoes(botoes, fases);
    menu3d?.atualizarFases(fases);
  };
  const cancelamentos = [aoMudarConfig(atualizar), aoProgresso('mudou', atualizar)];

  entrar(raiz.querySelectorAll('.menu-cabecalho > *, .botao-fase'), { atraso: 0.2 });

  return {
    destroy() {
      cancelamentos.forEach((cancelar) => cancelar());
      menu3d?.destroy();
      raiz.remove();
    },
  };
}
