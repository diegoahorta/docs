/**
 * Motor de correção (funções puras — testadas em tests/evaluate.test.mjs).
 * Não depende do DOM: pode ser usado no navegador, no Node ou num backend.
 * Japonês: respostas são comparadas sem espaços/pontuação e aceitam kanji OU só kana
 * (as respostas aceitas podem usar a marcação de furigana {漢字|かんじ}).
 */
import { isJapanese, plain, reading, normalizeJa } from './jp.js';

/** Formas aceitáveis de uma resposta com marcação: texto com kanji e leitura em kana. */
const forms = (acc) => (/\{[^|{}]+\|[^|{}]+\}/.test(acc) ? [plain(acc), reading(acc)] : [acc]);
const jaEqual = (answer, acc) => forms(acc).some((f) => normalizeJa(plain(answer)) === normalizeJa(f));

/** Normaliza texto para comparação: minúsculas, apóstrofos/aspas tipográficos, espaços e pontuação final. */
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Versão mais tolerante: remove toda pontuação (para fala transcrita). */
export function loose(s) {
  return normalize(s).replace(/[^\p{L}\p{N}'\s$.]/gu, ' ').replace(/(?<!\d)\.|\.(?!\d)/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Compara uma resposta com a lista de respostas aceitas. Ignora pontuação final se strict=false. */
export function checkText(answer, accepted, { strictPunctuation = false } = {}) {
  if (isJapanese(answer) || accepted.some(isJapanese)) return accepted.some((acc) => jaEqual(answer, acc));
  const a = normalize(answer);
  const strip = (x) => x.replace(/[.!]+$/, '').trim();
  return accepted.some((acc) => {
    const b = normalize(acc);
    return strictPunctuation ? a === b : strip(a) === strip(b);
  });
}

/** Lacunas: answers é uma lista (por lacuna) de alternativas aceitas. Retorna {correct, perGap[]} */
export function checkGaps(values, answers) {
  const same = (v, alt) => (isJapanese(alt) || isJapanese(v) ? jaEqual(v, alt) : normalize(v) === normalize(alt));
  const perGap = answers.map((alts, i) => alts.some((alt) => same(values[i] ?? '', alt)));
  return { correct: perGap.every(Boolean), perGap };
}

/** Palavras que começam com letra de vogal mas som de consoante (a) e vice-versa (an). */
const A_EXCEPTIONS = /^(uni|use|usu|uro|eu|one|once|ufo|ute)/;
const AN_EXCEPTIONS = /^(hour|honest|honou?r|heir)/;

/** Decide o artigo indefinido correto pelo SOM inicial (aproximação ortográfica com exceções). */
export function expectedArticle(word) {
  const w = String(word).toLowerCase();
  if (AN_EXCEPTIONS.test(w)) return 'an';
  if (A_EXCEPTIONS.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

/** Verifica todos os "a/an + palavra" de um texto. Retorna lista de erros [{found, expected, word}] */
export function articleErrors(text) {
  const errors = [];
  const re = /\b(a|an)\s+([a-z][a-z'-]*)/gi;
  let m;
  while ((m = re.exec(String(text)))) {
    const found = m[1].toLowerCase();
    const expected = expectedArticle(m[2]);
    if (found !== expected) errors.push({ found, expected, word: m[2] });
  }
  return errors;
}

/**
 * Produção livre: avalia critérios verificáveis (regex ou verificações nomeadas).
 * Não atribui "nota de qualidade": devolve quais critérios foram atendidos.
 */
export function checkCriteria(text, criteria) {
  const ja = isJapanese(text);
  // japonês: padrões são testados no texto sem marcação, espaços e pontuação, linha a linha
  const norm = ja ? plain(String(text)).split('\n').map(normalizeJa).join('\n') : normalize(text);
  const results = criteria.map((c) => {
    let ok = false;
    let detail = '';
    if (c.pattern) ok = new RegExp(c.pattern, 'imu').test(norm.split('\n').map((l) => l.trim()).join('\n'));
    else if (c.check === 'articles') {
      const hasArticle = /\b(a|an)\s+\w/i.test(norm);
      const errs = articleErrors(norm);
      ok = hasArticle && errs.length === 0;
      detail = errs.map((e) => `"${e.found} ${e.word}" → "${e.expected} ${e.word}"`).join('; ');
      if (!hasArticle) detail = 'Nenhum a/an encontrado.';
    } else if (c.check === 'lines3') ok = String(text).split('\n').filter((l) => l.trim()).length >= 3;
    return { label: c.label, ok, optional: !!c.optional, detail };
  });
  const required = results.filter((r) => !r.optional);
  const met = required.filter((r) => r.ok).length;
  return { results, met, total: required.length, correct: met === required.length };
}

/**
 * Compara fala/texto livre com um "match" do jogo: {all:[], any:[], anyPolite:[]}.
 * all: todos os termos precisam aparecer; any/anyPolite: pelo menos um de cada grupo.
 */
export function matchUtterance(text, match = {}) {
  if (isJapanese(text) || [...(match.all || []), ...(match.any || [])].some(isJapanese)) {
    const t = normalizeJa(plain(text));
    const has = (term) => forms(term).some((f) => t.includes(normalizeJa(f)));
    return (match.all || []).every(has) && (!match.any || match.any.some(has)) && (!match.anyPolite || match.anyPolite.some(has));
  }
  const t = ' ' + loose(text).replace(/\bi would\b/g, "i'd").replace(/\bid\b/g, "i'd") + ' ';
  const has = (term) => t.includes(' ' + loose(term).replace(/\bid\b/g, "i'd") + ' ') || t.includes(loose(term));
  const all = (match.all || []).every(has);
  const any = !match.any || match.any.some(has);
  const anyPolite = !match.anyPolite || match.anyPolite.some(has);
  return all && any && anyPolite;
}

/**
 * Diferença palavra a palavra (LCS) entre a frase-alvo e o que foi reconhecido.
 * Retorna [{word, hit}] para a frase-alvo. Usado como AUXÍLIO visual, não como nota.
 */
export function wordDiff(target, heard) {
  const ja = isJapanese(target);
  // japonês não separa palavras por espaço: compara caractere a caractere (kana/kanji)
  const A = ja ? [...normalizeJa(plain(target))] : loose(target).split(' ').filter(Boolean);
  const B = ja ? [...normalizeJa(plain(heard))] : loose(heard).split(' ').filter(Boolean);
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < A.length) {
    if (j < B.length && A[i] === B[j]) { out.push({ word: A[i], hit: true }); i++; j++; }
    else if (j < B.length && dp[i][j + 1] >= dp[i + 1][j]) j++;
    else { out.push({ word: A[i], hit: false }); i++; }
  }
  return out;
}

/** Avalia uma questão do banco a partir da resposta do aluno. Retorna {correct, ...detalhes} */
export function evaluateQuestion(q, response) {
  switch (q.type) {
    case 'mcq':
      return { correct: response === q.answer, chosen: response };
    case 'tf':
      return { correct: response === q.answer, chosen: response };
    case 'gap': {
      const r = checkGaps(response, q.answers);
      return { correct: r.correct, perGap: r.perGap };
    }
    case 'order':
      return { correct: checkText(response, q.answers) };
    case 'transform':
      return { correct: checkText(response, q.answers) };
    case 'match': {
      // response: array com o índice da resposta escolhida para cada pergunta
      const perPair = q.pairs.map((_, i) => response[i] === i);
      return { correct: perPair.every(Boolean), perPair };
    }
    case 'produce': {
      const r = checkCriteria(response, q.criteria);
      return { correct: r.correct, criteria: r };
    }
    default:
      throw new Error(`Tipo de questão desconhecido: ${q.type}`);
  }
}

/** Valida a estrutura de uma questão (usado no Painel do Professor). Retorna lista de erros. */
export function validateQuestion(q) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(`${q.id || '(sem id)'}: ${msg}`); };
  need(q.id, 'faltando "id"');
  need(q.prompt, 'faltando "prompt"');
  need(Array.isArray(q.skills) && q.skills.length, '"skills" deve ser uma lista não vazia');
  switch (q.type) {
    case 'mcq': need(Array.isArray(q.options) && q.options.length >= 2, 'mcq precisa de 2+ "options"'); need(Number.isInteger(q.answer) && q.answer < (q.options?.length || 0), '"answer" deve ser o índice de uma opção'); break;
    case 'tf': need(typeof q.answer === 'boolean', 'tf precisa de "answer" true/false'); break;
    case 'gap': {
      const gaps = (q.text?.match(/___/g) || []).length;
      need(gaps > 0, 'gap precisa de "___" em "text"');
      need(Array.isArray(q.answers) && q.answers.length === gaps, `"answers" deve ter ${gaps} lista(s), uma por lacuna`);
      break;
    }
    case 'order': need(Array.isArray(q.tiles) && q.tiles.length > 1, 'order precisa de "tiles"'); need(Array.isArray(q.answers) && q.answers.length, 'order precisa de "answers"'); break;
    case 'transform': need(q.source, 'transform precisa de "source"'); need(Array.isArray(q.answers) && q.answers.length, 'transform precisa de "answers"'); break;
    case 'match': need(Array.isArray(q.pairs) && q.pairs.length >= 2, 'match precisa de 2+ "pairs"'); break;
    case 'produce': need(Array.isArray(q.criteria) && q.criteria.length, 'produce precisa de "criteria"'); break;
    default: errs.push(`${q.id}: tipo inválido "${q.type}"`);
  }
  return errs;
}
