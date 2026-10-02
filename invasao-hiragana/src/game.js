// Núcleo 3D do jogo: cena, nave, invasores, tiros, partículas e regras.

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import glbBytes from '../assets/invasao-hiragana.glb'
import {
  COR_DO_KANA,
  EXCLAMACOES,
  PALAVRAS_POR_SETOR,
  ROMAJI,
  SETORES_HISTORIA,
  kanaDoSetor,
  linhaDoSetor,
  romajiDaPalavra,
  sortearPalavra
} from './kana.js'

const LIM_X = 9
const LIM_Y = 5
const Z_SURGIR = -290
const VEL_MUNDO = 44
const VEL_LASER = 230

export const DIFICULDADES = {
  cadete: {
    nome: 'Cadete',
    aprox: 19,
    intervalo: 2.0,
    escudo: 6,
    maxAliens: 5,
    tiroSetor: 4,
    perdaMemoria: 8
  },
  piloto: {
    nome: 'Piloto',
    aprox: 26,
    intervalo: 1.5,
    escudo: 5,
    maxAliens: 6,
    tiroSetor: 3,
    perdaMemoria: 11
  },
  as: {
    nome: 'Ás',
    aprox: 33,
    intervalo: 1.1,
    escudo: 4,
    maxAliens: 8,
    tiroSetor: 2,
    perdaMemoria: 14
  }
}

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const FONTE_JP =
  '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Unifont-JP", sans-serif'

// ------------------------------------------------------------------ texturas

const cacheTex = new Map()

function texturaKana(
  kana,
  { romaji = false, cor = '#fff', contraste = false } = {}
) {
  const chave = `${kana}|${romaji}|${cor}|${contraste}`
  if (cacheTex.has(chave)) return cacheTex.get(chave)
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.beginPath()
  g.arc(128, 128, 116, 0, Math.PI * 2)
  g.fillStyle = contraste ? 'rgba(0,0,0,0.92)' : 'rgba(12,8,36,0.7)'
  g.fill()
  g.lineWidth = contraste ? 14 : 9
  g.strokeStyle = contraste ? '#ffffff' : cor
  g.shadowColor = cor
  g.shadowBlur = 18
  g.stroke()
  g.shadowBlur = 0
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const y = romaji ? 112 : 132
  g.font = `700 ${romaji ? 136 : 160}px ${FONTE_JP}`
  g.lineJoin = 'round'
  g.lineWidth = 12
  g.strokeStyle = '#05030f'
  g.strokeText(kana, 128, y)
  g.fillStyle = contraste ? '#fff36b' : '#ffffff'
  g.fillText(kana, 128, y)
  if (romaji) {
    g.font = '700 44px "Exo 2", system-ui, sans-serif'
    g.fillStyle = contraste ? '#ffffff' : cor
    g.fillText(ROMAJI[kana] ?? '', 128, 206)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cacheTex.set(chave, tex)
  return tex
}

function texturaRadial(stops, tam = 128) {
  const c = document.createElement('canvas')
  c.width = c.height = tam
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(
    tam / 2,
    tam / 2,
    0,
    tam / 2,
    tam / 2,
    tam / 2
  )
  for (const [o, cor] of stops) grad.addColorStop(o, cor)
  g.fillStyle = grad
  g.fillRect(0, 0, tam, tam)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function texturaHalo() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.translate(128, 128)
  g.strokeStyle = '#ffd34d'
  g.shadowColor = '#ffb300'
  g.shadowBlur = 16
  g.lineWidth = 8
  for (let i = 0; i < 4; i++) {
    g.beginPath()
    g.arc(
      0,
      0,
      112,
      i * (Math.PI / 2) + 0.2,
      i * (Math.PI / 2) + Math.PI / 2 - 0.2
    )
    g.stroke()
  }
  for (let i = 0; i < 4; i++) {
    g.rotate(Math.PI / 2)
    g.beginPath()
    g.moveTo(0, -124)
    g.lineTo(-10, -106)
    g.lineTo(10, -106)
    g.closePath()
    g.fillStyle = '#ffd34d'
    g.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function texturaPlaneta() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')
  const cores = [
    '#3b2a7a',
    '#5a3fb0',
    '#2b8fb3',
    '#7b5cff',
    '#2a1d5c',
    '#46c4d9',
    '#4a2f96'
  ]
  let y = 0
  while (y < 256) {
    const h = 6 + Math.random() * 26
    g.fillStyle = cores[Math.floor(Math.random() * cores.length)]
    g.globalAlpha = 0.85
    g.fillRect(0, y, 512, h)
    y += h
  }
  g.globalAlpha = 0.25
  for (let i = 0; i < 300; i++) {
    g.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#1a1040'
    g.fillRect(
      Math.random() * 512,
      Math.random() * 256,
      20 + Math.random() * 80,
      1 + Math.random() * 3
    )
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ------------------------------------------------------------------ partículas

class Particulas {
  constructor(max) {
    this.max = max
    this.prox = 0
    this.pos = new Float32Array(max * 3)
    this.cor = new Float32Array(max * 4)
    this.tam = new Float32Array(max)
    this.vel = new Float32Array(max * 3)
    this.vida = new Float32Array(max)
    this.vidaMax = new Float32Array(max)
    this.tamBase = new Float32Array(max)
    this.arrasto = new Float32Array(max)
    this.gravidade = new Float32Array(max)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.pos, 3).setUsage(
        THREE.DynamicDrawUsage
      )
    )
    geo.setAttribute(
      'acor',
      new THREE.BufferAttribute(this.cor, 4).setUsage(
        THREE.DynamicDrawUsage
      )
    )
    geo.setAttribute(
      'tamanho',
      new THREE.BufferAttribute(this.tam, 1).setUsage(
        THREE.DynamicDrawUsage
      )
    )
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5)
    const mat = new THREE.ShaderMaterial({
      uniforms: { escala: { value: 300 } },
      vertexShader: /* glsl */ `
        attribute vec4 acor; attribute float tamanho; varying vec4 vCor; uniform float escala;
        void main(){ vCor=acor; vec4 mv=modelViewMatrix*vec4(position,1.0);
          float dist=max(-mv.z,0.1);
          // limita o tamanho e apaga partículas coladas na câmera (evita tela branca)
          vCor.a*=smoothstep(2.0,8.0,dist);
          gl_PointSize=min(tamanho*(escala/dist),56.0); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: /* glsl */ `
        varying vec4 vCor;
        void main(){ vec2 p=gl_PointCoord-0.5; float d=length(p); if(d>0.5) discard;
          float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vCor.rgb*(1.0+a*1.5), vCor.a*a); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    this.pontos = new THREE.Points(geo, mat)
    this.pontos.frustumCulled = false
    this.pontos.renderOrder = 5
  }

  emitir(
    origem,
    n,
    {
      cores,
      vel = 20,
      vida = 1,
      tam = 1,
      arrasto = 0.96,
      gravidade = 0,
      espalhar = 0,
      achatarZ = 1
    }
  ) {
    const c = new THREE.Color()
    for (let k = 0; k < n; k++) {
      const i = this.prox
      this.prox = (this.prox + 1) % this.max
      const u = Math.random() * 2 - 1
      const th = Math.random() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      const v = vel * (0.3 + Math.random() * 0.7)
      this.vel[i * 3] = r * Math.cos(th) * v
      this.vel[i * 3 + 1] = r * Math.sin(th) * v
      this.vel[i * 3 + 2] = u * v * achatarZ
      this.pos[i * 3] = origem.x + (Math.random() - 0.5) * espalhar
      this.pos[i * 3 + 1] = origem.y + (Math.random() - 0.5) * espalhar
      this.pos[i * 3 + 2] = origem.z + (Math.random() - 0.5) * espalhar
      c.set(cores[Math.floor(Math.random() * cores.length)])
      this.cor[i * 4] = c.r
      this.cor[i * 4 + 1] = c.g
      this.cor[i * 4 + 2] = c.b
      this.cor[i * 4 + 3] = 1
      const vd = vida * (0.5 + Math.random() * 0.5)
      this.vida[i] = vd
      this.vidaMax[i] = vd
      this.tamBase[i] = tam * (0.5 + Math.random() * 0.8)
      this.tam[i] = this.tamBase[i]
      this.arrasto[i] = arrasto
      this.gravidade[i] = gravidade
    }
  }

  atualizar(dt, deriva) {
    for (let i = 0; i < this.max; i++) {
      if (this.vida[i] <= 0) continue
      this.vida[i] -= dt
      if (this.vida[i] <= 0) {
        this.tam[i] = 0
        this.cor[i * 4 + 3] = 0
        continue
      }
      const a = Math.pow(this.arrasto[i], dt * 60)
      this.vel[i * 3] *= a
      this.vel[i * 3 + 1] =
        this.vel[i * 3 + 1] * a - this.gravidade[i] * dt
      this.vel[i * 3 + 2] *= a
      this.pos[i * 3] += this.vel[i * 3] * dt
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt
      this.pos[i * 3 + 2] += (this.vel[i * 3 + 2] + deriva) * dt
      const f = this.vida[i] / this.vidaMax[i]
      this.cor[i * 4 + 3] = f
      this.tam[i] = this.tamBase[i] * (0.4 + 0.6 * f)
    }
    const g = this.pontos.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.acor.needsUpdate = true
    g.attributes.tamanho.needsUpdate = true
  }

  limpar() {
    this.vida.fill(0)
    this.tam.fill(0)
  }
}

// ------------------------------------------------------------------ jogo

export class Jogo {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {(tipo: string, dados?: any) => void} ui  canal de eventos para a interface
   * @param {import('./audio.js').Audio} audio
   * @param {object} config  configurações (lidas a cada quadro)
   */
  constructor(canvas, ui, audio, config) {
    this.canvas = canvas
    this.ui = ui
    this.audio = audio
    this.config = config
    this.estado = 'menu'
    this.entrada = { x: 0, y: 0, atirar: false }
    this.ultimoQuadro = performance.now()
    this.tempo = 0
    this.escalaTempo = 1
    this.tremor = 0
    this.bloomExtra = 0
    this.socoFov = 0
    this.warp = 1
    this.warpAlvo = 1
    this.agenda = []
    this.aliens = []
    this.lasers = []
    this.asteroides = []
    this.portais = []
    this.orbes = []
    this.fantasmas = []
    this.ondas = []
    this.fpsAmostras = []
  }

  async iniciar() {
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer = r
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    r.outputColorSpace = THREE.SRGBColorSpace

    const cena = new THREE.Scene()
    this.cena = cena
    cena.background = new THREE.Color(0x05030f)
    cena.fog = new THREE.Fog(0x0a0720, 90, 330)

    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 2400)
    this.camera.position.set(0, 2.4, 10.5)

    cena.add(new THREE.HemisphereLight(0x9d90ff, 0x140b30, 0.9))
    const sol = new THREE.DirectionalLight(0xfff4e8, 1.6)
    sol.position.set(6, 10, 8)
    cena.add(sol)
    const recorte = new THREE.DirectionalLight(0x7c6bff, 2.0)
    recorte.position.set(-6, 3, -10)
    cena.add(recorte)

    this.texBrilho = texturaRadial([
      [0, 'rgba(255,255,255,1)'],
      [0.25, 'rgba(255,255,255,0.6)'],
      [1, 'rgba(255,255,255,0)']
    ])
    this.texHalo = texturaHalo()

    await this._carregarModelos()
    this._criarAmbiente()
    this._criarNave()
    this._criarMira()

    this.particulas = new Particulas(5000)
    cena.add(this.particulas.pontos)

    this._configurarPos()
    this._redimensionar()
    window.addEventListener('resize', () => this._redimensionar())

    r.setAnimationLoop(() => this._quadro())
  }

  // ---------------------------------------------------------------- recursos

  _carregarModelos() {
    return new Promise((resolve) => {
      const buf = glbBytes.buffer.slice(
        glbBytes.byteOffset,
        glbBytes.byteOffset + glbBytes.byteLength
      )
      new GLTFLoader().parse(
        buf,
        '',
        (gltf) => {
          this.modelos = {}
          for (const nome of ['Nave', 'Invasor', 'Asteroide', 'Portal']) {
            this.modelos[nome] =
              gltf.scene.getObjectByName(nome) ?? this._modeloReserva(nome)
          }
          resolve()
        },
        (erro) => {
          console.warn('GLB não carregou, usando modelos de reserva', erro)
          this.modelos = {}
          for (const nome of ['Nave', 'Invasor', 'Asteroide', 'Portal'])
            this.modelos[nome] = this._modeloReserva(nome)
          resolve()
        }
      )
    })
  }

  _modeloReserva(nome) {
    const g = new THREE.Group()
    g.name = nome
    const m = (geo, cor, emis = 0) =>
      new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: cor,
          emissive: cor,
          emissiveIntensity: emis
        })
      )
    if (nome === 'Nave') {
      const c = m(new THREE.ConeGeometry(0.5, 3, 8), 0xdddcf5)
      c.rotation.x = -Math.PI / 2
      g.add(c)
      g.add(m(new THREE.BoxGeometry(4.4, 0.08, 1), 0x8b7bff))
    } else if (nome === 'Invasor') {
      const d = m(new THREE.SphereGeometry(1.2, 20, 10), 0x555a70)
      d.scale.y = 0.3
      g.add(d)
      const anel = m(
        new THREE.TorusGeometry(1.28, 0.07, 6, 24),
        0xff4dc4,
        4
      )
      anel.name = 'InvasorAnel'
      anel.material.name = 'AnelAlien'
      anel.rotation.x = Math.PI / 2
      g.add(anel)
    } else if (nome === 'Asteroide') {
      g.add(m(new THREE.IcosahedronGeometry(1, 1), 0x554a50))
    } else {
      g.add(m(new THREE.TorusGeometry(3.2, 0.2, 8, 40), 0xffb84d, 4))
    }
    return g
  }

  _criarAmbiente() {
    const cena = this.cena

    // Nebulosa procedural num domo que acompanha a câmera
    this.nebulosa = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTempo: { value: 0 },
          uCor: { value: new THREE.Color('#b388ff') }
        },
        vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir=normalize(position);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTempo; uniform vec3 uCor; varying vec3 vDir;
          float h(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float n(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
          float fbm(vec3 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=0.5; } return v; }
          void main(){
            vec3 d=normalize(vDir);
            float n1=fbm(d*2.6+vec3(0.0,0.0,uTempo*0.012));
            float n2=fbm(d*5.5-vec3(uTempo*0.006));
            vec3 c=vec3(0.012,0.008,0.04);
            c=mix(c, uCor*0.42, smoothstep(0.48,0.82,n1)*0.85);
            c=mix(c, vec3(0.04,0.32,0.48), smoothstep(0.56,0.86,n2)*0.45);
            c+=vec3(0.6,0.12,0.4)*pow(smoothstep(0.55,0.95,n1*n2*1.7),2.0)*0.55;
            float estrela=step(0.9965,h(floor(d*420.0)));
            c+=vec3(estrela)*0.9;
            gl_FragColor=vec4(c,1.0);
          }`
      })
    )
    this.nebulosa.renderOrder = -10
    cena.add(this.nebulosa)

    // Planeta distante com anéis (acompanha a câmera com paralaxe)
    this.ceu = new THREE.Group()
    const planeta = new THREE.Mesh(
      new THREE.SphereGeometry(110, 48, 32),
      new THREE.MeshStandardMaterial({
        map: texturaPlaneta(),
        roughness: 0.9,
        fog: false,
        emissive: 0x1a0f40,
        emissiveIntensity: 0.6
      })
    )
    planeta.rotation.z = 0.3
    planeta.position.set(-330, 90, -1000)
    this.planeta = planeta
    const anel = new THREE.Mesh(
      new THREE.RingGeometry(150, 230, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9d8cff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        fog: false,
        depthWrite: false
      })
    )
    anel.rotation.set(1.25, 0.2, 0.4)
    planeta.add(anel)
    const atmosfera = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texBrilho,
        color: 0x6c5cff,
        transparent: true,
        opacity: 0.55,
        fog: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    atmosfera.scale.set(330, 330, 1)
    planeta.add(atmosfera)
    this.ceu.add(planeta)
    cena.add(this.ceu)

    // Estrelas (pontos) e riscos de velocidade
    const N = 1800
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = rand(-260, 260)
      pos[i * 3 + 1] = rand(-160, 160)
      pos[i * 3 + 2] = rand(-660, -30)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.estrelas = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 1.6,
        map: this.texBrilho,
        color: 0xd9d4ff,
        transparent: true,
        opacity: 0.9,
        fog: false,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    this.estrelas.frustumCulled = false
    cena.add(this.estrelas)

    const R = 260
    const rpos = new Float32Array(R * 6)
    this.riscosBase = []
    for (let i = 0; i < R; i++) {
      const ang = Math.random() * Math.PI * 2
      const raio = rand(14, 70)
      this.riscosBase.push([
        Math.cos(ang) * raio,
        Math.sin(ang) * raio * 0.7,
        rand(-500, 20)
      ])
    }
    const rgeo = new THREE.BufferGeometry()
    rgeo.setAttribute(
      'position',
      new THREE.BufferAttribute(rpos, 3).setUsage(THREE.DynamicDrawUsage)
    )
    this.riscos = new THREE.LineSegments(
      rgeo,
      new THREE.LineBasicMaterial({
        color: 0x9fe9ff,
        transparent: true,
        opacity: 0.45,
        fog: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    this.riscos.frustumCulled = false
    cena.add(this.riscos)

    // Grade neon abaixo para dar noção de velocidade
    this.grade = new THREE.GridHelper(1200, 120, 0x6c5cff, 0x3a2a8a)
    this.grade.material.transparent = true
    this.grade.material.opacity = 0.35
    this.grade.material.blending = THREE.AdditiveBlending
    this.grade.material.depthWrite = false
    this.grade.position.y = -18
    cena.add(this.grade)
  }

  _criarNave() {
    const nave = new THREE.Group()
    const modelo = this.modelos.Nave.clone(true)
    modelo.position.set(0, 0, 0)
    modelo.rotation.set(0, 0, 0)
    nave.add(modelo)
    this.naveModelo = modelo
    this.motor = modelo.getObjectByName('MotorBrilho')
    modelo.traverse((o) => {
      if (o.isMesh && o.material?.emissiveIntensity > 3) {
        o.material = o.material.clone()
        o.material.emissiveIntensity = o === this.motor ? 2.2 : 2.5
      }
    })
    this.saidas = [
      modelo.getObjectByName('CanhaoDSaida'),
      modelo.getObjectByName('CanhaoESaida')
    ].filter(Boolean)
    const brilho = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texBrilho,
        color: 0x8f7bff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
      })
    )
    brilho.material.opacity = 0.55
    brilho.scale.set(1.3, 1.3, 1)
    brilho.position.set(0, 0.03, 1.45)
    modelo.add(brilho)
    this.brilhoMotor = brilho
    this.nave = nave
    this.naveVel = new THREE.Vector2()
    this.rolagem = { ang: 0, dir: 0, t: 0 }
    this.cena.add(nave)
  }

  _criarMira() {
    const quadrado = (tam) => {
      const s = tam / 2
      const c = tam * 0.28
      const pts = []
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1]
      ]) {
        pts.push(x * s, y * s, 0, x * s - x * c, y * s, 0)
        pts.push(x * s, y * s, 0, x * s, y * s - y * c, 0)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(pts, 3)
      )
      const mat = new THREE.LineBasicMaterial({
        color: 0x5cffd6,
        transparent: true,
        depthTest: false,
        toneMapped: false,
        fog: false
      })
      const l = new THREE.LineSegments(geo, mat)
      l.renderOrder = 20
      return l
    }
    this.mira = [quadrado(1.6), quadrado(2.6)]
    for (const m of this.mira) this.cena.add(m)
  }

  _configurarPos() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.cena, this.camera))
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(512, 512),
      0.7,
      0.5,
      0.85
    )
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
  }

  _redimensionar() {
    const w = window.innerWidth
    const h = window.innerHeight
    const alta = this.config.qualidade !== 'baixa'
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, alta ? 2 : 1)
    )
    this.renderer.setSize(w, h, false)
    this.composer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, alta ? 2 : 1)
    )
    this.composer.setSize(w, h)
    const aspecto = w / h
    this.camera.aspect = aspecto
    // Em telas em pé (celular) abre o campo de visão para enxergar as laterais
    this.fovBase =
      aspecto < 1 ? Math.min(100, 68 * Math.pow(1 / aspecto, 0.55)) : 68
    this.camera.updateProjectionMatrix()
  }

  aplicarQualidade() {
    this._redimensionar()
  }

  // ---------------------------------------------------------------- partida

  novaPartida() {
    const dif =
      DIFICULDADES[this.config.dificuldade] ?? DIFICULDADES.piloto
    this._limparEntidades()
    this.p = {
      dif,
      pontos: 0,
      combo: 0,
      maxCombo: 0,
      escudo: dif.escudo,
      escudoMax: dif.escudo,
      memoria: 100,
      setor: 1,
      palavrasNoSetor: 0,
      palavra: null,
      indice: 0,
      usadas: new Set(),
      aprendidas: [],
      acertos: 0,
      erros: 0,
      disparos: 0,
      tempo: 0,
      invencivel: 0,
      tAlien: 1.5,
      tAsteroide: 6,
      tPortal: 14,
      cooldown: 0,
      lado: 0,
      radioVisto: new Set(),
      tRadio: 0,
      infinito: false
    }
    this.nave.position.set(0, 0, 0)
    this.nave.visible = true
    this.municaoLista = kanaDoSetor(1)
    this.municao = this.municaoLista[0]
    this._prepararBriefing()
  }

  _prepararBriefing() {
    this.estado = 'briefing'
    this.warpAlvo = 3.5
    this._agendar(1.4, () => (this.warpAlvo = 1))
    const setor = this.p.setor
    const linha = linhaDoSetor(setor)
    const novos = setor <= SETORES_HISTORIA ? linha.kana : []
    this.nebulosa.material.uniforms.uCor.value.set(linha.cor)
    this.municaoLista = kanaDoSetor(setor)
    if (!this.municaoLista.includes(this.municao))
      this.municao = this.municaoLista[0]
    this.ui('briefing', {
      setor,
      nome:
        setor <= SETORES_HISTORIA
          ? linha.nome
          : 'Fronteira do Esquecimento',
      cor: linha.cor,
      novos,
      todos: this.municaoLista,
      infinito: setor > SETORES_HISTORIA,
      palavrasPorSetor: PALAVRAS_POR_SETOR
    })
    this._emitirMunicao()
    this._emitirHud()
  }

  comecarSetor() {
    if (this.estado !== 'briefing') return
    this.estado = 'jogando'
    this._novaPalavra()
    const linha = linhaDoSetor(this.p.setor)
    if (this.p.setor === 1) {
      this._radio(
        'Piloto, o Esquecimento está apagando os hiragana do universo! Troque sua munição para o MESMO caractere do invasor e dispare.',
        true
      )
    } else {
      this._radio(
        `Setor ${this.p.setor}: ${linha.nome}. Fique de olho nos novos caracteres!`,
        true
      )
    }
  }

  continuarInfinito() {
    this.p.infinito = true
    this.p.setor += 1
    this.p.palavrasNoSetor = 0
    this._prepararBriefing()
  }

  pausar() {
    if (this.estado !== 'jogando' && this.estado !== 'briefing') return
    this.estadoAntesPausa = this.estado
    this.estado = 'pausado'
  }

  retomar() {
    if (this.estado !== 'pausado') return
    this.estado = this.estadoAntesPausa ?? 'jogando'
    this.ultimoQuadro = performance.now()
  }

  irParaMenu() {
    this._limparEntidades()
    this.estado = 'menu'
    this.nave.visible = true
    this.nave.position.set(0, 0, 0)
    this.p = null
  }

  _limparEntidades() {
    for (const lista of [
      this.aliens,
      this.lasers,
      this.asteroides,
      this.portais,
      this.orbes,
      this.fantasmas,
      this.ondas
    ]) {
      for (const e of lista) this._remover(e)
      lista.length = 0
    }
    this.agenda.length = 0
    this.particulas?.limpar()
    this.escalaTempo = 1
  }

  _remover(e) {
    const obj = e.grupo ?? e.mesh ?? e.sprite
    if (obj) {
      obj.removeFromParent()
      obj.traverse?.((o) => {
        if (o.isSprite || o.material?.userData?.descartavel)
          o.material.dispose()
      })
    }
    if (e.sprite && e.sprite !== obj) {
      e.sprite.removeFromParent()
      e.sprite.material.dispose()
    }
  }

  _agendar(atraso, fn) {
    this.agenda.push({ t: this.tempo + atraso, fn })
  }

  // ---------------------------------------------------------------- munição

  selecionarMunicao(kana) {
    if (!this.municaoLista?.includes(kana) || kana === this.municao) return
    this.municao = kana
    this.audio.selecionar(this._indiceKana(kana))
    this._emitirMunicao()
  }

  ciclarMunicao(d) {
    const l = this.municaoLista
    if (!l?.length) return
    const i = (l.indexOf(this.municao) + d + l.length) % l.length
    this.selecionarMunicao(l[i])
  }

  _indiceKana(k) {
    return Math.max(0, kanaDoSetor(99).indexOf(k))
  }

  _emitirMunicao() {
    this.ui('municao', { lista: this.municaoLista, atual: this.municao })
  }

  _emitirHud() {
    const p = this.p
    if (!p) return
    this.ui('hud', {
      pontos: p.pontos,
      combo: p.combo,
      mult: this._mult(),
      escudo: p.escudo,
      escudoMax: p.escudoMax,
      memoria: p.memoria,
      setor: p.setor,
      infinito: p.setor > SETORES_HISTORIA,
      palavra: p.palavra,
      indice: p.indice,
      palavrasNoSetor: p.palavrasNoSetor,
      palavrasPorSetor: PALAVRAS_POR_SETOR
    })
  }

  _mult() {
    return Math.min(5, 1 + Math.floor(this.p.combo / 5))
  }

  _radio(texto, forcar = false, chave = null) {
    const p = this.p
    if (!p) return
    if (chave) {
      if (p.radioVisto.has(chave)) return
      p.radioVisto.add(chave)
    }
    if (!forcar && p.tRadio > 0) return
    p.tRadio = 5
    this.ui('radio', texto)
  }

  _novaPalavra() {
    const p = this.p
    p.palavra = sortearPalavra(p.setor, p.usadas)
    p.usadas.add(p.palavra.palavra)
    p.indice = 0
    this.ui('palavra', {
      ...p.palavra,
      romaji: romajiDaPalavra(p.palavra.palavra)
    })
    this._emitirHud()
    this._atualizarAlvos()
  }

  _letraAlvo() {
    const p = this.p
    return p?.palavra && p.indice < p.palavra.letras.length
      ? p.palavra.letras[p.indice]
      : null
  }

  _atualizarAlvos() {
    const alvo = this._letraAlvo()
    for (const a of this.aliens) {
      a.alvo = a.kana === alvo
      a.halo.visible = a.alvo
    }
  }

  // ---------------------------------------------------------------- entidades

  _materialAnel(cor) {
    this._cacheAnel ??= new Map()
    if (!this._cacheAnel.has(cor)) {
      const m = new THREE.MeshStandardMaterial({
        color: cor,
        emissive: cor,
        emissiveIntensity: 4.5,
        roughness: 0.3
      })
      this._cacheAnel.set(cor, m)
    }
    return this._cacheAnel.get(cor)
  }

  _materialCupula(cor) {
    this._cacheCupula ??= new Map()
    if (!this._cacheCupula.has(cor)) {
      const m = new THREE.MeshStandardMaterial({
        color: cor,
        emissive: cor,
        emissiveIntensity: 1.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85
      })
      this._cacheCupula.set(cor, m)
    }
    return this._cacheCupula.get(cor)
  }

  _escolherKana() {
    const p = this.p
    const alvo = this._letraAlvo()
    const presentes = this.aliens.filter((a) => a.kana === alvo).length
    if (
      alvo &&
      (presentes === 0
        ? Math.random() < 0.75
        : presentes < 2 && Math.random() < 0.25)
    )
      return alvo
    if (p.palavra && Math.random() < 0.3) {
      const l = p.palavra.letras
      return l[Math.floor(Math.random() * l.length)]
    }
    // Tende a mostrar os caracteres novos do setor
    const lista = this.municaoLista
    if (
      p.setor > 1 &&
      p.setor <= SETORES_HISTORIA &&
      Math.random() < 0.4
    ) {
      const novos = linhaDoSetor(p.setor).kana.map(([k]) => k)
      return novos[Math.floor(Math.random() * novos.length)]
    }
    return lista[Math.floor(Math.random() * lista.length)]
  }

  _criarAlien() {
    const p = this.p
    const kana = this._escolherKana()
    const cor = COR_DO_KANA[kana] ?? '#ff4dc4'
    const grupo = new THREE.Group()
    const interno = this.modelos.Invasor.clone(true)
    interno.position.set(0, 0, 0)
    interno.traverse((o) => {
      if (!o.isMesh) return
      const nomeMat = o.material?.name ?? ''
      if (nomeMat.startsWith('AnelAlien'))
        o.material = this._materialAnel(cor)
      else if (nomeMat.startsWith('CupulaAlien'))
        o.material = this._materialCupula(cor)
    })
    interno.scale.setScalar(1.35)
    grupo.add(interno)

    const tex = texturaKana(kana, {
      romaji: this.config.romaji,
      cor,
      contraste: this.config.altoContraste
    })
    const rotulo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false
      })
    )
    const escalaRotulo = this.config.altoContraste ? 4.4 : 3.4
    rotulo.scale.set(escalaRotulo, escalaRotulo, 1)
    rotulo.position.set(0, 2.6, 0)
    rotulo.renderOrder = 10
    grupo.add(rotulo)

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texHalo,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    halo.scale.set(escalaRotulo * 1.45, escalaRotulo * 1.45, 1)
    halo.position.copy(rotulo.position)
    halo.renderOrder = 9
    halo.visible = false
    grupo.add(halo)

    const bolha = new THREE.Mesh(
      (this._geoBolha ??= new THREE.SphereGeometry(2.1, 16, 12)),
      new THREE.MeshBasicMaterial({
        color: 0xff3355,
        transparent: true,
        opacity: 0.0,
        wireframe: true,
        toneMapped: false
      })
    )
    bolha.material.userData.descartavel = true
    grupo.add(bolha)

    const amp = Math.min(6, (p.setor - 1) * 1.4)
    const bx = rand(-LIM_X, LIM_X)
    const by = rand(-LIM_Y, LIM_Y)
    grupo.position.set(bx, by, Z_SURGIR)
    this.cena.add(grupo)
    const a = {
      grupo,
      interno,
      rotulo,
      halo,
      bolha,
      kana,
      cor,
      base: new THREE.Vector2(bx, by),
      fase: rand(0, Math.PI * 2),
      freq: rand(0.4, 0.9),
      amp,
      vel: p.dif.aprox + (p.setor - 1) * 1.6 + rand(-2, 2),
      alvo: false,
      tBolha: 0,
      tTiro: rand(2, 5)
    }
    this.aliens.push(a)
    a.alvo = kana === this._letraAlvo()
    halo.visible = a.alvo
  }

  _criarAsteroide() {
    const grupo = this.modelos.Asteroide.clone(true)
    const esc = rand(1.4, 3.4)
    grupo.scale.setScalar(esc)
    grupo.position.set(
      rand(-LIM_X - 2, LIM_X + 2),
      rand(-LIM_Y - 1, LIM_Y + 1),
      Z_SURGIR
    )
    grupo.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6))
    this.cena.add(grupo)
    this.asteroides.push({
      grupo,
      raio: esc * 0.95,
      giro: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1))
    })
  }

  _criarPortal() {
    const grupo = this.modelos.Portal.clone(true)
    grupo.position.set(
      rand(-LIM_X + 2, LIM_X - 2),
      rand(-LIM_Y + 1.5, LIM_Y - 1.5),
      Z_SURGIR
    )
    this.cena.add(grupo)
    this.portais.push({ grupo, usado: false })
    this._radio(
      'Portal dourado à vista! Atravesse para recarregar escudo e memória.',
      false,
      'portal'
    )
  }

  _disparar() {
    const p = this.p
    const saida = this.saidas.length
      ? this.saidas[p.lado++ % this.saidas.length]
      : this.nave
    const origem = new THREE.Vector3()
    saida.getWorldPosition(origem)
    const dir = this._direcaoMira()
    const cor = new THREE.Color(COR_DO_KANA[this.municao] ?? '#66e0ff')

    const mesh = new THREE.Mesh(
      (this._geoLaser ??= new THREE.CapsuleGeometry(
        0.12,
        2.2,
        4,
        8
      ).rotateX(Math.PI / 2)),
      new THREE.MeshBasicMaterial({
        color: cor.clone().multiplyScalar(3),
        toneMapped: false
      })
    )
    mesh.position.copy(origem)
    mesh.lookAt(origem.clone().add(dir))
    this.cena.add(mesh)
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texturaKana(this.municao, {
          cor: COR_DO_KANA[this.municao],
          contraste: this.config.altoContraste
        }),
        transparent: true,
        depthWrite: false
      })
    )
    sprite.scale.set(1.3, 1.3, 1)
    sprite.position.copy(origem)
    this.cena.add(sprite)

    let alvo = null
    if (this.config.mira) alvo = this._travaMira(dir, 4.5, this.municao)
    this.lasers.push({
      mesh,
      sprite,
      vel: dir.multiplyScalar(VEL_LASER),
      kana: this.municao,
      vida: 1.5,
      alvo
    })
    p.disparos++
    this.audio.tiro(this._indiceKana(this.municao))
  }

  _direcaoMira() {
    const v = this.naveVel
    return new THREE.Vector3(v.x * 0.012, v.y * 0.012, -1).normalize()
  }

  /** Invasor mais próximo da linha de mira (opcionalmente só os do kana dado). */
  _travaMira(dir, raio, kana = null) {
    let melhor = null
    let melhorD = Infinity
    const n = this.nave.position
    for (const a of this.aliens) {
      const z = a.grupo.position.z
      if (z > -6 || z < -230) continue
      if (kana && a.kana !== kana) continue
      const t = (z - n.z) / dir.z
      const dx = a.grupo.position.x - (n.x + dir.x * t)
      const dy = a.grupo.position.y - (n.y + dir.y * t)
      const d = Math.hypot(dx, dy)
      if (d < raio && d < melhorD) {
        melhorD = d
        melhor = a
      }
    }
    return melhor
  }

  // ---------------------------------------------------------------- regras

  _acertoCorreto(a) {
    const p = this.p
    p.acertos++
    p.combo++
    p.maxCombo = Math.max(p.maxCombo, p.combo)
    p.pontos += 100 * this._mult()
    this._explodirAlien(a, true)
    this.audio.acerto(this._indiceKana(a.kana))
    this.ui('acerto', { kana: a.kana, romaji: ROMAJI[a.kana] })

    const alvo = this._letraAlvo()
    if (alvo && a.kana === alvo) {
      p.indice++
      p.pontos += 50
      this.audio.letraDaPalavra(p.indice - 1)
      if (p.indice >= p.palavra.letras.length) this._palavraCompleta()
      else this._atualizarAlvos()
    }
    if (p.combo > 0 && p.combo % 10 === 0) {
      this._fogosCombo()
      this.ui('combo', p.combo)
    }
    this._emitirHud()
  }

  _acertoErrado(a, laser) {
    const p = this.p
    p.erros++
    const tinhaCombo = p.combo >= 3
    p.combo = 0
    a.tBolha = 0.35
    this.audio.erro()
    this.particulas.emitir(laser.mesh.position, 14, {
      cores: ['#ff4466', '#ffffff'],
      vel: 14,
      vida: 0.35,
      tam: 0.6
    })
    this.ui('erro', {
      kana: a.kana,
      romaji: ROMAJI[a.kana],
      municao: laser.kana,
      perdeuCombo: tinhaCombo
    })
    this._radio(
      `Esse invasor é ${a.kana} (${ROMAJI[a.kana]}) e você disparou ${laser.kana}. Troque a munição para ${a.kana}!`,
      false,
      'primeiro-erro'
    )
    this._emitirHud()
  }

  _palavraCompleta() {
    const p = this.p
    const palavra = p.palavra
    p.aprendidas.push(palavra)
    p.palavrasNoSetor++
    const bonus = 1000 * p.setor
    p.pontos += bonus
    p.palavra = null
    this._celebrar(palavra, bonus)
    this._emitirHud()
    if (p.palavrasNoSetor >= PALAVRAS_POR_SETOR) {
      this._agendar(3.2, () => this._setorConcluido())
    } else {
      this._agendar(2.6, () => {
        if (this.estado === 'jogando') this._novaPalavra()
      })
    }
  }

  _setorConcluido() {
    if (this.estado !== 'jogando') return
    const p = this.p
    this.audio.setorConcluido()
    // Recolhe ameaças restantes
    for (const lista of [this.aliens, this.asteroides, this.orbes]) {
      for (const e of lista) this._remover(e)
      lista.length = 0
    }
    if (p.setor === SETORES_HISTORIA && !p.infinito) {
      this.estado = 'vitoria'
      this.ui('vitoria', this._estatisticas())
      return
    }
    p.setor++
    p.palavrasNoSetor = 0
    p.memoria = Math.min(100, p.memoria + 20)
    this._prepararBriefing()
  }

  _celebrar(palavra, bonus) {
    const reduzir = this.config.reduzirFlash
    const centro = new THREE.Vector3(
      this.nave.position.x * 0.5,
      this.nave.position.y * 0.5 + 1,
      -55
    )
    const arcoIris = [
      '#ff4d6d',
      '#ffb347',
      '#fff36b',
      '#5cff9d',
      '#31e3ff',
      '#8b7bff',
      '#ff6fb5',
      '#ffffff'
    ]

    // Onda de choque + núcleo
    for (const [atraso, cor, escala] of [
      [0, 0xfff1a8, 120],
      [0.12, 0x8b7bff, 95],
      [0.24, 0x31e3ff, 75]
    ]) {
      this._agendar(atraso, () => {
        const m = new THREE.Mesh(
          (this._geoOnda ??= new THREE.RingGeometry(0.93, 1, 96)),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(cor).multiplyScalar(1.8),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            fog: false
          })
        )
        m.position.copy(centro)
        this.cena.add(m)
        this.ondas.push({ mesh: m, t: 0, dur: 1.4, escala })
      })
    }
    const nucleo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texBrilho,
        color: 0xfff6d0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        fog: false
      })
    )
    nucleo.position.copy(centro)
    this.cena.add(nucleo)
    this.ondas.push({
      mesh: nucleo,
      t: 0,
      dur: 0.8,
      escala: reduzir ? 25 : 42,
      sprite: true
    })

    this.particulas.emitir(centro, reduzir ? 900 : 2200, {
      cores: arcoIris,
      vel: 75,
      vida: 2.4,
      tam: 2.2,
      arrasto: 0.955,
      gravidade: 6,
      achatarZ: 0.35
    })

    // Fogos de artifício pelo céu
    const nFogos = reduzir ? 5 : 12
    for (let i = 0; i < nFogos; i++) {
      this._agendar(0.25 + i * 0.2 + Math.random() * 0.15, () => {
        const pos = new THREE.Vector3(
          rand(-30, 30),
          rand(-8, 22),
          rand(-110, -60)
        )
        const cor = arcoIris[Math.floor(Math.random() * arcoIris.length)]
        this.particulas.emitir(pos, 160, {
          cores: [cor, cor, '#ffffff'],
          vel: 34,
          vida: 1.6,
          tam: 1.6,
          arrasto: 0.94,
          gravidade: 9
        })
      })
    }

    // A onda de choque limpa os invasores da tela
    let extras = 0
    for (const a of [...this.aliens]) {
      if (a.grupo.position.z > -230) {
        extras++
        this._explodirAlien(a, true)
      }
    }
    for (const o of this.orbes) this._remover(o)
    this.orbes.length = 0
    this.p.pontos += extras * 50

    this.escalaTempo = reduzir ? 0.7 : 0.25
    this.tremor = reduzir ? 0.15 : 1.3
    this.bloomExtra = reduzir ? 0.3 : 1.1
    this.socoFov = reduzir ? 2 : 14
    this.warpAlvo = 2.6
    this._agendar(1.6, () => (this.warpAlvo = 1))

    this.audio.comemoracao()
    const [exJp, exPt] =
      EXCLAMACOES[Math.floor(Math.random() * EXCLAMACOES.length)]
    this.ui('celebrar', {
      ...palavra,
      romaji: romajiDaPalavra(palavra.palavra),
      bonus,
      extras,
      exclamacao: exJp,
      exclamacaoPt: exPt
    })
  }

  _fogosCombo() {
    const cores = ['#fff36b', '#5cff9d', '#31e3ff', '#ff6fb5']
    for (let i = 0; i < 4; i++) {
      this._agendar(i * 0.15, () => {
        const pos = new THREE.Vector3(
          rand(-20, 20),
          rand(0, 14),
          rand(-90, -60)
        )
        this.particulas.emitir(pos, 110, {
          cores,
          vel: 26,
          vida: 1.2,
          tam: 1.3,
          gravidade: 8
        })
      })
    }
    this.audio.fogos()
  }

  _explodirAlien(a, porJogador) {
    const pos = a.grupo.position.clone()
    this.particulas.emitir(pos, 140, {
      cores: [a.cor, '#ffffff', '#fff1a8'],
      vel: 30,
      vida: 0.9,
      tam: 1.2
    })
    this.particulas.emitir(pos, 40, {
      cores: ['#ffb347', '#ff4d6d'],
      vel: 10,
      vida: 0.6,
      tam: 2.2,
      espalhar: 1.5
    })
    // O hiragana "liberado" sobe em direção à câmera: memória restaurada
    if (porJogador) {
      const s = a.rotulo
      s.getWorldPosition(s.position)
      this.cena.add(s)
      this.fantasmas.push({
        sprite: s,
        t: 0,
        ini: s.position.clone(),
        esc: s.scale.x
      })
      a.rotulo = null
    }
    this._remover(a)
    const i = this.aliens.indexOf(a)
    if (i >= 0) this.aliens.splice(i, 1)
  }

  _danificar(motivo) {
    const p = this.p
    if (p.invencivel > 0 || this.estado !== 'jogando') return
    p.escudo--
    p.invencivel = 1.4
    p.combo = 0
    this.tremor = this.config.reduzirFlash ? 0.25 : 0.9
    this.audio.dano()
    this.particulas.emitir(this.nave.position, 60, {
      cores: ['#ff4466', '#ffb347', '#ffffff'],
      vel: 18,
      vida: 0.6,
      tam: 1
    })
    this.ui('dano', { escudo: p.escudo, motivo })
    if (p.escudo === 2)
      this._radio(
        'Escudo baixo! Procure um portal dourado.',
        true,
        'escudo-baixo'
      )
    this._emitirHud()
    if (p.escudo <= 0) this._fimDeJogo('escudo')
  }

  _perderMemoria(a) {
    const p = this.p
    p.memoria = Math.max(0, p.memoria - p.dif.perdaMemoria)
    p.combo = 0
    this.audio.memoriaPerdida()
    this.ui('memoria', {
      kana: a.kana,
      romaji: ROMAJI[a.kana],
      memoria: p.memoria
    })
    if (p.memoria <= 35)
      this._radio(
        'A memória do universo está acabando! Não deixe os invasores passarem!',
        true,
        'memoria-baixa'
      )
    this._emitirHud()
    if (p.memoria <= 0) this._fimDeJogo('memoria')
  }

  _fimDeJogo(motivo) {
    if (this.estado !== 'jogando') return
    this.estado = 'fim'
    this.particulas.emitir(this.nave.position, 400, {
      cores: ['#ffffff', '#ffb347', '#ff4d6d', '#8b7bff'],
      vel: 40,
      vida: 1.6,
      tam: 1.8
    })
    this.nave.visible = false
    this.escalaTempo = this.config.reduzirFlash ? 0.8 : 0.3
    this.tremor = this.config.reduzirFlash ? 0.2 : 1.2
    this.audio.gameOver()
    this._agendar(1.4, () =>
      this.ui('fim', { ...this._estatisticas(), motivo })
    )
  }

  _estatisticas() {
    const p = this.p
    return {
      pontos: p.pontos,
      setor: p.setor,
      maxCombo: p.maxCombo,
      acertos: p.acertos,
      erros: p.erros,
      disparos: p.disparos,
      precisao: p.disparos
        ? Math.round((p.acertos / p.disparos) * 100)
        : 0,
      aprendidas: p.aprendidas.map((w) => ({
        ...w,
        romaji: romajiDaPalavra(w.palavra)
      })),
      tempo: p.tempo,
      dificuldade: p.dif.nome
    }
  }

  // ---------------------------------------------------------------- laço

  _quadro() {
    const agora = performance.now()
    const dtReal = Math.min((agora - this.ultimoQuadro) / 1000, 0.05)
    this.ultimoQuadro = agora
    this._medirFps(dtReal)
    if (this.estado === 'pausado') {
      this._renderizar()
      return
    }
    this.escalaTempo += (1 - this.escalaTempo) * Math.min(1, dtReal * 1.4)
    const dt = dtReal * this.escalaTempo
    this.tempo += dt

    for (let i = this.agenda.length - 1; i >= 0; i--) {
      if (this.agenda[i].t <= this.tempo) {
        const { fn } = this.agenda[i]
        this.agenda.splice(i, 1)
        fn()
      }
    }

    this.warp += (this.warpAlvo - this.warp) * Math.min(1, dt * 2.5)
    const velMundo =
      VEL_MUNDO * this.warp * (this.estado === 'menu' ? 0.6 : 1)
    this._atualizarAmbiente(dt, velMundo)

    if (this.estado === 'menu') this._atualizarMenu(dt)
    else if (this.estado !== 'fim' && this.estado !== 'vitoria')
      this._atualizarNave(dt)
    else for (const m of this.mira) m.visible = false

    if (this.estado === 'jogando') this._atualizarJogo(dt, velMundo)
    this._atualizarLasers(dt)
    this._atualizarEfeitos(dt, velMundo)
    this.particulas.atualizar(dt, velMundo * 0.6)
    this._atualizarCamera(dtReal)
    this._renderizar()
  }

  _renderizar() {
    if (this.config.qualidade === 'baixa') {
      this.renderer.render(this.cena, this.camera)
    } else {
      this.bloom.strength = 0.7 + this.bloomExtra
      this.composer.render()
    }
  }

  _medirFps(dt) {
    // Qualidade automática: se ficar abaixo de ~28 fps por alguns segundos, reduz
    if (this.config.qualidade !== 'auto' || this._qualidadeReduzida) return
    this.fpsAmostras.push(dt)
    if (this.fpsAmostras.length < 180) return
    const media =
      this.fpsAmostras.reduce((a, b) => a + b, 0) / this.fpsAmostras.length
    this.fpsAmostras.length = 0
    if (media > 1 / 28) {
      this._qualidadeReduzida = true
      this.config.qualidade = 'baixa'
      this._redimensionar()
      this.ui('qualidade-reduzida')
    }
  }

  _atualizarAmbiente(dt, vel) {
    this.nebulosa.material.uniforms.uTempo.value += dt
    this.nebulosa.position.copy(this.camera.position)
    this.ceu.position.set(
      this.camera.position.x * 0.9,
      this.camera.position.y * 0.9,
      0
    )
    this.planeta.rotation.y += dt * 0.01

    const pos = this.estrelas.geometry.attributes.position.array
    for (let i = 2; i < pos.length; i += 3) {
      pos[i] += vel * 0.35 * dt
      if (pos[i] > -30) pos[i] -= 630
    }
    this.estrelas.geometry.attributes.position.needsUpdate = true

    const r = this.riscos.geometry.attributes.position.array
    const comp = 1.5 + vel * 0.05 * this.warp
    for (let i = 0; i < this.riscosBase.length; i++) {
      const b = this.riscosBase[i]
      b[2] += vel * 1.4 * dt
      if (b[2] > 20) b[2] -= 520
      r[i * 6] = b[0]
      r[i * 6 + 1] = b[1]
      r[i * 6 + 2] = b[2]
      r[i * 6 + 3] = b[0]
      r[i * 6 + 4] = b[1]
      r[i * 6 + 5] = b[2] - comp
    }
    this.riscos.geometry.attributes.position.needsUpdate = true
    this.riscos.material.opacity = Math.min(
      0.8,
      0.25 + (this.warp - 1) * 0.3
    )

    this.grade.position.z = (this.grade.position.z + vel * dt) % 10
  }

  _atualizarMenu(dt) {
    const t = this.tempo
    this.nave.position.set(
      Math.sin(t * 0.5) * 2.2,
      Math.sin(t * 0.8) * 0.8 + 0.4,
      0
    )
    this.naveVel.set(
      Math.cos(t * 0.5) * 1.1 * 8,
      Math.cos(t * 0.8) * 0.64 * 8
    )
    this._orientarNave(dt)
    for (const m of this.mira) m.visible = false
  }

  _atualizarNave(dt) {
    const e = this.entrada
    const inv = this.config.inverterY ? -1 : 1
    const ax = clamp(e.x, -1, 1) * 30
    const ay = clamp(e.y * inv, -1, 1) * 22
    this.naveVel.x += (ax - this.naveVel.x) * Math.min(1, dt * 7)
    this.naveVel.y += (ay - this.naveVel.y) * Math.min(1, dt * 7)
    const n = this.nave.position
    n.x = clamp(n.x + this.naveVel.x * dt, -LIM_X, LIM_X)
    n.y = clamp(n.y + this.naveVel.y * dt, -LIM_Y, LIM_Y)
    if (Math.abs(n.x) >= LIM_X) this.naveVel.x *= 0.5
    if (Math.abs(n.y) >= LIM_Y) this.naveVel.y *= 0.5
    this._orientarNave(dt)

    // Piscar durante invencibilidade
    if (this.p?.invencivel > 0) {
      this.p.invencivel -= dt
      this.naveModelo.visible =
        Math.floor(this.p.invencivel * 14) % 2 === 0
    } else {
      this.naveModelo.visible = true
    }

    // Rastro do motor
    if (Math.random() < 0.9) {
      const atras = new THREE.Vector3(0, 0.03, 1.7)
        .applyQuaternion(this.nave.quaternion)
        .add(n)
      this.particulas.emitir(atras, 1, {
        cores: ['#4a3cc0', '#1a7fa0'],
        vel: 2,
        vida: 0.3,
        tam: 0.35
      })
    }

    // Mira (dois quadrados à frente, como nos shooters de trilho clássicos)
    const dir = this._direcaoMira()
    const trava =
      this.estado === 'jogando'
        ? this._travaMira(dir, this.config.mira ? 4.5 : 2.6)
        : null
    let cor = 0x5cffd6
    if (trava) cor = trava.kana === this.municao ? 0xffd34d : 0xff4d6d
    this.miraTrava = trava
    this.mira.forEach((m, i) => {
      m.visible = this.estado === 'jogando' || this.estado === 'briefing'
      m.position.copy(n).addScaledVector(dir, i === 0 ? 22 : 44)
      m.material.color.setHex(cor)
      m.quaternion.copy(this.camera.quaternion)
    })
  }

  _orientarNave(dt) {
    const v = this.naveVel
    const rol = this.rolagem
    if (rol.t > 0) {
      rol.t -= dt
      rol.ang += rol.dir * dt * ((Math.PI * 2) / 0.55)
      if (rol.t <= 0) rol.ang = 0
    }
    const alvo = new THREE.Euler(
      v.y * 0.022,
      -v.x * 0.012,
      -v.x * 0.03 + rol.ang,
      'YXZ'
    )
    const q = new THREE.Quaternion().setFromEuler(alvo)
    this.nave.quaternion.slerp(q, rol.t > 0 ? 1 : Math.min(1, dt * 10))
    if (this.motor) {
      const pulso =
        1 + Math.sin(this.tempo * 40) * 0.12 + (this.warp - 1) * 0.3
      this.motor.scale.set(1, pulso, 1)
      this.brilhoMotor.scale.setScalar(1.2 * pulso)
    }
  }

  rolar(direcao) {
    if (this.estado !== 'jogando' && this.estado !== 'briefing') return
    if (this.rolagem.t > 0) return
    this.rolagem.t = 0.55
    this.rolagem.dir = direcao || (this.naveVel.x >= 0 ? -1 : 1)
    this.audio.rolagem()
  }

  _atualizarJogo(dt, velMundo) {
    const p = this.p
    p.tempo += dt
    p.tRadio -= dt

    // Disparo (manual ou automático quando a mira trava num invasor compatível)
    p.cooldown -= dt
    const auto =
      this.config.autoTiro &&
      this.miraTrava &&
      this.miraTrava.kana === this.municao
    if ((this.entrada.atirar || auto) && p.cooldown <= 0) {
      this._disparar()
      p.cooldown = auto && !this.entrada.atirar ? 0.32 : 0.17
    }

    // Surgimento
    const fator = Math.pow(0.93, p.setor - 1)
    p.tAlien -= dt
    if (
      p.tAlien <= 0 &&
      this.aliens.length < p.dif.maxAliens + Math.floor(p.setor / 2) &&
      p.palavra
    ) {
      this._criarAlien()
      p.tAlien = Math.max(0.55, p.dif.intervalo * fator) * rand(0.75, 1.25)
    }
    if (p.setor >= 2) {
      p.tAsteroide -= dt
      if (p.tAsteroide <= 0) {
        this._criarAsteroide()
        p.tAsteroide = rand(2.5, 5) * fator
      }
    }
    p.tPortal -= dt
    if (p.tPortal <= 0) {
      this._criarPortal()
      p.tPortal = rand(20, 28)
    }

    const n = this.nave.position

    // Invasores
    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const a = this.aliens[i]
      const g = a.grupo
      g.position.z += a.vel * dt
      const t = this.tempo * a.freq + a.fase
      g.position.x = clamp(
        a.base.x + Math.sin(t) * a.amp,
        -LIM_X - 1,
        LIM_X + 1
      )
      g.position.y = clamp(
        a.base.y +
          Math.cos(t * 1.3) * a.amp * 0.5 +
          Math.sin(this.tempo * 2 + a.fase) * 0.3,
        -LIM_Y - 1,
        LIM_Y + 1
      )
      a.interno.rotateY(dt * 1.2)
      a.halo.material.rotation += dt * 1.5
      const pulso = 1 + Math.sin(this.tempo * 6) * 0.06
      a.halo.scale.setScalar(a.rotulo.scale.x * 1.45 * pulso)
      if (a.tBolha > 0) {
        a.tBolha -= dt
        a.bolha.material.opacity = Math.max(0, a.tBolha / 0.35) * 0.8
      }

      // Disparo inimigo
      if (
        p.setor >= p.dif.tiroSetor &&
        g.position.z > -170 &&
        g.position.z < -50
      ) {
        a.tTiro -= dt
        if (a.tTiro <= 0) {
          a.tTiro = rand(3, 6) * fator
          this._criarOrbe(g.position)
        }
      }

      // Colisão com a nave
      const dz = Math.abs(g.position.z - n.z)
      if (
        dz < 1.5 &&
        Math.abs(g.position.x - n.x) < 2.4 &&
        Math.abs(g.position.y - n.y) < 1.6
      ) {
        this._explodirAlien(a, false)
        this._danificar('colisao')
        continue
      }
      // Passou da nave: a memória do universo enfraquece
      if (g.position.z > 8) {
        const tinhaLetra = a.alvo
        this._remover(a)
        this.aliens.splice(i, 1)
        this._perderMemoria(a)
        if (tinhaLetra)
          this._radio(
            `O ${a.kana} escapou! Outro vai aparecer, não desista.`,
            false
          )
      }
    }

    // Asteroides
    for (let i = this.asteroides.length - 1; i >= 0; i--) {
      const r = this.asteroides[i]
      r.grupo.position.z += velMundo * 0.9 * dt
      r.grupo.rotation.x += r.giro.x * dt
      r.grupo.rotation.y += r.giro.y * dt
      const d = r.grupo.position.clone().sub(n)
      if (
        Math.abs(d.z) < r.raio &&
        Math.hypot(d.x / 1.6, d.y) < r.raio + 0.3
      ) {
        this.particulas.emitir(r.grupo.position, 80, {
          cores: ['#9a8a90', '#ffb347'],
          vel: 16,
          vida: 0.8,
          tam: 1.2
        })
        this._remover(r)
        this.asteroides.splice(i, 1)
        this._danificar('asteroide')
        this._radio(
          'Cuidado com os asteroides! Desvie ou destrua-os com qualquer munição.',
          false,
          'asteroide'
        )
        continue
      }
      if (r.grupo.position.z > 20) {
        this._remover(r)
        this.asteroides.splice(i, 1)
      }
    }

    // Portais
    for (let i = this.portais.length - 1; i >= 0; i--) {
      const pt = this.portais[i]
      const g = pt.grupo
      const zAntes = g.position.z
      g.position.z += velMundo * 0.8 * dt
      g.rotation.z += dt * 0.6
      if (!pt.usado && zAntes < n.z && g.position.z >= n.z) {
        if (Math.hypot(g.position.x - n.x, g.position.y - n.y) < 3.1) {
          pt.usado = true
          p.escudo = Math.min(p.escudoMax, p.escudo + 1)
          p.memoria = Math.min(100, p.memoria + 15)
          p.pontos += 250
          this.audio.portal()
          this.particulas.emitir(g.position, 200, {
            cores: ['#ffd34d', '#fff1a8', '#ffffff'],
            vel: 22,
            vida: 1,
            tam: 1.2
          })
          this.ui('portal', { escudo: p.escudo, memoria: p.memoria })
          this._emitirHud()
        }
      }
      if (g.position.z > 25) {
        this._remover(pt)
        this.portais.splice(i, 1)
      }
    }

    // Orbes inimigos
    for (let i = this.orbes.length - 1; i >= 0; i--) {
      const o = this.orbes[i]
      o.sprite.position.addScaledVector(o.vel, dt)
      o.sprite.material.rotation += dt * 4
      const d = o.sprite.position.distanceTo(n)
      if (d < 1.3) {
        if (this.rolagem.t > 0) {
          this.audio.defletir()
          this.particulas.emitir(o.sprite.position, 30, {
            cores: ['#5cffd6', '#ffffff'],
            vel: 14,
            vida: 0.4,
            tam: 0.8
          })
          this.ui('defletiu')
        } else {
          this._danificar('tiro')
        }
        this._remover(o)
        this.orbes.splice(i, 1)
        continue
      }
      if (o.sprite.position.z > 15) {
        this._remover(o)
        this.orbes.splice(i, 1)
      }
    }
  }

  _criarOrbe(origem) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texBrilho,
        color: new THREE.Color(0xff3366).multiplyScalar(2),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        toneMapped: false
      })
    )
    sprite.scale.set(1.8, 1.8, 1)
    sprite.position.copy(origem)
    this.cena.add(sprite)
    const alvo = this.nave.position.clone()
    const vel = alvo.sub(origem).normalize().multiplyScalar(58)
    this.orbes.push({ sprite, vel })
    this._radio(
      'Disparo inimigo! Faça uma rolagem (Shift ou botão ⟲) para refletir!',
      false,
      'orbe'
    )
  }

  _atualizarLasers(dt) {
    const A = new THREE.Vector3()
    const B = new THREE.Vector3()
    const AB = new THREE.Vector3()
    const AC = new THREE.Vector3()
    const segmentoAtinge = (centro, raio) => {
      AB.subVectors(B, A)
      AC.subVectors(centro, A)
      const t = clamp(AC.dot(AB) / Math.max(AB.lengthSq(), 1e-6), 0, 1)
      return (
        A.clone().addScaledVector(AB, t).distanceToSquared(centro) <
        raio * raio
      )
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i]
      l.vida -= dt
      if (l.alvo && this.aliens.includes(l.alvo)) {
        const desejada = l.alvo.grupo.position
          .clone()
          .sub(l.mesh.position)
          .normalize()
          .multiplyScalar(VEL_LASER)
        l.vel.lerp(desejada, Math.min(1, dt * 9)).setLength(VEL_LASER)
        l.mesh.lookAt(l.mesh.position.clone().add(l.vel))
      }
      A.copy(l.mesh.position)
      l.mesh.position.addScaledVector(l.vel, dt)
      B.copy(l.mesh.position)
      l.sprite.position
        .copy(l.mesh.position)
        .add(new THREE.Vector3(0, 0.6, 0))

      let consumido = false
      if (this.estado === 'jogando') {
        for (const a of this.aliens) {
          if (!segmentoAtinge(a.grupo.position, 2.1)) continue
          if (a.kana === l.kana) this._acertoCorreto(a)
          else this._acertoErrado(a, l)
          consumido = true
          break
        }
        if (!consumido) {
          for (let j = this.asteroides.length - 1; j >= 0; j--) {
            const r = this.asteroides[j]
            if (!segmentoAtinge(r.grupo.position, r.raio)) continue
            this.particulas.emitir(r.grupo.position, 90, {
              cores: ['#b8a8b0', '#ffb347', '#ffffff'],
              vel: 18,
              vida: 0.8,
              tam: 1.2
            })
            this._remover(r)
            this.asteroides.splice(j, 1)
            this.p.pontos += 25
            this.audio.acerto(0)
            this._emitirHud()
            consumido = true
            break
          }
        }
        if (!consumido) {
          for (let j = this.orbes.length - 1; j >= 0; j--) {
            const o = this.orbes[j]
            if (!segmentoAtinge(o.sprite.position, 1.2)) continue
            this.particulas.emitir(o.sprite.position, 30, {
              cores: ['#ff3366', '#ffffff'],
              vel: 12,
              vida: 0.4,
              tam: 0.8
            })
            this._remover(o)
            this.orbes.splice(j, 1)
            this.p.pontos += 10
            consumido = true
            break
          }
        }
      }
      if (consumido || l.vida <= 0 || l.mesh.position.z < -330) {
        l.mesh.material.dispose()
        this._remover(l)
        this.lasers.splice(i, 1)
      }
    }
  }

  _atualizarEfeitos(dt, velMundo) {
    for (let i = this.fantasmas.length - 1; i >= 0; i--) {
      const f = this.fantasmas[i]
      f.t += dt
      const k = f.t / 0.9
      const destino = this.camera.position
        .clone()
        .add(new THREE.Vector3(0, 3, -6))
      f.sprite.position.lerpVectors(f.ini, destino, k * k)
      f.sprite.scale.setScalar(f.esc * (1 + k * 0.6))
      f.sprite.material.opacity = 1 - k
      if (k >= 1) {
        this._remover(f)
        this.fantasmas.splice(i, 1)
      }
    }
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      const o = this.ondas[i]
      o.t += dt
      const k = o.t / o.dur
      const e = 1 - Math.pow(1 - Math.min(k, 1), 3)
      o.mesh.scale.setScalar(Math.max(0.01, e * o.escala))
      o.mesh.material.opacity = Math.max(0, 1 - k)
      o.mesh.position.z += velMundo * 0.3 * dt
      if (k >= 1) {
        o.mesh.removeFromParent()
        o.mesh.material.dispose()
        this.ondas.splice(i, 1)
      }
    }
    this.bloomExtra = Math.max(0, this.bloomExtra - dt * 1.6)
    this.socoFov = Math.max(0, this.socoFov - dt * 14)
    this.tremor = Math.max(0, this.tremor - dt * 1.4)
  }

  _atualizarCamera(dt) {
    const n = this.nave.position
    const c = this.camera
    const menu = this.estado === 'menu'
    const alvoPos = menu
      ? new THREE.Vector3(
          Math.sin(this.tempo * 0.15) * 7,
          2.6,
          9 + Math.cos(this.tempo * 0.15) * 2
        )
      : new THREE.Vector3(n.x * 0.55, n.y * 0.55 + 2.4, 10.5)
    c.position.lerp(alvoPos, Math.min(1, dt * 4))
    if (this.tremor > 0) {
      const t = this.tremor * this.tremor
      c.position.x += (Math.random() - 0.5) * t * 1.2
      c.position.y += (Math.random() - 0.5) * t * 1.2
    }
    const olhar = menu
      ? new THREE.Vector3(n.x * 0.5, 0.6, -6)
      : new THREE.Vector3(n.x * 0.75, n.y * 0.7 + 0.6, -30)
    c.lookAt(olhar)
    c.fov = this.fovBase + this.socoFov + (this.warp - 1) * 6
    c.updateProjectionMatrix()
  }

  /** Texturas dos rótulos mudam quando romaji/alto contraste são alternados. */
  atualizarRotulos() {
    for (const a of this.aliens) {
      if (!a.rotulo) continue
      a.rotulo.material.map = texturaKana(a.kana, {
        romaji: this.config.romaji,
        cor: a.cor,
        contraste: this.config.altoContraste
      })
      const e = this.config.altoContraste ? 4.4 : 3.4
      a.rotulo.scale.set(e, e, 1)
    }
  }
}
