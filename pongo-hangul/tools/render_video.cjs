// Gera video/pongo-hangul-trailer.mp4 a partir de video/trailer.html.
// Uso: node tools/render_video.cjs   (precisa de Playwright com Chromium e de ffmpeg no PATH)
const path = require('path'), fs = require('fs'), { spawn, execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const FPS = 30, ROOT = path.join(__dirname, '..', 'video'), OUT = path.join(ROOT, 'pongo-hangul-trailer.mp4');
(async () => {
  const opts = { executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--allow-file-access-from-files'] }; // imagens locais sem "sujar" o canvas
  if (process.env.HTTPS_PROXY) opts.proxy = { server: process.env.HTTPS_PROXY };
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, ignoreHTTPSErrors: true });
  page.on('pageerror', e => console.error('erro na página:', e.message));
  await page.goto('file://' + path.join(ROOT, 'trailer.html') + '#render');
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => DUR);
  console.log('áudio…');
  const wav = path.join(ROOT, 'trilha.wav');
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => renderAudio()), 'base64'));
  console.log('quadros…');
  const silent = path.join(ROOT, 'video-sem-som.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    const b64 = await page.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', .93).split(',')[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`  ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT]);
  fs.unlinkSync(silent); fs.unlinkSync(wav);
  console.log('pronto:', OUT);
})();
