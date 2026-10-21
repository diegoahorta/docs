// Painel de configurações: romaji, animações, volume, fala e progresso.

import { criarElemento } from '../core/utils.js';
import { alterarConfig, obterConfig } from '../core/settings.js';
import { falar, falaDisponivel, temVozJaponesa } from '../core/speech.js';
import { tocarClique } from '../core/audio.js';
import { apagarTudo } from '../core/storage.js';
import { abrirModal } from './modal.js';

const OPCOES_MOVIMENTO = [
  { valor: 'sistema', rotulo: 'Seguir o sistema' },
  { valor: 'reduzido', rotulo: 'Reduzidas' },
  { valor: 'completo', rotulo: 'Completas' },
];

function campoInterruptor(chave, rotulo, descricao) {
  const entrada = criarElemento('input', { type: 'checkbox', checked: obterConfig()[chave] });
  entrada.addEventListener('change', () => alterarConfig(chave, entrada.checked));
  return criarElemento('label', { class: 'campo campo-interruptor' }, [
    entrada,
    criarElemento('span', {}, [
      criarElemento('strong', { text: rotulo }),
      descricao ? criarElemento('small', { text: descricao }) : null,
    ]),
  ]);
}

function campoMovimento() {
  const atual = obterConfig().movimento;
  const opcoes = OPCOES_MOVIMENTO.map(({ valor, rotulo }) => {
    const entrada = criarElemento('input', {
      type: 'radio',
      name: 'movimento',
      value: valor,
      checked: valor === atual,
    });
    entrada.addEventListener('change', () => alterarConfig('movimento', valor));
    return criarElemento('label', { class: 'opcao' }, [entrada, rotulo]);
  });
  return criarElemento('fieldset', { class: 'campo' }, [
    criarElemento('legend', { text: 'Animações' }),
    criarElemento('div', { class: 'grupo-opcoes' }, opcoes),
  ]);
}

function campoDeslizante(chave, rotulo, { min, max, passo, aoSoltar }) {
  const entrada = criarElemento('input', {
    type: 'range',
    min,
    max,
    step: passo,
    value: obterConfig()[chave],
  });
  entrada.addEventListener('input', () => alterarConfig(chave, Number(entrada.value)));
  entrada.addEventListener('change', () => aoSoltar?.());
  return criarElemento('label', { class: 'campo' }, [
    criarElemento('strong', { text: rotulo }),
    entrada,
  ]);
}

function secaoVoz() {
  const status = criarElemento('small', { class: 'texto-suave' });
  const atualizarStatus = () => {
    if (!falaDisponivel()) {
      status.textContent = 'Seu navegador não tem síntese de voz.';
    } else if (!temVozJaponesa()) {
      status.textContent =
        'Nenhuma voz japonesa encontrada. Instale a voz "Japonês" nas configurações do sistema para ouvir a pronúncia correta.';
    } else {
      status.textContent = 'Voz japonesa encontrada. ✔';
    }
  };
  atualizarStatus();
  const botaoTestar = criarElemento('button', {
    type: 'button',
    class: 'botao botao-secundario',
    text: '🔊 Testar: こんにちは',
    onClick: () => {
      falar('こんにちは');
      atualizarStatus();
    },
  });
  return criarElemento('div', { class: 'campo' }, [
    campoDeslizante('velocidadeFala', 'Velocidade da fala', { min: 0.5, max: 1.2, passo: 0.05 }),
    botaoTestar,
    status,
  ]);
}

function secaoPerigo() {
  const botaoApagar = criarElemento('button', {
    type: 'button',
    class: 'botao botao-perigo',
    text: 'Apagar todo o progresso',
    onClick: () => {
      const confirmou = window.confirm(
        'Tem certeza? XP, streak, conquistas e o histórico do SRS serão apagados.',
      );
      if (confirmou) {
        apagarTudo();
        window.location.reload();
      }
    },
  });
  return criarElemento('div', { class: 'campo' }, botaoApagar);
}

/** Abre o painel de configurações em um modal. */
export function abrirConfiguracoes() {
  abrirModal({
    titulo: 'Configurações',
    classe: 'modal-config',
    conteudo: [
      campoInterruptor('mostrarRomaji', 'Mostrar romaji', 'Exibe a leitura em letras latinas.'),
      campoMovimento(),
      campoDeslizante('volumeEfeitos', 'Volume dos efeitos', {
        min: 0,
        max: 1,
        passo: 0.1,
        aoSoltar: tocarClique,
      }),
      secaoVoz(),
      campoInterruptor(
        'liberarTodasFases',
        'Liberar todas as fases',
        'Ignora o XP necessário para abrir cada minijogo.',
      ),
      secaoPerigo(),
      criarElemento('p', { class: 'creditos' }, [
        'Ordem dos traços: ',
        criarElemento('a', {
          href: 'https://kanjivg.tagaini.net',
          target: '_blank',
          rel: 'noopener',
          text: 'KanjiVG',
        }),
        ' (CC BY-SA 3.0). Fonte: Noto Sans JP.',
      ]),
    ],
  });
}
