// Teclado, controle (gamepad) e botões de toque, unificados em ações.
const MAPA = {
  ArrowLeft: 'esquerda', KeyA: 'esquerda',
  ArrowRight: 'direita', KeyD: 'direita',
  ArrowUp: 'cima', KeyW: 'cima',
  ArrowDown: 'baixo', KeyS: 'baixo',
  Space: 'pular', KeyK: 'pular',
  KeyJ: 'soco', KeyZ: 'soco',
  KeyL: 'pegar', KeyX: 'pegar',
  KeyU: 'especial', KeyC: 'especial',
  Escape: 'pausa', KeyP: 'pausa',
  Enter: 'confirmar', NumpadEnter: 'confirmar',
  KeyM: 'musica',
  KeyV: 'scanlines',
  KeyF: 'telaCheia',
};

export class Entrada {
  constructor() {
    this.segurando = new Set();
    this.apertou = new Set();
    this.toque = new Set();
    this.controleAntes = new Set();
    this.aoInteragir = () => {};

    addEventListener('keydown', (e) => {
      const acao = MAPA[e.code];
      this.aoInteragir();
      if (!acao) return;
      e.preventDefault();
      if (!e.repeat) this.apertou.add(acao);
      this.segurando.add(acao);
    });
    addEventListener('keyup', (e) => {
      const acao = MAPA[e.code];
      if (acao) this.segurando.delete(acao);
    });
    addEventListener('blur', () => this.segurando.clear());
    addEventListener('pointerdown', () => this.aoInteragir());
  }

  ligarToque(raiz) {
    for (const botao of raiz.querySelectorAll('[data-tecla]')) {
      const acao = botao.dataset.tecla;
      const soltar = (e) => {
        e.preventDefault();
        this.toque.delete(acao);
        botao.classList.remove('ativo', 'apertado');
      };
      botao.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        botao.setPointerCapture?.(e.pointerId);
        this.toque.add(acao);
        this.apertou.add(acao);
        botao.classList.add('ativo', 'apertado');
      });
      botao.addEventListener('pointerup', soltar);
      botao.addEventListener('pointercancel', soltar);
      botao.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  lerControle() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const agora = new Set();
    for (const p of pads) {
      if (!p) continue;
      const [ax, ay] = p.axes;
      const b = (i) => p.buttons[i]?.pressed;
      if (ax < -0.4 || b(14)) agora.add('esquerda');
      if (ax > 0.4 || b(15)) agora.add('direita');
      if (ay < -0.4 || b(12)) agora.add('cima');
      if (ay > 0.4 || b(13)) agora.add('baixo');
      if (b(0)) agora.add('pular');
      if (b(2)) agora.add('soco');
      if (b(1)) agora.add('pegar');
      if (b(3)) agora.add('especial');
      if (b(9)) agora.add('pausa');
      if (b(0) || b(9)) agora.add('confirmar');
    }
    for (const a of agora) if (!this.controleAntes.has(a)) this.apertou.add(a);
    this.controle = agora;
    this.controleAntes = agora;
  }

  /** Ação mantida pressionada. */
  seg(acao) {
    return this.segurando.has(acao) || this.toque.has(acao) || this.controle?.has(acao);
  }

  /** Ação apertada neste quadro. */
  ap(acao) {
    return this.apertou.has(acao);
  }

  /** Consome uma ação apertada (para não disparar duas coisas). */
  consumir(acao) {
    const tinha = this.apertou.has(acao);
    this.apertou.delete(acao);
    return tinha;
  }

  fimDoQuadro() {
    this.apertou.clear();
  }
}
