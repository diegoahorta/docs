// Ponto de entrada: aplica as configurações, monta o HUD e cuida da
// navegação entre o menu 3D e os minijogos.

import { aplicarNoDocumento } from './core/settings.js';
import { criarRoteador } from './router.js';
import { montarTelaMenu } from './menu3d/menuScreen.js';
import { montarTelaJogo } from './games/gameScreen.js';
import { montarHud } from './ui/hud.js';
import { abrirTabelaKana } from './ui/kanaChart.js';
import { abrirConfiguracoes } from './ui/settingsPanel.js';
import { abrirPainelProgresso } from './ui/progressPanel.js';
import { abrirPainelConquistas, iniciarAvisosDeConquista } from './ui/achievementsToast.js';
import { mostrarMensagem } from './ui/feedback.js';

aplicarNoDocumento();

const roteador = criarRoteador(document.getElementById('tela'), document.getElementById('cortina'));

const hud = montarHud(document.getElementById('hud'), {
  aoVoltar: irParaMenu,
  aoEstudar: () => abrirTabelaKana(),
  aoVerProgresso: () => abrirPainelProgresso(),
  aoConquistas: abrirPainelConquistas,
  aoConfig: abrirConfiguracoes,
});

iniciarAvisosDeConquista();

let telaAtual = 'menu';

function irParaMenu() {
  telaAtual = 'menu';
  hud.mostrarVoltar(false);
  return roteador.irPara(montarTelaMenu, { aoEscolherJogo: irParaJogo });
}

async function irParaJogo(jogoId) {
  telaAtual = 'jogo';
  hud.mostrarVoltar(true);
  try {
    await roteador.irPara(montarTelaJogo, { jogoId, aoSair: irParaMenu });
  } catch (erro) {
    console.error(erro);
    mostrarMensagem('Não foi possível abrir o jogo. Voltando ao menu…');
    irParaMenu();
  }
}

/**
 * Botão "voltar" do app Android: fecha o modal de cima; num jogo, volta ao
 * menu. Devolve false no menu sem modal (aí o app fecha).
 */
window.voltarApp = () => {
  if (document.querySelector('.modal-fundo')) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    return true;
  }
  if (telaAtual === 'jogo') {
    irParaMenu();
    return true;
  }
  return false;
};

irParaMenu();
