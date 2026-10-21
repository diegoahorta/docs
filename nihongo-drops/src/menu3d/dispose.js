// Libera da GPU tudo o que um objeto Three.js criou: geometrias, materiais e texturas.
// Sem isso, cada visita ao menu vazaria memória de vídeo.

/** Percorre a árvore e chama dispose() em cada recurso (uma vez por recurso). */
export function liberarObjeto(raiz) {
  const geometrias = new Set();
  const materiais = new Set();
  const texturas = new Set();

  raiz.traverse((objeto) => {
    if (objeto.geometry) {
      geometrias.add(objeto.geometry);
    }
    const lista = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    for (const material of lista) {
      if (!material) {
        continue;
      }
      materiais.add(material);
      for (const valor of Object.values(material)) {
        if (valor?.isTexture) {
          texturas.add(valor);
        }
      }
    }
  });

  geometrias.forEach((geometria) => geometria.dispose());
  materiais.forEach((material) => material.dispose());
  texturas.forEach((textura) => textura.dispose());
  raiz.clear();
}
