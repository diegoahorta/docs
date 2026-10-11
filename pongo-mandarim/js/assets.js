// Caminhos das imagens. Na versão em arquivo HTML único, window.PONGO_ASSETS traz
// cada imagem como data: URI; no projeto normal, o caminho relativo é usado.
const EMBED = window.PONGO_ASSETS || {};
export const asset = (path) => EMBED[path] || path;

export const EXPR = ['feliz', 'empolgado', 'piscando', 'curioso', 'surpreso', 'triste', 'pensativo', 'tchau', 'assustado', 'carinhoso', 'osso', 'brincalhao'];
export const expr = (name) => asset(`assets/img/expr/${name}.webp`);

// Folhas de sprites recortadas das artes do Pongo (8 quadros cada, alinhados pelo chão)
export const SPRITES = {
  walk: { src: 'assets/sprites/pongo-walk.webp', frames: 8, w: 160, h: 195 },
  jump: { src: 'assets/sprites/pongo-jump.webp', frames: 8, w: 161, h: 293 },
};
