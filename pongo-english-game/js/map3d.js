/* Pongo Learns English - interactive 3D map.
 * Loads the garden + house + Pongo modelled in Blender (assets/pongo_world.glb,
 * embedded in js/world-data.js) and renders it with Three.js. Lesson stops are
 * the LVL_* empties from the Blender scene; HTML markers float above them. */
(function () {
  'use strict';
  if (!window.THREE || !THREE.GLTFLoader || !THREE.OrbitControls) return; // game.js falls back to a 2D path

  // Same winding path as blender/build_pongo_world.py (Blender x,y -> three x,-y)
  const PATH_2D = [[0, -29], [0, -21], [-8, -15], [-11, -6], [-2, -1], [8, 2], [10, 9], [4, 12.5], [0, 15.5]];
  const BOUNDS = { minX: -26, maxX: 26, minZ: -30, maxZ: 28 };

  const M = {
    ready: false,
    active: true,
    levels: [], // THREE.Vector3 per level
    levelT: [], // curve parameter per level
    pongoAt: 0,
  };

  let renderer, scene, camera, controls, clock, pongo, curve, beacon, star;
  let tail, earFlop, pongoMeshes = [];
  let clouds = [];
  let walk = null;
  let hop = 0;
  let markersEl, markerEls = [];
  let onSelect = () => {}, onPongo = () => {};
  const tmp = new THREE.Vector3();

  function b64ToBuffer(b64) {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function makeCloud() {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const n = 3 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + Math.random() * 1.4, 1), mat);
      s.position.set(i * 2.1 - n, Math.random() * 0.8, Math.random() * 1.5);
      g.add(s);
    }
    g.position.set(-70 + Math.random() * 140, 20 + Math.random() * 8, -60 + Math.random() * 90);
    g.userData.speed = 0.6 + Math.random() * 0.8;
    return g;
  }

  M.init = function (opts) {
    onSelect = opts.onSelect || onSelect;
    onPongo = opts.onPongo || onPongo;
    markersEl = opts.markers;
    const canvas = opts.canvas;

    return new Promise((resolve, reject) => {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch (e) {
        reject(e);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xcdeeff, 70, 150);
      camera = new THREE.PerspectiveCamera(42, 1, 0.5, 400);
      camera.position.set(0, 30, 10);

      scene.add(new THREE.HemisphereLight(0xdff4ff, 0x5c8a3a, 0.75));
      const sun = new THREE.DirectionalLight(0xfff3d6, 1.05);
      sun.position.set(-30, 50, 25);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 140 });
      sun.shadow.bias = -0.0008;
      scene.add(sun);

      for (let i = 0; i < 9; i++) {
        const c = makeCloud();
        clouds.push(c);
        scene.add(c);
      }

      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 14;
      controls.maxDistance = 80;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = 1.2;
      controls.screenSpacePanning = false;
      controls.target.set(0, 0, 21);

      clock = new THREE.Clock();

      const loader = new THREE.GLTFLoader();
      loader.parse(
        b64ToBuffer(window.PONGO_WORLD_GLB),
        '',
        (gltf) => {
          const root = gltf.scene;
          root.traverse((o) => {
            if (o.isMesh) {
              const big = /Lawn|PathStone|_Pad|Pond_Water|FlowerBed\d_Soil/.test(o.name);
              o.castShadow = !big;
              o.receiveShadow = true;
              if (o.material && o.material.metalness !== undefined) {
                o.material.metalness = Math.min(o.material.metalness, 0.3);
              }
            }
          });
          scene.add(root);

          for (let i = 1; i <= 7; i++) {
            const e = root.getObjectByName('LVL_' + i);
            const v = new THREE.Vector3();
            if (e) e.getWorldPosition(v);
            M.levels.push(v);
          }

          pongo = root.getObjectByName('Pongo');
          scene.attach(pongo);
          pongo.traverse((o) => { if (o.isMesh) pongoMeshes.push(o); });
          tail = root.getObjectByName('Pongo_Tail') || pongo.getObjectByName('Pongo_Tail');
          earFlop = pongo.getObjectByName('Pongo_EarFlop');
          pongo.scale.setScalar(1.35);

          curve = new THREE.CatmullRomCurve3(PATH_2D.map(([x, y]) => new THREE.Vector3(x, 0.3, -y)));
          curve.arcLengthDivisions = 600;
          const samples = curve.getSpacedPoints(600);
          M.levelT = M.levels.map((lv) => {
            let best = 0, bd = Infinity;
            samples.forEach((p, i) => {
              const d = p.distanceToSquared(lv);
              if (d < bd) { bd = d; best = i; }
            });
            return best / 600;
          });

          // beacon over the current lesson stop
          beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.3, 9, 32, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xfff1a6, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
          );
          scene.add(beacon);
          star = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.55, 0),
            new THREE.MeshStandardMaterial({ color: 0xffc800, emissive: 0xffa000, emissiveIntensity: 0.6, flatShading: true }),
          );
          star.castShadow = true;
          scene.add(star);

          buildMarkers();
          bindPicking(canvas);
          resize();
          window.addEventListener('resize', resize);
          M.ready = true;
          requestAnimationFrame(tick);
          resolve();
        },
        (err) => reject(err),
      );
    });
  };

  function resize() {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 640 ? 55 : 42;
    camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ HTML markers
  function buildMarkers() {
    markersEl.innerHTML = '';
    markerEls = M.levels.map((_, i) => {
      const b = document.createElement('button');
      b.className = 'marker locked';
      b.type = 'button';
      b.innerHTML = `<span class="marker-disc"><span class="marker-num">${i + 1}</span></span><span class="marker-label"></span>`;
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelect(i, b);
      });
      markersEl.appendChild(b);
      return b;
    });
  }

  M.setMarkers = function (states, labels) {
    markerEls.forEach((b, i) => {
      b.className = 'marker ' + states[i].state;
      b.setAttribute('aria-label', `Lição ${i + 1}: ${labels[i]} (${states[i].text})`);
      b.querySelector('.marker-label').textContent = labels[i];
      const num = b.querySelector('.marker-num');
      num.innerHTML =
        states[i].state === 'locked'
          ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"/></svg>'
          : states[i].state === 'done'
            ? '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7Z"/></svg>'
            : String(i + 1);
      b.style.setProperty('--stars', states[i].stars || 0);
      b.dataset.stars = states[i].stars ? '★'.repeat(states[i].stars) + '☆'.repeat(3 - states[i].stars) : '';
    });
  };

  function placeMarkers() {
    const w = window.innerWidth, h = window.innerHeight;
    M.levels.forEach((p, i) => {
      tmp.copy(p);
      tmp.y += 4.3;
      tmp.project(camera);
      const el = markerEls[i];
      if (tmp.z > 1) {
        el.style.visibility = 'hidden';
        return;
      }
      el.style.visibility = '';
      const x = (tmp.x * 0.5 + 0.5) * w;
      const y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      el.style.zIndex = String(1000 - Math.round(tmp.z * 1000));
    });
  }

  // ------------------------------------------------------------ picking Pongo
  function bindPicking(canvas) {
    const ray = new THREE.Raycaster();
    const v2 = new THREE.Vector2();
    let down = null;
    canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      v2.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(v2, camera);
      if (ray.intersectObjects(pongoMeshes, false).length) {
        M.jump();
        onPongo();
      }
    });
  }

  // ------------------------------------------------------------ Pongo
  M.placePongo = function (i) {
    M.pongoAt = i;
    const t = M.levelT[i];
    const p = curve.getPointAt(t);
    pongo.position.set(p.x, 0.32, p.z);
    const ahead = curve.getPointAt(Math.min(1, t + 0.01));
    pongo.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z) * 0.3; // mostly facing the camera
    M.focus(i, true);
  };

  M.walkTo = function (i) {
    return new Promise((resolve) => {
      const from = M.levelT[M.pongoAt], to = M.levelT[i];
      const dur = Math.max(1.2, Math.abs(to - from) * 14);
      walk = { from, to, t: 0, dur, resolve, target: i };
      M.pongoAt = i;
    });
  };

  M.jump = function () { hop = 1; };

  M.focus = function (i, instant) {
    const p = M.levels[i];
    if (!p) return;
    const goal = new THREE.Vector3(p.x, 0, p.z);
    const off = new THREE.Vector3(0, 22, 26);
    if (instant) {
      controls.target.copy(goal);
      camera.position.copy(goal).add(off);
    } else {
      M._focusGoal = { goal, off, k: 0 };
    }
  };

  M.overview = function () {
    M._focusGoal = { goal: new THREE.Vector3(0, 0, -2), off: new THREE.Vector3(0, 52, 40), k: 0 };
  };

  M.setActive = function (on) {
    M.active = on;
    if (markersEl) markersEl.hidden = !on;
    if (on) clock.getDelta();
  };

  // ------------------------------------------------------------ loop
  function tick() {
    requestAnimationFrame(tick);
    if (!M.active) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    clouds.forEach((c) => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 80) c.position.x = -80;
    });

    // Pongo walking along the stepping stones
    if (walk) {
      walk.t += dt / walk.dur;
      const k = Math.min(1, walk.t);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const u = walk.from + (walk.to - walk.from) * e;
      const p = curve.getPointAt(Math.min(1, Math.max(0, u)));
      const dir = Math.sign(walk.to - walk.from) || 1;
      const q = curve.getPointAt(Math.min(1, Math.max(0, u + 0.004 * dir)));
      pongo.position.set(p.x, 0.32 + Math.abs(Math.sin(time * 14)) * 0.35, p.z);
      const yaw = Math.atan2(q.x - p.x, q.z - p.z);
      pongo.rotation.y = yaw;
      controls.target.lerp(new THREE.Vector3(p.x, 0, p.z), 0.08);
      if (k >= 1) {
        const r = walk.resolve;
        walk = null;
        pongo.rotation.y = 0;
        M.jump();
        r();
      }
    } else if (pongo) {
      const base = 0.32 + Math.sin(time * 3) * 0.04;
      if (hop > 0) {
        hop = Math.max(0, hop - dt * 1.6);
        pongo.position.y = base + Math.sin((1 - hop) * Math.PI) * 1.6;
        pongo.rotation.y = (1 - hop) * Math.PI * 2;
      } else {
        pongo.position.y = base;
      }
    }
    if (tail) tail.rotation.y = Math.sin(time * (walk ? 22 : 12)) * 0.5;
    if (earFlop) earFlop.rotation.x = Math.sin(time * 2.2) * 0.12;

    // beacon + star over the current stop
    const cur = M.levels[M.current ?? 0];
    if (cur && beacon) {
      beacon.position.set(cur.x, 4.5, cur.z);
      beacon.material.opacity = 0.16 + Math.sin(time * 3) * 0.06;
      star.position.set(cur.x, 6.2 + Math.sin(time * 2.4) * 0.35, cur.z);
      star.rotation.y = time * 1.6;
      beacon.visible = star.visible = M.current != null;
    }

    if (M._focusGoal) {
      const f = M._focusGoal;
      f.k += dt;
      controls.target.lerp(f.goal, 0.06);
      camera.position.lerp(tmp.copy(f.goal).add(f.off), 0.05);
      if (f.k > 1.6) M._focusGoal = null;
    }

    controls.update();
    // keep the view inside the garden
    controls.target.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, controls.target.x));
    controls.target.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, controls.target.z));
    controls.target.y = 0;

    renderer.render(scene, camera);
    placeMarkers();
  }

  window.PongoMap = M;
})();
