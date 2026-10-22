/** Idiomas de estudo (PT-BR é a língua de apoio). */
export const LANGS = [
  { code: 'en', label: 'EN', name: 'Inglês', voice: 'en-US' },
  { code: 'fr', label: 'FR', name: 'Francês', voice: 'fr-FR' },
  { code: 'de', label: 'DE', name: 'Alemão', voice: 'de-DE' },
  { code: 'es', label: 'ES', name: 'Espanhol', voice: 'es-ES' },
];

export const LANG_CODES = LANGS.map((l) => l.code);

export const langByCode = Object.fromEntries(LANGS.map((l) => [l.code, l]));

/**
 * Legenda de cores ODU Creative (Mapeamento Sintático / Chunking).
 * Blocos 1–5 seguem o Template Padrão de Aula; o bloco 0 agrupa expressões
 * fixas e conectores (polywords, "por favor", "obrigado").
 */
export const BLOCKS = [
  { id: 0, nome: 'Expressão', rotulo: 'Expressão / Conector', exemplo: 'por favor / please' },
  { id: 1, nome: 'Sujeito', rotulo: 'Tópico / Sujeito', exemplo: 'Eu / I' },
  { id: 2, nome: 'Tempo', rotulo: 'Tempo / Advérbio', exemplo: 'Hoje / Today' },
  { id: 3, nome: 'Lugar', rotulo: 'Lugar / Destino', exemplo: 'Na escola / At school' },
  { id: 4, nome: 'Objeto', rotulo: 'Objeto / Complemento', exemplo: 'O idioma / The language' },
  { id: 5, nome: 'Verbo', rotulo: 'Verbo / Ação / Auxiliar', exemplo: 'Estudo / Study' },
];

/** Intervalos da revisão espaçada em dias (roteiro ODU: 1 → 3 → 7 → 21). */
export const SRS_DAYS = [0, 1, 3, 7, 21, 60];
