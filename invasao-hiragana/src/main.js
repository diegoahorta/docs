// Interface, entrada (teclado, mouse, toque, gamepad), acessibilidade e cola entre jogo e áudio.

import { Audio } from './audio.js'
import { Jogo } from './game.js'
import { COR_DO_KANA, LINHAS, ROMAJI } from './kana.js'

const $ = (sel) => document.querySelector(sel)

// ------------------------------------------------------------------ configurações

const CHAVE_CONFIG = 'invasao-hiragana-3d:config'
const CHAVE_RECORDE = 'invasao-hiragana-3d:recorde'
const reduzMovimento =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const PADRAO = {
  dificuldade: 'cadete',
  volMusica: 0.6,
  volEfeitos: 0.8,
  voz: true,
  mira: true,
  autoTiro: true,
  digitacao: true,
  inverterY: false,
  romaji: true,
  altoContraste: false,
  reduzirFlash: reduzMovimento,
  qualidade: 'auto'
}

const PRESETS = {
  cadete: { mira: true, autoTiro: true, romaji: true },
  piloto: { mira: true, autoTiro: false, romaji: true },
  as: { mira: false, autoTiro: false, romaji: false }
}

function lerArmazenado(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave))
  } catch {
    return null
  }
}

function salvarArmazenado(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    /* armazenamento indisponível (modo privado etc.) — segue sem salvar */
  }
}

const config = { ...PADRAO, ...(lerArmazenado(CHAVE_CONFIG) ?? {}) }
const salvarConfig = () => salvarArmazenado(CHAVE_CONFIG, config)

// ------------------------------------------------------------------ anúncios e voz

let ultimoAnuncio = 0
function anunciar(texto, urgente = false) {
  const agora = performance.now()
  if (!urgente && agora - ultimoAnuncio < 900) return
  ultimoAnuncio = agora
  const el = urgente ? $('#anuncio-urgente') : $('#anuncio')
  el.textContent = ''
  requestAnimationFrame(() => (el.textContent = texto))
}

let vozJa = null
function carregarVozes() {
  const vozes = window.speechSynthesis?.getVoices() ?? []
  vozJa = vozes.find((v) => v.lang?.toLowerCase().startsWith('ja')) ?? null
}
if ('speechSynthesis' in window) {
  carregarVozes()
  window.speechSynthesis.addEventListener?.('voiceschanged', carregarVozes)
}

function falar(texto, interromper = false) {
  if (!config.voz || !vozJa || !('speechSynthesis' in window)) return
  try {
    if (interromper) window.speechSynthesis.cancel()
    else if (window.speechSynthesis.pending) return
    const u = new SpeechSynthesisUtterance(texto)
    u.voice = vozJa
    u.lang = vozJa.lang
    u.rate = 0.95
    u.volume = Math.min(1, config.volEfeitos + 0.2)
    window.speechSynthesis.speak(u)
  } catch {
    /* sem síntese de voz */
  }
}

// ------------------------------------------------------------------ avisos, flash, confete

function aviso(texto, tipo = 'bom') {
  const box = $('#avisos')
  const el = document.createElement('div')
  el.className = `aviso ${tipo}`
  el.textContent = texto
  box.appendChild(el)
  while (box.children.length > 3) box.firstChild.remove()
  setTimeout(() => el.remove(), 1700)
}

function flash(forte) {
  const el = $('#flash')
  if (config.reduzirFlash) {
    el.animate([{ opacity: 0.22 }, { opacity: 0 }], {
      duration: 900,
      easing: 'ease-out'
    })
    return
  }
  // No máximo 2 flashes por segundo (diretrizes de fotossensibilidade)
  el.animate(
    forte
      ? [
          { opacity: 0.85, offset: 0 },
          { opacity: 0, offset: 0.28 },
          { opacity: 0.5, offset: 0.55 },
          { opacity: 0, offset: 0.85 }
        ]
      : [{ opacity: 0.5 }, { opacity: 0 }],
    { duration: forte ? 1300 : 500, easing: 'ease-out' }
  )
}

const confete = {
  canvas: $('#confete'),
  pecas: [],
  ativo: false,
  disparar(qtd) {
    const c = this.canvas
    c.width = innerWidth * Math.min(devicePixelRatio || 1, 2)
    c.height = innerHeight * Math.min(devicePixelRatio || 1, 2)
    const cores = [
      '#ff4d6d',
      '#ffb347',
      '#fff36b',
      '#5cff9d',
      '#31e3ff',
      '#8b7bff',
      '#ff6fb5',
      '#ffffff'
    ]
    const kanas = Object.keys(ROMAJI)
    for (let i = 0; i < qtd; i++) {
      const lado = Math.random() < 0.5
      this.pecas.push({
        x: lado ? 0 : c.width,
        y: c.height * (0.55 + Math.random() * 0.4),
        vx: (lado ? 1 : -1) * (6 + Math.random() * 16) * (c.width / 1400),
        vy: -(14 + Math.random() * 20) * (c.height / 900),
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        tam: (6 + Math.random() * 10) * (c.width / 1400 + 0.4),
        cor: cores[Math.floor(Math.random() * cores.length)],
        kana:
          Math.random() < 0.12
            ? kanas[Math.floor(Math.random() * kanas.length)]
            : null,
        vida: 1
      })
    }
    if (!this.ativo) {
      this.ativo = true
      requestAnimationFrame(() => this.quadro())
    }
  },
  quadro() {
    const c = this.canvas
    const g = c.getContext('2d')
    g.clearRect(0, 0, c.width, c.height)
    const grav = 0.45 * (c.height / 900)
    for (const p of this.pecas) {
      p.vy += grav
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.vida -= 0.004
      g.save()
      g.globalAlpha = Math.max(0, Math.min(1, p.vida * 2))
      g.translate(p.x, p.y)
      g.rotate(p.rot)
      g.fillStyle = p.cor
      if (p.kana) {
        g.font = `700 ${p.tam * 2.6}px "Noto Sans JP", sans-serif`
        g.fillText(p.kana, 0, 0)
      } else {
        g.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2)
      }
      g.restore()
    }
    this.pecas = this.pecas.filter(
      (p) => p.vida > 0 && p.y < c.height + 60
    )
    if (this.pecas.length) requestAnimationFrame(() => this.quadro())
    else {
      this.ativo = false
      g.clearRect(0, 0, c.width, c.height)
    }
  }
}

// ------------------------------------------------------------------ HUD

const hudCache = {}
function definirTexto(id, texto) {
  if (hudCache[id] === texto) return
  hudCache[id] = texto
  $(id).textContent = texto
}

function atualizarHud(h) {
  definirTexto('#hud-pontos', h.pontos.toLocaleString('pt-BR'))
  definirTexto(
    '#hud-setor',
    h.infinito ? `Setor ∞ ${h.setor}` : `Setor ${h.setor}/5`
  )
  const combo = $('#hud-combo')
  combo.hidden = h.combo < 2
  if (hudCache.combo !== h.combo) {
    combo.textContent = `Combo ${h.combo} · ×${h.mult}`
    if (h.combo > (hudCache.combo ?? 0)) {
      combo.classList.remove('pulsar')
      void combo.offsetWidth
      combo.classList.add('pulsar')
    }
    hudCache.combo = h.combo
  }

  const chaveEscudo = `${h.escudo}/${h.escudoMax}`
  if (hudCache.escudo !== chaveEscudo) {
    hudCache.escudo = chaveEscudo
    const el = $('#hud-escudo')
    el.innerHTML = ''
    for (let i = 0; i < h.escudoMax; i++) {
      const pip = document.createElement('i')
      if (i >= h.escudo) pip.className = 'vazio'
      el.appendChild(pip)
    }
    el.setAttribute('aria-valuenow', h.escudo)
    el.setAttribute('aria-valuemax', h.escudoMax)
    el.setAttribute('aria-valuetext', `${h.escudo} de ${h.escudoMax}`)
  }
  if (hudCache.memoria !== h.memoria) {
    hudCache.memoria = h.memoria
    const barra = $('#hud-memoria')
    barra.style.width = `${h.memoria}%`
    barra.classList.toggle('baixa', h.memoria <= 35)
    $('#hud-memoria-meter').setAttribute(
      'aria-valuenow',
      Math.round(h.memoria)
    )
  }

  // Palavra da missão
  const chavePalavra = `${h.palavra?.palavra ?? ''}|${h.indice}|${config.romaji}`
  if (hudCache.palavra !== chavePalavra) {
    hudCache.palavra = chavePalavra
    const caixa = $('#hud-palavra')
    caixa.innerHTML = ''
    if (h.palavra) {
      h.palavra.letras.forEach((k, i) => {
        const d = document.createElement('div')
        d.className =
          'letra' +
          (i < h.indice ? ' feita' : i === h.indice ? ' proxima' : '')
        d.lang = 'ja'
        d.textContent = k
        if (config.romaji || i < h.indice) {
          const s = document.createElement('small')
          s.textContent = ROMAJI[k]
          d.appendChild(s)
        }
        caixa.appendChild(d)
      })
      $('#hud-significado').textContent = `“${h.palavra.significado}”`
      caixa.setAttribute(
        'aria-label',
        `Palavra ${h.palavra.palavra}, ${h.indice} de ${h.palavra.letras.length} letras`
      )
    } else {
      $('#hud-significado').textContent =
        h.palavrasNoSetor > 0
          ? 'Memória restaurada!'
          : 'Prepare-se para decolar…'
    }
    marcarAlvoNaMunicao(
      h.palavra && h.indice < h.palavra.letras.length
        ? h.palavra.letras[h.indice]
        : null
    )
  }
  const chaveProg = `${h.palavrasNoSetor}/${h.palavrasPorSetor}`
  if (hudCache.prog !== chaveProg) {
    hudCache.prog = chaveProg
    const prog = $('#hud-progresso-setor')
    prog.innerHTML = ''
    for (let i = 0; i < h.palavrasPorSetor; i++) {
      const b = document.createElement('i')
      if (i < h.palavrasNoSetor) b.className = 'ok'
      prog.appendChild(b)
    }
  }
}

let alvoMunicao = null
function marcarAlvoNaMunicao(kana) {
  alvoMunicao = kana
  for (const b of $('#municao-lista').children)
    b.classList.toggle('alvo', b.dataset.kana === kana)
}

let listaMunicaoAtual = ''
function atualizarMunicao({ lista, atual }) {
  const chave = lista.join('') + config.romaji
  const box = $('#municao-lista')
  if (chave !== listaMunicaoAtual) {
    listaMunicaoAtual = chave
    box.innerHTML = ''
    lista.forEach((k, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.dataset.kana = k
      b.lang = 'ja'
      b.setAttribute('role', 'radio')
      b.setAttribute(
        'aria-label',
        `${k} ${ROMAJI[k]}${i < 10 ? `, tecla ${(i + 1) % 10}` : ''}`
      )
      b.style.setProperty('--cor', COR_DO_KANA[k])
      b.textContent = k
      const s = document.createElement('small')
      s.textContent = ROMAJI[k]
      b.appendChild(s)
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        jogo?.selecionarMunicao(k)
      })
      b.addEventListener('click', () => jogo?.selecionarMunicao(k))
      box.appendChild(b)
    })
    marcarAlvoNaMunicao(alvoMunicao)
  }
  for (const b of box.children) {
    b.setAttribute('aria-checked', String(b.dataset.kana === atual))
    b.tabIndex = b.dataset.kana === atual ? 0 : -1
  }
  const kanaEl = $('#municao-kana')
  kanaEl.textContent = atual
  kanaEl.parentElement.style.setProperty(
    '--cor-municao',
    COR_DO_KANA[atual]
  )
  $('#municao-romaji').textContent = ROMAJI[atual]
}

let timerRadio = 0
let timerDigitar = 0
function mostrarRadio(texto) {
  const box = $('#radio')
  const p = $('#radio-texto')
  box.hidden = false
  box.style.animation = 'none'
  void box.offsetWidth
  box.style.animation = ''
  clearTimeout(timerRadio)
  clearInterval(timerDigitar)
  if (config.reduzirFlash) {
    p.textContent = texto
  } else {
    let i = 0
    p.textContent = ''
    timerDigitar = setInterval(() => {
      i += 2
      p.textContent = texto.slice(0, i)
      if (i >= texto.length) clearInterval(timerDigitar)
    }, 18)
  }
  anunciar(`Comandante Hoshi: ${texto}`)
  timerRadio = setTimeout(
    () => (box.hidden = true),
    4500 + texto.length * 45
  )
}

// ------------------------------------------------------------------ telas

const telas = [
  '#tela-inicio',
  '#tela-briefing',
  '#tela-pausa',
  '#tela-fim'
]
function mostrarTela(id) {
  for (const t of telas) $(t).hidden = t !== id
  if (id) {
    const foco = $(id).querySelector('.btn-primario:not([hidden])')
    setTimeout(() => foco?.focus({ preventScroll: true }), 60)
  }
  atualizarToque()
}

function chipsHtml(alvo, lista) {
  alvo.innerHTML = ''
  lista.forEach((k, i) => {
    const d = document.createElement('div')
    d.className = 'chip'
    d.style.setProperty('--cor', COR_DO_KANA[k])
    d.style.animationDelay = `${i * 0.06}s`
    const b = document.createElement('b')
    b.textContent = k
    const s = document.createElement('span')
    s.textContent = ROMAJI[k]
    s.lang = 'pt-BR'
    d.append(b, s)
    alvo.appendChild(d)
  })
}

function mostrarRecorde() {
  const r = lerArmazenado(CHAVE_RECORDE)
  $('#recorde').textContent = r
    ? `🏆 Recorde: ${r.pontos.toLocaleString('pt-BR')} pontos (setor ${r.setor})`
    : ''
}

function mostrarFim(dados, vitoria) {
  const recordeAnterior = lerArmazenado(CHAVE_RECORDE)
  const novoRecorde =
    !recordeAnterior || dados.pontos > recordeAnterior.pontos
  if (novoRecorde && dados.pontos > 0)
    salvarArmazenado(CHAVE_RECORDE, {
      pontos: dados.pontos,
      setor: dados.setor
    })

  $('#fim-sobre').textContent = vitoria
    ? 'Missão cumprida'
    : 'Fim da missão'
  $('#fim-titulo').textContent = vitoria
    ? 'Universo salvo do esquecimento!'
    : dados.motivo === 'memoria'
      ? 'O universo esqueceu…'
      : 'Nave abatida!'
  $('#fim-texto').textContent = vitoria
    ? 'Você restaurou todas as linhas de hiragana, de あ a の. O cosmos lembra de novo!'
    : dados.motivo === 'memoria'
      ? 'Invasores demais escaparam e a memória do universo se apagou. Tente de novo, piloto!'
      : 'Seu escudo acabou. Use rolagens e portais dourados para sobreviver mais tempo.'
  if (novoRecorde && dados.pontos > 0)
    $('#fim-texto').textContent += ' 🏆 Novo recorde!'

  const est = $('#fim-estatisticas')
  est.innerHTML = ''
  const min = Math.floor(dados.tempo / 60)
  const seg = String(Math.floor(dados.tempo % 60)).padStart(2, '0')
  for (const [rot, val] of [
    ['Pontos', dados.pontos.toLocaleString('pt-BR')],
    ['Setor', dados.setor],
    ['Acertos', dados.acertos],
    ['Precisão', `${dados.precisao}%`],
    ['Maior combo', dados.maxCombo],
    ['Tempo', `${min}:${seg}`]
  ]) {
    const d = document.createElement('div')
    const dt = document.createElement('dt')
    const dd = document.createElement('dd')
    dt.textContent = rot
    dd.textContent = val
    d.append(dt, dd)
    est.appendChild(d)
  }
  const lista = $('#fim-palavras')
  lista.innerHTML = ''
  if (!dados.aprendidas.length) {
    const li = document.createElement('li')
    li.textContent = 'Nenhuma ainda — na próxima você consegue!'
    lista.appendChild(li)
  }
  for (const w of dados.aprendidas) {
    const li = document.createElement('li')
    const b = document.createElement('b')
    b.lang = 'ja'
    b.textContent = w.palavra
    li.append(b, `${w.romaji} — ${w.significado}`)
    lista.appendChild(li)
  }
  $('#btn-continuar-infinito').hidden = !vitoria
  $('#btn-de-novo').className = vitoria ? 'btn-secundario' : 'btn-primario'
  $('#hud').hidden = true
  mostrarTela('#tela-fim')
  anunciar(`${$('#fim-titulo').textContent} ${dados.pontos} pontos.`, true)
}

// ------------------------------------------------------------------ eventos do jogo

function aoEventoDoJogo(tipo, d) {
  switch (tipo) {
    case 'hud':
      atualizarHud(d)
      break
    case 'municao':
      atualizarMunicao(d)
      break
    case 'palavra':
      anunciar(
        `Nova missão: ${d.palavra}, ${d.romaji}, significa ${d.significado}. Primeira letra: ${d.letras[0]} ${ROMAJI[d.letras[0]]}.`
      )
      break
    case 'acerto':
      aviso(`${d.kana} ${d.romaji} ✓`, 'bom')
      falar(d.kana)
      anunciar(`Acertou ${d.romaji}`)
      break
    case 'erro':
      aviso(`✗ Esse é ${d.kana} (${d.romaji})`, 'ruim')
      anunciar(`Munição errada. Esse invasor é ${d.romaji}.`)
      break
    case 'memoria':
      aviso(`${d.kana} escapou! Memória ${Math.round(d.memoria)}%`, 'ruim')
      anunciar(
        `${d.romaji} escapou. Memória do universo em ${Math.round(d.memoria)} por cento.`
      )
      break
    case 'dano': {
      const v = $('#vinheta-dano')
      v.animate(
        [{ opacity: config.reduzirFlash ? 0.4 : 1 }, { opacity: 0 }],
        { duration: 700, easing: 'ease-out' }
      )
      if (!config.reduzirFlash) {
        document.body.classList.remove('tremer')
        void document.body.offsetWidth
        document.body.classList.add('tremer')
      }
      aviso('Escudo −1', 'ruim')
      anunciar(`Dano! Escudo ${d.escudo}.`, true)
      navigator.vibrate?.(120)
      break
    }
    case 'portal':
      aviso('Portal! +Escudo +Memória', 'ouro')
      anunciar('Portal atravessado. Escudo e memória recuperados.')
      break
    case 'combo':
      aviso(`Combo ${d}! 🔥`, 'ouro')
      break
    case 'defletiu':
      aviso('Refletido! ✦', 'bom')
      break
    case 'radio':
      mostrarRadio(d)
      break
    case 'briefing':
      abrirBriefing(d)
      break
    case 'celebrar':
      celebrar(d)
      break
    case 'vitoria':
      mostrarFim(d, true)
      break
    case 'fim':
      mostrarFim(d, false)
      break
    case 'qualidade-reduzida':
      aviso('Qualidade gráfica ajustada para manter a fluidez', 'ouro')
      break
  }
}

function abrirBriefing(d) {
  $('#hud').hidden = false
  $('#briefing-setor').textContent = d.infinito
    ? `Setor ∞ ${d.setor}`
    : `Setor ${d.setor} de 5`
  $('#briefing-titulo').textContent = d.nome
  $('#briefing-titulo').style.color = d.cor
  if (d.novos.length) {
    $('#briefing-texto').textContent =
      d.setor === 1
        ? 'Seus primeiros hiragana. Memorize o som de cada um:'
        : 'Novos hiragana detectados neste setor:'
    chipsHtml(
      $('#briefing-chips'),
      d.novos.map(([k]) => k)
    )
  } else {
    $('#briefing-texto').textContent =
      'Todos os hiragana estão de volta — e os invasores estão mais rápidos!'
    chipsHtml($('#briefing-chips'), d.todos)
  }
  $('#briefing-dica').textContent =
    `Restaure ${d.palavrasPorSetor} palavras para limpar o setor.${
      config.digitacao
        ? ' Dica: digite o romaji (ex.: k + a) para trocar a munição.'
        : ''
    }`
  mostrarTela('#tela-briefing')
  anunciar(
    `${$('#briefing-setor').textContent}: ${d.nome}. ${$('#briefing-texto').textContent} ${d.novos
      .map(([, r]) => r)
      .join(', ')}`,
    true
  )
}

function celebrar(d) {
  const el = $('#celebracao')
  $('#cel-exclamacao').textContent = d.exclamacao
  $('#cel-palavra').textContent = d.palavra
  $('#cel-romaji').textContent = d.romaji
  $('#cel-significado').textContent = `= ${d.significado}`
  $('#cel-bonus').textContent =
    `+${d.bonus.toLocaleString('pt-BR')}${d.extras ? ` · ${d.extras} invasores pulverizados` : ''}`
  el.hidden = false
  el.classList.remove('ativo')
  void el.offsetWidth
  el.classList.add('ativo')
  clearTimeout(el._timer)
  el._timer = setTimeout(() => {
    el.hidden = true
    el.classList.remove('ativo')
  }, 2900)
  flash(true)
  confete.disparar(config.reduzirFlash ? 70 : 260)
  if (!config.reduzirFlash) setTimeout(() => confete.disparar(140), 700)
  if (!config.reduzirFlash) {
    document.body.classList.remove('tremer')
    void document.body.offsetWidth
    document.body.classList.add('tremer')
  }
  navigator.vibrate?.([80, 40, 80, 40, 200])
  falar(`${d.palavra}`, true)
  anunciar(
    `Sequência perfeita! ${d.palavra}, ${d.romaji}, significa ${d.significado}. Mais ${d.bonus} pontos.`,
    true
  )
}

// ------------------------------------------------------------------ entrada

const teclas = new Set()
const toqueVetor = { x: 0, y: 0 }
let toqueFogo = false
let mouseFogo = false
let bufferRomaji = ''
let timerBuffer = 0
let gamepadAnterior = []

const emJogo = () =>
  jogo && (jogo.estado === 'jogando' || jogo.estado === 'briefing')
const dialogoAberto = () => document.querySelector('dialog[open]')

function digitar(letra) {
  bufferRomaji += letra
  const lista = jogo.municaoLista ?? []
  const exato = lista.find((k) => ROMAJI[k] === bufferRomaji)
  const prefixo = lista.some(
    (k) => ROMAJI[k].startsWith(bufferRomaji) && ROMAJI[k] !== bufferRomaji
  )
  if (exato) {
    jogo.selecionarMunicao(exato)
    bufferRomaji = ''
  } else if (!prefixo) {
    bufferRomaji = letra
    const so = lista.find((k) => ROMAJI[k] === letra)
    if (so) {
      jogo.selecionarMunicao(so)
      bufferRomaji = ''
    } else if (!lista.some((k) => ROMAJI[k].startsWith(letra)))
      bufferRomaji = ''
  }
  const ind = $('#digitacao')
  ind.hidden = !bufferRomaji
  ind.textContent = bufferRomaji ? `${bufferRomaji}_` : ''
  clearTimeout(timerBuffer)
  timerBuffer = setTimeout(() => {
    bufferRomaji = ''
    ind.hidden = true
  }, 1200)
}

function alternarPausa() {
  if (!jogo) return
  if (jogo.estado === 'jogando') {
    jogo.pausar()
    mostrarTela('#tela-pausa')
  } else if (jogo.estado === 'pausado' && !dialogoAberto()) {
    retomar()
  }
}

function retomar() {
  mostrarTela(
    jogo.estadoAntesPausa === 'briefing' ? '#tela-briefing' : null
  )
  jogo.retomar()
}

window.addEventListener('keydown', (e) => {
  if (dialogoAberto()) return
  const k = e.key
  const code = e.code
  // Telas de menu: deixa a navegação nativa (Tab/Enter/Espaço nos botões)
  if (
    jogo?.estado === 'briefing' &&
    !$('#tela-briefing').hidden &&
    (k === 'Enter' || k === ' ')
  ) {
    e.preventDefault()
    decolar()
    return
  }
  if (!jogo || (jogo.estado !== 'jogando' && jogo.estado !== 'pausado'))
    return

  const teclaPausa = k === 'Escape' || (k === 'p' && !config.digitacao)
  // Enter só pausa durante o voo; na tela de pausa ele aciona o botão focado
  if (teclaPausa || (k === 'Enter' && jogo.estado === 'jogando')) {
    e.preventDefault()
    alternarPausa()
    return
  }
  if (jogo.estado !== 'jogando') return

  if (k === ' ') {
    e.preventDefault()
    teclas.add('fogo')
    return
  }
  if (k.startsWith('Arrow')) {
    e.preventDefault()
    teclas.add(k)
    return
  }
  if (code === 'ShiftLeft' || code === 'ShiftRight') {
    if (!e.repeat) jogo.rolar(code === 'ShiftLeft' ? 1 : -1)
    return
  }
  if (k === 'Tab') {
    e.preventDefault()
    jogo.ciclarMunicao(e.shiftKey ? -1 : 1)
    return
  }
  if (/^[0-9]$/.test(k)) {
    const i = k === '0' ? 9 : Number(k) - 1
    const l = jogo.municaoLista
    if (l[i]) jogo.selecionarMunicao(l[i])
    return
  }
  const letra = k.length === 1 ? k.toLowerCase() : ''
  if (letra === 'z' || letra === 'x') {
    jogo.ciclarMunicao(letra === 'z' ? -1 : 1)
    return
  }
  if (!config.digitacao) {
    const mapa = {
      w: 'ArrowUp',
      a: 'ArrowLeft',
      s: 'ArrowDown',
      d: 'ArrowRight'
    }
    if (mapa[letra]) {
      teclas.add(mapa[letra])
      return
    }
    if (letra === 'q' || letra === 'e') {
      if (!e.repeat) jogo.rolar(letra === 'q' ? 1 : -1)
      return
    }
  } else if (
    /^[a-z]$/.test(letra) &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey
  ) {
    digitar(letra)
  }
})

window.addEventListener('keyup', (e) => {
  const k = e.key
  if (k === ' ') teclas.delete('fogo')
  if (k.startsWith('Arrow')) teclas.delete(k)
  const mapa = {
    w: 'ArrowUp',
    a: 'ArrowLeft',
    s: 'ArrowDown',
    d: 'ArrowRight'
  }
  const m = mapa[k.toLowerCase?.()]
  if (m) teclas.delete(m)
})

window.addEventListener('blur', () => {
  teclas.clear()
  mouseFogo = false
  if (jogo?.estado === 'jogando') alternarPausa()
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (jogo?.estado === 'jogando') alternarPausa()
    audio.suspender(true)
  } else {
    audio.suspender(false)
  }
})

const canvas = $('#cena')
canvas.addEventListener('pointerdown', (e) => {
  if (
    e.pointerType === 'mouse' &&
    e.button === 0 &&
    jogo?.estado === 'jogando'
  )
    mouseFogo = true
})
window.addEventListener('pointerup', () => (mouseFogo = false))
canvas.addEventListener(
  'wheel',
  (e) => {
    if (jogo?.estado !== 'jogando') return
    e.preventDefault()
    jogo.ciclarMunicao(e.deltaY > 0 ? 1 : -1)
  },
  { passive: false }
)

// Toque
let usandoToque = window.matchMedia?.('(pointer: coarse)').matches ?? false
function atualizarToque() {
  const mostrar =
    usandoToque &&
    jogo &&
    (jogo.estado === 'jogando' || jogo.estado === 'briefing') &&
    $('#tela-briefing').hidden
  $('#toque').hidden = !mostrar
  document.body.classList.toggle('toque', usandoToque)
}
window.addEventListener(
  'touchstart',
  () => {
    if (!usandoToque) {
      usandoToque = true
      atualizarToque()
    }
  },
  { passive: true }
)

;(function configurarJoystick() {
  const base = $('#joystick')
  const pino = $('#joystick-pino')
  let id = null
  const mover = (e) => {
    const r = base.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    let dx = e.clientX - cx
    let dy = e.clientY - cy
    const max = r.width * 0.38
    const d = Math.hypot(dx, dy)
    if (d > max) {
      dx = (dx / d) * max
      dy = (dy / d) * max
    }
    pino.style.transform = `translate(${dx}px, ${dy}px)`
    toqueVetor.x = dx / max
    toqueVetor.y = -dy / max
  }
  base.addEventListener('pointerdown', (e) => {
    id = e.pointerId
    base.setPointerCapture(id)
    mover(e)
  })
  base.addEventListener(
    'pointermove',
    (e) => e.pointerId === id && mover(e)
  )
  const soltar = (e) => {
    if (e.pointerId !== id) return
    id = null
    toqueVetor.x = toqueVetor.y = 0
    pino.style.transform = ''
  }
  base.addEventListener('pointerup', soltar)
  base.addEventListener('pointercancel', soltar)

  const fogo = $('#btn-fogo')
  fogo.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    toqueFogo = true
    fogo.classList.add('ativo')
    fogo.setPointerCapture(e.pointerId)
  })
  const pararFogo = () => {
    toqueFogo = false
    fogo.classList.remove('ativo')
  }
  fogo.addEventListener('pointerup', pararFogo)
  fogo.addEventListener('pointercancel', pararFogo)
  $('#btn-rolar').addEventListener('pointerdown', (e) => {
    e.preventDefault()
    jogo?.rolar(0)
  })
})()

function lerGamepad() {
  const pads = navigator.getGamepads?.() ?? []
  const gp = [...pads].find(Boolean)
  if (!gp) return null
  const b = gp.buttons.map((x) => x.pressed)
  const novo = (i) => b[i] && !gamepadAnterior[i]
  const morto = (v) => (Math.abs(v) < 0.18 ? 0 : v)
  const res = {
    x: morto(gp.axes[0] ?? 0) + (b[15] ? 1 : 0) - (b[14] ? 1 : 0),
    y: -morto(gp.axes[1] ?? 0),
    fogo: b[0] || b[7]
  }
  if (jogo) {
    if (novo(9)) {
      if (jogo.estado === 'briefing' && !$('#tela-briefing').hidden)
        decolar()
      else alternarPausa()
    }
    if (
      jogo.estado === 'briefing' &&
      !$('#tela-briefing').hidden &&
      novo(0)
    )
      decolar()
    if (jogo.estado === 'jogando') {
      if (novo(4) || novo(12)) jogo.ciclarMunicao(-1)
      if (novo(5) || novo(13)) jogo.ciclarMunicao(1)
      if (novo(1)) jogo.rolar(-1)
      if (novo(2)) jogo.rolar(1)
    }
  }
  gamepadAnterior = b
  return res
}

function laçoEntrada() {
  if (jogo) {
    const gp = lerGamepad()
    let x =
      (teclas.has('ArrowRight') ? 1 : 0) -
      (teclas.has('ArrowLeft') ? 1 : 0) +
      toqueVetor.x
    let y =
      (teclas.has('ArrowUp') ? 1 : 0) -
      (teclas.has('ArrowDown') ? 1 : 0) +
      toqueVetor.y
    if (gp) {
      x += gp.x
      y += gp.y
    }
    jogo.entrada.x = Math.max(-1, Math.min(1, x))
    jogo.entrada.y = Math.max(-1, Math.min(1, y))
    jogo.entrada.atirar =
      teclas.has('fogo') || toqueFogo || mouseFogo || !!gp?.fogo
  }
  requestAnimationFrame(laçoEntrada)
}

// ------------------------------------------------------------------ fluxo

const audio = new Audio()
audio.setVolumes(config.volMusica, config.volEfeitos)
let jogo = null

function iniciarAudio() {
  if (audio.iniciar()) {
    audio.setVolumes(config.volMusica, config.volEfeitos)
    audio.tocarMusica()
  }
}
window.addEventListener('pointerdown', iniciarAudio, { once: true })
window.addEventListener('keydown', iniciarAudio, { once: true })

function iniciarPartida() {
  iniciarAudio()
  audio.clique()
  audio.intensidade = 1
  Object.assign(config, {
    dificuldade:
      document.querySelector('input[name=dificuldade]:checked')?.value ??
      config.dificuldade
  })
  salvarConfig()
  for (const k of Object.keys(hudCache)) delete hudCache[k]
  listaMunicaoAtual = ''
  $('#hud').hidden = false
  jogo.novaPartida()
}

function decolar() {
  audio.clique()
  mostrarTela(null)
  jogo.comecarSetor()
  atualizarToque()
}

function voltarMenu() {
  jogo.irParaMenu()
  audio.intensidade = 0
  $('#hud').hidden = true
  $('#radio').hidden = true
  mostrarRecorde()
  mostrarTela('#tela-inicio')
}

$('#btn-iniciar').addEventListener('click', iniciarPartida)
$('#btn-decolar').addEventListener('click', decolar)
$('#btn-continuar').addEventListener('click', retomar)
$('#btn-pausa').addEventListener('click', alternarPausa)
$('#btn-sair').addEventListener('click', voltarMenu)
$('#btn-menu').addEventListener('click', voltarMenu)
$('#btn-de-novo').addEventListener('click', () => {
  mostrarTela(null)
  iniciarPartida()
})
$('#btn-continuar-infinito').addEventListener('click', () => {
  $('#hud').hidden = false
  jogo.continuarInfinito()
})

// Dificuldade
for (const r of document.querySelectorAll('input[name=dificuldade]')) {
  r.checked = r.value === config.dificuldade
  r.addEventListener('change', () => {
    config.dificuldade = r.value
    Object.assign(config, PRESETS[r.value])
    salvarConfig()
    audio.clique()
  })
}

// Configurações
const dlgConfig = $('#dlg-config')
const formConfig = dlgConfig.querySelector('form')
function abrirConfig() {
  for (const el of formConfig.elements) {
    if (!el.name || !(el.name in config)) continue
    if (el.type === 'checkbox') el.checked = !!config[el.name]
    else el.value = config[el.name]
  }
  const voz = formConfig.elements.voz
  voz.disabled = !vozJa
  voz.parentElement.title = vozJa
    ? ''
    : 'Nenhuma voz em japonês instalada neste dispositivo'
  dlgConfig.showModal()
}
formConfig.addEventListener('input', (e) => {
  const el = e.target
  if (!el.name) return
  config[el.name] =
    el.type === 'checkbox'
      ? el.checked
      : el.type === 'range'
        ? Number(el.value)
        : el.value
  aplicarConfig(el.name)
  salvarConfig()
})
function aplicarConfig(nome) {
  document.body.classList.toggle('alto-contraste', config.altoContraste)
  document.body.classList.toggle('calmo', config.reduzirFlash)
  if (!nome || nome.startsWith('vol'))
    audio.setVolumes(config.volMusica, config.volEfeitos)
  if (!jogo) return
  if (nome === 'romaji' || nome === 'altoContraste') {
    jogo.atualizarRotulos()
    listaMunicaoAtual = ''
    delete hudCache.palavra
    jogo._emitirMunicao()
    jogo._emitirHud()
  }
  if (nome === 'qualidade') jogo.aplicarQualidade()
}
$('#btn-config').addEventListener('click', abrirConfig)
$('#btn-pausa-config').addEventListener('click', abrirConfig)

const dlgAjuda = $('#dlg-ajuda')
$('#btn-ajuda').addEventListener('click', () => dlgAjuda.showModal())
$('#btn-pausa-ajuda').addEventListener('click', () => dlgAjuda.showModal())
$('#btn-fechar-ajuda').addEventListener('click', () => dlgAjuda.close())

// ------------------------------------------------------------------ inicialização

function suportaWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    )
  } catch {
    return false
  }
}

async function esperarFontes() {
  if (!document.fonts?.load) return
  const tempoLimite = new Promise((r) => setTimeout(r, 2500))
  await Promise.race([
    Promise.all([
      document.fonts.load('700 64px "Noto Sans JP"', 'あかさたな'),
      document.fonts.load('700 32px "Exo 2"', 'a')
    ]).catch(() => {}),
    tempoLimite
  ])
}

async function principal() {
  aplicarConfig()
  chipsHtml(
    $('#chips-inicio'),
    LINHAS.slice(0, 2).flatMap((l) => l.kana.map(([k]) => k))
  )
  mostrarRecorde()

  if (!suportaWebGL()) {
    $('#tela-inicio').hidden = true
    $('#erro').hidden = false
    return
  }
  await esperarFontes()
  try {
    jogo = new Jogo(canvas, aoEventoDoJogo, audio, config)
    await jogo.iniciar()
  } catch (erro) {
    console.error(erro)
    $('#tela-inicio').hidden = true
    $('#erro').hidden = false
    $('#erro-texto').textContent =
      `Erro ao iniciar o 3D: ${erro?.message ?? erro}`
    return
  }
  const btn = $('#btn-iniciar')
  btn.disabled = false
  btn.textContent = 'Iniciar missão'
  btn.focus({ preventScroll: true })
  requestAnimationFrame(laçoEntrada)
  window.__jogo = jogo // útil para depuração e testes automatizados
}

principal()
