// Utilitários genéricos usados em todo o projeto.

/** Devolve uma cópia embaralhada do array (algoritmo de Fisher–Yates). */
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Sorteia um elemento qualquer do array. */
export function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

/** Pequeno emissor de eventos (on / emit). `on` devolve a função para cancelar. */
export function criarEmissor() {
  const ouvintes = new Map();
  return {
    on(evento, callback) {
      if (!ouvintes.has(evento)) {
        ouvintes.set(evento, new Set());
      }
      ouvintes.get(evento).add(callback);
      return () => ouvintes.get(evento)?.delete(callback);
    },
    emit(evento, dados) {
      ouvintes.get(evento)?.forEach((callback) => {
        try {
          callback(dados);
        } catch (erro) {
          console.error(erro);
        }
      });
    },
  };
}

/** Promessa que resolve depois de `ms` milissegundos. */
export function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Cria um elemento HTML de forma declarativa.
 * Atributos especiais: class, text, dataset e onEvento (ex.: onClick).
 */
export function criarElemento(tag, atributos = {}, filhos = []) {
  const elemento = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    aplicarAtributo(elemento, chave, valor);
  }
  for (const filho of [].concat(filhos)) {
    if (filho !== null && filho !== undefined && filho !== false) {
      elemento.append(filho instanceof Node ? filho : String(filho));
    }
  }
  return elemento;
}

function aplicarAtributo(elemento, chave, valor) {
  if (valor === undefined || valor === null || valor === false) {
    return;
  }
  if (chave === 'class') {
    elemento.className = valor;
  } else if (chave === 'text') {
    elemento.textContent = valor;
  } else if (chave === 'dataset') {
    Object.assign(elemento.dataset, valor);
  } else if (/^on[A-Z]/.test(chave) && typeof valor === 'function') {
    elemento.addEventListener(chave.slice(2).toLowerCase(), valor);
  } else {
    elemento.setAttribute(chave, valor === true ? '' : String(valor));
  }
}

/** Espera as fontes carregarem (com limite de tempo), para o katakana não "pular" na tela. */
export async function aguardarFontes(limiteMs = 2500) {
  if (!document.fonts?.load) {
    return;
  }
  const carregamento = Promise.all([
    document.fonts.load('900 48px "Noto Sans JP"', 'アカサ'),
    document.fonts.load('800 32px "Baloo 2"', 'Katakana'),
  ]).catch(() => null);
  await Promise.race([carregamento, esperar(limiteMs)]);
}
