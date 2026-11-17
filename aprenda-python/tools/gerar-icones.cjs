// Gera os ícones PNG do Android (mipmap-*) a partir de web/img/icone.svg usando o Chromium/Playwright.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const svg = fs.readFileSync(path.join(raiz, 'web/img/icone.svg'), 'utf8');
const tamanhos = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [d, t] of Object.entries(tamanhos)) {
    await p.setViewportSize({ width: t, height: t });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${t}" height="${t}" `)}</body></html>`);
    await p.screenshot({ path: path.join(raiz, `android/res/mipmap-${d}/ic_launcher.png`), omitBackground: true });
  }
  await p.setViewportSize({ width: 512, height: 512 });
  await p.setContent(`<html><body style="margin:0">${svg.replace('<svg ', '<svg width="512" height="512" ')}</body></html>`);
  await p.screenshot({ path: path.join(raiz, 'web/img/icone-512.png'), omitBackground: true });
  await b.close();
  console.log('ícones gerados');
})();
