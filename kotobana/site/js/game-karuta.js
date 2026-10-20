// かるた Karuta: jogo da memória em 3D, palavra ↔ significado.
import { S, VOCAB, esc, sample, practiced, gain, save, speak, pitchHTML } from "./core.js";
import { fontsReady, fitText, canvasTexture, shortPt, tween, makeRenderer } from "./three-util.js";

const PAIRS = 6;

export function karutaGame(stage, words) {
  if (words.length < PAIRS) words = VOCAB.filter(v => v.livro === 1 && v.imp === 3);
  stage.classList.add("tatami");
  stage.innerHTML = `
    <div class="hud"><div class="hud-l"><span>Jogadas <b id="k-moves">0</b></span><span>Pares <b id="k-pairs">0/${PAIRS}</b></span></div>
      <div class="hud-target"></div><div class="hud-r"><span>Tempo <b id="k-time">0:00</b></span></div></div>
    <div class="stage-overlay" id="ov" hidden></div>`;
  const $ = s => stage.querySelector(s);
  const renderer = makeRenderer(stage);
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2b2a1c);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.55));
  const sun = new THREE.DirectionalLight(0xfff1d6, 0.75);
  sun.position.set(-4, 6, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(sun);

  // tatame: fibras de junco e borda de tecido
  const tatamiTex = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = "#b9b27a"; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) { c.fillStyle = `rgba(${90 + Math.random() * 40},${90 + Math.random() * 30},40,${0.12 + Math.random() * 0.12})`; c.fillRect(0, y, w, 2); }
    for (let x = 0; x < w; x += 64) { c.fillStyle = "rgba(60,60,20,0.15)"; c.fillRect(x, 0, 2, h); }
  });
  tatamiTex.wrapS = tatamiTex.wrapT = THREE.RepeatWrapping; tatamiTex.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: tatamiTex, roughness: 0.95 }));
  floor.position.z = -0.06; floor.receiveShadow = true; scene.add(floor);
  for (const y of [-7.5, 7.5]) {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.45), new THREE.MeshStandardMaterial({ color: 0x1d2a4a, roughness: 0.8 }));
    band.position.set(0, y, -0.05); scene.add(band);
  }

  const CW = 1.5, CH = 2.1;
  const cardGeo = new THREE.BoxGeometry(CW, CH, 0.05);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.6 });
  const backTex = canvasTexture(300, 420, (c, w, h) => {
    c.fillStyle = "#24497a"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 3;
    for (let y = -20; y < h + 40; y += 28) for (let x = (y / 28) % 2 ? 0 : 24; x < w + 48; x += 48)   // seigaiha (ondas)
      for (const r of [22, 15, 8]) { c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.stroke(); }
    c.strokeStyle = "#e8d9a8"; c.lineWidth = 10; c.strokeRect(12, 12, w - 24, h - 24);
    c.fillStyle = "#f3ead2"; c.beginPath(); c.arc(w / 2, h / 2, 62, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#24497a"; c.font = '700 80px "Zen Old Mincho", serif'; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("花", w / 2, h / 2 + 4);
  });
  backTex.encoding = THREE.sRGBEncoding;

  function faceTex(v, jp) {
    const t = canvasTexture(300, 420, (c, w, h) => {
      c.fillStyle = "#fbf6ea"; c.fillRect(0, 0, w, h);
      c.strokeStyle = jp ? "#b5462e" : "#24497a"; c.lineWidth = 12; c.strokeRect(14, 14, w - 28, h - 28);
      c.fillStyle = "#1d1a17"; c.textAlign = "center"; c.textBaseline = "middle";
      if (jp) {
        const fam = '"Zen Old Mincho", "Hiragino Mincho ProN", serif';
        const { size, lines } = fitText(c, v.palavra, fam, 700, w - 60, h - 150, 96, 3);
        c.font = `700 ${size}px ${fam}`;
        lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 - 20 + (i - (lines.length - 1) / 2) * size * 1.15));
        if (v.palavra !== v.leitura) {
          c.fillStyle = "#6b5f52";
          const r = fitText(c, v.leitura, '"Zen Kaku Gothic New", sans-serif', 500, w - 60, 40, 28, 1);
          c.font = `500 ${r.size}px "Zen Kaku Gothic New", sans-serif`; c.fillText(r.lines[0], w / 2, h - 62);
        }
      } else {
        const fam = '"Instrument Sans", system-ui, sans-serif';
        const { size, lines } = fitText(c, shortPt(v.pt), fam, 600, w - 60, h - 110, 46, 5);
        c.font = `600 ${size}px ${fam}`;
        lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.2));
        c.fillStyle = "#24497a"; c.font = '600 20px "Instrument Sans", sans-serif'; c.fillText("PORTUGUÊS", w / 2, h - 52);
      }
    });
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  let cards = [], open = [], busy = false, moves = 0, matched = 0, t0 = 0, timer = 0, raf = 0, alive = true, hover = null, chosen = [];

  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const cols = camera.aspect >= 1.1 ? 4 : 3, rows = (PAIRS * 2) / cols;
    const gx = CW + 0.35, gy = CH + 0.35;
    cards.forEach((c, i) => {
      const col = i % cols, row = (i / cols) | 0;
      c.userData.home.set((col - (cols - 1) / 2) * gx, ((rows - 1) / 2 - row) * gy, 0);
      if (!c.userData.anim) c.position.copy(c.userData.home).setZ(c.userData.done ? 0.25 : 0);
    });
    // enquadra a grade inteira
    const needH = rows * gy + 0.6, needW = cols * gx + 0.6;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const dist = Math.max(needH / 2 / Math.tan(vfov / 2), needW / 2 / (Math.tan(vfov / 2) * camera.aspect)) * 1.05;
    camera.position.set(0, -dist * 0.22, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(layout); ro.observe(stage);

  function deal() {
    cards.forEach(c => scene.remove(c)); cards = [];
    chosen = sample(words, PAIRS);
    const deckCards = chosen.flatMap(v => [{ v, jp: true }, { v, jp: false }]).sort(() => Math.random() - 0.5);
    for (const { v, jp } of deckCards) {
      const front = new THREE.MeshStandardMaterial({ map: faceTex(v, jp), roughness: 0.5 });
      const back = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 });
      const m = new THREE.Mesh(cardGeo, [edgeMat, edgeMat, edgeMat, edgeMat, front, back]);
      m.castShadow = true;
      m.rotation.y = Math.PI;                      // começa virada
      m.userData = { v, jp, up: false, done: false, home: new THREE.Vector3(), front };
      cards.push(m); scene.add(m);
    }
    layout();
    // animação de distribuição
    cards.forEach((c, i) => {
      const end = c.userData.home.clone(); c.userData.anim = true;
      c.position.set(0, -8, 3);
      setTimeout(() => tween(380, k => c.position.lerpVectors(new THREE.Vector3(0, -8, 3), end, k)).then(() => (c.userData.anim = false)), i * 50);
    });
    moves = 0; matched = 0; open = []; busy = false; t0 = performance.now();
    clearInterval(timer); timer = setInterval(tick, 500); hud();
  }

  function flip(c, up) {
    c.userData.up = up; c.userData.anim = true;
    const from = c.rotation.y, to = up ? 0 : Math.PI, z0 = c.position.z;
    return tween(320, k => { c.rotation.y = from + (to - from) * k; c.position.z = z0 + Math.sin(k * Math.PI) * 0.6; }).then(() => (c.userData.anim = false));
  }

  async function pick(c) {
    if (busy || c.userData.up || c.userData.done) return;
    open.push(c); await flip(c, true);
    if (open.length < 2) return;
    busy = true; moves++; hud();
    const [a, b] = open; open = [];
    if (a.userData.v.id === b.userData.v.id && a.userData.jp !== b.userData.jp) {
      matched++; speak(a.userData.v); practiced(a.userData.v.id, true);
      for (const c of [a, b]) { c.userData.done = true; c.userData.front.emissive = new THREE.Color(0x3a2a00); c.userData.front.emissiveIntensity = 0.35; }
      await tween(260, k => { a.position.z = b.position.z = 0.25 * k; });
      hud(); busy = false;
      if (matched === PAIRS) setTimeout(finish, 500);
    } else {
      await new Promise(r => setTimeout(r, 850));
      await Promise.all([flip(a, false), flip(b, false)]);
      busy = false;
    }
  }

  const elapsed = () => Math.round((performance.now() - t0) / 1000);
  const fmt = s => `${(s / 60) | 0}:${String(s % 60).padStart(2, "0")}`;
  function tick() { $("#k-time").textContent = fmt(elapsed()); }
  function hud() { $("#k-moves").textContent = moves; $("#k-pairs").textContent = `${matched}/${PAIRS}`; tick(); }

  function finish() {
    clearInterval(timer);
    const secs = elapsed(), best = S.best.karuta;
    const record = !best || moves < best.moves || (moves === best.moves && secs < best.secs);
    if (record) S.best.karuta = { moves, secs };
    S.stats.games++;
    const xp = Math.max(6, 30 - (moves - PAIRS) * 2);
    gain(xp); save();
    $("#ov").hidden = false;
    $("#ov").innerHTML = `<div class="ov-card">
      <h2>${record ? "Novo recorde!" : "おつかれさま！"}</h2>
      <p class="score-line"><b>${moves}</b> jogadas · ${fmt(secs)} · +${xp} XP</p>
      <div class="ov-missed">${chosen.map(v => `<div><span class="jp">${esc(v.palavra)}</span> ${pitchHTML(v)} <span>${esc(v.pt)}</span></div>`).join("")}</div>
      <button class="btn primary" id="k-again">Jogar de novo</button></div>`;
  }

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function cast(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    return ray.intersectObjects(cards, false)[0]?.object;
  }
  renderer.domElement.addEventListener("pointerdown", e => { const c = cast(e); if (c) pick(c); });
  renderer.domElement.addEventListener("pointermove", e => {
    const c = cast(e); hover = c && !c.userData.up && !c.userData.done ? c : null;
    renderer.domElement.style.cursor = hover ? "pointer" : "default";
  });
  stage.addEventListener("click", e => { if (e.target.closest("#k-again")) { $("#ov").hidden = true; deal(); } });

  function loop() {
    raf = requestAnimationFrame(loop);
    for (const c of cards) {
      if (c.userData.anim || c.userData.done || c.userData.up) continue;
      const target = c === hover ? 0.18 : 0;
      c.position.z += (target - c.position.z) * 0.2;
    }
    renderer.render(scene, camera);
  }

  fontsReady().then(() => { if (alive) { deal(); loop(); } });

  return () => {
    alive = false; cancelAnimationFrame(raf); clearInterval(timer); ro.disconnect();
    scene.traverse(o => { o.geometry?.dispose?.(); [].concat(o.material || []).forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); });
    renderer.dispose();
  };
}
