// Acesso seguro ao localStorage.
// Tudo fica dentro de try/catch: em aba anônima, com armazenamento cheio
// ou bloqueado, o jogo continua funcionando com uma cópia em memória.

const PREFIXO = 'katakana-show:';
const memoria = new Map();

/** Lê um valor JSON salvo. Se não existir ou der erro, devolve `padrao`. */
export function lerJSON(chave, padrao) {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (bruto !== null) {
      return JSON.parse(bruto);
    }
  } catch (erro) {
    console.warn(`Não foi possível ler "${chave}" do armazenamento.`, erro);
  }
  return memoria.has(chave) ? memoria.get(chave) : padrao;
}

/** Salva um valor como JSON. Devolve `true` se gravou no localStorage. */
export function salvarJSON(chave, valor) {
  memoria.set(chave, valor);
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    console.warn(`Não foi possível salvar "${chave}" no armazenamento.`, erro);
    return false;
  }
}

/** Apaga todos os dados do Katakana Show (recordes, álbum, estatísticas e configurações). */
export function apagarTudo() {
  memoria.clear();
  try {
    const chaves = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const chave = localStorage.key(i);
      if (chave?.startsWith(PREFIXO)) {
        chaves.push(chave);
      }
    }
    chaves.forEach((chave) => localStorage.removeItem(chave));
  } catch (erro) {
    console.warn('Não foi possível apagar os dados salvos.', erro);
  }
}
