// Grava cenas do jogo quadro a quadro (30 fps exatos) com um "piloto automático".
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const DIR = process.argv[2];
const so = process.argv[3]; // opcional: só uma cena
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message, e.stack));
await p.goto('http://localhost:8765/jogo/');
await p.waitForFunction(() => window.jogo && jogo.cenario);
await p.evaluate(() => {
  const J = jogo;
  J.renderer.setAnimationLoop(null);
  J.telas.ativa?.el.remove();
  J.telas.ativa = null;
  J.hud.mostrar(false);
  document.querySelector('#scanlines').classList.add('desligado');
  J.tempo = 0;
  const ent = J.entrada;
  window.passo = () => { J.tempo += 1000 / 30; J.quadro(J.tempo); };
  window.preparar = (fase, cfg = {}) => {
    J.carregarFase(fase);
    J.estado = 'jogando';
    J.ondas = cfg.ondas ?? [];
    J.ondaIdx = 0;
    J.camX = cfg.camX ?? 0;
    const h = J.heroi;
    h.x = cfg.x ?? J.camX + 300; h.z = cfg.z ?? 70;
    h.energia = cfg.energia ?? 0;
    if (cfg.noOnibus) { const o = J.cenario.solidos.find((s) => h.x > s.x0 && h.x < s.x1); h.suporte = o; h.h = o.topo; h.z = o.z0 + 10; }
    for (const [tipo, x, z] of cfg.ratos ?? []) { const r = J.gerarInimigo(tipo, 'dir', z); r.x = x; r.mudar('perseguir'); }
    J.ultimo = J.tempo;
    window.roteiro = cfg.roteiro ?? {};
    window.quadroN = 0;
    window.modo = cfg.modo ?? 'lutar';
  };
  // Piloto: segura/aperta teclas como um jogador.
  window.pilotar = () => {
    const h = J.heroi; const n = window.quadroN++;
    ent.segurando.clear();
    const acao = window.roteiro[n];
    if (acao) for (const a of acao) a.startsWith('+') ? ent.segurando.add(a.slice(1)) : ent.apertou.add(a);
    h.vida = Math.max(h.vida, 55); // o herói não morre no trailer
    if (window.modo === 'andar') { ent.segurando.add('direita'); return; }
    if (window.modo === 'parado' || (acao && acao.includes('so'))) return;
    const alvo = J.inimigos.filter((r) => r.atingivel).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
    if (!alvo) { if (window.modo === 'lutar') ent.segurando.add('direita'); return; }
    const dx = alvo.x - h.x, dz = alvo.z - h.z;
    if (Math.abs(dz) > 8) ent.segurando.add(dz > 0 ? 'cima' : 'baixo');
    if (Math.abs(dx) > 95) ent.segurando.add(dx > 0 ? 'direita' : 'esquerda');
    else if (Math.abs(dx) < 40) ent.segurando.add(dx > 0 ? 'esquerda' : 'direita');
    else {
      if (Math.sign(dx) !== h.dir && h.estado !== 'soco') ent.segurando.add(dx > 0 ? 'direita' : 'esquerda');
      else if (n % 7 === 0 && Math.abs(dz) < 14) ent.apertou.add('soco');
    }
  };
  window.foto = () => J.renderer.domElement.toDataURL('image/jpeg', 0.92);
});

const CENAS = {
  grajau_andar: { fase: 0, quadros: 200, cfg: { x: 140, z: 40, camX: 0, modo: 'andar' } },
  grajau_luta: { fase: 0, quadros: 260, cfg: { x: 560, z: 70, camX: 260, ratos: [['ratinho', 760, 60], ['ratinho', 840, 95], ['ratazana', 980, 70], ['ratinho', 420, 40]], modo: 'fixo' } },
  onibus: { fase: 0, quadros: 150, cfg: { x: 2380, z: 30, camX: 2080, modo: 'parado', noOnibus: true, ratos: [['ratinho', 2780, 30], ['ratinho', 2840, 50]],
    roteiro: Object.assign(Object.fromEntries([...Array(50).keys()].map((i) => [i + 8, ['+direita']])), { 30: ['+direita', 'pular'], 42: ['+direita', 'soco'] }) } },
  paulista: { fase: 1, quadros: 230, cfg: { x: 1400, z: 70, camX: 1100, ratos: [['ratazana', 1650, 70], ['lixeiro', 1950, 100], ['ratinho', 1250, 40], ['ratinho', 1700, 120]], modo: 'fixo' } },
  centro_garrafa: { fase: 2, quadros: 170, cfg: { x: 2070, z: 42, camX: 1750, modo: 'parado', ratos: [['ratazana', 2450, 42], ['ratinho', 2520, 60]],
    roteiro: { 4: ['pegar'], 30: ['+direita'], 31: ['+direita'], 32: ['+direita'], 45: ['pegar'] } } },
  centro_luta: { fase: 2, quadros: 200, cfg: { x: 3600, z: 70, camX: 3300, ratos: [['ratazana', 3800, 70], ['ratinho', 3850, 100], ['lixeiro', 4150, 50], ['ratinho', 3400, 60]], modo: 'fixo' } },
  noite: { fase: 3, quadros: 200, cfg: { x: 1750, z: 70, camX: 1450, ratos: [['ratazana', 1950, 70], ['ratazana', 1550, 90], ['lixeiro', 2300, 60], ['ratinho', 2000, 110]], modo: 'fixo' } },
  chefe: { fase: 3, quadros: 330, cfg: { x: 3050, z: 90, camX: 2700, energia: 0, ratos: [['rei', 3350, 90]], modo: 'fixo' } },
  especial: { fase: 3, quadros: 120, cfg: { x: 3100, z: 90, camX: 2800, energia: 100, ratos: [['rei', 3270, 90], ['ratinho', 2970, 60], ['ratazana', 3350, 110], ['ratinho', 3250, 40]], modo: 'parado',
    roteiro: { 30: ['especial'] } } },
  vitoria: { fase: 0, quadros: 110, cfg: { x: 1680, z: 60, camX: 1300, modo: 'parado' } },
};

for (const [nome, c] of Object.entries(CENAS)) {
  if (so && so !== nome) continue;
  const dir = `${DIR}/${nome}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await p.evaluate(([f, cfg]) => window.preparar(f, cfg), [c.fase, c.cfg]);
  if (nome === 'vitoria') await p.evaluate(() => { jogo.estado = 'cena'; jogo.heroi.mudar('vitoria'); });
  for (let i = 0; i < 15; i++) await p.evaluate(() => { window.pilotar(); window.passo(); }); // aquece
  for (let i = 0; i < c.quadros; i++) {
    const url = await p.evaluate(() => { window.pilotar(); window.passo(); return window.foto(); });
    fs.writeFileSync(`${dir}/${String(i).padStart(4, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(nome, c.quadros, JSON.stringify(await p.evaluate(() => ({ vida: Math.round(jogo.heroi.vida), inim: jogo.inimigos.map((r) => r.tipo + ':' + r.estado), h: jogo.heroi.estado }))));
}
await b.close();
