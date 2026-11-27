/* Pongo 3D — o mascote (um cachorrinho) numa ilha flutuante com um relógio que gira para trás (o passado!).
   Three.js r128 (global THREE). Se WebGL não existir, cai para um Pongo em SVG. */
(function () {
  'use strict';
  const PQ3D = { ok: false };
  let renderer, scene, camera, root, dog, parts = {}, clockHands, ring, coin, mountEl = null, ro = null;
  let state = 'idle', stateStart = 0, resultMode = false, enabled = true, raf = 0, lastFrame = 0;
  const pointer = { x: 0, y: 0 };
  const confetti = [];
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;

  const COLORS = {
    fur: 0xE8A25C, cream: 0xFFF1DC, ear: 0x8A4B26, nose: 0x1B1B22, collar: 0xFF5F3D, tag: 0xFFB81F,
    grass: 0x6FCF97, grassDark: 0x4FAE7A, dirt: 0xB87A4B, ring: 0xFFB81F, face: 0xFFFFFF, hand: 0x1B2232, tongue: 0xFF7A93,
  };
  const CONFETTI = [0xFF5F3D, 0xFFB81F, 0x2B8CF0, 0x1D9E63, 0xD64F8A, 0x7C5CE0];

  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.02 }, opts || {}));
  }
  function sphere(r, color, sx, sy, sz, seg) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 28, seg ? Math.round(seg * 0.75) : 20), mat(color));
    m.scale.set(sx || 1, sy || 1, sz || 1);
    return m;
  }

  function buildDog() {
    dog = new THREE.Group();
    // corpo sentado
    const body = sphere(1, COLORS.fur, 0.78, 0.92, 0.74); body.position.set(0, 0.95, 0); dog.add(body);
    const belly = sphere(1, COLORS.cream, 0.5, 0.62, 0.3); belly.position.set(0, 0.86, 0.5); dog.add(belly);
    // patas traseiras
    [-1, 1].forEach((s) => {
      const h = sphere(0.44, COLORS.fur, 1, 0.8, 1.15); h.position.set(0.52 * s, 0.38, 0.02); dog.add(h);
      const foot = sphere(0.2, COLORS.cream, 1.2, 0.6, 1.5); foot.position.set(0.62 * s, 0.1, 0.42); dog.add(foot);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.72, 16), mat(COLORS.fur));
      leg.position.set(0.28 * s, 0.42, 0.5); dog.add(leg);
      const paw = sphere(0.19, COLORS.cream, 1.1, 0.65, 1.3); paw.position.set(0.28 * s, 0.08, 0.6); dog.add(paw);
    });
    // coleira + plaquinha (osso dourado)
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.075, 12, 36), mat(COLORS.collar));
    collar.rotation.x = Math.PI / 2; collar.position.set(0, 1.62, 0.02); dog.add(collar);
    const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20), mat(COLORS.tag, { metalness: 0.5, roughness: 0.3 }));
    tag.rotation.x = Math.PI / 2; tag.position.set(0, 1.46, 0.55); dog.add(tag);

    // cabeça
    const head = new THREE.Group(); head.position.set(0, 2.15, 0.05); dog.add(head);
    const skull = sphere(0.72, COLORS.fur, 1.05, 0.95, 0.95); head.add(skull);
    const muzzle = sphere(0.38, COLORS.cream, 1.05, 0.78, 0.95); muzzle.position.set(0, -0.2, 0.55); head.add(muzzle);
    const nose = sphere(0.12, COLORS.nose, 1.25, 0.9, 0.9); nose.position.set(0, -0.08, 0.9); head.add(nose);
    const spot = sphere(0.3, COLORS.ear, 1, 1, 0.5); spot.position.set(0.32, 0.25, 0.5); head.add(spot);
    const tongue = sphere(0.12, COLORS.tongue, 1, 0.5, 1.2); tongue.position.set(0, -0.44, 0.72); tongue.visible = false; head.add(tongue);
    const eyes = [];
    [-1, 1].forEach((s) => {
      const eye = new THREE.Group(); eye.position.set(0.27 * s, 0.1, 0.62);
      const ball = sphere(0.1, COLORS.nose, 1, 1.1, 0.8); eye.add(ball);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(0.03, 0.04, 0.07); eye.add(glint);
      head.add(eye); eyes.push(eye);
    });
    const ears = [];
    [-1, 1].forEach((s) => {
      const pivot = new THREE.Group(); pivot.position.set(0.58 * s, 0.42, -0.02);
      const ear = sphere(0.3, COLORS.ear, 0.75, 1.55, 0.35); ear.position.set(0.08 * s, -0.38, 0); pivot.add(ear);
      pivot.rotation.z = 0.35 * s; head.add(pivot); ears.push(pivot);
    });
    // rabo
    const tail = new THREE.Group(); tail.position.set(0, 0.55, -0.62); dog.add(tail);
    const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, 0.75, 12), mat(COLORS.fur));
    tailMesh.position.set(0, 0.32, -0.1); tailMesh.rotation.x = -0.5; tail.add(tailMesh);
    const tip = sphere(0.1, COLORS.cream); tip.position.set(0, 0.66, -0.3); tail.add(tip);

    parts = { head, eyes, ears, tail, tongue, body };
    return dog;
  }

  function buildIsland() {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.85, 0.32, 9), mat(COLORS.grass, { flatShading: true }));
    top.position.y = -0.16; g.add(top);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.5, 0.22, 9), mat(COLORS.grassDark, { flatShading: true }));
    rim.position.y = -0.42; g.add(rim);
    const dirt = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.5, 9), mat(COLORS.dirt, { flatShading: true }));
    dirt.rotation.x = Math.PI; dirt.position.y = -1.28; g.add(dirt);
    // osso no chão
    const bone = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10), mat(0xFFFFFF)); shaft.rotation.z = Math.PI / 2; bone.add(shaft);
    [-0.32, 0.32].forEach((x) => [-0.07, 0.07].forEach((z) => { const k = sphere(0.1, 0xFFFFFF); k.position.set(x, 0, z); bone.add(k); }));
    bone.position.set(1.15, 0.08, 0.75); bone.rotation.y = 0.6; g.add(bone);
    // tufos
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 5), mat(COLORS.grassDark, { flatShading: true }));
      tuft.position.set(Math.cos(a) * 1.6, 0.1, Math.sin(a) * 1.6); g.add(tuft);
    }
    return g;
  }

  function buildClock() {
    const g = new THREE.Group(); g.position.set(0, 1.85, -1.5);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.75, 48), new THREE.MeshBasicMaterial({ color: COLORS.face, transparent: true, opacity: 0.55 }));
    g.add(face);
    ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.07, 12, 64), mat(COLORS.ring, { metalness: 0.4, roughness: 0.35 }));
    g.add(ring);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(i % 3 === 0 ? 0.1 : 0.05, i % 3 === 0 ? 0.28 : 0.16, 0.02), new THREE.MeshBasicMaterial({ color: COLORS.hand }));
      tick.position.set(Math.sin(a) * 1.5, Math.cos(a) * 1.5, 0.01); tick.rotation.z = -a; g.add(tick);
    }
    const hands = new THREE.Group(); hands.position.z = 0.03;
    const hour = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.8, 0.02), new THREE.MeshBasicMaterial({ color: COLORS.hand })); hour.position.y = 0.4;
    const minute = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 0.02), new THREE.MeshBasicMaterial({ color: COLORS.collar })); minute.position.y = 0.62;
    const hp = new THREE.Group(); hp.add(hour); const mp = new THREE.Group(); mp.add(minute);
    hands.add(hp); hands.add(mp); g.add(hands);
    clockHands = { hp, mp };
    return g;
  }

  function buildCoin() {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 40), mat(0xFFC23D, { metalness: 0.65, roughness: 0.25 }));
    disc.rotation.x = Math.PI / 2; g.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 10, 40), mat(0xE39A00, { metalness: 0.7, roughness: 0.25 }));
    g.add(rim);
    // estrela em relevo
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.34 : 0.15; const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }), mat(0xFFF1B8, { metalness: 0.3 }));
    star.position.z = 0.07; g.add(star);
    const star2 = star.clone(); star2.rotation.y = Math.PI; star2.position.z = -0.07; g.add(star2);
    g.position.set(0, 3.75, 0.2); g.visible = false;
    return g;
  }

  function burst(n) {
    const geo = new THREE.PlaneGeometry(0.09, 0.16);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: CONFETTI[i % CONFETTI.length], side: THREE.DoubleSide }));
      m.position.set((Math.random() - 0.5) * 0.6, 2.4, (Math.random() - 0.5) * 0.6);
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      m.userData = { v: new THREE.Vector3(Math.cos(a) * sp * 0.6, 4 + Math.random() * 3.5, Math.sin(a) * sp * 0.4), spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), born: now() };
      scene.add(m); confetti.push(m);
    }
  }

  function init() {
    if (!window.THREE) return false;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return false; }
    if (!renderer || !renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 2.1, 9.2);
    camera.lookAt(0, 1.55, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8496c0, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(3, 6, 5); scene.add(sun);
    const rim = new THREE.DirectionalLight(0xffd7a8, 0.35); rim.position.set(-4, 2, -3); scene.add(rim);

    root = new THREE.Group(); scene.add(root);
    root.add(buildIsland());
    root.add(buildDog());
    root.add(buildClock());
    coin = buildCoin(); scene.add(coin);

    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    PQ3D.ok = true;
    return true;
  }

  function resize() {
    if (!mountEl || !renderer) return;
    const w = Math.max(1, mountEl.clientWidth), h = Math.max(1, mountEl.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    frame();
    renderOnce();
  }

  function frame() {
    // no resultado a câmera recua e sobe para mostrar a moeda acima do Pongo
    camera.position.set(0, resultMode ? 2.6 : 2.1, resultMode ? 11.4 : 9.2);
    camera.lookAt(0, resultMode ? 2.15 : 1.55, 0);
    camera.updateProjectionMatrix();
  }

  function ease(p) { return 1 - Math.pow(1 - p, 3); }

  function animate(t) {
    const st = t - stateStart;
    const { head, eyes, ears, tail, tongue } = parts;
    // base idle
    root.position.y = Math.sin(t * 1.4) * 0.07;
    root.rotation.y = Math.sin(t * 0.35) * 0.12;
    dog.position.y = 0; dog.rotation.set(0, 0, 0); dog.scale.set(1, 1, 1);
    head.rotation.y = pointer.x * 0.45; head.rotation.x = pointer.y * 0.18; head.rotation.z = Math.sin(t * 1.1) * 0.06;
    let wag = Math.sin(t * 7) * 0.35, earLift = 0, tongueOn = false, eyeSquint = 1;
    // relógio volta no tempo (anti-horário)
    clockHands.mp.rotation.z = t * 0.9; clockHands.hp.rotation.z = t * 0.075;
    ring.rotation.z = -t * 0.2;

    if (state === 'happy' || state === 'celebrate') {
      const dur = state === 'happy' ? 1.0 : 2.4;
      const p = Math.min(1, st / dur);
      const hops = state === 'happy' ? 1 : 3;
      const hp = (p * hops) % 1;
      dog.position.y = Math.sin(hp * Math.PI) * (state === 'happy' ? 0.7 : 0.9);
      const squash = hp < 0.08 || hp > 0.92 ? 0.9 : 1.04;
      dog.scale.set(2 - squash, squash, 2 - squash);
      if (state === 'happy') dog.rotation.y = ease(p) * Math.PI * 2;
      wag = Math.sin(t * 22) * 0.6; earLift = 0.6 * Math.sin(hp * Math.PI); tongueOn = true; eyeSquint = 0.45;
      clockHands.mp.rotation.z = t * 6;
      if (p >= 1) setState(resultMode ? 'proud' : 'idle');
    } else if (state === 'sad') {
      const p = Math.min(1, st / 1.3);
      head.rotation.y = Math.sin(p * Math.PI * 6) * 0.4 * (1 - p);
      head.rotation.x = 0.25;
      earLift = -0.45; wag = Math.sin(t * 2) * 0.08; eyeSquint = 0.6;
      dog.scale.set(1.02, 0.97, 1.02);
      if (p >= 1) setState('idle');
    } else if (state === 'proud') {
      wag = Math.sin(t * 12) * 0.5; tongueOn = true; earLift = 0.2;
    }

    tail.rotation.z = wag; tail.rotation.x = state === 'sad' ? 0.6 : -0.1;
    ears[0].rotation.z = -0.35 - earLift; ears[1].rotation.z = 0.35 + earLift;
    tongue.visible = tongueOn;
    const blink = (t % 3.8) < 0.13 ? 0.12 : 1;
    eyes.forEach((e) => { e.scale.y = Math.min(blink, eyeSquint); });

    // moeda do resultado
    coin.visible = resultMode;
    if (resultMode) { coin.rotation.y = t * 2.2; coin.position.y = 3.85 + Math.sin(t * 2) * 0.1; }

    // confete
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i], u = c.userData, age = t - u.born;
      const dt = 1 / 60;
      u.v.y -= 9.8 * dt * 0.8; u.v.multiplyScalar(0.985);
      c.position.addScaledVector(u.v, dt);
      c.rotation.x += u.spin.x * dt; c.rotation.y += u.spin.y * dt; c.rotation.z += u.spin.z * dt;
      if (age > 3 || c.position.y < -3) { scene.remove(c); c.material.dispose(); confetti.splice(i, 1); }
    }
  }

  function renderOnce() {
    if (!renderer || !mountEl) return;
    animate(now());
    renderer.render(scene, camera);
  }

  function loop() {
    cancelAnimationFrame(raf);
    const tick = (ms) => {
      if (document.hidden || !mountEl) return;
      if (!enabled && state === 'idle' && !confetti.length && !resultMode) { renderOnce(); return; }
      // ~60fps máx, economiza bateria em telas 120Hz
      if (ms - lastFrame >= 15) { lastFrame = ms; animate(now()); renderer.render(scene, camera); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function setState(s) { state = s; stateStart = now(); }

  /* ---------- fallback SVG ---------- */
  const SVG_DOG = '<svg viewBox="0 0 120 120" class="svg-pongo" aria-label="Pongo"><ellipse cx="60" cy="108" rx="42" ry="7" fill="currentColor" opacity=".12"/><g class="sp-body"><ellipse cx="60" cy="80" rx="27" ry="26" fill="#E8A25C"/><ellipse cx="60" cy="84" rx="16" ry="18" fill="#FFF1DC"/><ellipse cx="60" cy="46" rx="26" ry="23" fill="#E8A25C"/><ellipse cx="36" cy="46" rx="8" ry="17" fill="#8A4B26" transform="rotate(18 36 46)"/><ellipse cx="84" cy="46" rx="8" ry="17" fill="#8A4B26" transform="rotate(-18 84 46)"/><ellipse cx="60" cy="56" rx="13" ry="10" fill="#FFF1DC"/><circle cx="51" cy="44" r="3.6" fill="#1B1B22"/><circle cx="69" cy="44" r="3.6" fill="#1B1B22"/><ellipse cx="60" cy="51" rx="4.5" ry="3.3" fill="#1B1B22"/><rect x="40" y="64" width="40" height="5" rx="2.5" fill="#FF5F3D"/><circle cx="60" cy="71" r="3.5" fill="#FFB81F"/></g></svg>';
  function fallbackMount(el) {
    if (!el.querySelector('.svg-pongo')) el.innerHTML = SVG_DOG;
    mountEl = el;
  }
  function fallbackReact(kind) {
    if (!mountEl) return;
    const s = mountEl.querySelector('.svg-pongo'); if (!s) return;
    s.classList.remove('is-happy', 'is-sad'); void s.offsetWidth;
    if (kind === 'happy' || kind === 'celebrate') s.classList.add('is-happy');
    if (kind === 'sad') s.classList.add('is-sad');
  }
  const style = document.createElement('style');
  style.textContent = '.svg-pongo{width:100%;height:100%;color:var(--ink,#000)}.svg-pongo .sp-body{transform-origin:60px 100px}.svg-pongo.is-happy .sp-body{animation:spHop .6s ease 2}.svg-pongo.is-sad .sp-body{animation:spNo .5s ease 2}@keyframes spHop{50%{transform:translateY(-14px) scale(1.04,.96)}}@keyframes spNo{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}';
  document.head.appendChild(style);

  /* ---------- API ---------- */
  let triedInit = false;
  PQ3D.mount = function (el) {
    if (!el) return;
    if (!triedInit) { triedInit = true; init(); }
    if (!PQ3D.ok) { fallbackMount(el); return; }
    if (mountEl === el && renderer.domElement.parentNode === el) { resize(); return; }
    mountEl = el;
    el.innerHTML = '';
    el.appendChild(renderer.domElement);
    if (ro) ro.disconnect();
    if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(el); }
    resize();
    loop();
  };
  PQ3D.react = function (kind) {
    if (!PQ3D.ok) { fallbackReact(kind); return; }
    if (kind === 'celebrate') burst(enabled ? 90 : 30);
    if (kind === 'happy' && enabled) burst(14);
    setState(kind === 'idle' ? 'idle' : kind);
    loop();
  };
  PQ3D.setResult = function (on) { resultMode = !!on; if (PQ3D.ok) { frame(); setState(on ? 'proud' : 'idle'); loop(); } };
  PQ3D.setEnabled = function (on) { enabled = !!on; if (PQ3D.ok) loop(); };
  window.PQ3D = PQ3D;
})();
