/* ==========================================================================
   Arena 3D (three.js) com os modelos gerados no Blender (models/*.glb).
   Lado P (azul) fica perto da câmera (z > 0); lado E (vermelho) ao fundo.
   ========================================================================== */
const World = (() => {
  let renderer, scene, camera, canvas, container, clock;
  const models = {};
  const TEAM_COLORS = { P: 0x3b7dd8, E: 0xd8432e };
  const LANE_X = 4.3, YAG_Z = 7.6, KING_Z = 11.2;
  let towers = [], units = [], shots = [], debris = [];
  let particles, pData = [], petals, petalData = [];
  let river, ready = false, shakeT = 0, onTowerHit = null, onTowerDown = null;
  const tmpV = new THREE.Vector3();

  function b64ToBuf(b64) {
    const bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function loadModels() {
    const loader = new THREE.GLTFLoader();
    const names = Object.keys(window.MODELS || {});
    return Promise.all(names.map(n => new Promise(res => {
      loader.parse(b64ToBuf(window.MODELS[n]), "", g => {
        g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        models[n] = g.scene; res();
      }, () => res());
    })));
  }
  function clone(name, team) {
    const src = models[name];
    if (!src) return new THREE.Group();
    const c = src.clone(true);
    c.traverse(o => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      if (o.material.name === "TEAM" && team) o.material.color.setHex(TEAM_COLORS[team]);
    });
    return c;
  }

  function groundTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d"), n = 16, s = 512 / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? "#5d9c4a" : "#67a852"; g.fillRect(x * s, y * s, s, s);
    }
    for (let i = 0; i < 900; i++) {                    // tufos de grama
      g.fillStyle = Math.random() < 0.5 ? "rgba(40,90,30,.35)" : "rgba(170,220,120,.25)";
      g.fillRect(Math.random() * 512, Math.random() * 512, 2, 4);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3.4);
    t.encoding = THREE.sRGBEncoding; return t;
  }
  function riverTexture() {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64;
    const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, "#2f86c9"); gr.addColorStop(0.5, "#46a6e6"); gr.addColorStop(1, "#2f86c9");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const x = Math.random() * 256, y = Math.random() * 64; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 3, x + 18, y); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.encoding = THREE.sRGBEncoding; return t;
  }
  function dotTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,.8)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }
  function petalTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); g.fillStyle = "#ffc4da"; g.translate(32, 32); g.rotate(0.6);
    g.beginPath(); g.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ff9ec2"; g.beginPath(); g.ellipse(-8, 0, 10, 5, 0, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(c);
  }

  function buildArena() {
    scene.background = new THREE.Color(0x2b2a5e);
    scene.fog = new THREE.Fog(0x2b2a5e, 40, 80);
    const hemi = new THREE.HemisphereLight(0xfff1e0, 0x4a4580, 1.05); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe6c4, 1.9);
    sun.position.set(-10, 22, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 18, bottom: -18, near: 1, far: 60 });
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8fa8ff, 0.35); rim.position.set(10, 8, -14); scene.add(rim);

    // gramado + terreno externo
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ color: 0x3f6e37 }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.05; outer.receiveShadow = true; scene.add(outer);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(16, 28), new THREE.MeshLambertMaterial({ map: groundTexture() }));
    field.rotation.x = -Math.PI / 2; field.receiveShadow = true; scene.add(field);
    // bordas de pedra
    const edgeM = new THREE.MeshLambertMaterial({ color: 0x8d8a83 });
    [[-8.2, 0], [8.2, 0]].forEach(([x]) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 28.4), edgeM); e.position.set(x, 0.17, 0); e.receiveShadow = e.castShadow = true; scene.add(e); });
    [-14.2, 14.2].forEach(z => { const e = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.35, 0.4), edgeM); e.position.set(0, 0.17, z); scene.add(e); });
    // caminhos de terra
    const pathM = new THREE.MeshLambertMaterial({ color: 0xc9a66b });
    [-LANE_X, LANE_X].forEach(x => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 24), pathM); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.01, 0); p.receiveShadow = true; scene.add(p); });
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(LANE_X * 2 + 1.5, 1.3), pathM); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.012, s * 9.4); p.receiveShadow = true; scene.add(p); });
    // rio
    river = new THREE.Mesh(new THREE.PlaneGeometry(17, 2.6), new THREE.MeshLambertMaterial({ map: riverTexture() }));
    river.rotation.x = -Math.PI / 2; river.position.y = 0.03; scene.add(river);
    const bankM = new THREE.MeshLambertMaterial({ color: 0x7a6a50 });
    [-1.35, 1.35].forEach(z => { const b = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.18, 0.14), bankM); b.position.set(0, 0.09, z); scene.add(b); });
    // pontes
    [-LANE_X, LANE_X].forEach(x => { const b = clone("bridge"); b.position.set(x, 0, 0); scene.add(b); });
    // decoração
    const deco = (n, x, z, s = 1, ry = 0) => { const o = clone(n); o.position.set(x, 0, z); o.scale.setScalar(s); o.rotation.y = ry; scene.add(o); return o; };
    deco("torii", 0, 13.3, 1.1); deco("torii", 0, -13.3, 1.1, Math.PI);
    [[-7, 4], [7, -4], [-7, -11], [7, 11], [-6.8, -3.5], [6.8, 3.5], [-10, 8], [10, -8], [-10.5, -2], [10.5, 2], [-11, 13], [11, -13]].forEach(([x, z], i) => deco("sakura", x, z, 1.1 + (i % 3) * 0.2, i));
    [[-2.2, 2.2], [2.2, 2.2], [-2.2, -2.2], [2.2, -2.2], [-6.3, 9.4], [6.3, 9.4], [-6.3, -9.4], [6.3, -9.4]].forEach(([x, z]) => deco("lantern", x, z, 1));
    [[-7.2, 0.5], [7.3, -0.6], [-1.5, 5], [1.6, -5.2], [-9.5, 5], [9.6, -5]].forEach(([x, z], i) => deco("rock", x, z, 0.8 + (i % 2) * 0.4, i));

    // partículas (explosões)
    const N = 900, geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.55, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    particles.frustumCulled = false; scene.add(particles);
    for (let i = 0; i < N; i++) pData.push({ life: 0 });
    // pétalas de sakura caindo
    const PN = 120, pg = new THREE.BufferGeometry(), pp = new Float32Array(PN * 3);
    for (let i = 0; i < PN; i++) { pp[i * 3] = (Math.random() - 0.5) * 22; pp[i * 3 + 1] = Math.random() * 12; pp[i * 3 + 2] = (Math.random() - 0.5) * 30; petalData.push({ v: 0.4 + Math.random() * 0.6, ph: Math.random() * 6 }); }
    pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    petals = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.35, map: petalTexture(), transparent: true, depthWrite: false }));
    petals.frustumCulled = false; scene.add(petals);
  }

  /* ---------------- torres ---------------- */
  function placeTowers(onHit, onDown) {
    onTowerHit = onHit; onTowerDown = onDown;
    towers.forEach(t => scene.remove(t.obj)); towers = [];
    units.forEach(u => scene.remove(u.obj)); units = [];
    shots.forEach(s => scene.remove(s.obj)); shots = [];
    debris.forEach(d => scene.remove(d.obj)); debris = [];
    ["P", "E"].forEach(side => {
      const s = side === "P" ? 1 : -1;
      [["L", -LANE_X, YAG_Z, "yagura", 1000, 1.05], ["R", LANE_X, YAG_Z, "yagura", 1000, 1.05], ["K", 0, KING_Z, "tenshu", 1500, 0.95]].forEach(([id, x, z, m, hp, sc]) => {
        const obj = clone(m, side);
        obj.position.set(x, 0, s * z); obj.scale.setScalar(sc);
        obj.rotation.y = side === "P" ? Math.PI : 0;  // bandeiras voltadas para o rio
        scene.add(obj);
        towers.push({ side, id, kind: m, hp, max: hp, alive: true, obj, pos: new THREE.Vector3(x, 0, s * z), top: m === "tenshu" ? 6.6 : 4.1, cool: Math.random(), shake: 0, fall: 0 });
      });
    });
    return towers;
  }
  function towerOf(side, id) { return towers.find(t => t.side === side && t.id === id); }
  function pickTarget(defSide) {
    const yag = towers.filter(t => t.side === defSide && t.kind === "yagura");
    const king = towerOf(defSide, "K");
    if (yag.some(t => !t.alive) && king.alive) return king;
    const alive = yag.filter(t => t.alive);
    if (!alive.length) return king.alive ? king : null;
    // foca a torre mais fraca; no empate, a que já está sendo atacada
    const aimed = t => units.filter(u => u.target === t).length;
    alive.sort((a, b) => a.hp - b.hp || aimed(b) - aimed(a) || a.pos.x - b.pos.x);
    return alive[0];
  }
  function bridgeY(z) { return Math.abs(z) < 1.6 ? 0.17 + 0.45 * Math.cos(z * Math.PI / 3.2) : 0; }

  /* ---------------- tropas ---------------- */
  function spawnUnits(side, count, damage, model) {
    const defSide = side === "P" ? "E" : "P", s = side === "P" ? 1 : -1;
    const target = pickTarget(defSide);
    if (!target) return;
    for (let i = 0; i < count; i++) {
      const obj = clone(model, side);
      obj.scale.setScalar(model === "oni" ? 1.6 : 1.5);
      const lane = target.kind === "yagura" ? Math.sign(target.pos.x) : laneToKing(defSide);
      const lx = lane * LANE_X + (i - (count - 1) / 2) * 0.55;
      const start = new THREE.Vector3((i - (count - 1) / 2) * 0.6, 0, s * (KING_Z - 2.4));
      const path = [start, new THREE.Vector3(lx, 0, s * 5.2), new THREE.Vector3(lx, 0, s * 1.7), new THREE.Vector3(lx, 0, -s * 1.7), attackPoint(target, lx, i, count)];
      obj.position.copy(start);
      scene.add(obj);
      units.push({ side, obj, path, seg: 0, speed: 4.2 + Math.random() * 0.4, dmg: damage / count, target, state: "walk", t: -i * 0.18, bob: Math.random() * 6, delay: i * 0.18 });
      burst(start.clone().setY(0.6), side === "P" ? [0.5, 0.8, 1] : [1, 0.5, 0.4], 26, 3);
    }
  }
  function laneToKing(defSide) {
    const dead = towers.filter(t => t.side === defSide && t.kind === "yagura" && !t.alive);
    return dead.length ? Math.sign(dead[Math.floor(Math.random() * dead.length)].pos.x) : 1;
  }
  function attackPoint(target, lx, i, count) {
    const dir = Math.sign(target.pos.z), off = (i - (count - 1) / 2) * 0.6;
    if (target.kind === "tenshu") return new THREE.Vector3(Math.sign(lx) * 1.4 + off, 0, target.pos.z - dir * 2.6);
    return new THREE.Vector3(target.pos.x + off, 0, target.pos.z - dir * 1.9);
  }
  function updateUnits(dt) {
    for (let k = units.length - 1; k >= 0; k--) {
      const u = units[k];
      if (u.delay > 0) { u.delay -= dt; u.obj.visible = false; continue; }
      u.obj.visible = true; u.bob += dt * 12;
      if (u.state === "walk") {
        const to = u.path[u.seg + 1];
        tmpV.subVectors(to, u.obj.position); tmpV.y = 0;
        const d = tmpV.length(), stepLen = u.speed * dt;
        if (d <= stepLen) {
          u.obj.position.x = to.x; u.obj.position.z = to.z; u.seg++;
          if (u.seg >= u.path.length - 1) { u.state = "attack"; u.t = 0; }
        } else {
          tmpV.normalize();
          u.obj.position.x += tmpV.x * stepLen; u.obj.position.z += tmpV.z * stepLen;
          u.obj.rotation.y = Math.atan2(-tmpV.x, -tmpV.z); // modelos olham para +Y do Blender (= -Z no three)
        }
        u.obj.position.y = bridgeY(u.obj.position.z) + Math.abs(Math.sin(u.bob)) * 0.12;
        u.obj.rotation.z = Math.sin(u.bob) * 0.08;
      } else if (u.state === "attack") {
        if (!u.target.alive) {                          // alvo caiu antes: procura outro
          const defSide = u.side === "P" ? "E" : "P", nt = pickTarget(defSide);
          if (!nt) { removeUnit(k, true); continue; }
          u.target = nt; u.path = [u.obj.position.clone(), attackPoint(nt, nt.pos.x || u.obj.position.x, 0, 1)]; u.seg = 0; u.state = "walk"; continue;
        }
        u.t += dt;
        tmpV.subVectors(u.target.pos, u.obj.position);
        u.obj.rotation.y = Math.atan2(-tmpV.x, -tmpV.z);
        const swing = Math.sin(u.t * 14);
        u.obj.rotation.x = Math.max(0, swing) * 0.5;
        if (u.t > 0.9) {
          hitTower(u.target, u.dmg, u.side);
          removeUnit(k, true);
        }
      }
    }
  }
  function removeUnit(k, poof) {
    const u = units[k];
    if (poof) burst(u.obj.position.clone().setY(0.8), u.side === "P" ? [0.6, 0.85, 1] : [1, 0.55, 0.4], 18, 2.5);
    scene.remove(u.obj); units.splice(k, 1);
  }
  function hitTower(t, dmg, bySide) {
    if (!t.alive) return;
    t.hp = Math.max(0, t.hp - Math.round(dmg));
    t.shake = 0.4;
    const p = t.pos.clone().setY(t.top * 0.55);
    burst(p, [1, 0.75, 0.25], 90, 7); burst(p, [1, 0.35, 0.15], 50, 5); burst(p, [1, 1, 1], 20, 9);
    shakeT = Math.max(shakeT, 0.25);
    if (onTowerHit) onTowerHit(t, Math.round(dmg), bySide);
    if (t.hp <= 0) {
      t.alive = false; t.fall = 0.0001;
      for (let i = 0; i < 4; i++) setTimeout(() => burst(t.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 3, (Math.random() - 0.5) * 2)), [1, 0.6 + Math.random() * 0.3, 0.2], 120, 10), i * 140);
      spawnDebris(t);
      shakeT = 0.8;
      if (onTowerDown) onTowerDown(t, bySide);
    }
  }
  function spawnDebris(t) {
    const m = new THREE.MeshLambertMaterial({ color: 0x8d8a83 });
    for (let i = 0; i < 22; i++) {
      const s = 0.15 + Math.random() * 0.35, o = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), i % 3 ? m : new THREE.MeshLambertMaterial({ color: t.side === "P" ? 0x3b7dd8 : 0xd8432e }));
      o.position.copy(t.pos).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 1 + Math.random() * 3, (Math.random() - 0.5) * 1.5));
      o.castShadow = true; scene.add(o);
      debris.push({ obj: o, v: new THREE.Vector3((Math.random() - 0.5) * 9, 4 + Math.random() * 6, (Math.random() - 0.5) * 9), r: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0), life: 3 + Math.random() });
    }
  }

  /* ---------------- disparos (cosméticos) das torres ---------------- */
  function updateTowers(dt) {
    towers.forEach(t => {
      if (t.shake > 0) { t.shake -= dt; t.obj.position.x = t.pos.x + Math.sin(t.shake * 80) * t.shake * 0.25; }
      else t.obj.position.x = t.pos.x;
      if (!t.alive) {
        if (t.fall > 0 && t.fall < 1.6) { t.fall += dt; t.obj.position.y = -t.fall * t.fall * 1.8; t.obj.rotation.z = t.fall * 0.35 * (t.id === "R" ? -1 : 1); }
        else if (t.fall >= 1.6) t.obj.visible = false;
        return;
      }
      t.cool -= dt;
      if (t.cool > 0) return;
      let best = null, bd = t.kind === "tenshu" ? 8.5 : 7.5;
      units.forEach(u => { if (u.side !== t.side && u.obj.visible) { const d = u.obj.position.distanceTo(t.pos); if (d < bd) { bd = d; best = u; } } });
      if (best) {
        t.cool = t.kind === "tenshu" ? 0.7 : 0.95;
        const o = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), new THREE.MeshBasicMaterial({ color: t.side === "P" ? 0x9fd0ff : 0xffb199 }));
        const from = t.pos.clone().setY(t.top - 0.6);
        o.position.copy(from); scene.add(o);
        shots.push({ obj: o, from, unit: best, t: 0, side: t.side });
        if (Math.random() < 0.5) Sound.shoot();
      } else t.cool = 0.25;
    });
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; s.t += dt * 2.2;
      const to = s.unit.obj.position.clone().setY(0.8);
      s.obj.position.lerpVectors(s.from, to, Math.min(s.t, 1)); s.obj.position.y += Math.sin(Math.min(s.t, 1) * Math.PI) * 1.5;
      if (s.t >= 1) {
        burst(to, s.side === "P" ? [0.6, 0.85, 1] : [1, 0.6, 0.4], 10, 2.5);
        s.unit.obj.traverse(o => { if (o.isMesh && o.material.emissive) { o.material.emissive.setHex(0xffffff); setTimeout(() => o.material.emissive && o.material.emissive.setHex(0), 70); } });
        scene.remove(s.obj); shots.splice(i, 1);
      }
    }
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i]; d.life -= dt; d.v.y -= 18 * dt;
      d.obj.position.addScaledVector(d.v, dt);
      if (d.obj.position.y < 0.1) { d.obj.position.y = 0.1; d.v.multiplyScalar(0.4); d.v.y = Math.abs(d.v.y) * 0.3; }
      d.obj.rotation.x += d.r.x * dt; d.obj.rotation.y += d.r.y * dt;
      if (d.life <= 0) { scene.remove(d.obj); debris.splice(i, 1); }
    }
  }

  /* ---------------- partículas ---------------- */
  let pCursor = 0;
  function burst(pos, rgb, n, speed) {
    for (let i = 0; i < n; i++) {
      const p = pData[pCursor]; pCursor = (pCursor + 1) % pData.length;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1), sp = speed * (0.3 + Math.random() * 0.7);
      p.x = pos.x; p.y = pos.y; p.z = pos.z;
      p.vx = Math.sin(ph) * Math.cos(th) * sp; p.vy = Math.abs(Math.cos(ph)) * sp * 1.1; p.vz = Math.sin(ph) * Math.sin(th) * sp;
      p.life = p.max = 0.5 + Math.random() * 0.7;
      const j = 0.75 + Math.random() * 0.25; p.r = rgb[0] * j; p.g = rgb[1] * j; p.b = rgb[2] * j;
    }
  }
  function updateParticles(dt) {
    const pos = particles.geometry.attributes.position.array, col = particles.geometry.attributes.color.array;
    for (let i = 0; i < pData.length; i++) {
      const p = pData[i];
      if (p.life > 0) {
        p.life -= dt; p.vy -= 9 * dt; p.vx *= 0.98; p.vz *= 0.98;
        p.x += p.vx * dt; p.y = Math.max(0.05, p.y + p.vy * dt); p.z += p.vz * dt;
        const k = Math.max(0, p.life / p.max);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        col[i * 3] = p.r * k; col[i * 3 + 1] = p.g * k; col[i * 3 + 2] = p.b * k;
      } else { pos[i * 3 + 1] = -50; }
    }
    particles.geometry.attributes.position.needsUpdate = true; particles.geometry.attributes.color.needsUpdate = true;
    const pp = petals.geometry.attributes.position.array, tt = clock.elapsedTime;
    for (let i = 0; i < petalData.length; i++) {
      const d = petalData[i];
      pp[i * 3 + 1] -= d.v * dt; pp[i * 3] += Math.sin(tt + d.ph) * dt * 0.6; pp[i * 3 + 2] += dt * 0.3;
      if (pp[i * 3 + 1] < 0) { pp[i * 3 + 1] = 10 + Math.random() * 3; pp[i * 3] = (Math.random() - 0.5) * 22; pp[i * 3 + 2] = (Math.random() - 0.5) * 30; }
    }
    petals.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------------- câmera / loop ---------------- */
  function fit() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // aproxima/afasta até toda a arena caber na tela
    const corners = [[-8.4, 0, 14.4], [8.4, 0, 14.4], [-8.4, 0, -14.4], [8.4, 0, -14.4], [0, 6.6, -KING_Z], [-8, 0, 0], [8, 0, 0]];
    const dir = new THREE.Vector3(0, 21, 15.5).normalize();
    let dist = 18;
    for (let it = 0; it < 60; it++) {
      camera.position.copy(dir).multiplyScalar(dist); camera.lookAt(0, 0, 0.6); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      const ok = corners.every(c => { tmpV.set(c[0], c[1], c[2]).project(camera); return Math.abs(tmpV.x) <= 0.98 && tmpV.y <= 0.96 && tmpV.y >= -1.02; });
      if (ok && it > 0) break;
      dist += 0.8;
    }
    camera.userData.base = camera.position.clone();
  }
  function frame() {
    requestAnimationFrame(frame);
    if (!ready) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    updateUnits(dt); updateTowers(dt); updateParticles(dt);
    if (river) river.material.map.offset.x += dt * 0.08;
    if (shakeT > 0) {
      shakeT -= dt; const a = shakeT * 0.6;
      camera.position.copy(camera.userData.base).add(new THREE.Vector3((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, 0));
    } else if (camera.userData.base) camera.position.copy(camera.userData.base);
    renderer.render(scene, camera);
  }

  return {
    async init(cv, cont) {
      canvas = cv; container = cont; clock = new THREE.Clock();
      if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false; // cores hex em sRGB
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, 1, 0.5, 200);
      await loadModels();
      buildArena();
      new ResizeObserver(fit).observe(container); fit();
      ready = true; frame();
    },
    fit, placeTowers, spawnUnits, burst, towers: () => towers,
    unitsCount: () => units.length,
    clearUnits() { units.forEach(u => scene.remove(u.obj)); units = []; },
    project(v) {                                       // 3D → pixels no container
      tmpV.copy(v).project(camera);
      return { x: (tmpV.x * 0.5 + 0.5) * container.clientWidth, y: (-tmpV.y * 0.5 + 0.5) * container.clientHeight, vis: tmpV.z < 1 };
    },
    celebrate(side) {                                  // fogos sobre o reino vencedor
      const s = side === "P" ? 1 : -1;
      for (let i = 0; i < 10; i++) setTimeout(() => burst(new THREE.Vector3((Math.random() - 0.5) * 12, 4 + Math.random() * 4, s * (4 + Math.random() * 8)), [Math.random(), Math.random() * 0.5 + 0.5, Math.random()], 80, 7), i * 220);
    },
    V3: (x, y, z) => new THREE.Vector3(x, y, z)
  };
})();
