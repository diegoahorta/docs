// Ponto de entrada do Katakana Show: liga a barra do topo e troca as telas
// (início → rodada → resultado). Só uma tela existe por vez: ao trocar, a
// anterior é limpa (cronômetro, ouvintes e animações).

import { aplicarNoDocumento, aoMudarConfig } from './core/settings.js';
import { aguardarFontes } from './core/utils.js';
import { tocarAbertura } from './core/audio.js';
import { abrirGuia } from './ui/guia.js';
import { abrirAlbum } from './ui/album.js';
import { abrirConfig } from './ui/config.js';
import { limparConfete } from './ui/confete.js';
import { mostrarInicio } from './telas/inicio.js';
import { mostrarJogo } from './telas/jogo.js';
import { mostrarResultado } from './telas/resultado.js';

const conteudo = document.getElementById('conteudo');
let limparTelaAtual = null;
let telaAtual = '';

/** Troca a tela: limpa a anterior e monta a nova. */
function trocarTela(nome, montar) {
  limparTelaAtual?.();
  limparConfete();
  telaAtual = nome;
  document.body.dataset.tela = nome;
  window.scrollTo({ top: 0 });
  limparTelaAtual = montar(conteudo);
}

function irParaInicio() {
  trocarTela('inicio', (conteiner) =>
    mostrarInicio(conteiner, {
      aoComecar: (opcoes) => {
        tocarAbertura();
        irParaJogo(opcoes);
      },
    }),
  );
}

function irParaJogo(opcoes) {
  trocarTela('jogo', (conteiner) =>
    mostrarJogo(conteiner, {
      ...opcoes,
      aoTerminar: (resultado) => irParaResultado(resultado, opcoes),
      aoSair: irParaInicio,
    }),
  );
}

function irParaResultado(resultado, opcoes) {
  trocarTela('resultado', (conteiner) =>
    mostrarResultado(conteiner, resultado, {
      aoJogarDeNovo: () => irParaJogo(opcoes),
      aoInicio: irParaInicio,
    }),
  );
}

/** Botão "voltar" do Android (se o jogo for empacotado como app). */
window.voltarApp = () => {
  const fecharModal = document.querySelector('.modal-fundo .botao-icone');
  if (fecharModal) {
    fecharModal.click();
    return true;
  }
  if (telaAtual === 'jogo') {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    return true;
  }
  if (telaAtual === 'resultado') {
    irParaInicio();
    return true;
  }
  return false;
};

async function iniciar() {
  aplicarNoDocumento();
  aoMudarConfig(aplicarNoDocumento);

  document.getElementById('botao-guia').addEventListener('click', () => abrirGuia());
  document.getElementById('botao-album').addEventListener('click', () => abrirAlbum());
  document
    .getElementById('botao-config')
    .addEventListener('click', () =>
      abrirConfig({ aoApagar: () => telaAtual === 'inicio' && irParaInicio() }),
    );
  document.getElementById('botao-logo').addEventListener('click', () => {
    if (telaAtual === 'jogo') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } else {
      irParaInicio();
    }
  });

  await aguardarFontes();
  irParaInicio();
}

iniciar();
