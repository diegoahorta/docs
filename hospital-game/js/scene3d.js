// Fundo 3D em Three.js: objetos de hospital em estilo "toon" flutuando em tons pastel,
// e um pequeno hospital que aparece na tela inicial.
(function () {
  const api = { setMood() {}, showHospital() {}, celebrate() {} };
  window.Scene3D = api;
  if (!window.THREE) return;

  const canvas = document.getElementById('bg3d');
  if (!canvas) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    canvas.remove();
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Gradiente de 3 tons = sombreamento de anime (cel shading)
  const grad = new THREE.DataTexture(new Uint8Array([140, 140, 140, 205, 205, 205, 255, 255, 255]), 3, 1, THREE.RGBFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter;
  grad.needsUpdate = true;
  const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: grad });

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.55);
  sun.position.set(4, 6, 8);
  scene.add(sun);

  const PASTELS = [0xffaab8, 0xa8e6cf, 0xcdb4f0, 0xb5dcf5, 0xffd3b6, 0xffeaa7];

  function cross(color) {
    const g = new THREE.Group();
    const m = toon(color);
    const a = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.45), m);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.45), m);
    g.add(a, b);
    return g;
  }
  function pill(c1, c2) {
    const g = new THREE.Group();
    const r = 0.32;
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.55, 20), toon(c1));
    const h2 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.55, 20), toon(c2));
    h1.position.y = 0.275; h2.position.y = -0.275;
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), toon(c1));
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), toon(c2));
    s1.position.y = 0.55; s2.position.y = -0.55;
    g.add(h1, h2, s1, s2);
    return g;
  }
  function heart(color) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35);
    s.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 });
    geo.center();
    return new THREE.Mesh(geo, toon(color));
  }
  function cloud() {
    const g = new THREE.Group();
    const m = toon(0xffffff);
    [[0, 0, 0.6], [0.6, 0.1, 0.45], [-0.6, 0.05, 0.42], [0.25, 0.35, 0.4]].forEach(([x, y, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m);
      s.position.set(x, y, 0);
      g.add(s);
    });
    return g;
  }

  const floaters = [];
  const makers = [
    () => cross(0xffaab8), () => pill(0xcdb4f0, 0xffffff), () => heart(0xffaab8), () => cloud(),
    () => cross(0xa8e6cf), () => pill(0xb5dcf5, 0xffeaa7), () => heart(0xcdb4f0), () => pill(0xffd3b6, 0xffffff),
    () => cross(0xb5dcf5), () => cloud(), () => heart(0xffd3b6), () => pill(0xa8e6cf, 0xffffff),
  ];
  makers.forEach((make, i) => {
    const o = make();
    const sc = 0.6 + ((i * 37) % 10) / 14;
    o.scale.setScalar(sc);
    o.userData = {
      base: new THREE.Vector3(((i * 53) % 17) - 8.5, ((i * 29) % 11) - 5.5, -2 - ((i * 13) % 6)),
      speed: 0.25 + ((i * 7) % 5) / 10,
      phase: i * 1.7,
      spin: new THREE.Vector3(((i % 3) - 1) * 0.3, 0.35 + (i % 4) * 0.1, ((i % 2) - 0.5) * 0.2),
    };
    o.position.copy(o.userData.base);
    scene.add(o);
    floaters.push(o);
  });

  // Hospital fofo (tela inicial)
  const hospital = new THREE.Group();
  (function build() {
    const wall = toon(0xfff6f8), roof = toon(0xffaab8), glass = toon(0xb5dcf5), door = toon(0xa8e6cf);
    const main = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 2), wall);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.8), wall);
    const wingR = wingL.clone();
    wingL.position.set(-2.5, -0.4, 0); wingR.position.set(2.5, -0.4, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.28, 2.3), roof);
    top.position.y = 1.42;
    const topL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 2), roof);
    const topR = topL.clone();
    topL.position.set(-2.5, 0.6, 0); topR.position.set(2.5, 0.6, 0);
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.1), door);
    d.position.set(0, -0.75, 1.02);
    hospital.add(main, wingL, wingR, top, topL, topR, d);
    [[-1.15, 0.55], [1.15, 0.55], [-1.15, -0.55], [1.15, -0.55]].forEach(([x, y]) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), glass);
      w.position.set(x, y, 1.02);
      hospital.add(w);
    });
    [-2.5, 2.5].forEach((x) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), glass);
      w.position.set(x, -0.3, 0.92);
      hospital.add(w);
    });
    const sign = cross(0xff8fab);
    sign.scale.setScalar(0.55);
    sign.position.set(0, 0.62, 1.1);
    hospital.add(sign);
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.25, 40), toon(0xc8efdc));
    ground.position.y = -1.42;
    hospital.add(ground);
    [[-3.9, 0.9], [3.9, 0.6], [-3.4, -1.5], [3.5, -1.6]].forEach(([x, z]) => {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), toon(0xa8e6cf));
      t.position.set(x, -0.85, z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8), toon(0xe0b89c));
      trunk.position.set(x, -1.2, z);
      hospital.add(t, trunk);
    });
  })();
  hospital.scale.setScalar(0.85);
  hospital.rotation.x = 0.18;
  hospital.visible = false;
  scene.add(hospital);

  // Confete para comemorar acertos
  const confetti = [];
  function celebrate() {
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(i % 2 ? new THREE.BoxGeometry(0.18, 0.18, 0.04) : new THREE.SphereGeometry(0.1, 8, 6), toon(PASTELS[i % PASTELS.length]));
      m.position.set((Math.random() - 0.5) * 2, -1 + Math.random(), 4);
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.18, 0.16 + Math.random() * 0.12, (Math.random() - 0.5) * 0.05);
      m.userData.life = 1;
      scene.add(m);
      confetti.push(m);
    }
    if (reduce.matches) render(performance.now());
  }

  let w = 0, h = 0;
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    placeHospital();
  }
  function placeHospital() {
    const visW = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
    const wide = w > 860;
    hospital.position.set(wide ? visW * 0.25 : 0, wide ? 0.5 : -3.6, 0);
    hospital.scale.setScalar(wide ? 0.8 : 0.5);
  }
  window.addEventListener('resize', resize);
  resize();

  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => { mx = e.clientX / w - 0.5; my = e.clientY / h - 0.5; });

  let wantHospital = false;
  function render(t) {
    const s = t / 1000;
    floaters.forEach((o) => {
      const u = o.userData;
      o.position.x = u.base.x + Math.sin(s * u.speed + u.phase) * 0.5 + mx * 0.8;
      o.position.y = u.base.y + Math.cos(s * u.speed * 0.8 + u.phase) * 0.6 - my * 0.6;
      o.rotation.x = u.spin.x * s; o.rotation.y = u.spin.y * s; o.rotation.z = u.spin.z * s;
    });
    const showH = wantHospital && w > 860;
    hospital.visible = showH;
    if (showH) {
      hospital.rotation.y = Math.sin(s * 0.4) * 0.35 + mx * 0.4;
      hospital.position.y += (Math.sin(s * 1.2) * 0.004);
    }
    for (let i = confetti.length - 1; i >= 0; i--) {
      const m = confetti[i];
      m.position.add(m.userData.v);
      m.userData.v.y -= 0.006;
      m.rotation.x += 0.1; m.rotation.y += 0.13;
      m.userData.life -= 0.012;
      if (m.userData.life <= 0) { scene.remove(m); m.geometry.dispose(); confetti.splice(i, 1); }
    }
    renderer.render(scene, camera);
  }

  let running = true;
  function loop(t) {
    if (running) render(t);
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  if (reduce.matches) {
    render(4000);
    // Sem animação contínua: só redesenha quando algo muda
    const tick = () => { if (confetti.length) { render(performance.now()); requestAnimationFrame(tick); } };
    api.celebrate = () => { celebrate(); tick(); };
  } else {
    requestAnimationFrame(loop);
    api.celebrate = celebrate;
  }

  api.showHospital = (v) => { wantHospital = !!v; if (reduce.matches) render(4000); };
  api.setMood = (hex) => {
    // Tinge levemente a luz ambiente conforme o lugar da história
    scene.children.forEach((c) => { if (c.isAmbientLight) c.color.set(hex || 0xffffff); });
    if (reduce.matches) render(4000);
  };
})();
