import { readFileSync } from 'node:fs'

export const loadJSON = (rel) =>
  JSON.parse(readFileSync(new URL(`../src/data/${rel}`, import.meta.url), 'utf8'))
