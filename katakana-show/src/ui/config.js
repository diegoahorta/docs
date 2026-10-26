// ⚙️ Configurações: tempo por pergunta, efeitos sonoros, voz e animações.

import { OPCOES_DE_TEMPO, alterarConfig, obterConfig } from '../core/settings.js';
import { falar, falaDisponivel, temVozJaponesa } from '../core/speech.js';
import { apagarTudo } from '../core/storage.js';
import { criarElemento } from '../core/utils.js';
import { abrirModal } from './modal.js';

/** Um <select> com rótulo. */
function campoSelecao(rotulo, chave, opcoes) {
  const id = `config-${chave}`;
  const atual = obterConfig()[chave];
  const selecao = criarElemento(
    'select',
    {
      id,
      onChange: () => {
        const opcao = opcoes[selecao.selectedIndex];
        alterarConfig(chave, opcao.valor);
      },
    },
    opcoes.map((opcao) =>
      criarElemento('option', { text: opcao.nome, selected: opcao.valor === atual }),
    ),
  );
  return criarElemento('div', { class: 'campo' }, [
    criarElemento('label', { for: id, text: rotulo }),
    selecao,
  ]);
}

/** Um controle deslizante com rótulo. */
function campoDeslizante(rotulo, chave, { minimo, maximo, passo, aoSoltar }) {
  const id = `config-${chave}`;
  const controle = criarElemento('input', {
    id,
    type: 'range',
    min: minimo,
    max: maximo,
    step: passo,
    value: obterConfig()[chave],
    onInput: () => alterarConfig(chave, Number(controle.value)),
    onChange: () => aoSoltar?.(),
  });
  return criarElemento('div', { class: 'campo' }, [
    criarElemento('label', { for: id, text: rotulo }),
    controle,
  ]);
}

function avisoDeVoz() {
  if (!falaDisponivel()) {
    return '⚠️ Este navegador não tem síntese de voz. Use o Chrome, o Edge ou o Safari.';
  }
  if (!temVozJaponesa()) {
    return '⚠️ Não encontramos uma voz em japonês. No Windows: Configurações → Hora e idioma → Fala → Adicionar vozes → Japonês. No Android: Configurações → Idiomas → Saída de texto para fala.';
  }
  return '✅ Voz em japonês encontrada.';
}

/** Abre o painel de configurações. */
export function abrirConfig({ aoApagar } = {}) {
  const botaoApagar = criarElemento('button', {
    type: 'button',
    class: 'botao botao-perigo',
    text: '🗑️ Apagar recordes e álbum',
    onClick: () => {
      if (botaoApagar.dataset.confirmar === 'sim') {
        apagarTudo();
        modal.fechar();
        aoApagar?.();
        return;
      }
      botaoApagar.dataset.confirmar = 'sim';
      botaoApagar.textContent = 'Tem certeza? Clique de novo para apagar';
    },
  });

  const modal = abrirModal({
    titulo: '⚙️ Configurações',
    classe: 'modal-config',
    conteudo: [
      campoSelecao('⏱️ Tempo por pergunta', 'tempoPorPergunta', OPCOES_DE_TEMPO),
      campoDeslizante('🔔 Volume dos efeitos', 'volumeEfeitos', {
        minimo: 0,
        maximo: 1,
        passo: 0.1,
      }),
      campoDeslizante('🗣️ Velocidade da voz', 'velocidadeFala', {
        minimo: 0.5,
        maximo: 1.2,
        passo: 0.05,
        aoSoltar: () => falar('カタカナ'),
      }),
      campoSelecao('🔊 Falar a palavra ao mostrar a resposta', 'falarAoMostrar', [
        { valor: true, nome: 'Sim' },
        { valor: false, nome: 'Não' },
      ]),
      campoSelecao('✨ Animações', 'movimento', [
        { valor: 'sistema', nome: 'Seguir o sistema' },
        { valor: 'completo', nome: 'Completas' },
        { valor: 'reduzido', nome: 'Reduzidas' },
      ]),
      criarElemento('p', { class: 'texto-suave', text: avisoDeVoz() }),
      botaoApagar,
    ],
  });
  return modal;
}
