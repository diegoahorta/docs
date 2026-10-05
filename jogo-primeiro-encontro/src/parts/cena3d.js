/* =====================================================================
   3D: modelos gerados no Blender (GLB) renderizados com Three.js
   ===================================================================== */
const has3D = (() => { try { return !!window.THREE && !!THREE.GLTFLoader && !!document.createElement('canvas').getContext('webgl'); } catch (err) { return false; } })();
const Models = {};
function b64ToBuf(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function loadModels() {
  if (!has3D) return Promise.resolve();
  const loader = new THREE.GLTFLoader();
  return Promise.all(['mascote', 'tanaka', 'meishi', 'telefone', 'estrela', 'trofeu'].map(nm => new Promise(res => {
    loader.parse(b64ToBuf(ASSETS[nm + '_glb']), '', g => { Models[nm] = g.scene; res(); }, () => res());
  })));
}
const stages = [];
__STAGE_CLASS__
function charRig(obj, ry0 = 0) { // animações: balanço, pulo, reverência (ojigi) e "não-não"
  const rig = { obj, ry0, jumpT: -1, noT: -1, bowT: -1, baseY: obj.position.y };
  rig.tick = (t) => {
    let y = rig.baseY + Math.sin(t * 2.2 + ry0) * 0.05, ry = ry0 + Math.sin(t * 0.7) * 0.15, rx = 0, rz = 0, s = 1;
    if (rig.bowT >= 0) {
      const k = (t - rig.bowT) / 1.4;
      if (k >= 1) rig.bowT = -1; else rx = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.55;
    }
    if (rig.jumpT >= 0) {
      const k = (t - rig.jumpT) / 0.9;
      if (k >= 1) rig.jumpT = -1;
      else { y += Math.sin(k * Math.PI) * 0.8; ry += k * Math.PI * 2; s = 1 + Math.sin(k * Math.PI) * 0.12; }
    }
    if (rig.noT >= 0) {
      const k = (t - rig.noT) / 0.7;
      if (k >= 1) rig.noT = -1; else rz = Math.sin(k * Math.PI * 5) * 0.22 * (1 - k);
    }
    obj.position.y = y; obj.rotation.set(rx, ry, rz); obj.scale.setScalar(s * (obj.userData.s || 1));
  };
  rig.jump = () => { rig.jumpT = clock; };
  rig.bow = () => { rig.bowT = clock; };
  rig.no = () => { rig.noT = clock; };
  return rig;
}
let clock = 0;
let heroDaru = null, heroTanaka = null, lessonRig = null, trophyStage = null, fx3d = null;

function build3D() {
  if (!has3D || !Models.mascote || !Models.tanaka) { useFallbackImages(); return; }
  // herói: Daru e Tanaka se cumprimentam com reverência; cartões de visita e o celular flutuam
  const hero = new Stage($('#heroCanvas'), { cam: [0, 0.5, 9.5], fov: 30, look: [1.6, 0.1, 0] });
  const d = Models.mascote.clone(true); d.position.set(0.3, -0.3, 0); d.userData.s = 0.95; hero.scene.add(d);
  const tk = Models.tanaka.clone(true); tk.position.set(2.9, -0.3, 0); tk.userData.s = 0.95; hero.scene.add(tk);
  heroDaru = charRig(d, 0.55); heroTanaka = charRig(tk, -0.55);
  const cards = [];
  if (Models.meishi) for (let i = 0; i < 5; i++) { const c = Models.meishi.clone(true); c.scale.setScalar(0.32); c.userData.o = i * 1.3; hero.scene.add(c); cards.push(c); }
  let phone = null;
  if (Models.telefone) { phone = Models.telefone.clone(true); phone.scale.setScalar(0.42); phone.position.set(4.6, 1.3, -1); hero.scene.add(phone); }
  let nextBow = 1.5;
  hero.update = (t) => {
    if (t > nextBow) { heroDaru.bow(); setTimeout(() => heroTanaka && heroTanaka.bow(), 250); nextBow = t + 5; }
    heroDaru.tick(t); heroTanaka.tick(t);
    // tela larga: personagens à direita do texto; tela estreita: personagens embaixo do texto
    const narrow = hero.camera.aspect < 1.6;
    const lookX = narrow ? 1.6 : hero.camera.aspect < 2 ? 0.4 : -1.4, lookY = narrow ? 1.05 : 0.1;
    hero.camera.position.set(lookX + Math.sin(t * 0.15) * 0.5, lookY + 0.4, narrow ? 11 : 9.5);
    hero.camera.lookAt(lookX, lookY, 0);
    cards.forEach((c, i) => { const a = t * 0.35 + c.userData.o; c.position.set(1.6 + Math.cos(a) * 2.6, 1.2 + Math.sin(a * 1.3) * 0.5, -1.4 + Math.sin(a) * 1.2); c.rotation.set(Math.sin(a) * 0.4, a * 1.5, Math.cos(a) * 0.3); });
    if (phone) { phone.rotation.set(0.2, Math.sin(t * 0.6) * 0.6, Math.sin(t * 0.8) * 0.15); phone.position.y = 1.3 + Math.sin(t * 1.1) * 0.15; }
  };
  $('#heroCanvas').addEventListener('click', () => { Sound.init(); heroDaru.bow(); heroTanaka.bow(); Sound.tap(); toast(pick(['はじめまして！ Muito prazer!', 'よろしくおねがいします！', 'しつれいですが、おなまえは どちらですか。'])); });

  // Tanaka na lição: ele é a pessoa que você está conhecendo
  const lc = document.createElement('canvas');
  const ls = new Stage(lc, { cam: [0, 0.3, 5.2], fov: 34, look: [0, 0, 0] });
  const lm = Models.tanaka.clone(true); lm.position.y = -0.15; ls.scene.add(lm); lessonRig = charRig(lm, 0);
  ls.update = t => lessonRig.tick(t);
  window.__lessonMascot = lc;

  // troféu do resultado
  const tc = document.createElement('canvas');
  trophyStage = new Stage(tc, { cam: [0, 0.6, 6.2], fov: 32, look: [0, 0.3, 0] });
  if (Models.trofeu) { const tr = Models.trofeu.clone(true); tr.position.y = -0.1; trophyStage.scene.add(tr); trophyStage.update = t => { tr.rotation.y = t * 1.2; tr.position.y = -0.1 + Math.sin(t * 2) * 0.08; }; }
  window.__trophy = tc;

  // camada de efeitos: estrelas e cartões de visita 3D que explodem a cada acerto
  fx3d = new Stage($('#fx3d'), { cam: [0, 0, 12], fov: 40 });
  fx3d.always = true; fx3d.items = [];
  fx3d.update = (t, dt) => {
    fx3d.items = fx3d.items.filter(it => {
      it.life -= dt;
      if (it.life <= 0) { fx3d.scene.remove(it.o); return false; }
      it.v.y -= 6 * dt; it.o.position.addScaledVector(it.v, dt);
      it.o.rotation.x += it.spin.x * dt; it.o.rotation.y += it.spin.y * dt;
      const k = Math.min(1, it.life / 0.5); it.o.scale.setScalar(it.s * k);
      return true;
    });
  };
}
function burst3D(x, y, count) {
  if (!fx3d || !Models.estrela || REDUCED) return;
  const cam = fx3d.camera, v = new THREE.Vector3((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(cam);
  const dir = v.sub(cam.position).normalize(), dist = -cam.position.z / dir.z;
  const origin = cam.position.clone().add(dir.multiplyScalar(dist));
  for (let i = 0; i < count; i++) {
    const card = Models.meishi && i % 3 === 0;
    const o = (card ? Models.meishi : Models.estrela).clone(true); o.position.copy(origin);
    const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7;
    const it = { o, v: new THREE.Vector3(Math.cos(a) * sp, Math.sin(a) * sp + 5, Math.random() * 4), spin: { x: Math.random() * 8 - 4, y: Math.random() * 10 - 5 }, life: 1.2 + Math.random() * 0.8, s: card ? 0.5 + Math.random() * 0.3 : 0.35 + Math.random() * 0.45 };
    fx3d.scene.add(o); fx3d.items.push(it);
  }
}
function useFallbackImages() {
  const img = (k, cls) => { const i = new Image(); i.src = 'data:image/png;base64,' + ASSETS[k]; i.alt = ''; if (cls) i.className = cls; return i; };
  const hc = $('#heroCanvas'); const hi = img('dupla_png', 'fallback'); hi.style.objectPosition = '85% 60%'; hc.replaceWith(hi);
  window.__lessonMascot = img('dupla_png'); window.__trophy = img('trofeu_png');
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  for (const s of stages) if (s.visible()) s.render(clock, dt);
  requestAnimationFrame(frame);
}

