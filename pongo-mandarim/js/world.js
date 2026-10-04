// Mundo 3D: carrega os .glb gerados pelo Blender (blender/build_assets.py),
// faz o Pongo caminhar pelo cenário, abre os portais e anima as comemorações.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const GATE_Z = [-16, -32, -48];
const END_Z = -58;
const SPEED = 3.4;
const MODELS = 'assets/models/';
// A versão publicada como artifact não pode servir .glb: lá cada modelo vai como JSON
// { "glb": "<base64>" } e é decodificado aqui (window.PONGO_MODEL_EXT = '.glb.json').
const EXT = window.PONGO_MODEL_EXT || '.glb';

// A versão em arquivo HTML único traz os modelos embutidos em window.PONGO_EMBEDDED_MODELS.
const EMBEDDED = window.PONGO_EMBEDDED_MODELS || null;

async function loadPacked(url, name) {
  let glb = EMBEDDED?.[name];
  if (!glb) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    ({ glb } = await res.json());
  }
  const bin = atob(glb);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return loader.parseAsync(buf.buffer, MODELS);
}

const loader = new GLTFLoader();
const cache = new Map();
function load(name) {
  if (!cache.has(name)) {
    const url = MODELS + name.replace('.glb', EXT);
    cache.set(name, EXT === '.glb' && !EMBEDDED ? loader.loadAsync(url) : loadPacked(url, name));
  }
  return cache.get(name);
}

export function createWorld(canvas, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(0, 4, 9);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x7a6a50, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  let levelRoot = null;
  let pongo = null;
  let mixer = null;
  let actions = {};
  let current = null;
  let panda = null;
  let pandaMixer = null;
  let pandaActions = {};
  let gates = [];
  let gateOpen = [false, false, false];
  let floorY = 0;
  let walking = false;
  let autoWalk = false;
  let busy = false; // desafio aberto
  let ended = false;
  let facingCam = 0; // 0 = de costas (andando), 1 = virado para a câmera
  let stepTimer = 0;
  let particles = null;
  let confetti3d = null;
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function skyTexture(top, bottom) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function play(name, fade = 0.25, once = false) {
    const a = actions[name];
    if (!a || current === a) return;
    a.reset();
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    a.clampWhenFinished = once;
    a.enabled = true;
    a.setEffectiveWeight(1);
    if (current) current.crossFadeTo(a, fade, false);
    a.play();
    current = a;
  }

  function shadows(root, cast = true) {
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = cast;
        o.receiveShadow = true;
      }
    });
  }

  function makeParticles(kind) {
    const n = kind === 'vagalumes' ? 120 : 260;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      vel[i * 3] = (Math.random() - 0.5) * 0.4;
      vel[i * 3 + 1] = kind === 'bolhas' ? 0.3 + Math.random() * 0.4 : kind === 'vagalumes' ? (Math.random() - 0.5) * 0.2 : -(0.4 + Math.random() * 0.6);
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const color = { petalas: 0xffa6c9, vagalumes: 0xfff27a, neve: 0xffffff, bolhas: 0xd8f4ff }[kind] || 0xffffff;
    const mat = new THREE.PointsMaterial({
      color, size: kind === 'vagalumes' ? 0.18 : 0.14, transparent: true, opacity: 0.9, depthWrite: false,
      blending: kind === 'vagalumes' ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.userData = { vel, kind };
    pts.frustumCulled = false;
    return pts;
  }

  function makeConfetti3d() {
    const n = 260;
    const geo = new THREE.PlaneGeometry(0.12, 0.07);
    const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    const palette = ['#D0384E', '#3A86A0', '#2563EB', '#F2B631', '#1E8449', '#6D28D9', '#FF8FB1', '#ffffff'].map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) mesh.setColorAt(i, palette[i % palette.length]);
    mesh.frustumCulled = false;
    mesh.visible = false;
    mesh.userData = { p: new Float32Array(n * 3), v: new Float32Array(n * 3), r: new Float32Array(n * 3), t: 0 };
    return mesh;
  }

  async function loadLevel(level) {
    if (levelRoot) {
      scene.remove(levelRoot);
      levelRoot.traverse((o) => {
        if (o.isMesh) o.geometry.dispose();
      });
    }
    ended = false;
    busy = false;
    autoWalk = false;
    gateOpen = [false, false, false];
    levelRoot = new THREE.Group();
    scene.add(levelRoot);

    const [sceneGltf, gateGltf, pongoGltf, pandaGltf] = await Promise.all([
      load(level.cena), load('gate.glb'), load('pongo.glb'), level.amiga ? load('panda.glb') : Promise.resolve(null),
    ]);

    const world = sceneGltf.scene.clone(true);
    shadows(world, true);
    levelRoot.add(world);

    scene.background = skyTexture(level.ceu[0], level.ceu[1]);
    scene.fog = new THREE.Fog(new THREE.Color(level.ceu[1]), 30, 110);
    hemi.color.set(level.ceu[0]);
    floorY = level.chao || 0;

    gates = GATE_Z.map((z, i) => {
      const gte = gateGltf.scene.clone(true);
      gte.position.set(0, floorY, z);
      shadows(gte);
      levelRoot.add(gte);
      return { obj: gte, doorL: gte.getObjectByName('DoorL'), doorR: gte.getObjectByName('DoorR'), open: 0 };
    });

    // Pongo: o mesmo modelo para todas as fases (animações vindas do Blender)
    if (!pongo) {
      pongo = pongoGltf.scene;
      shadows(pongo);
      mixer = new THREE.AnimationMixer(pongo);
      for (const clip of pongoGltf.animations) actions[clip.name] = mixer.clipAction(clip);
      mixer.addEventListener('finished', (e) => {
        if (e.action === actions.Jump || e.action === actions.Sad) {
          current = null;
          play(walking ? 'Walk' : 'Idle', 0.3);
        }
      });
    }
    pongo.position.set(0, floorY, 4);
    pongo.rotation.set(0, 0, 0);
    facingCam = 0;
    levelRoot.add(pongo);
    current = null;
    play('Idle', 0);

    panda = null;
    if (pandaGltf) {
      panda = pandaGltf.scene.clone(true);
      panda.position.set(-1.6, floorY, -63);
      panda.rotation.y = Math.PI;
      panda.scale.setScalar(1.15);
      shadows(panda);
      levelRoot.add(panda);
      pandaMixer = new THREE.AnimationMixer(panda);
      pandaActions = {};
      for (const clip of pandaGltf.animations) pandaActions[clip.name] = pandaMixer.clipAction(clip);
      pandaActions.Idle?.play();
    }

    particles = makeParticles(level.particulas);
    levelRoot.add(particles);
    confetti3d = makeConfetti3d();
    levelRoot.add(confetti3d);

    resize();
    snapCamera();
  }

  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  function desiredCamera(t) {
    const p = pongo.position;
    if (busy || ended) {
      // enquadra o Pongo na metade de cima da tela (o painel do desafio ocupa a de baixo)
      camPos.set(p.x + 2.6, p.y + 2.3, p.z + 4.6);
      camTarget.set(p.x, p.y - 0.6, p.z);
    } else {
      camPos.set(p.x + Math.sin(t * 0.15) * 1.2, p.y + 3.3, p.z + 6.8);
      camTarget.set(p.x, p.y + 1.1, p.z - 4);
    }
  }
  function snapCamera() {
    desiredCamera(0);
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
  }
  const lookTmp = new THREE.Vector3();

  function nextStop() {
    for (let i = 0; i < 3; i++) if (!gateOpen[i]) return { z: GATE_Z[i] + 2.6, gate: i };
    return { z: END_Z, gate: -1 };
  }

  function update() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!pongo) {
      renderer.render(scene, camera);
      return;
    }
    // movimento
    const want = (walking || autoWalk) && !busy && !ended;
    const stop = nextStop();
    if (want) {
      const nz = pongo.position.z - SPEED * dt;
      if (nz <= stop.z) {
        pongo.position.z = stop.z;
        autoWalk = false;
        walking = false;
        play('Idle');
        if (stop.gate >= 0) {
          busy = true;
          hooks.onGate?.(stop.gate);
        } else {
          ended = true;
          if (pandaActions.Wave) {
            pandaActions.Idle?.fadeOut(0.3);
            pandaActions.Wave.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
          }
          hooks.onEnd?.();
        }
      } else {
        pongo.position.z = nz;
        if (current !== actions.Walk && current !== actions.Jump) play('Walk');
        stepTimer -= dt;
        if (stepTimer <= 0) {
          stepTimer = 0.34;
          hooks.onStep?.();
        }
      }
      hooks.onProgress?.((4 - pongo.position.z) / (4 - END_Z));
    } else if (current === actions.Walk) play('Idle');

    // Pongo vira para a câmera quando para num portal
    const targetFacing = busy || ended ? 1 : 0;
    facingCam += (targetFacing - facingCam) * Math.min(1, dt * 4);
    pongo.rotation.y = facingCam * (Math.PI + 0.5);

    // portais
    gates.forEach((gt, i) => {
      const tgt = gateOpen[i] ? 1 : 0;
      gt.open += (tgt - gt.open) * Math.min(1, dt * 2.2);
      if (gt.doorL) gt.doorL.rotation.y = gt.open * 1.75;
      if (gt.doorR) gt.doorR.rotation.y = -gt.open * 1.75;
    });

    // partículas do ambiente seguem a câmera
    if (particles) {
      const a = particles.geometry.attributes.position;
      const v = particles.userData.vel;
      const cx = pongo.position.x;
      const cz = pongo.position.z;
      for (let i = 0; i < a.count; i++) {
        let x = a.array[i * 3] + v[i * 3] * dt + Math.sin(t + i) * 0.004;
        let y = a.array[i * 3 + 1] + v[i * 3 + 1] * dt;
        let z = a.array[i * 3 + 2] + v[i * 3 + 2] * dt;
        if (y < floorY - 0.2) y = 10;
        if (y > 12) y = floorY;
        if (z - cz > 15) z -= 30;
        if (z - cz < -15) z += 30;
        if (x - cx > 15) x -= 30;
        if (x - cx < -15) x += 30;
        a.array[i * 3] = x;
        a.array[i * 3 + 1] = y;
        a.array[i * 3 + 2] = z;
      }
      a.needsUpdate = true;
    }

    // confete 3D
    if (confetti3d?.visible) {
      const u = confetti3d.userData;
      u.t -= dt;
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const s = new THREE.Vector3(1, 1, 1);
      const pv = new THREE.Vector3();
      for (let i = 0; i < confetti3d.count; i++) {
        u.v[i * 3 + 1] -= 6 * dt;
        for (let k = 0; k < 3; k++) {
          u.v[i * 3 + k] *= 0.985;
          u.p[i * 3 + k] += u.v[i * 3 + k] * dt;
          u.r[i * 3 + k] += dt * (3 + (i % 5));
        }
        if (u.p[i * 3 + 1] < floorY + 0.02) {
          u.p[i * 3 + 1] = floorY + 0.02;
          u.v[i * 3] = u.v[i * 3 + 1] = u.v[i * 3 + 2] = 0;
        }
        pv.set(u.p[i * 3], u.p[i * 3 + 1], u.p[i * 3 + 2]);
        e.set(u.r[i * 3], u.r[i * 3 + 1], u.r[i * 3 + 2]);
        q.setFromEuler(e);
        m.compose(pv, q, s);
        confetti3d.setMatrixAt(i, m);
      }
      confetti3d.instanceMatrix.needsUpdate = true;
      if (u.t <= 0) confetti3d.visible = false;
    }

    // câmera suave
    desiredCamera(t);
    camera.position.lerp(camPos, Math.min(1, dt * 2.5));
    lookTmp.lerp(camTarget, Math.min(1, dt * 3));
    camera.lookAt(lookTmp);

    // sol acompanha o Pongo (sombras nítidas perto dele)
    sun.position.set(pongo.position.x + 8, pongo.position.y + 18, pongo.position.z + 6);
    sun.target.position.copy(pongo.position);

    mixer?.update(dt);
    pandaMixer?.update(dt);
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(update);

  return {
    loadLevel,
    resize,
    setWalking(on) {
      walking = on;
    },
    toggleAuto() {
      if (busy || ended) return;
      autoWalk = !autoWalk;
      if (!autoWalk) walking = false;
    },
    isAuto: () => autoWalk,
    isBusy: () => busy,
    // pula direto para um portal (ao retomar uma fase com missões já feitas)
    skipTo(doneCount) {
      for (let i = 0; i < doneCount; i++) {
        gateOpen[i] = true;
        gates[i].open = 1;
      }
      if (doneCount > 0) pongo.position.z = GATE_Z[doneCount - 1] - 1.5;
      snapCamera();
    },
    openGate(i) {
      gateOpen[i] = true;
      busy = false;
    },
    reopenGate(i) {
      busy = true;
      hooks.onGate?.(i);
    },
    celebrate() {
      current = null;
      play('Jump', 0.1, true);
      if (confetti3d) {
        const u = confetti3d.userData;
        const p = pongo.position;
        for (let i = 0; i < confetti3d.count; i++) {
          u.p[i * 3] = p.x;
          u.p[i * 3 + 1] = p.y + 1.2;
          u.p[i * 3 + 2] = p.z;
          const a = Math.random() * Math.PI * 2;
          const sp = 2 + Math.random() * 4;
          u.v[i * 3] = Math.cos(a) * sp;
          u.v[i * 3 + 1] = 4 + Math.random() * 6;
          u.v[i * 3 + 2] = Math.sin(a) * sp;
        }
        u.t = 4;
        confetti3d.visible = true;
      }
    },
    sad() {
      current = null;
      play('Sad', 0.15, true);
    },
    pandaWave() {
      if (pandaActions.Wave) {
        pandaActions.Idle?.fadeOut(0.3);
        pandaActions.Wave.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
      }
    },
    pause(on) {
      renderer.setAnimationLoop(on ? null : update);
      if (!on) clock.getDelta();
    },
  };
}
