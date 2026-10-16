// HUD (vida, energia, placar) e telas em HTML: título, menus, diálogos e cartelas.
import { ASSETS } from './config.js';
import { gerarRato, retratoRato } from './ratos.js';

const $ = (sel) => document.querySelector(sel);

export class Hud {
  constructor() {
    this.raiz = $('#hud');
    this.vida = $('#hud-vida');
    this.energia = $('#hud-energia');
    this.barraEnergia = this.energia.parentElement;
    this.vidas = $('#hud-vidas');
    this.pontos = $('#hud-pontos');
    this.combo = $('#hud-combo');
    this.fase = $('#hud-fase');
    this.inimigo = $('#hud-inimigo');
    this.inimigoNome = $('#hud-inimigo-nome');
    this.inimigoVida = $('#hud-inimigo-vida');
    this.siga = $('#hud-siga');
    this.cache = {};
  }

  mostrar(v) {
    this.raiz.hidden = !v;
  }

  definir(chave, el, valor, fn) {
    if (this.cache[chave] === valor) return;
    this.cache[chave] = valor;
    fn(el, valor);
  }

  atualizar({ heroi, pontos, combo, foco, siga, fase }) {
    this.definir('vida', this.vida, Math.round((heroi.vida / heroi.vidaMax) * 100), (el, v) => (el.style.width = v + '%'));
    this.definir('energia', this.energia, Math.round(heroi.energia), (el, v) => {
      el.style.width = v + '%';
      this.barraEnergia.classList.toggle('cheia', v >= 100);
    });
    this.definir('vidas', this.vidas, heroi.vidas, (el, v) => (el.textContent = 'x' + v));
    this.definir('pontos', this.pontos, pontos, (el, v) => (el.textContent = String(v).padStart(7, '0')));
    this.definir('combo', this.combo, combo, (el, v) => (el.textContent = v > 1 ? `COMBO x${v}` : ''));
    this.definir('fase', this.fase, fase, (el, v) => (el.textContent = v));
    this.definir('siga', this.siga, siga, (el, v) => (el.hidden = !v));
    const chaveFoco = foco ? `${foco.nome}:${Math.ceil(foco.vida)}` : '';
    this.definir('foco', this.inimigo, chaveFoco, (el) => {
      el.hidden = !foco;
      if (foco) {
        this.inimigoNome.textContent = foco.nome;
        this.inimigoVida.style.width = Math.max(0, (foco.vida / foco.vidaMax) * 100) + '%';
      }
    });
  }
}

/** Telas sobrepostas. Cada tela é atualizada pelo laço principal e resolve uma Promise ao terminar. */
export class Telas {
  constructor(entrada, audio) {
    this.raiz = $('#telas');
    this.entrada = entrada;
    this.audio = audio;
    this.ativa = null;
  }

  get aberta() {
    return !!this.ativa;
  }

  abrir(tela) {
    this.fechar();
    this.ativa = tela;
    this.raiz.appendChild(tela.el);
    return new Promise((ok) => (tela.resolver = ok));
  }

  fechar(valor) {
    if (!this.ativa) return;
    const t = this.ativa;
    this.ativa = null;
    t.el.remove();
    t.resolver?.(valor);
  }

  atualizar(dt) {
    this.ativa?.atualizar(dt, this.entrada);
  }

  // ---------- Menu genérico ----------
  menu({ titulo, conteudo, itens, classe = 'escura', voltar, lado = false }) {
    const el = document.createElement('div');
    el.className = 'tela ' + classe;
    if (titulo) el.insertAdjacentHTML('beforeend', titulo);
    const corpo = lado ? document.createElement('div') : el;
    if (lado) {
      corpo.className = 'lado-a-lado';
      el.appendChild(corpo);
    }
    if (conteudo) corpo.appendChild(conteudo);
    const lista = document.createElement('div');
    lista.className = 'menu';
    corpo.appendChild(lista);
    const botoes = itens.map((item, i) => {
      const b = document.createElement('button');
      b.className = 'botao-verde';
      b.textContent = typeof item.texto === 'function' ? item.texto() : item.texto;
      b.addEventListener('click', () => escolher(i));
      b.addEventListener('pointerenter', () => focar(i));
      lista.appendChild(b);
      return b;
    });
    let foco = 0;
    const focar = (i) => {
      foco = (i + botoes.length) % botoes.length;
      botoes.forEach((b, k) => b.classList.toggle('foco', k === foco));
    };
    const escolher = (i) => {
      const item = itens[i];
      this.audio.iniciar();
      this.audio.sfx('confirmar');
      if (item.acao) {
        // ação que não fecha o menu (ex.: alternar opção)
        item.acao();
        botoes[i].textContent = typeof item.texto === 'function' ? item.texto() : item.texto;
        return;
      }
      this.fechar(item.valor);
    };
    focar(0);
    const tela = {
      el,
      atualizar: (dt, ent) => {
        if (ent.consumir('cima')) {
          focar(foco - 1);
          this.audio.sfx('cursor');
        }
        if (ent.consumir('baixo')) {
          focar(foco + 1);
          this.audio.sfx('cursor');
        }
        if (ent.consumir('confirmar') || ent.consumir('soco') || ent.consumir('pular')) {
          botoes[foco].classList.add('apertado');
          setTimeout(() => botoes[foco]?.classList.remove('apertado'), 120);
          escolher(foco);
        }
        if (voltar !== undefined && ent.consumir('pausa')) this.fechar(voltar);
      },
    };
    return this.abrir(tela);
  }

  titulo(opcoes) {
    const conteudo = document.createElement('div');
    conteudo.className = 'capa';
    const heroi = document.createElement('img');
    heroi.src = 'sprites/heroi_frente_pose.png';
    heroi.className = 'retrato-grande';
    const ratos = document.createElement('canvas');
    const rei = gerarRato('rei').quadros.parado0;
    const rato = gerarRato('ratinho').quadros.preparar;
    const taz = gerarRato('ratazana').quadros.parado0;
    ratos.width = 200;
    ratos.height = 140;
    const ctx = ratos.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(taz, -200, 140 - taz.height * 1.6, taz.width * 1.6, taz.height * 1.6);
    ctx.drawImage(rato, -90, 140 - rato.height * 1.6, rato.width * 1.6, rato.height * 1.6);
    ctx.drawImage(rei, -150, 140 - rei.height * 2, rei.width * 2, rei.height * 2);
    ctx.restore();
    ratos.className = 'retrato-grande';
    ratos.style.height = 'calc(var(--u) * 190)';
    conteudo.append(heroi, ratos);

    return this.menu({
      classe: 'escura titulo-tela',
      lado: true,
      titulo: '<div class="titulo">BOULOS<small>vs. A GANGUE DOS RATOS</small></div>',
      conteudo,
      itens: [
        { texto: 'JOGAR', valor: 'jogar' },
        { texto: 'CONTROLES', valor: 'controles' },
        { texto: () => 'MÚSICA: ' + this.audio.descricaoModo(), acao: opcoes.alternarMusica },
        { texto: () => 'TELA CRT: ' + (opcoes.scanlinesLigado() ? 'LIGADA' : 'DESLIGADA'), acao: opcoes.alternarScanlines },
      ],
    });
  }

  controles() {
    const c = document.createElement('div');
    c.className = 'controles';
    const linha = (teclas, desc) => {
      c.insertAdjacentHTML('beforeend', `<div class="teclas">${teclas}</div><div>${desc}</div>`);
    };
    const t = (classe, letra = '') => `<span class="tecla ${classe}">${letra}</span>`;
    linha(t('seta-esq') + t('seta-cima') + t('seta-baixo') + t('seta-dir') + ' ' + t('vazia', 'W') + t('vazia', 'A') + t('vazia', 'S') + t('vazia', 'D'), 'ANDAR');
    linha(t('larga', 'ESPACO') + t('vazia', 'K'), 'PULAR (BAIXO + PULAR DESCE DA PLATAFORMA)');
    linha(t('vazia', 'J') + t('vazia', 'Z'), 'SOCO (3 SEGUIDOS = COMBO) / VOADORA NO AR');
    linha(t('vazia', 'L') + t('vazia', 'X'), 'PEGAR E ARREMESSAR GARRAFA OU PEDRA');
    linha(t('vazia', 'U') + t('vazia', 'C'), 'FORCA DO POVO (ENERGIA CHEIA)');
    linha(t('esc anim'), 'PAUSA');
    linha(t('vazia', 'M') + t('vazia', 'V') + t('vazia', 'F'), 'MUSICA / TELA CRT / TELA CHEIA');
    return this.menu({
      classe: 'opaca',
      titulo: '<div class="subtitulo">CONTROLES</div>',
      conteudo: c,
      itens: [{ texto: 'VOLTAR', valor: 'voltar' }],
      voltar: 'voltar',
    });
  }

  // ---------- Diálogo com efeito de máquina de escrever ----------
  dialogo(falas, { fundo = false } = {}) {
    let i = 0;
    let visivel = 0;
    let acumulado = 0;
    const el = document.createElement('div');
    el.className = 'tela' + (fundo ? ' opaca' : '');
    const caixa = document.createElement('div');
    caixa.className = 'dialogo';
    el.appendChild(caixa);
    const montar = () => {
      const f = falas[i];
      caixa.innerHTML = '';
      if (f.quem === 'BOULOS') {
        const img = document.createElement('img');
        img.src = 'sprites/heroi_retrato.png';
        caixa.appendChild(img);
      } else if (f.retrato) {
        caixa.appendChild(retratoRato(f.retrato));
      }
      const texto = document.createElement('div');
      texto.innerHTML = `<div class="quem">${f.quem}</div><div class="fala"></div><div class="continuar">ENTER</div>`;
      caixa.appendChild(texto);
      this.falaEl = texto.querySelector('.fala');
      visivel = 0;
      acumulado = 0;
    };
    const avancar = () => {
      const f = falas[i];
      if (visivel < f.texto.length) {
        visivel = f.texto.length;
        this.falaEl.textContent = f.texto;
        return;
      }
      i++;
      this.audio.sfx('confirmar');
      if (i >= falas.length) this.fechar();
      else montar();
    };
    el.addEventListener('click', avancar);
    montar();
    return this.abrir({
      el,
      atualizar: (dt, ent) => {
        const f = falas[i];
        if (!f) return;
        if (visivel < f.texto.length) {
          acumulado += dt * 45;
          const novo = Math.min(f.texto.length, Math.floor(acumulado));
          if (novo > visivel) {
            visivel = novo;
            this.falaEl.textContent = f.texto.slice(0, visivel);
            if (visivel % 3 === 0) this.audio.sfx('texto');
          }
        }
        if (ent.consumir('confirmar') || ent.consumir('soco') || ent.consumir('pular')) avancar();
        if (ent.consumir('pausa')) this.fechar();
      },
    });
  }

  // ---------- Cartela de fase ----------
  cartela(titulo, subtitulo, segundos = 2.4) {
    const el = document.createElement('div');
    el.className = 'tela escura';
    el.innerHTML = `<div class="cartela">${titulo}</div><div class="subtitulo">${subtitulo}</div>`;
    let t = 0;
    return this.abrir({
      el,
      atualizar: (dt, ent) => {
        t += dt;
        if (t > segundos || (t > 0.4 && (ent.consumir('confirmar') || ent.consumir('soco')))) this.fechar();
      },
    });
  }

  aviso(texto, segundos = 1.6) {
    const el = document.createElement('div');
    el.className = 'tela';
    el.style.pointerEvents = 'none';
    el.innerHTML = `<div class="cartela">${texto}</div>`;
    this.raiz.appendChild(el);
    setTimeout(() => el.remove(), segundos * 1000);
  }
}

export function preCarregarUi() {
  // Garante que as imagens de botões estejam em cache antes do primeiro menu.
  for (const n of ['botao-verde', 'botao-verde-pressionado', 'tecla-esc', 'tecla-esc-pressionada']) {
    const img = new Image();
    img.src = `${ASSETS}sprites/ui/${n}.png`;
  }
}
