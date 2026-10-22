/** Nome de arquivo estável para um texto: "Je m'appelle Ana." → "je-m-appelle-ana" */
export function audioKey(text) {
  return text
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
