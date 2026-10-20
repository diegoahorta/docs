// 灯籠 Lanternas: toque a lanterna com o significado certo antes que ela suba.
import { S, VOCAB, esc, shuffle, distractors, practiced, gain, save, speak, pitchHTML } from "./core.js";
import { fontsReady, fitText, canvasTexture, shortPt, makeRenderer } from "./three-util.js";

export function lanternGame(stage, words) {
  if (words.length < 4) words = VOCAB.filter(v => v.livro === 1 && v.imp === 3);
  stage.classList.add("night");
  stage.innerHTML = `
    <div class="hud">
      <div class="hud-l"><span>Pontos <b id="h-score">0</b></span><span>Nível <b id="h-level">1</b></span></div>
      <div class="hud-target" id="h-target"></div>
      <div class="hud-r" id="h-lives"></div>
    </div>
    <div class="stage-overlay" id="ov"></div>`;
  const $ = s => stage.querySelector(s);
  const renderer = makeRenderer(stage);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1326);
  scene.fog = new THREE.Fog(0x0b1326, 14, 30);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 12);
  scene.add(new THREE.HemisphereLight(0x8fa8d8, 0x1a1020, 0.6));
  const warm = new THREE.PointLight(0xffb36b, 0.8, 30); warm.position.set(0, -4, 6); scene.add(warm);

  // céu: estrelas, lua e montanhas distantes
  const starGeo = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 500; i++) sp.push((Math.random() - 0.5) * 60, Math.random() * 22 - 4, -12 - Math.random() * 10);
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.07, transparent: true, opacity: 0.85 }));
  scene.add(stars);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), new THREE.MeshBasicMaterial({ color: 0xf3ead2, fog: false }));
  moon.position.set(7, 5.5, -16); scene.add(moon);
  const glowTex = canvasTexture(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,190,110,0.9)"); g.addColorStop(0.35, "rgba(255,140,60,0.35)"); g.addColorStop(1, "rgba(255,120,40,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const mountains = canvasTexture(1024, 256, (c, w, h) => {
    const layer = (col, amp, base, seed) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) c.lineTo(x, base - amp * (Math.sin(x / 90 + seed) * 0.6 + Math.sin(x / 37 + seed * 2) * 0.25 + Math.sin(x / 210 + seed) * 0.8));
      c.lineTo(w, h); c.fill();
    };
    layer("#16203a", 50, 150, 1); layer("#0f1830", 40, 190, 4); layer("#0b1224", 25, 225, 7);
  });
  const mtn = new THREE.Mesh(new THREE.PlaneGeometry(50, 12.5), new THREE.MeshBasicMaterial({ map: mountains, transparent: true, fog: false }));
  mtn.position.set(0, -5.5, -14); scene.add(mtn);

  // lanternas decorativas ao fundo
  const deco = [];
  const decoMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffa860, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(decoMat); const k = 0.25 + Math.random() * 0.4;
    s.scale.set(k, k, 1); s.position.set((Math.random() - 0.5) * 30, Math.random() * 20 - 10, -6 - Math.random() * 8);
    s.userData.v = 0.15 + Math.random() * 0.25; deco.push(s); scene.add(s);
  }

  const bodyGeo = new THREE.SphereGeometry(0.62, 28, 20); bodyGeo.scale(1, 1.18, 1);
  const capGeo = new THREE.CylinderGeometry(0.34, 0.4, 0.14, 24);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.7 });
  const ribGeo = new THREE.TorusGeometry(0.62, 0.012, 6, 40);

  let W = 10, H = 8, raf = 0, last = 0, running = false, alive = true;
  let score = 0, lives = 3, lvl = 1, combo = 0, lanterns = [], target = null, roundLock = false, missed = [], dirJP = S.prefs.lanternDir !== "pt";
  const particles = [];

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    H = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    W = H * camera.aspect;
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  function labelTexture(text, jp) {
    return canvasTexture(512, 256, (c, w, h) => {
      c.fillStyle = "rgba(255,247,232,0.94)";
      c.beginPath(); c.roundRect ? c.roundRect(8, 8, w - 16, h - 16, 26) : c.rect(8, 8, w - 16, h - 16); c.fill();
      c.strokeStyle = "#b5462e"; c.lineWidth = 6; c.stroke();
      c.fillStyle = "#2a1712"; c.textAlign = "center"; c.textBaseline = "middle";
      const fam = jp ? '"Zen Old Mincho", "Hiragino Mincho ProN", serif' : '"Instrument Sans", system-ui, sans-serif';
      const { size, lines } = fitText(c, text, fam, jp ? 700 : 600, w - 70, h - 50, jp ? 96 : 64, jp ? 2 : 3);
      c.font = `${jp ? 700 : 600} ${size}px ${fam}`;
      lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.18));
    });
  }

  function makeLantern(v, x, y, correct) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8502f, emissive: 0xff6a2a, emissiveIntensity: 0.55, roughness: 0.55 });
    const body = new THREE.Mesh(bodyGeo, mat); g.add(body);
    for (const yy of [-0.35, 0, 0.35]) { const r = new THREE.Mesh(ribGeo, capMat); r.rotation.x = Math.PI / 2; r.position.y = yy; r.scale.setScalar(Math.cos(Math.asin(yy / 0.73)) || 0.7); g.add(r); }
    const top = new THREE.Mesh(capGeo, capMat); top.position.y = 0.72; g.add(top);
    const bot = new THREE.Mesh(capGeo, capMat); bot.position.y = -0.72; g.add(bot);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(3.2, 3.2, 1); g.add(glow);
    const text = dirJP ? shortPt(v.pt) : v.palavra;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text, !dirJP), transparent: true, depthTest: false }));
    label.scale.set(2.3, 1.15, 1); label.position.set(0, -1.35, 0.2); label.renderOrder = 5; g.add(label);
    g.position.set(x, y, 0);
    g.userData = { v, correct, mat, glow, label, phase: Math.random() * 6, state: "rise", speed: 1 };
    body.userData.root = g; label.userData.root = g;
    scene.add(g);
    return g;
  }

  function lifeIcons() { $("#h-lives").innerHTML = Array.from({ length: 3 }, (_, i) => `<i class="${i < lives ? "on" : ""}" aria-hidden="true"></i>`).join("") + `<span class="sr">${lives} vidas</span>`; }
  function hud() { $("#h-score").textContent = score; $("#h-level").textContent = lvl; lifeIcons(); }

  function newRound() {
    if (!alive) return;
    lanterns.forEach(l => scene.remove(l)); lanterns = [];
    target = words[Math.random() * words.length | 0];
    const field = dirJP ? "pt" : "palavra";
    const opts = distractors(target, 3, field).filter(o => shortPt(o.pt) !== shortPt(target.pt));
    const all = shuffle([target, ...opts.slice(0, 3)]);
    const span = Math.min(W * 0.84, 11), n = all.length;
    const k = Math.max(0.5, Math.min(1, W / (n * 2.6)));     // telas estreitas: lanternas menores e em zigue-zague
    all.forEach((v, i) => {
      const x = n === 1 ? 0 : -span / 2 + span * (i / (n - 1)) * (k < 1 ? 0.9 : 1) + (k < 1 ? span * 0.05 : 0);
      const stagger = k < 0.85 && i % 2 ? -2.2 : 0;
      const l = makeLantern(v, x + (Math.random() - 0.5) * 0.4 * k, -H / 2 - 1.4 - Math.random() * 1.2 + stagger, v === target);
      l.scale.setScalar(k);
      lanterns.push(l);
    });
    $("#h-target").innerHTML = dirJP
      ? `<span class="t-jp">${esc(target.palavra)}</span>${target.palavra !== target.leitura ? `<span class="t-r">${esc(target.leitura)}</span>` : ""}`
      : `<span class="t-pt">${esc(target.pt)}</span>`;
    if (dirJP) speak(target);
    roundLock = false;
  }

  function burst(pos, color) {
    const n = 60, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { p.set([pos.x, pos.y, pos.z], i * 3); const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI, s = 2 + Math.random() * 4; vel.push(new THREE.Vector3(Math.cos(a) * Math.sin(b) * s, Math.cos(b) * s, Math.sin(a) * Math.sin(b) * s)); }
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.userData = { vel, life: 1 }; scene.add(pts); particles.push(pts);
  }

  function hit(l) {
    if (roundLock || l.userData.state !== "rise") return;
    roundLock = true;
    if (l.userData.correct) {
      combo++; score += 1 + (combo >= 5 ? 1 : 0);
      practiced(target.id, true);
      l.userData.state = "fly"; burst(l.position, 0xffd27a);
      lanterns.filter(o => o !== l).forEach(o => (o.userData.state = "fade"));
      if (score >= lvl * 6) lvl++;
      hud(); setTimeout(newRound, 750);
    } else {
      combo = 0; lives--; missed.push(target); practiced(target.id, false);
      l.userData.state = "fall"; l.userData.mat.color.set(0x5a2b4a); l.userData.mat.emissive.set(0x3a0f30);
      const right = lanterns.find(o => o.userData.correct); if (right) right.userData.state = "show";
      hud();
      setTimeout(() => (lives > 0 ? newRound() : gameOver()), 1400);
    }
  }

  function escaped() {
    if (roundLock) return;
    roundLock = true; combo = 0; lives--; missed.push(target); practiced(target.id, false);
    hud();
    setTimeout(() => (lives > 0 ? newRound() : gameOver()), 500);
  }

  function update(dt, t) {
    stars.material.opacity = 0.7 + Math.sin(t * 0.8) * 0.15;
    deco.forEach(s => { s.position.y += s.userData.v * dt; if (s.position.y > 12) s.position.y = -12; });
    const speed = 0.75 + 0.16 * (lvl - 1);
    for (const l of lanterns) {
      const u = l.userData;
      u.phase += dt;
      if (u.state === "rise" || u.state === "show") {
        l.position.y += speed * dt * (u.state === "show" ? 0.4 : 1);
        l.position.x += Math.sin(u.phase * 1.3) * 0.004;
        l.rotation.z = Math.sin(u.phase * 1.1) * 0.08;
        if (u.state === "show") u.glow.scale.setScalar(3.2 + Math.sin(t * 10) * 0.6);
        if (u.correct && u.state === "rise" && l.position.y > H / 2 + 0.8) escaped();
      } else if (u.state === "fly") {
        l.position.y += dt * 9; l.scale.multiplyScalar(1 + dt * 0.6);
      } else if (u.state === "fall") {
        l.position.y -= dt * 6; l.rotation.z += dt * 2;
      } else if (u.state === "fade") {
        u.label.material.opacity = Math.max(0, u.label.material.opacity - dt * 3);
        l.position.y += dt * 1.5; l.scale.multiplyScalar(1 - dt * 1.2);
      }
      u.mat.emissiveIntensity = 0.5 + Math.sin(u.phase * 3) * 0.08;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i], a = p.geometry.attributes.position;
      p.userData.life -= dt * 1.1;
      p.userData.vel.forEach((v, k) => { v.y -= dt * 3; a.array[k * 3] += v.x * dt; a.array[k * 3 + 1] += v.y * dt; a.array[k * 3 + 2] += v.z * dt; });
      a.needsUpdate = true; p.material.opacity = Math.max(0, p.userData.life);
      if (p.userData.life <= 0) { scene.remove(p); p.geometry.dispose(); particles.splice(i, 1); }
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    if (running) update(dt, now / 1000);
    else deco.forEach(s => { s.position.y += s.userData.v * dt; if (s.position.y > 12) s.position.y = -12; });
    renderer.render(scene, camera);
  }

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function onPointer(e) {
    if (!running) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const objs = lanterns.flatMap(l => [l.children[0], l.userData.label]);
    const h = ray.intersectObjects(objs, false)[0];
    if (h) hit(h.object.userData.root);
  }
  renderer.domElement.addEventListener("pointerdown", onPointer);
  function onKey(e) { if (running && /^[1-4]$/.test(e.key)) { const sorted = [...lanterns].sort((a, b) => a.position.x - b.position.x); if (sorted[+e.key - 1]) hit(sorted[+e.key - 1]); } }
  document.addEventListener("keydown", onKey);

  function intro() {
    $("#ov").hidden = false;
    $("#ov").innerHTML = `<div class="ov-card">
      <h2>灯籠 Lanternas</h2>
      <p>Uma palavra aparece no alto. Toque a lanterna com a resposta certa antes que ela suba pelo céu. No teclado, use 1 a 4 da esquerda para a direita.</p>
      <div class="row center">
        <label class="chip"><input type="radio" name="ldir" value="jp" ${dirJP ? "checked" : ""}>Palavra → significado</label>
        <label class="chip"><input type="radio" name="ldir" value="pt" ${!dirJP ? "checked" : ""}>Significado → palavra</label>
      </div>
      <button class="btn primary" id="l-start">Começar</button>
      <p class="small">Recorde: ${S.best.lanternas || 0} pontos</p></div>`;
  }
  function begin() {
    dirJP = (stage.querySelector("[name=ldir]:checked") || {}).value !== "pt";
    S.prefs.lanternDir = dirJP ? "jp" : "pt";
    score = 0; lives = 3; lvl = 1; combo = 0; missed = [];
    $("#ov").hidden = true; hud(); running = true; newRound();
  }
  function gameOver() {
    running = false;
    lanterns.forEach(l => scene.remove(l)); lanterns = [];
    $("#h-target").innerHTML = "";
    const record = score > (S.best.lanternas || 0);
    if (record) S.best.lanternas = score;
    S.stats.games++;
    gain(Math.max(1, score * 2)); save();
    const uniq = [...new Map(missed.map(v => [v.id, v])).values()];
    $("#ov").hidden = false;
    $("#ov").innerHTML = `<div class="ov-card">
      <h2>${record ? "Novo recorde!" : "Fim de jogo"}</h2>
      <p class="score-line"><b>${score}</b> pontos · nível ${lvl} · +${Math.max(1, score * 2)} XP</p>
      ${uniq.length ? `<div class="ov-missed">${uniq.map(v => `<div><span class="jp">${esc(v.palavra)}</span> ${pitchHTML(v)} <span>${esc(v.pt)}</span></div>`).join("")}</div>
        <p class="small">Essas palavras foram para a revisão.</p>` : ""}
      <button class="btn primary" id="l-start">Jogar de novo</button></div>`;
  }
  stage.addEventListener("click", e => { if (e.target.closest("#l-start")) begin(); });
  const onVis = () => { if (document.hidden) last = performance.now(); };
  document.addEventListener("visibilitychange", onVis);

  fontsReady().then(() => { if (alive) { intro(); raf = requestAnimationFrame(loop); } });
  hud();

  return () => {
    alive = false; running = false; cancelAnimationFrame(raf); ro.disconnect();
    document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis);
    scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.(); } });
    renderer.dispose();
  };
}
