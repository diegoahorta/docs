// Automated play-test: plays every lesson of a game file answering correctly.
// usage: NODE_PATH=$(npm root -g) node tools/playtest.cjs pongo-coreano.html [screenshots-dir]
const { chromium } = require('playwright');
const path = require('path');
const file = path.resolve(process.argv[2] || 'pongo-coreano.html');
const shots = process.argv[3];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 760 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + file);
  await p.waitForFunction(() => !document.getElementById('btn-play').disabled, null, { timeout: 60000 });
  if (shots) await p.screenshot({ path: shots + '/start.png' });
  await p.click('#btn-play');
  await p.waitForTimeout(1500);
  const units = await p.evaluate(() => window.PongoContent.UNITS.length);
  const seen = {};
  for (let u = 0; u < units; u++) {
    await p.evaluate(() => { document.getElementById('map-tip').hidden = true; });
    await p.locator('.marker').nth(u).click();
    await p.click('#pop-start');
    await p.click('#btn-check'); // intro
    for (let k = 0; k < 40; k++) {
      if (await p.isVisible('#result')) break;
      const ex = await p.evaluate(() => window.PongoDebug());
      const tag = ex.type + (ex.compose ? '-compose' : ex.joined ? '-joined' : '') + (ex.say && ex.type === 'choice' ? '-say' : '');
      if (ex.type === 'match') {
        for (const [a, c] of ex.pairs) {
          await p.locator('.match .col').nth(0).locator('.choice:not(.gone)', { hasText: a }).first().click();
          await p.locator('.match .col').nth(1).locator('.choice:not(.gone)', { hasText: c }).first().click();
          await p.waitForTimeout(380);
        }
        await p.waitForTimeout(600);
      } else if (ex.type === 'build' || ex.type === 'listen') {
        for (const [t] of ex.blocks) {
          const idx = await p.$$eval('#bank .block', (els, t) => els.findIndex((e) => !e.classList.contains('used') && e.textContent === t), t);
          await p.locator('#bank .block').nth(idx).click();
        }
        if (shots && !seen[tag]) await p.screenshot({ path: `${shots}/${tag}.png` });
        await p.click('#btn-check');
        if (shots && !seen['cel']) { await p.waitForTimeout(700); await p.screenshot({ path: shots + '/celebrate.png' }); seen.cel = 1; }
      } else if (ex.type === 'type') {
        await p.fill('#type-input', ex.accept[0]);
        await p.click('#btn-check');
      } else {
        await p.locator('.choices .choice').nth(ex.answer).click();
        if (shots && !seen[tag]) await p.screenshot({ path: `${shots}/${tag}.png` });
        await p.click('#btn-check');
      }
      const ok = await p.evaluate(() => document.getElementById('lesson-foot').classList.contains('ok'));
      if (!ok) errs.push(`unit ${u + 1}: answer marked wrong: ${JSON.stringify(ex).slice(0, 120)}`);
      seen[tag] = 1;
      await p.waitForTimeout(ex.type === 'build' || ex.type === 'listen' ? 300 : 150);
      await p.click('#btn-check');
    }
    const title = await p.textContent('#res-title');
    const acc = await p.textContent('#res-acc');
    console.log(`unit ${u + 1}: ${title} ${acc}`);
    if (shots && u === 0) { await p.waitForTimeout(800); await p.screenshot({ path: shots + '/result.png' }); }
    await p.click('#res-continue');
    await p.waitForTimeout(u < units - 1 ? 3500 : 1500);
  }
  if (shots) await p.screenshot({ path: shots + '/map-end.png' });
  console.log('save:', await p.evaluate((k) => localStorage.getItem(k), await p.evaluate(() => window.PongoPack.saveKey)));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
