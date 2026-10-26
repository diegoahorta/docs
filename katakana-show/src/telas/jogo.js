// A rodada do quiz: pergunta, cronômetro, 4 alternativas, ajudas, combo e placar.
// Estados: 'pergunta' (cronômetro correndo) → 'resposta' (cartão de feedback) → próxima.
// No modo equipes, as equipes se revezam e cada uma tem o seu combo e as suas ajudas.

import { buscarTemporada } from '../quiz/temporadas.js';
import { criarRodada } from '../quiz/perguntas.js';
import { multiplicador, pontosDoAcerto } from '../quiz/pontuacao.js';
import { colarNoAlbum, pesoDeRevisao, registrarResposta } from '../core/placar.js';
import { obterConfig } from '../core/settings.js';
import { falar, falaDisponivel, temVozJaponesa } from '../core/speech.js';
import {
  tocarAcerto,
  tocarClique,
  tocarCombo,
  tocarErro,
  tocarTempoEsgotado,
  tocarTique,
} from '../core/audio.js';
import { comoSoa } from '../data/fonetica.js';
import { criarElemento } from '../core/utils.js';
import { abrirModal } from '../ui/modal.js';
import { explodirConfete } from '../ui/confete.js';
import { entrar, gsap, pulsar, tremer } from '../ui/motion.js';
import { animacoesReduzidas } from '../core/settings.js';
import { criarFeedback } from './feedback.js';

const FORMAS = ['▲', '◆', '●', '■'];
const TECLAS = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
const BONUS_DE_TEMPO_MS = 10_000;
const AJUDAS = [
  { id: 'meio', icone: '✂️', rotulo: '50:50', descricao: 'Elimina duas alternativas erradas' },
  { id: 'tempo', icone: '⏱️', rotulo: '+10 s', descricao: 'Ganha mais 10 segundos' },
  { id: 'ouvir', icone: '🔊', rotulo: 'Ouvir', descricao: 'Ouve a pronúncia da resposta' },
];

/**
 * Monta a rodada dentro de `conteiner`.
 * @param {object} opcoes { temporadaId, equipes, perguntas, aoTerminar(resultado), aoSair() }
 * @returns {Function} limpeza (para o cronômetro, remove ouvintes e animações)
 */
export function mostrarJogo(
  conteiner,
  { temporadaId, equipes, perguntas: total, aoTerminar, aoSair },
) {
  const temporada = buscarTemporada(temporadaId);
  const comVoz = falaDisponivel() && temVozJaponesa();
  const perguntas = criarRodada(temporada, total, { peso: pesoDeRevisao, comVoz });
  const modoEquipes = equipes.length > 1;
  const times = equipes.map((equipe) => ({
    ...equipe,
    pontos: 0,
    combo: 0,
    maiorCombo: 0,
    acertos: 0,
    respondidas: 0,
    ajudas: { meio: true, tempo: true, ouvir: true },
  }));
  const historico = [];
  const palavrasNovas = new Set();

  let indice = 0;
  let estado = 'pergunta';
  let consultouGuia = false;
  let modalAberto = false;
  let modalDePausa = null;
  let atrasoDeInicio = 0;

  // ---------- Cronômetro (requestAnimationFrame, pausável) ----------
  const relogio = { duracaoMs: 0, restanteMs: 0, ultimo: 0, quadro: 0, ultimoSegundo: null };
  const comTempo = () => obterConfig().tempoPorPergunta > 0;

  // ---------- Estrutura da tela ----------
  const elementosDoPlacar = times.map((time) =>
    criarElemento('li', { class: `placar-equipe cor-${time.cor}` }, [
      criarElemento('span', { class: 'placar-nome', text: `${time.emoji} ${time.nome}` }),
      criarElemento('strong', { class: 'placar-pontos', text: '0' }),
    ]),
  );
  const contador = criarElemento('p', { class: 'hud-contador' });
  const pontinhos = criarElemento(
    'ol',
    { class: 'hud-pontinhos', 'aria-hidden': 'true' },
    perguntas.map(() => criarElemento('li')),
  );
  const combo = criarElemento('div', { class: 'hud-combo', 'aria-live': 'polite' });
  const botaoPausa = criarElemento('button', {
    type: 'button',
    class: 'botao-icone botao-pausa',
    'aria-label': 'Pausar',
    text: '⏸',
    onClick: () => pausar(),
  });
  const barraTempo = criarElemento('span', { class: 'relogio-barra' });
  const segundos = criarElemento('span', { class: 'relogio-segundos', 'aria-hidden': 'true' });
  const relogioEl = criarElemento('div', { class: 'relogio' }, [
    criarElemento('span', { class: 'relogio-trilho' }, barraTempo),
    segundos,
  ]);
  const vezDaEquipe = criarElemento('p', { class: 'vez-da-equipe', 'aria-live': 'polite' });
  const tipoEl = criarElemento('p', { class: 'pergunta-tipo' });
  const tituloEl = criarElemento('h2', { class: 'pergunta-titulo', tabindex: '-1' });
  const destaqueEl = criarElemento('div', { class: 'destaque' });
  const avisoGuia = criarElemento('p', {
    class: 'aviso-guia',
    text: '📖 Guia consultado: esta pergunta vale metade dos pontos.',
  });
  const respostasEl = criarElemento('div', { class: 'respostas' });
  const ajudasEl = criarElemento('div', { class: 'ajudas', role: 'group', 'aria-label': 'Ajudas' });
  const areaFeedback = criarElemento('div', { class: 'area-feedback' });
  const anuncioCombo = criarElemento('div', { class: 'anuncio-combo', 'aria-hidden': 'true' });

  const tela = criarElemento(
    'section',
    { class: 'tela-jogo', 'aria-label': `Rodada ${temporada.nome}` },
    [
      criarElemento('div', { class: 'hud-jogo' }, [
        criarElemento('div', { class: 'hud-progresso' }, [contador, pontinhos]),
        criarElemento(
          'ul',
          {
            class: `placar ${modoEquipes ? 'placar-equipes' : 'placar-solo'}`,
            'aria-label': 'Placar',
          },
          elementosDoPlacar,
        ),
        combo,
        botaoPausa,
      ]),
      relogioEl,
      criarElemento('div', { class: 'palco-pergunta' }, [
        vezDaEquipe,
        tipoEl,
        tituloEl,
        destaqueEl,
        avisoGuia,
        anuncioCombo,
      ]),
      respostasEl,
      ajudasEl,
      areaFeedback,
    ],
  );
  conteiner.replaceChildren(tela);

  const timeDaVez = () => times[indice % times.length];

  // ---------- HUD ----------
  function atualizarPlacar(animar = null) {
    times.forEach((time, posicao) => {
      const item = elementosDoPlacar[posicao];
      item.classList.toggle(
        'placar-ativo',
        modoEquipes && time === timeDaVez() && estado !== 'fim',
      );
      const alvo = item.querySelector('.placar-pontos');
      if (animar === time && !animacoesReduzidas()) {
        const valor = { n: Number(alvo.textContent) || 0 };
        gsap.to(valor, {
          n: time.pontos,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => {
            alvo.textContent = String(Math.round(valor.n));
          },
        });
        pulsar(item, 1.12);
      } else {
        alvo.textContent = String(time.pontos);
      }
    });
  }

  function atualizarCombo() {
    const time = timeDaVez();
    const mult = multiplicador(time.combo);
    combo.className = `hud-combo combo-${mult}`;
    combo.replaceChildren(
      criarElemento('span', { class: 'combo-fogo', 'aria-hidden': 'true', text: '🔥' }),
      criarElemento('span', { class: 'combo-mult', text: `x${mult}` }),
      criarElemento('span', {
        class: 'combo-seq',
        text: time.combo > 0 ? `${time.combo} seguidos` : 'combo',
      }),
    );
  }

  function atualizarProgresso() {
    contador.textContent = `Pergunta ${indice + 1} de ${perguntas.length}`;
    [...pontinhos.children].forEach((ponto, posicao) => {
      const registro = historico[posicao];
      ponto.className = registro
        ? registro.acertou
          ? 'ponto-certo'
          : 'ponto-errado'
        : posicao === indice
          ? 'ponto-atual'
          : '';
    });
  }

  // ---------- Cronômetro ----------
  function desenharRelogio() {
    const fracao = relogio.duracaoMs > 0 ? relogio.restanteMs / relogio.duracaoMs : 1;
    barraTempo.style.transform = `scaleX(${Math.max(0, Math.min(1, fracao))})`;
    relogioEl.dataset.nivel = fracao > 0.5 ? 'alto' : fracao > 0.25 ? 'medio' : 'baixo';
    const restante = Math.ceil(relogio.restanteMs / 1000);
    segundos.textContent = `${restante}s`;
    if (restante !== relogio.ultimoSegundo) {
      if (restante <= 3 && restante > 0 && relogio.ultimoSegundo !== null) {
        tocarTique();
      }
      relogio.ultimoSegundo = restante;
    }
  }

  function passoDoRelogio(agora) {
    relogio.quadro = 0;
    if (estado !== 'pergunta') {
      return;
    }
    relogio.restanteMs -= agora - relogio.ultimo;
    relogio.ultimo = agora;
    desenharRelogio();
    if (relogio.restanteMs <= 0) {
      responder(null);
      return;
    }
    relogio.quadro = requestAnimationFrame(passoDoRelogio);
  }

  function rodarRelogio() {
    if (!comTempo() || estado !== 'pergunta' || modalAberto || document.hidden || relogio.quadro) {
      return;
    }
    relogio.ultimo = performance.now();
    relogio.quadro = requestAnimationFrame(passoDoRelogio);
  }

  function pararRelogio() {
    if (relogio.quadro) {
      cancelAnimationFrame(relogio.quadro);
      relogio.quadro = 0;
    }
  }

  // ---------- Pergunta ----------
  function rotuloDoTipo(pergunta) {
    return pergunta.palavra ? '🗣️ Vocabulário' : '🔤 Leitura de katakana';
  }

  function desenharDestaque(pergunta) {
    const { destaque } = pergunta;
    if (destaque.audio) {
      return criarElemento('button', {
        type: 'button',
        class: 'destaque-audio',
        'aria-label': 'Ouvir a palavra de novo',
        text: '🔊',
        onClick: () => falar(destaque.audio),
      });
    }
    if (destaque.emoji) {
      return criarElemento('div', { class: 'destaque-significado' }, [
        criarElemento('span', {
          class: 'destaque-emoji',
          'aria-hidden': 'true',
          text: destaque.emoji,
        }),
        criarElemento('span', { class: 'destaque-pt', text: destaque.pt }),
      ]);
    }
    if (destaque.romaji) {
      return criarElemento('div', { class: 'destaque-romaji-bloco' }, [
        criarElemento('span', { class: 'destaque-romaji', text: `"${destaque.romaji}"` }),
        criarElemento('span', {
          class: 'destaque-soa',
          text: `🗣️ soa "${comoSoa(destaque.romaji)}"`,
        }),
      ]);
    }
    return criarElemento('span', {
      class: `destaque-kana ${destaque.palavra ? 'destaque-palavra' : ''}`,
      lang: 'ja',
      text: destaque.kana,
    });
  }

  function desenharRespostas(pergunta) {
    respostasEl.replaceChildren(
      ...pergunta.opcoes.map((opcao, posicao) =>
        criarElemento(
          'button',
          {
            type: 'button',
            class: `resposta resposta-${posicao} ${opcao.kana ? 'resposta-kana' : ''} ${opcao.romaji ? 'resposta-romaji' : ''}`,
            'aria-keyshortcuts': String(posicao + 1),
            onClick: () => responder(posicao),
          },
          [
            criarElemento('span', {
              class: 'resposta-forma',
              'aria-hidden': 'true',
              text: FORMAS[posicao],
            }),
            opcao.emoji
              ? criarElemento('span', {
                  class: 'resposta-emoji',
                  'aria-hidden': 'true',
                  text: opcao.emoji,
                })
              : null,
            criarElemento('span', {
              class: 'resposta-texto',
              lang: opcao.kana ? 'ja' : null,
              text: opcao.rotulo,
            }),
            criarElemento('span', {
              class: 'resposta-tecla',
              'aria-hidden': 'true',
              text: posicao + 1,
            }),
          ],
        ),
      ),
    );
  }

  function desenharAjudas() {
    const time = timeDaVez();
    const pergunta = perguntas[indice];
    ajudasEl.replaceChildren(
      ...AJUDAS.map((ajuda) => {
        const indisponivel =
          (ajuda.id === 'tempo' && !comTempo()) ||
          (ajuda.id === 'ouvir' && (!comVoz || pergunta.tipo === 'ouvir-palavra'));
        const botao = criarElemento(
          'button',
          {
            type: 'button',
            class: 'ajuda',
            title: ajuda.descricao,
            'aria-label': `${ajuda.rotulo}: ${ajuda.descricao}`,
            onClick: () => usarAjuda(ajuda.id, botao),
          },
          [
            criarElemento('span', { 'aria-hidden': 'true', text: ajuda.icone }),
            criarElemento('span', { text: ajuda.rotulo }),
          ],
        );
        botao.disabled = indisponivel || !time.ajudas[ajuda.id];
        return botao;
      }),
    );
  }

  function mostrarPergunta() {
    const pergunta = perguntas[indice];
    estado = 'pergunta';
    consultouGuia = false;
    avisoGuia.hidden = true;
    areaFeedback.replaceChildren();
    tela.classList.remove('com-feedback');

    const time = timeDaVez();
    vezDaEquipe.hidden = !modoEquipes;
    vezDaEquipe.className = `vez-da-equipe cor-${time.cor}`;
    vezDaEquipe.textContent = `Vez da equipe ${time.emoji} ${time.nome}!`;
    tipoEl.textContent = rotuloDoTipo(pergunta);
    tituloEl.textContent = pergunta.titulo;
    destaqueEl.replaceChildren(desenharDestaque(pergunta));
    desenharRespostas(pergunta);
    desenharAjudas();
    atualizarProgresso();
    atualizarPlacar();
    atualizarCombo();

    relogioEl.hidden = !comTempo();
    relogio.duracaoMs = obterConfig().tempoPorPergunta * 1000;
    relogio.restanteMs = relogio.duracaoMs;
    relogio.ultimoSegundo = null;
    desenharRelogio();

    entrar([destaqueEl, ...respostasEl.children], { y: 30, intervalo: 0.05 });
    if (modoEquipes && !animacoesReduzidas()) {
      gsap.fromTo(
        vezDaEquipe,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' },
      );
    }
    if (pergunta.destaque.audio) {
      falar(pergunta.destaque.audio);
    }
    tituloEl.focus({ preventScroll: true });
    // Pequena pausa para a pergunta aparecer antes de o tempo começar a correr.
    atrasoDeInicio = window.setTimeout(rodarRelogio, animacoesReduzidas() ? 0 : 400);
  }

  // ---------- Ajudas ----------
  function usarAjuda(id, botao) {
    const time = timeDaVez();
    if (estado !== 'pergunta' || !time.ajudas[id]) {
      return;
    }
    const pergunta = perguntas[indice];
    time.ajudas[id] = false;
    botao.disabled = true;
    tocarClique();
    if (id === 'meio') {
      const botoes = [...respostasEl.children];
      const erradas = botoes.filter((_, posicao) => posicao !== pergunta.correta);
      erradas
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .forEach((errada) => {
          errada.disabled = true;
          errada.classList.add('resposta-eliminada');
        });
    } else if (id === 'tempo') {
      relogio.restanteMs += BONUS_DE_TEMPO_MS;
      relogio.duracaoMs = Math.max(relogio.duracaoMs, relogio.restanteMs);
      desenharRelogio();
      pulsar(relogioEl, 1.06);
    } else if (id === 'ouvir') {
      falar(pergunta.palavra?.kana ?? pergunta.item.kana);
    }
  }

  // ---------- Resposta ----------
  function anunciarCombo(mult) {
    anuncioCombo.textContent = `COMBO x${mult}! 🔥`;
    tocarCombo(mult);
    if (animacoesReduzidas()) {
      return;
    }
    gsap.fromTo(
      anuncioCombo,
      { scale: 0.3, opacity: 0, rotation: -12 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.45,
        ease: 'back.out(2.5)',
        onComplete: () => gsap.to(anuncioCombo, { opacity: 0, duration: 0.4, delay: 0.7 }),
      },
    );
  }

  function responder(posicao) {
    if (estado !== 'pergunta') {
      return;
    }
    estado = 'resposta';
    window.clearTimeout(atrasoDeInicio);
    pararRelogio();
    const pergunta = perguntas[indice];
    const time = timeDaVez();
    const acertou = posicao === pergunta.correta;
    const botoes = [...respostasEl.children];
    const fracaoRestante = comTempo() ? Math.max(0, relogio.restanteMs) / relogio.duracaoMs : null;

    time.respondidas += 1;
    let pontos = 0;
    let novaFigurinha = false;
    const multAntes = multiplicador(time.combo);
    if (acertou) {
      time.combo += 1;
      time.maiorCombo = Math.max(time.maiorCombo, time.combo);
      time.acertos += 1;
      pontos = pontosDoAcerto({ fracaoRestante, combo: time.combo, consultouGuia });
      time.pontos += pontos;
      if (pergunta.palavra) {
        novaFigurinha = colarNoAlbum(pergunta.palavra.id);
        if (novaFigurinha) {
          palavrasNovas.add(pergunta.palavra.id);
        }
      }
    } else {
      time.combo = 0;
    }
    pergunta.idsRevisao.forEach((id) => registrarResposta(id, acertou));
    historico.push({
      pergunta,
      acertou,
      escolhida: posicao === null ? null : pergunta.opcoes[posicao],
      equipe: time,
    });

    // Mostra nas alternativas o que era certo e o que foi marcado.
    botoes.forEach((botao, i) => {
      botao.disabled = true;
      botao.classList.toggle('resposta-correta', i === pergunta.correta);
      botao.classList.toggle('resposta-marcada-errada', i === posicao && !acertou);
      botao.classList.toggle('resposta-apagada', i !== pergunta.correta && i !== posicao);
    });
    [...ajudasEl.children].forEach((botao) => {
      botao.disabled = true;
    });

    const botaoCerto = botoes[pergunta.correta];
    if (acertou) {
      tocarAcerto();
      const caixa = botaoCerto.getBoundingClientRect();
      explodirConfete(caixa.left + caixa.width / 2, caixa.top + caixa.height / 2);
      pulsar(botaoCerto, 1.08);
      const multDepois = multiplicador(time.combo);
      if (multDepois > multAntes) {
        anunciarCombo(multDepois);
      }
    } else if (posicao === null) {
      tocarTempoEsgotado();
      tremer(relogioEl);
    } else {
      tocarErro();
      tremer(botoes[posicao]);
    }

    atualizarPlacar(acertou ? time : null);
    atualizarCombo();
    atualizarProgresso();

    const ultima = indice === perguntas.length - 1;
    const { cartao, botao } = criarFeedback(pergunta, {
      acertou,
      escolhida: posicao === null ? null : pergunta.opcoes[posicao],
      pontos,
      tempoEsgotado: posicao === null,
      novaFigurinha,
      consultouGuia,
      ultima,
      aoContinuar: avancar,
    });
    areaFeedback.replaceChildren(cartao);
    tela.classList.add('com-feedback');
    entrar(cartao, { y: 40 });
    if (obterConfig().falarAoMostrar) {
      falar(pergunta.palavra?.kana ?? pergunta.item.kana);
    }
    botao.focus({ preventScroll: true });
    cartao.scrollIntoView?.({
      block: 'nearest',
      behavior: animacoesReduzidas() ? 'auto' : 'smooth',
    });
  }

  function avancar() {
    if (estado !== 'resposta') {
      return;
    }
    tocarClique();
    if (indice === perguntas.length - 1) {
      estado = 'fim';
      aoTerminar({ temporada, times, historico, palavrasNovas: [...palavrasNovas] });
      return;
    }
    indice += 1;
    mostrarPergunta();
  }

  // ---------- Pausa ----------
  function pausar() {
    if (estado === 'fim' || modalDePausa) {
      return;
    }
    modalDePausa = abrirModal({
      titulo: '⏸ Show pausado',
      classe: 'modal-pausa',
      aoFechar: () => {
        modalDePausa = null;
      },
      conteudo: [
        criarElemento('p', { text: 'O cronômetro está parado. Respire fundo! 😄' }),
        criarElemento('div', { class: 'acoes' }, [
          criarElemento('button', {
            type: 'button',
            class: 'botao',
            text: '▶ Continuar',
            onClick: () => modalDePausa?.fechar(),
          }),
          criarElemento('button', {
            type: 'button',
            class: 'botao botao-secundario',
            text: '🚪 Sair do show',
            onClick: () => {
              modalDePausa?.fechar();
              aoSair();
            },
          }),
        ]),
      ],
    });
  }

  // ---------- Eventos globais ----------
  function aoModal(evento) {
    modalAberto = evento.detail.aberto;
    if (modalAberto) {
      pararRelogio();
    } else {
      rodarRelogio();
    }
  }

  function aoGuia() {
    if (estado === 'pergunta' && !consultouGuia) {
      consultouGuia = true;
      avisoGuia.hidden = false;
    }
  }

  function aoVisibilidade() {
    if (document.hidden) {
      pararRelogio();
    } else {
      rodarRelogio();
    }
  }

  function aoTeclar(evento) {
    if (modalAberto || evento.ctrlKey || evento.metaKey || evento.altKey) {
      return;
    }
    if (evento.key === 'Escape') {
      evento.preventDefault();
      pausar();
      return;
    }
    const posicao = TECLAS[evento.key.toLowerCase()];
    if (posicao !== undefined && estado === 'pergunta') {
      const botao = respostasEl.children[posicao];
      if (botao && !botao.disabled) {
        evento.preventDefault();
        responder(posicao);
      }
    }
  }

  document.addEventListener('ks:modal', aoModal);
  document.addEventListener('ks:guia', aoGuia);
  document.addEventListener('visibilitychange', aoVisibilidade);
  window.addEventListener('keydown', aoTeclar);

  mostrarPergunta();

  return () => {
    estado = 'fim';
    pararRelogio();
    window.clearTimeout(atrasoDeInicio);
    document.removeEventListener('ks:modal', aoModal);
    document.removeEventListener('ks:guia', aoGuia);
    document.removeEventListener('visibilitychange', aoVisibilidade);
    window.removeEventListener('keydown', aoTeclar);
    gsap.killTweensOf(tela.querySelectorAll('*'));
    modalDePausa?.fechar();
  };
}
