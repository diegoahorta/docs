import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'dist-single/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error'
    }
  },
  {
    files: ['tests/**/*.js', 'tools/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node } }
  }
]
