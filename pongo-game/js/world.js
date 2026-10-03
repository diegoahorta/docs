// Mundo 3D: o jardim da casa, com os modelos gerados no Blender
// (blender/build_models.py -> models/*.glb, embutidos em models/models-data.js).

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const rand = (a, b) => a + Math.random() * (b - a)

// Posições (x, z) do caminho: início + 6 buracos
const START = new THREE.Vector3(-9, 0, 10)
const STOP = 0.16 // fração de segmento antes do buraco onde o Pongo para
const SPOTS = [
  [-5.5, 7.5], [-7, 0.5], [-2, -5], [3.5, -2.5], [8, 3], [3, 8.5],
].map(([x, z]) => new THREE.Vector3(x, 0, z))

export async function createWorld(canvas, { onPongoTap, onStep } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = skyTexture()
  scene.fog = new THREE.Fog(0xbfe8ff, 38, 85)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
  camera.position.set(0, 26, 34)

  // luzes
  scene.add(new THREE.HemisphereLight(0xdff3ff, 0x5a8f3a, 1.1))
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4)
  sun.position.set(12, 22, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 })
  sun.shadow.bias = -0.0005
  scene.add(sun)

  // ------------------------------------------------------------ modelos
  const loader = new GLTFLoader()
  const src = window.PONGO_MODELS || {}
  const names = ['pongo', 'bone', 'mound', 'hole', 'doghouse', 'house', 'tree', 'palm', 'bush', 'flower', 'fence', 'stone', 'ball', 'marker']
  const models = {}
  await Promise.all(names.map(async (n) => {
    const url = src[n] || `models/${n}.glb`
    const gltf = await loader.loadAsync(url)
    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    models[n] = gltf.scene
  }))
  const place = (name, x, z, { s = 1, ry = 0, y = 0 } = {}) => {
    const o = models[name].clone(true)
    o.position.set(x, y, z)
    o.rotation.y = ry
    o.scale.setScalar(s)
    scene.add(o)
    return o
  }

  // ------------------------------------------------------------- terreno
  const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 64), new THREE.MeshStandardMaterial({ color: 0x5fae45, roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // gramado do jardim (mais claro, levemente ondulado nas cores)
  const lawnGeo = new THREE.PlaneGeometry(30, 26, 60, 52)
  const colors = []
  const c = new THREE.Color()
  for (let i = 0; i < lawnGeo.attributes.position.count; i++) {
    c.setHSL(0.27 + rand(-0.02, 0.02), 0.55, 0.47 + rand(-0.04, 0.04))
    colors.push(c.r, c.g, c.b)
  }
  lawnGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const lawn = new THREE.Mesh(lawnGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }))
  lawn.rotation.x = -Math.PI / 2
  lawn.position.set(0, 0.01, 1)
  lawn.receiveShadow = true
  scene.add(lawn)

  // tufos de grama (instanced)
  const blade = new THREE.ConeGeometry(0.05, 0.35, 3)
  blade.translate(0, 0.17, 0)
  const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x3f9b3a, roughness: 1 }), 2600)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  for (let i = 0; i < grass.count; i++) {
    const x = rand(-14.5, 14.5)
    const z = rand(-11.5, 13.5)
    q.setFromEuler(new THREE.Euler(rand(-0.3, 0.3), rand(0, 6), rand(-0.3, 0.3)))
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, rand(0.6, 1.5), 1))
    grass.setMatrixAt(i, m4)
    grass.setColorAt(i, new THREE.Color().setHSL(0.26 + rand(-0.03, 0.04), 0.6, rand(0.3, 0.45)))
  }
  scene.add(grass)

  // ------------------------------------------------------------ cenário
  place('house', 0, -15, { s: 1.5 })
  const doghouse = place('doghouse', -11, 9.5, { s: 1.1, ry: 0.9 })

  for (const [x, z, s] of [[-1, -8.5, 1.2], [-10, -6, 1.1], [10, -8, 1.3], [-12.5, 2, 1]]) place('tree', x, z, { s, ry: rand(0, 6) })
  for (const [x, z, s] of [[10.5, 5, 1.2], [12, -2, 1], [-13, -10, 1.1], [12.5, 11.5, 1.2], [-13.5, 12.5, 0.9]]) place('palm', x, z, { s, ry: rand(0, 6) })
  for (const [x, z] of [[5, -4.5], [6.5, -5], [-13, -3], [13, 7], [8, 12.5], [-8, -9.5], [0.5, 12.8], [13, -9], [-3, -11]]) {
    place('bush', x, z, { s: rand(0.9, 1.4), ry: rand(0, 6) })
  }
  // floresta "selvagem" fora da cerca
  for (let i = 0; i < 34; i++) {
    const a = rand(0, Math.PI * 2)
    const r = rand(22, 40)
    place(Math.random() < 0.55 ? 'palm' : 'tree', Math.cos(a) * r, Math.sin(a) * r * 0.9 + 2, { s: rand(1.2, 2.2), ry: rand(0, 6) })
  }

  // cerca em volta do jardim
  for (let x = -14; x <= 14; x += 2) place('fence', x, 14, { ry: 0 })
  for (let z = -10; z <= 12; z += 2) {
    place('fence', -15, z + 1, { ry: Math.PI / 2 })
    place('fence', 15, z + 1, { ry: Math.PI / 2 })
  }

  // flores
  const petalColors = [0xff5d8f, 0xffd166, 0xffffff, 0xb185ff, 0xff8a3d, 0x4cc9f0]
  const addFlower = (x, z, s = 1) => {
    const f = place('flower', x, z, { s: s * rand(1.3, 2), ry: rand(0, 6) })
    const col = new THREE.Color(petalColors[(Math.random() * petalColors.length) | 0])
    f.traverse((o) => {
      if (o.isMesh && o.material.name === 'Petal') {
        o.material = o.material.clone()
        o.material.color = col
      }
    })
  }
  for (let i = 0; i < 34; i++) addFlower(-8.8 + rand(-2.2, 2.2), -1.6 + rand(-1.6, 1.6))
  for (let i = 0; i < 40; i++) {
    const x = rand(-14, 14)
    const z = rand(-11, 13)
    if (SPOTS.some((s) => s.distanceTo(new THREE.Vector3(x, 0, z)) < 2)) continue
    addFlower(x, z, 0.8)
  }

  // caminho de pedras
  const path = new THREE.CatmullRomCurve3([START, ...SPOTS], false, 'catmullrom', 0.4)
  const stones = 70
  for (let i = 0; i <= stones; i++) {
    const p = path.getPointAt(i / stones)
    if (SPOTS.some((s) => s.distanceTo(p) < 1.2)) continue
    const t = path.getTangentAt(i / stones)
    place('stone', p.x + rand(-0.15, 0.15), p.z + rand(-0.15, 0.15), { s: rand(0.75, 1), ry: Math.atan2(t.x, t.z) + rand(-0.3, 0.3) })
  }

  // buracos (montinhos) e moedas de pista
  const spots = SPOTS.map((p) => {
    const mound = place('mound', p.x, p.z, { s: 1.1 })
    const marker = place('marker', p.x, p.z, { y: 2.2, s: 0.9 })
    return { pos: p, mound, marker, hole: null, done: false }
  })

  // nuvens
  const clouds = []
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true })
  for (let i = 0; i < 7; i++) {
    const cl = new THREE.Group()
    for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.2, 2.2), 1), cloudMat)
      b.position.set(k * 1.6 - 2.4, rand(-0.3, 0.4), rand(-0.6, 0.6))
      cl.add(b)
    }
    cl.position.set(rand(-40, 40), rand(16, 24), rand(-45, -10))
    cl.userData.speed = rand(0.3, 0.8)
    scene.add(cl)
    clouds.push(cl)
  }

  // borboletas
  const butterflies = []
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Group()
    const wingMat = new THREE.MeshStandardMaterial({ color: petalColors[i % petalColors.length], side: THREE.DoubleSide })
    const wingGeo = new THREE.CircleGeometry(0.18, 8)
    wingGeo.translate(0.18, 0, 0)
    const l = new THREE.Mesh(wingGeo, wingMat)
    const r = new THREE.Mesh(wingGeo, wingMat)
    r.scale.x = -1
    b.add(l, r)
    b.userData = { l, r, c: new THREE.Vector3(rand(-12, 12), 0, rand(-9, 12)), ph: rand(0, 6), rad: rand(1.5, 4) }
    scene.add(b)
    butterflies.push(b)
  }

  // ------------------------------------------------------------- Pongo
  const pongo = models.pongo
  pongo.position.copy(START)
  pongo.scale.setScalar(1.1)
  scene.add(pongo)
  const parts = {
    head: pongo.getObjectByName('Head'),
    tail: pongo.getObjectByName('Tail'),
    legs: ['Leg_FL', 'Leg_BR', 'Leg_FR', 'Leg_BL'].map((n) => pongo.getObjectByName(n)),
  }
  const baseHead = parts.head.rotation.x

  // partículas de terra
  const dirtGeo = new THREE.IcosahedronGeometry(0.09, 0)
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2c, roughness: 1, flatShading: true })
  const dirt = []

  // item revelado (bola / osso)
  let reveal = null
  const glow = new THREE.PointLight(0xffe08a, 0, 8)
  scene.add(glow)

  // ------------------------------------------------------------- estado
  const state = {
    mode: 'idle', // idle | walk | dig | happy
    walk: null,
    digUntil: 0,
    hopT: -1,
    camTarget: new THREE.Vector3(),
    camPos: new THREE.Vector3(0, 26, 34),
    panelOpen: false,
    intro: true,
    t: 0,
  }

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w < h ? 60 : 45
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)
  resize()

  // clique no Pongo -> late e pula
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  canvas.addEventListener('pointerdown', (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    if (ray.intersectObject(pongo, true).length) {
      hop()
      onPongoTap?.()
    }
  })

  function hop() {
    state.hopT = 0
  }

  function faceTo(dir, k = 0.15) {
    const target = Math.atan2(dir.x, dir.z)
    let d = target - pongo.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    pongo.rotation.y += d * k
  }

  function walkTo(index) {
    const n = SPOTS.length
    // o ponto i da curva fica em t = i / n (getPoint não usa comprimento de arco);
    // paramos um pouquinho antes do buraco
    const from = index === 0 ? 0 : index / n - STOP / n
    const to = (index + 1) / n - STOP / n
    const dist = path.getLength() * (to - from)
    return new Promise((resolve) => {
      state.mode = 'walk'
      state.walk = { index, from, to, t: 0, dur: Math.max(2.2, dist / 3.2), resolve, lastStep: 0 }
    })
  }

  function dig(index, find) {
    const spot = spots[index]
    return new Promise((resolve) => {
      state.mode = 'dig'
      state.digUntil = state.t + 2.6
      state.digResolve = () => {
        // troca montinho por buraco
        scene.remove(spot.mound)
        spot.hole = place('hole', spot.pos.x, spot.pos.z, { s: 1.15 })
        spot.done = true
        spot.markerFly = 0
        if (find === 'ball' || find === 'bone') {
          if (reveal) scene.remove(reveal.obj)
          const obj = place(find, spot.pos.x, spot.pos.z, { s: find === 'bone' ? 1.6 : 1.4, y: 0.2 })
          reveal = { obj, t: 0, bone: find === 'bone' }
          glow.position.set(spot.pos.x, 2, spot.pos.z)
          glow.intensity = find === 'bone' ? 40 : 10
        }
        state.mode = 'happy'
        hop()
        setTimeout(() => {
          state.mode = 'idle'
          resolve()
        }, find === 'bone' ? 2600 : 1400)
      }
    })
  }

  const clock = new THREE.Clock()
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05)
    state.t += dt
    const t = state.t

    // ---- Pongo
    let legSwing = 0
    let headTarget = baseHead + Math.sin(t * 2) * 0.05
    let tailSpeed = 9
    let bodyY = 0

    if (state.mode === 'walk' && state.walk) {
      const w = state.walk
      w.t += dt / w.dur
      const k = Math.min(1, w.t)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      const u = w.from + (w.to - w.from) * e
      const p = path.getPoint(u)
      pongo.position.x = p.x
      pongo.position.z = p.z
      faceTo(path.getTangent(Math.min(u, 0.999)), 0.2)
      legSwing = Math.sin(t * 14) * 0.6
      bodyY = Math.abs(Math.sin(t * 14)) * 0.08
      tailSpeed = 16
      if (t - w.lastStep > 0.22) {
        w.lastStep = t
        onStep?.()
      }
      if (w.t >= 1) {
        state.mode = 'idle'
        state.walk = null
        state.faceSpot = SPOTS[w.index]
        w.resolve()
      }
    } else if (state.mode === 'dig') {
      headTarget = baseHead + 0.65
      legSwing = 0
      parts.legs[0].rotation.x = -0.6 + Math.sin(t * 30) * 0.7
      parts.legs[2].rotation.x = -0.6 + Math.sin(t * 30 + Math.PI) * 0.7
      bodyY = -0.05
      tailSpeed = 22
      if (Math.random() < 0.6) spawnDirt()
      if (t > state.digUntil && state.digResolve) {
        const r = state.digResolve
        state.digResolve = null
        r()
      }
    } else if (state.mode === 'idle' && state.faceSpot) {
      faceTo(state.faceSpot.clone().sub(pongo.position), 0.1)
    } else if (state.mode === 'happy') {
      tailSpeed = 26
      headTarget = baseHead - 0.25
    }

    if (state.mode !== 'dig') {
      parts.legs.forEach((l, i) => {
        const target = i % 2 ? -legSwing : legSwing
        l.rotation.x += (target - l.rotation.x) * 0.35
      })
    } else {
      parts.legs[1].rotation.x *= 0.8
      parts.legs[3].rotation.x *= 0.8
    }
    parts.head.rotation.x += (headTarget - parts.head.rotation.x) * 0.15
    parts.tail.rotation.y = Math.sin(t * tailSpeed) * 0.7

    if (state.hopT >= 0) {
      state.hopT += dt
      const h = Math.sin(Math.min(1, state.hopT / 0.5) * Math.PI)
      bodyY += h * 0.9
      pongo.rotation.z = Math.sin(state.hopT * 20) * 0.05 * h
      if (state.hopT > 0.5) state.hopT = -1
    }
    pongo.position.y = bodyY

    // ---- moedas de pista
    spots.forEach((s, i) => {
      if (s.done) {
        if (s.markerFly !== undefined && s.marker.parent) {
          s.markerFly += dt
          s.marker.position.y += dt * 6
          s.marker.rotation.y += dt * 20
          s.marker.scale.setScalar(Math.max(0.01, 0.9 - s.markerFly * 0.8))
          if (s.markerFly > 1.1) scene.remove(s.marker)
        }
        return
      }
      s.marker.rotation.y = t * 1.6 + i
      s.marker.position.y = 2.2 + Math.sin(t * 2.4 + i) * 0.18
    })

    // ---- item revelado
    if (reveal) {
      reveal.t += dt
      const k = Math.min(1, reveal.t / 1.2)
      reveal.obj.position.y = 0.2 + (reveal.bone ? 2.6 : 1.4) * easeOutBack(k)
      reveal.obj.rotation.y += dt * (reveal.bone ? 3 : 2)
      if (reveal.bone) {
        reveal.obj.rotation.z = Math.sin(t * 2) * 0.3
        glow.intensity = 30 + Math.sin(t * 6) * 12
      } else {
        glow.intensity *= 0.98
      }
    }

    // ---- terra voando
    for (let i = dirt.length - 1; i >= 0; i--) {
      const d = dirt[i]
      d.userData.v.y -= 12 * dt
      d.position.addScaledVector(d.userData.v, dt)
      d.rotation.x += dt * 8
      if (d.position.y < 0) {
        scene.remove(d)
        dirt.splice(i, 1)
      }
    }

    // ---- ambiente
    clouds.forEach((cl) => {
      cl.position.x += cl.userData.speed * dt
      if (cl.position.x > 50) cl.position.x = -50
    })
    butterflies.forEach((b, i) => {
      const u = b.userData
      const a = t * 0.6 + u.ph
      b.position.set(u.c.x + Math.cos(a) * u.rad, 1.2 + Math.sin(t * 2 + i) * 0.5, u.c.z + Math.sin(a * 1.3) * u.rad)
      b.rotation.y = -a
      const flap = Math.sin(t * 22 + i) * 1.1
      u.l.rotation.y = flap
      u.r.rotation.y = -flap
    })

    // ---- câmera
    if (state.intro) {
      const a = t * 0.12
      state.camPos.set(Math.sin(a) * 30, 20, Math.cos(a) * 30 + 2)
      state.camTarget.set(0, 0, 0)
    } else {
      const p = pongo.position
      const portrait = window.innerWidth < window.innerHeight
      const dist = portrait ? 1.35 : 1
      // com o painel aberto, a câmera olha "abaixo" do Pongo para ele subir na tela
      const lookShift = state.panelOpen ? (portrait ? 4.5 : 3.2) : 0
      state.camPos.set(p.x + 2, 9.5 * dist, p.z + 11 * dist)
      state.camTarget.set(p.x, 0.8, p.z + lookShift)
    }
    camera.position.lerp(state.camPos, state.intro ? 0.02 : 0.05)
    if (!state.lookAt) state.lookAt = state.camTarget.clone()
    state.lookAt.lerp(state.camTarget, 0.08)
    camera.lookAt(state.lookAt)

    renderer.render(scene, camera)
    requestAnimationFrame(frame)
  }

  function spawnDirt() {
    if (dirt.length > 90) return
    const d = new THREE.Mesh(dirtGeo, dirtMat)
    const back = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), pongo.rotation.y)
    d.position.copy(pongo.position).add(back.clone().multiplyScalar(-0.9)).setY(0.3)
    d.userData.v = back.multiplyScalar(rand(2, 4)).add(new THREE.Vector3(rand(-1.5, 1.5), rand(3, 6), rand(-1.5, 1.5)))
    d.castShadow = true
    scene.add(d)
    dirt.push(d)
  }

  /** Posição do Pongo na tela (px) — usada pelos efeitos 2D. */
  function pongoScreen() {
    const v = pongo.position.clone().setY(1.5).project(camera)
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight }
  }

  function revealScreen() {
    if (!reveal) return pongoScreen()
    const v = reveal.obj.position.clone().project(camera)
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight }
  }

  function reset() {
    spots.forEach((s) => {
      if (s.hole) scene.remove(s.hole)
      s.hole = null
      if (!s.mound.parent) scene.add(s.mound)
      if (!s.marker.parent) scene.add(s.marker)
      s.marker.scale.setScalar(0.9)
      s.marker.position.y = 2.2
      s.done = false
      s.markerFly = undefined
    })
    if (reveal) scene.remove(reveal.obj)
    reveal = null
    glow.intensity = 0
    pongo.position.copy(START)
    pongo.rotation.set(0, 0, 0)
    state.mode = 'idle'
    state.faceSpot = null
  }

  requestAnimationFrame(frame)

  return {
    walkTo,
    dig,
    hop,
    reset,
    pongoScreen,
    revealScreen,
    setPanelOpen(open) { state.panelOpen = open },
    endIntro() { state.intro = false },
    doghouse,
  }
}

function easeOutBack(x) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#4fb3ff')
  grad.addColorStop(0.55, '#a9ddff')
  grad.addColorStop(1, '#fff4d6')
  g.fillStyle = grad
  g.fillRect(0, 0, 4, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
