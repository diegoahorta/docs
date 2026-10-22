// Teclado dos minijogos, escutado direto na janela.
// Não usamos o plugin de teclado do Phaser porque, quando várias teclas
// chegam no mesmo quadro, ele pode repetir eventos (a seta andava duas casas).
// Assim cada tecla gera exatamente um evento, na hora, e o preventDefault vale.

/** Escuta o keydown da janela. Devolve a função que para de escutar. */
export function ouvirTeclado(aoTeclar) {
  window.addEventListener('keydown', aoTeclar);
  return () => window.removeEventListener('keydown', aoTeclar);
}
