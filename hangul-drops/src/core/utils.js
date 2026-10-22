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

/** Mantém um número dentro do intervalo [minimo, maximo]. */
export function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

/** Deixa o romanizacao só com letras minúsculas, sem espaços nem pontuação. */
export function normalizarLeitura(texto) {
  return String(texto)
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/** Confere se o texto digitado corresponde à leitura do item (aceita alternativas). */
export function leituraConfere(item, digitado) {
  const resposta = normalizarLeitura(digitado);
  if (!resposta) {
    return false;
  }
  return [item.romanizacao, ...(item.alternativas ?? [])].some(
    (leitura) => normalizarLeitura(leitura) === resposta,
  );
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

/** Data local no formato AAAA-MM-DD (usada no streak diário). */
export function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Quantos dias de calendário separam duas datas AAAA-MM-DD. */
export function diasEntre(isoInicio, isoFim) {
  const emMs = (iso) => {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return Date.UTC(ano, mes - 1, dia);
  };
  return Math.round((emMs(isoFim) - emMs(isoInicio)) / 86_400_000);
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

/** Espera a fonte coreana carregar (com limite de tempo), para desenhar hangul em canvas. */
export async function aguardarFontes(limiteMs = 2500) {
  if (!document.fonts?.load) {
    return;
  }
  const carregamento = Promise.all([
    document.fonts.load('700 48px "Noto Sans KR"', '한글ㄱㅏ'),
    document.fonts.load('900 48px "Noto Sans KR"', '한글ㄱㅏ'),
  ]).catch(() => null);
  await Promise.race([carregamento, esperar(limiteMs)]);
}
