import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CATS, CHEERS, PLANETS } from './content.js';
import * as A from './audio.js';
import { celebrate, jolt, spark } from './fx.js';

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ================================================================== render
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030c);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
camera.position.set(0, 40, 70);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 25;
controls.maxDistance = 140;
controls.maxPolarAngle = Math.PI * 0.48;
controls.enablePan = false;

scene.add(new THREE.HemisphereLight(0xaad8ff, 0x110820, 0.9));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.4);
sun.position.set(-40, 30, 30);
scene.add(sun);
const U = { t: { value: 0 } };

// céu: nebulosa + estrelas (acompanham a câmera)
const sky = new THREE.Group();
scene.add(sky);
{
  const neb = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { t: U.t },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform float t;
      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
      float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        vec3 d = vD;
        float a = fbm(d*2.2 + vec3(0.0, t*0.004, 0.0));
        float b = fbm(d*4.0 + 7.0);
        vec3 c = vec3(0.01,0.012,0.04);
        c += vec3(0.25,0.08,0.45) * smoothstep(0.45, 0.85, a) * 0.8;
        c += vec3(0.05,0.35,0.55) * smoothstep(0.5, 0.9, b) * 0.6;
        c += vec3(0.9,0.4,0.2) * pow(smoothstep(0.6,0.95,a*b*1.6),2.0) * 0.5;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  sky.add(neb);
  const N = 5000;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(rand(500, 1200));
    pos.set([v.x, v.y, v.z], i * 3);
    c.setHSL(rand(0.5, 0.7), rand(0.2, 0.8), rand(0.6, 1));
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const dg = dot.getContext('2d');
  const gr = dg.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = gr; dg.fillRect(0, 0, 32, 32);
  sky.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 4.5, map: new THREE.CanvasTexture(dot), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true })));
}

// ================================================================== modelos
const MODELS = ['timebox', 'asteroid', 'station', ...PLANETS.map((p) => p.model)];
const models = {};
function bake(src) {
  src.updateMatrixWorld(true);
  const inv = src.matrixWorld.clone().invert();
  const byMat = new Map();
  const m4 = new THREE.Matrix4();
  src.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.clone().applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    if (g.index) g = g.toNonIndexed();
    const key = o.material.name;
    if (!byMat.has(key)) byMat.set(key, { m: o.material, gs: [] });
    byMat.get(key).gs.push(g);
  });
  const out = new THREE.Group();
  for (const { m, gs } of byMat.values()) {
    const mesh = new THREE.Mesh(mergeGeometries(gs, false), m);
    mesh.name = m.name;
    out.add(mesh);
  }
  return out;
}
function textPlane(text, w, h, { color = '#ffffff', bg = '#0c0e16', font = '800 64px "Exo 2", system-ui, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = Math.round((1024 * h) / w);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#bfe3ff'; g.shadowBlur = 12;
  g.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
}
function labelSprite(lines, { color = '#e6f6ff', accent = '#4de8e0', h = 2.4 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = '800 54px "Exo 2", system-ui, sans-serif';
  const w = Math.max(...lines.map((l, i) => { g.font = i ? '700 36px "Exo 2", system-ui, sans-serif' : '800 54px "Exo 2", system-ui, sans-serif'; return g.measureText(l).width; })) + 60;
  c.width = w; c.height = lines.length > 1 ? 130 : 84;
  g.fillStyle = 'rgba(6,12,40,.78)';
  g.strokeStyle = accent; g.lineWidth = 4;
  g.beginPath(); g.roundRect(3, 3, w - 6, c.height - 6, 22); g.fill(); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => {
    g.font = i ? '700 36px "Exo 2", system-ui, sans-serif' : '800 54px "Exo 2", system-ui, sans-serif';
    g.fillStyle = i ? accent : color;
    g.fillText(l, w / 2, i ? 100 : 46);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, toneMapped: false }));
  s.scale.set((h * c.width) / c.height, h, 1);
  s.renderOrder = 10;
  return s;
}

// ================================================================== mundo
const W = { planets: [], hits: [] };
let box, lamp, route, routeDone, selRing, vortex, burst3D;

function makeBox() {
  const g = new THREE.Group();
  const b = bake(models.timebox);
  g.add(b);
  lamp = b.children.find((m) => m.name === 'Lamp');
  // placas luminosas "SPACE-TIME BOX" nos quatro lados (frente em +Z)
  const d = 0.722, y = 2.5;
  [[0, 0, d], [Math.PI, 0, -d], [-Math.PI / 2, -d, 0], [Math.PI / 2, d, 0]].forEach(([ry, x, z]) => {
    const p = textPlane('SPACE · TIME · BOX', 1.14, 0.17);
    p.position.set(x, y, z);
    p.rotation.y = ry;
    g.add(p);
  });
  const glow = new THREE.PointLight(0x9fd0ff, 6, 8);
  glow.position.y = 3.3;
  g.add(glow);
  return g;
}

function buildWorld() {
  // planetas em espiral
  PLANETS.forEach((p, i) => {
    const a = i * 0.82 + 0.3;
    const r = 14 + i * 5.2;
    const pos = new THREE.Vector3(Math.cos(a) * r, Math.sin(i * 1.7) * 3, Math.sin(a) * r);
    const g = models[p.model];
    g.traverse((o) => {
      if (o.isMesh && o.material.name === 'PlanetSurface') { o.material.vertexColors = true; o.material.roughness = 0.85; }
    });
    const s = 2.6 + (i === 7 ? 0.6 : 0);
    g.scale.setScalar(s);
    g.position.copy(pos);
    scene.add(g);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(s * 1.6, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(pos);
    hit.userData.idx = i;
    scene.add(hit);
    const label = labelSprite([`${p.id} · ${p.name}`, p.en]);
    label.position.copy(pos).add(new THREE.Vector3(0, s * 1.7 + 1.4, 0));
    scene.add(label);
    W.planets.push({ g, pos, s, label, spin: rand(0.08, 0.2) });
    W.hits.push(hit);
  });
  // rota (linha luminosa entre os planetas)
  const curve = new THREE.CatmullRomCurve3(W.planets.map((p) => p.pos));
  route = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, 0.12, 6), new THREE.MeshBasicMaterial({ color: 0x3a5a9a, transparent: true, opacity: 0.5 }));
  scene.add(route);
  W.curve = curve;
  routeDone = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x4de8e0, toneMapped: false }));
  scene.add(routeDone);

  // cinturão de asteroides
  const ast = bake(models.asteroid);
  const N = 140;
  for (const m of ast.children) {
    m.material.vertexColors = true;
    const im = new THREE.InstancedMesh(m.geometry, m.material, N);
    const tmp = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2), r = rand(62, 80);
      tmp.position.set(Math.cos(a) * r, rand(-4, 4), Math.sin(a) * r);
      tmp.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      tmp.scale.setScalar(rand(0.3, 1.4));
      tmp.updateMatrix();
      im.setMatrixAt(i, tmp.matrix);
    }
    W.belt = im;
    scene.add(im);
  }
  // estação espacial no centro
  const st = bake(models.station);
  st.scale.setScalar(2.2);
  st.position.set(0, 2, 0);
  scene.add(st);
  W.station = st;

  // anel de seleção
  selRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffd84d, toneMapped: false }));
  selRing.rotation.x = Math.PI / 2;
  selRing.visible = false;
  scene.add(selRing);

  // nave
  box = makeBox();
  scene.add(box);

  // túnel do vórtice (bem longe do mapa)
  vortex = new THREE.Group();
  vortex.position.set(0, -2000, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 400, 48, 1, true), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { t: U.t }, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float t;
      void main(){
        float a = vUv.x * 6.2831;
        float z = vUv.y * 40.0 + t * 9.0;
        float s = sin(a * 3.0 + z * 1.1 + sin(z * 0.6) * 2.0) * 0.5 + 0.5;
        float s2 = sin(a * 7.0 - z * 2.1 + t * 2.0) * 0.5 + 0.5;
        float s3 = sin(a * 2.0 + z * 0.4 - t) * 0.5 + 0.5;
        vec3 c = mix(vec3(0.02, 0.05, 0.3), vec3(0.15, 0.6, 1.0), s);
        c = mix(c, vec3(1.0, 0.55, 0.15), pow(s2 * s3, 3.0));
        c += vec3(0.8, 0.9, 1.0) * pow(s * s2, 12.0);
        gl_FragColor = vec4(c * (0.7 + 0.5 * s3), 1.0);
      }`,
  }));
  tube.rotation.x = Math.PI / 2;
  vortex.add(tube);
  scene.add(vortex);
  vortex.visible = false;

  // partículas 3D de comemoração
  const pg = new THREE.OctahedronGeometry(0.12, 0);
  const pm = new THREE.MeshBasicMaterial({ toneMapped: false });
  const im = new THREE.InstancedMesh(pg, pm, 260);
  const cols = [0x4de8e0, 0xffd84d, 0xff5fa2, 0x7c8cff, 0xffffff, 0x9dff6b];
  const cc = new THREE.Color();
  for (let i = 0; i < 260; i++) im.setColorAt(i, cc.setHex(cols[i % cols.length]));
  im.frustumCulled = false;
  scene.add(im);
  burst3D = { im, p: Array.from({ length: 260 }, () => ({ life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3() })), k: 0 };
}

function updateRouteDone() {
  const n = Math.min(save.unlocked, PLANETS.length) - 1;
  routeDone.geometry.dispose();
  if (n <= 0) { routeDone.geometry = new THREE.BufferGeometry(); return; }
  const pts = W.planets.slice(0, n + 1).map((p) => p.pos);
  routeDone.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60 * n, 0.2, 8);
}

// ================================================================== estado
const save = (() => {
  let s = { unlocked: 1, stars: {}, best: {}, at: 0 };
  try { const v = JSON.parse(localStorage.getItem('timebox_v1')); if (v) s = { ...s, ...v }; } catch (e) { /* ok */ }
  return s;
})();
const persist = () => { try { localStorage.setItem('timebox_v1', JSON.stringify(save)); } catch (e) { /* ok */ } };
const totalScore = () => Object.values(save.best).reduce((a, b) => a + b, 0);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

const G = { mode: 'title', sel: -1, planet: 0, k: 0, score: 0, combo: 0, mistakes: 0, tries: 0, start: 0, placed: [], tray: [], camFrom: null, travelT: 0 };

// ================================================================== telas e HUD
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
}
function refreshMapHud() {
  $('totalScore').textContent = totalScore().toLocaleString('pt-BR');
  $('totalStars').textContent = totalStars();
  W.planets.forEach((p, i) => { p.label.material.opacity = i < save.unlocked ? 1 : 0.45; });
  updateRouteDone();
}
let toastT = 0;
function toast(html, ms = 1500) {
  const t = $('toast');
  t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), ms);
}

function enterMap() {
  G.mode = 'map';
  show(null);
  $('missionHud').hidden = true;
  $('mapHud').hidden = false;
  vortex.visible = false;
  controls.enabled = true;
  const p = W.planets[Math.min(save.at, PLANETS.length - 1)].pos;
  controls.target.copy(p).multiplyScalar(0.4);
  camera.position.set(p.x * 0.4 + 30, 45, p.z * 0.4 + 60);
  refreshMapHud();
  selectPlanet(Math.min(save.unlocked - 1, PLANETS.length - 1));
}

function selectPlanet(i) {
  G.sel = i;
  const p = PLANETS[i];
  const P = W.planets[i];
  selRing.visible = true;
  selRing.position.copy(P.pos);
  selRing.scale.setScalar(P.s * 1.9);
  const locked = i >= save.unlocked;
  const st = save.stars[p.id] || 0;
  const panel = $('planetPanel');
  panel.hidden = false;
  panel.innerHTML = `<div class="num">MISSÃO ${p.id} DE ${PLANETS.length}</div><h2>${esc(p.name)}</h2><div class="en">${esc(p.en)}</div>
    <div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div>
    <p>${locked ? '🔒 Complete a missão anterior para liberar as coordenadas deste planeta.' : p.rule}</p>
    ${locked ? '' : `<button class="btn go" id="travelBtn" style="width:100%">Viajar ▶</button>`}
    ${save.best[p.id] ? `<p style="margin:10px 0 0;font-size:13px">Recorde: ${save.best[p.id]} pontos</p>` : ''}`;
  if (!locked) $('travelBtn').onclick = () => { A.sfxClick(); travelTo(i); };
  A.sfxTap(1 + i * 0.05);
}

// ================================================================== viagem pelo vórtice
function travelTo(i, back = false) {
  G.mode = 'travel';
  G.travelT = 0;
  G.travelDur = back ? 2.2 : 3.4;
  G.travelTarget = i;
  G.travelBack = back;
  controls.enabled = false;
  $('mapHud').hidden = true;
  $('missionHud').hidden = true;
  show(null);
  vortex.visible = true;
  A.sfxMaterialize(G.travelDur + 0.4, 0.35);
  A.sfxWarp(0.2);
}
function updateTravel(dt) {
  G.travelT += dt;
  const t = G.travelT;
  const v = vortex.position;
  camera.position.set(v.x + Math.sin(t * 1.3) * 1.2, v.y + Math.cos(t * 1.1) * 1.2, v.z + 18);
  camera.lookAt(v.x, v.y, v.z - 40);
  box.position.set(v.x + Math.sin(t * 2) * 1.5, v.y + Math.cos(t * 1.7) * 1.2, v.z + 5);
  box.rotation.set(Math.sin(t) * 0.6, t * 3, Math.cos(t * 1.4) * 0.5);
  if (t >= G.travelDur) {
    vortex.visible = false;
    box.rotation.set(0, 0, 0);
    if (G.travelBack) enterMap(); else openBriefing(G.travelTarget);
  }
}

// ================================================================== missão
function placeMissionScene(i) {
  const P = W.planets[i];
  G.missionPos = P.pos.clone();
  G.planet = i;
  // posiciona a câmera direto na cena da missão (sem "voar" desde o vórtice)
  camera.position.set(P.pos.x + 2.2, P.pos.y + 1.5, P.pos.z + (innerWidth / innerHeight < 1 ? 19 : 14));
  camera.lookAt(P.pos.x + 2.2, P.pos.y - 2.6, P.pos.z);
  save.at = i;
  persist();
}
function openBriefing(i) {
  placeMissionScene(i);
  G.mode = 'brief';
  const p = PLANETS[i];
  $('bNum').textContent = `MISSÃO ${p.id} DE ${PLANETS.length}`;
  $('bTitle').textContent = p.name;
  $('bEn').textContent = p.en;
  $('bRule').innerHTML = p.rule;
  $('bEx').innerHTML = p.examples.map((e) => `<div class="ex">“${esc(e)}”</div>`).join('');
  show('briefScreen');
  A.duck(0.6, 3000);
}
function startMission() {
  show(null);
  A.unduck();
  $('missionHud').hidden = false;
  G.mode = 'mission';
  G.k = 0;
  G.score = 0;
  G.combo = 0;
  G.mistakes = 0;
  $('mName').textContent = PLANETS[G.planet].name;
  startSentence();
}
function startSentence() {
  const p = PLANETS[G.planet];
  const s = p.sentences[G.k];
  G.placed = [];
  G.tries = 0;
  G.hinted = false;
  G.start = performance.now();
  G.tray = shuffle([...s.chunks, ...s.distract].map((x, id) => ({ ...x, id })));
  $('ptLine').innerHTML = `<span class="emo">${s.ctx}</span>${esc(s.pt)}`;
  $('tipLine').hidden = true;
  $('dots').innerHTML = p.sentences.map((_, j) => `<i class="${j < G.k ? 'on' : j === G.k ? 'cur' : ''}"></i>`).join('');
  renderConsole();
  updateMissionHud();
}
function hideCats() { return PLANETS[G.planet].id >= 6; }
function renderConsole() {
  const s = PLANETS[G.planet].sentences[G.k];
  const slots = $('slots');
  slots.innerHTML = s.chunks.map((c, j) => {
    const placed = G.placed[j];
    if (placed !== undefined) {
      const b = G.tray.find((x) => x.id === placed);
      return `<button class="block pop ${G.hintId === placed ? 'hinted' : ''}" data-slot="${j}" style="--c:${CATS[b.c].color}">${esc(b.t)}</button>`;
    }
    const cat = hideCats() ? null : CATS[c.c];
    return `<div class="slot" style="${cat ? `--c:${cat.color}` : ''}">${cat ? cat.pt : j + 1}</div>`;
  }).join('');
  $('tray').innerHTML = G.tray.map((b) => `<button class="block ${G.placed.includes(b.id) ? 'used' : ''}" data-id="${b.id}" style="--c:${CATS[b.c].color}">${esc(b.t)}</button>`).join('');
  slots.querySelectorAll('.block').forEach((el) => el.onclick = () => {
    if (G.mode !== 'mission') return;
    const j = +el.dataset.slot;
    G.placed.splice(j, 1);
    A.sfxRemove();
    renderConsole();
  });
  $('tray').querySelectorAll('.block').forEach((el) => el.onclick = () => {
    if (G.mode !== 'mission') return;
    const id = +el.dataset.id;
    if (G.placed.includes(id) || G.placed.length >= s.chunks.length) return;
    G.placed.push(id);
    A.sfxPlace(G.placed.length);
    const r = el.getBoundingClientRect();
    spark(r.left + r.width / 2, r.top + r.height / 2, CATS[G.tray.find((x) => x.id === id).c].color);
    renderConsole();
  });
  $('engageBtn').disabled = G.placed.length !== s.chunks.length;
}
function updateMissionHud() {
  $('mScore').textContent = G.score.toLocaleString('pt-BR');
  const mult = 1 + 0.25 * Math.min(G.combo, 8);
  $('combo').textContent = G.combo > 0 ? `COMBO ×${mult}` : '';
}
function engage() {
  if (G.mode !== 'mission') return;
  const s = PLANETS[G.planet].sentences[G.k];
  const got = G.placed.map((id) => G.tray.find((x) => x.id === id).t);
  const wrong = s.chunks.map((c, j) => got[j] !== c.t);
  if (!wrong.some(Boolean)) return success();
  G.tries++;
  G.mistakes++;
  G.combo = 0;
  G.score = Math.max(0, G.score - 25);
  A.sfxWrong();
  jolt(0.5);
  document.querySelectorAll('#slots .block').forEach((el) => { if (wrong[+el.dataset.slot]) el.classList.add('bad'); });
  const first = wrong.indexOf(true);
  const need = hideCats() ? '' : `<br><span style="font-size:.7em">Confira o bloco ${first + 1}: ${CATS[s.chunks[first].c].pt}</span>`;
  toast(`⚠ FALHA NOS CIRCUITOS! −25${need}`, 1800);
  if (G.tries >= 2) { $('tipLine').hidden = false; $('tipLine').innerHTML = '💡 ' + esc(s.tip); }
  updateMissionHud();
}
function hint() {
  if (G.mode !== 'mission') return;
  const s = PLANETS[G.planet].sentences[G.k];
  let j = 0;
  while (j < G.placed.length && G.tray.find((x) => x.id === G.placed[j]).t === s.chunks[j].t) j++;
  if (j >= s.chunks.length) return;
  G.placed = G.placed.slice(0, j);
  const b = G.tray.find((x) => x.t === s.chunks[j].t && !G.placed.includes(x.id));
  G.placed.push(b.id);
  G.hintId = b.id;
  G.hinted = true;
  G.score = Math.max(0, G.score - 30);
  A.sfxHint();
  renderConsole();
  updateMissionHud();
}
function success() {
  const p = PLANETS[G.planet];
  const s = p.sentences[G.k];
  const secs = (performance.now() - G.start) / 1000;
  const first = G.tries === 0 && !G.hinted;
  if (first) G.combo++; else G.combo = 0;
  const mult = 1 + 0.25 * Math.min(G.combo, 8);
  const timeBonus = Math.max(0, Math.round(60 - secs));
  const pts = Math.round((100 + (first ? 50 : 0) + timeBonus) * mult);
  G.score += pts;
  updateMissionHud();
  G.mode = 'celebrate';
  const last = G.k === p.sentences.length - 1;
  const [word, msg, pt] = CHEERS[Math.floor(Math.random() * CHEERS.length)];
  const sentence = s.chunks.map((c) => c.t).join(' ').replace(/([^?!.])$/, '$1.');
  document.querySelectorAll('#slots .block').forEach((el) => (el.style.borderColor = 'var(--good)'));
  fire3D(box.position, 200);
  const dur = celebrate({ word: last ? 'MISSION COMPLETE!' : word, msg, pt, sentence, points: pts,
    sub: `${first ? 'De primeira +50 • ' : ''}tempo +${timeBonus}${mult > 1 ? ` • combo ×${mult}` : ''}`, big: last });
  setTimeout(() => {
    if (G.mode !== 'celebrate') return;
    if (last) finishPlanet();
    else { G.k++; G.mode = 'mission'; startSentence(); }
  }, dur * 1000 + 100);
}
function finishPlanet() {
  const p = PLANETS[G.planet];
  const stars = G.mistakes === 0 ? 3 : G.mistakes <= 3 ? 2 : 1;
  save.stars[p.id] = Math.max(save.stars[p.id] || 0, stars);
  save.best[p.id] = Math.max(save.best[p.id] || 0, G.score);
  save.unlocked = Math.max(save.unlocked, Math.min(PLANETS.length, G.planet + 2));
  if (G.planet === PLANETS.length - 1) save.done = true;
  persist();
  $('missionHud').hidden = true;
  G.mode = 'done';
  if (G.planet === PLANETS.length - 1) {
    $('fStars').textContent = `★ ${totalStars()} / ${PLANETS.length * 3}`;
    $('fScore').textContent = `${totalScore().toLocaleString('pt-BR')} pontos`;
    show('finalScreen');
    celebrate({ word: 'GRAMMAR LEGEND!', msg: 'You have travelled across the whole galaxy of English!', pt: 'Você atravessou toda a galáxia do inglês!', points: totalScore(), big: true });
    return;
  }
  $('dTitle').textContent = p.name;
  $('dStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('dScore').textContent = `${G.score.toLocaleString('pt-BR')} pontos`;
  $('dInfo').innerHTML = G.mistakes ? `Falhas nos circuitos: ${G.mistakes}. Repita para ganhar 3 estrelas!` : '<b>Nenhum erro! Missão perfeita.</b>';
  show('doneScreen');
}

function updateMissionScene(t, dt) {
  const c = G.missionPos;
  const P = W.planets[G.planet];
  // nave pairando perto do planeta; câmera enquadra os dois acima do console
  const wide = innerWidth / innerHeight;
  const back = wide < 1 ? 19 : 14;
  box.position.set(c.x + (wide < 1 ? 2.8 : 5.2), c.y - 1.3 + Math.sin(t * 1.6) * 0.3, c.z + 2.5);
  box.rotation.y += dt * (G.mode === 'celebrate' ? 9 : 0.4);
  box.rotation.z = Math.sin(t * 0.9) * 0.08;
  const want = new THREE.Vector3(c.x + 2.2 + Math.sin(t * 0.2) * 0.6, c.y + 1.5, c.z + back);
  camera.position.lerp(want, 1 - Math.exp(-3 * dt));
  camera.lookAt(c.x + 2.2, c.y - (wide < 1 ? 4.5 : 2.6), c.z);
  P.g.rotation.y += dt * 0.05;
}

// ================================================================== partículas 3D
function fire3D(pos, n) {
  for (let i = 0; i < n; i++) {
    const p = burst3D.p[burst3D.k++ % burst3D.p.length];
    p.life = rand(1, 2);
    p.pos.copy(pos).add(new THREE.Vector3(0, 1.5, 0));
    p.vel.randomDirection().multiplyScalar(rand(3, 11));
  }
}
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3();
function updateBurst(dt) {
  const { im, p } = burst3D;
  p.forEach((q, i) => {
    if (q.life > 0) { q.life -= dt; q.vel.multiplyScalar(Math.exp(-1.5 * dt)); q.pos.addScaledVector(q.vel, dt); tmpS.setScalar(Math.min(1, q.life) * 1.5); } else tmpS.setScalar(0);
    tmpQ.setFromEuler(new THREE.Euler(q.life * 6, q.life * 4, 0));
    im.setMatrixAt(i, tmpM.compose(q.pos, tmpQ, tmpS));
  });
  im.instanceMatrix.needsUpdate = true;
}

// ================================================================== entrada
const ray = new THREE.Raycaster();
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; A.initAudio(); });
canvas.addEventListener('pointerup', (e) => {
  if (G.mode !== 'map' || !downAt) return;
  if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(W.hits)[0];
  if (hit) selectPlanet(hit.object.userData.idx);
});
canvas.addEventListener('pointermove', (e) => {
  if (G.mode !== 'map') return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  canvas.style.cursor = ray.intersectObjects(W.hits).length ? 'pointer' : 'grab';
});
addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') toggleMusic();
  if (G.mode === 'mission' && e.key === 'Enter' && !$('engageBtn').disabled) engage();
  if (G.mode === 'mission' && e.key === 'Backspace') { G.placed.pop(); A.sfxRemove(); renderConsole(); }
});
function toggleMusic() {
  A.initAudio();
  A.setMusic(!A.isMusicOn());
  document.querySelectorAll('.musicBtn').forEach((b) => (b.textContent = A.isMusicOn() ? '♪' : '✕♪'));
}
document.querySelectorAll('.musicBtn').forEach((b) => (b.onclick = toggleMusic));
$('playBtn').onclick = () => { A.initAudio(); A.startMusic(); A.sfxClick(); A.speak('Welcome aboard, traveller!'); enterMap(); };
$('howBtn').onclick = () => { A.initAudio(); show('howScreen'); };
$('howOk').onclick = () => show(G.mode === 'title' ? 'titleScreen' : null);
$('bGo').onclick = () => { A.sfxClick(); startMission(); };
$('engageBtn').onclick = engage;
$('clearBtn').onclick = () => { if (G.mode === 'mission') { G.placed = []; A.sfxRemove(); renderConsole(); } };
$('hintBtn').onclick = hint;
$('ruleBtn').onclick = () => { const p = PLANETS[G.planet]; toast(`<div style="font-size:.7em;font-family:var(--body);text-shadow:0 0 8px #000">${p.rule}</div>`, 5000); };
$('mapBtn').onclick = () => { if (G.mode === 'mission') { A.sfxClick(); travelTo(G.planet, true); } };
$('dMap').onclick = () => { A.sfxClick(); travelTo(Math.min(G.planet + 1, PLANETS.length - 1), true); };
$('dRetry').onclick = () => { A.sfxClick(); openBriefing(G.planet); };
$('fMap').onclick = () => { A.sfxClick(); enterMap(); };

// ================================================================== loop
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 70 : 55;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
const clock = new THREE.Clock();
let time = 0;
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  time += dt;
  U.t.value = time;
  if (box) {
    W.planets.forEach((p) => (p.g.rotation.y += dt * p.spin));
    if (W.station) W.station.rotation.y += dt * 0.15;
    if (W.belt) W.belt.rotation.y += dt * 0.01;
    if (lamp) lamp.material.emissiveIntensity = 2 + Math.sin(time * 4) * 2;
    selRing.rotation.z += dt;
    selRing.visible = G.mode === 'map' && G.sel >= 0;
    W.planets.forEach((p) => (p.label.visible = G.mode === 'map' || G.mode === 'title'));
    if (G.mode === 'map' || G.mode === 'title') {
      if (G.mode === 'title') {
        const a = time * 0.05;
        camera.position.set(Math.cos(a) * 75, 30, Math.sin(a) * 75);
        camera.lookAt(0, 0, 0);
      } else controls.update();
      const at = W.planets[Math.min(save.at, PLANETS.length - 1)];
      box.position.set(at.pos.x + Math.cos(time * 0.6) * at.s * 2.2, at.pos.y + 1 + Math.sin(time) * 0.4, at.pos.z + Math.sin(time * 0.6) * at.s * 2.2);
      box.rotation.set(0.15, time * 0.8, 0.1);
      box.scale.setScalar(1.3);
    } else if (G.mode === 'travel') { box.scale.setScalar(1); updateTravel(dt); }
    else if (G.missionPos) { box.scale.setScalar(1); updateMissionScene(time, dt); }
    sky.position.copy(camera.position);
    updateBurst(dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

async function load() {
  const L = new GLTFLoader();
  let n = 0;
  await Promise.all(MODELS.map((m) => new Promise((res, rej) => L.load(window.MODEL_DATA?.[m] || `models/${m}.${window.MODEL_EXT || "glb"}`, (g) => {
    models[m] = g.scene;
    $('loadbar').firstElementChild.style.width = `${(++n / MODELS.length) * 100}%`;
    res();
  }, undefined, rej))));
  if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  buildWorld();
  refreshMapHud();
  $('loadTxt').textContent = 'Nave pronta! O som liga ao decolar 🔊';
  $('playBtn').disabled = false;
  window.__ready = true;
}
load().catch((e) => { console.error(e); $('loadTxt').textContent = 'Erro ao carregar os modelos 3D. Abra pelo arquivo único time-box.html ou por um servidor web.'; });
loop();
window.__tb = { G, save, PLANETS, W, travelTo, openBriefing, startMission, engage, enterMap, selectPlanet, get box() { return box; } };
