// Configuração do ESLint no formato "flat config".
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  // Pastas que o ESLint deve ignorar.
  { ignores: ['node_modules/', 'assets/', 'dist/'] },

  // Regras recomendadas pela equipe do ESLint.
  js.configs.recommended,

  // Código do jogo: ES Modules rodando no navegador.
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Este arquivo e os scripts de geração rodam no Node.
  {
    files: ['eslint.config.js', 'scripts/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Desliga regras de estilo que conflitariam com o Prettier (sempre por último).
  prettier,
];
