// Desenhos SVG reutilizados pelos puzzles: mapa da cidade, cenas de
// “encontrar o objeto”, grade de rotas e bússola clicável.
import { BUILDINGS, AREAS, CITY_W, CITY_H } from '../../maps/cityMap.js'
import { FIND_SCENES } from '../../data/puzzles.js'
import { ABS, VEC } from '../../systems/DirectionSystem.js'
import { plain, reading } from '../ruby.js'
import { state } from '../../systems/GameState.js'

const K = 10 // px por tile no mapa SVG

const BCOLOR = {
  school: '#3fa68f',
  hospital: '#8ec9ee',
  restaurant: '#e07a5f',
  bank: '#5b6bb5',
  station: '#b5524f',
  post: '#e05a55',
  konbini: '#7bd389',
  house: '#e9a36a',
  library: '#6aa35a'
}

function label(x, y, markup, size = 18) {
  const furi = state.settings.furigana && plain(markup) !== reading(markup)
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="#1b1530" font-family="DotGothic16, sans-serif" paint-order="stroke" stroke="#fff" stroke-width="4">${plain(markup)}</text>${
    furi
      ? `<text x="${x}" y="${y - size - 1}" font-size="${size * 0.5}" text-anchor="middle" fill="#3a3157" font-family="DotGothic16, sans-serif" paint-order="stroke" stroke="#fff" stroke-width="3">${reading(markup)}</text>`
      : ''
  }`
}

/** Mapa da cidade. labels: 'all' | [ids]; highlight: id; marker: {x,y} em tiles. */
export function cityMapSVG({
  labels = 'all',
  highlight,
  marker,
  clickable = false
} = {}) {
  const show = (id) => labels === 'all' || labels.includes(id)
  const area = (id, fill) => {
    const a = AREAS.find((x) => x.id === id).rect
    return `<rect x="${a.x * K}" y="${a.y * K}" width="${a.w * K}" height="${a.h * K}" fill="${fill}"/>`
  }
  const roads = [
    [2, 12, 60, 2],
    [2, 30, 44, 2],
    [18, 12, 2, 32],
    [44, 12, 2, 32]
  ]
    .map(
      ([x, y, w, h]) =>
        `<rect x="${x * K}" y="${y * K}" width="${w * K}" height="${h * K}" fill="#5a5f6e"/>`
    )
    .join('')
  const blds = BUILDINGS.map((b) => {
    const { x, y, w, h } = b.rect
    const hl = b.id === highlight
    const name = show(b.id) ? b.name : '？'
    return `<g class="${clickable ? 'hot' : ''}" data-id="${b.id}">
      <rect class="ring" x="${x * K}" y="${y * K}" width="${w * K}" height="${h * K}" rx="4" fill="${show(b.id) ? BCOLOR[b.style] : '#c9c2dc'}" stroke="${hl ? '#ff7a3d' : '#1b1530'}" stroke-width="${hl ? 5 : 2}"/>
      ${label((x + w / 2) * K, (y + h / 2) * K + 8, name, 17)}
    </g>`
  }).join('')
  const park = AREAS.find((a) => a.id === 'park').rect
  const plaza = AREAS.find((a) => a.id === 'plaza').rect
  return `<svg viewBox="0 0 ${CITY_W * K} ${CITY_H * K}" width="640" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#8fd17f"/>
    ${area('plaza', '#ecd9a8')}${area('park', '#6cc463')}${area('pond', '#4aa3e0')}${area('maze', '#c7b99f')}
    ${roads}
    ${blds}
    <g class="${clickable ? 'hot' : ''}" data-id="park">${label((park.x + park.w / 2) * K, (park.y + 8) * K, show('park') ? '{公園|こうえん}' : '？', 17)}</g>
    ${label((plaza.x + plaza.w / 2) * K, (plaza.y + plaza.h / 2) * K + 6, '{広場|ひろば}', 17)}
    ${marker ? `<text x="${marker.x * K}" y="${marker.y * K}" font-size="28" text-anchor="middle">📍</text>` : ''}
    <g transform="translate(${CITY_W * K - 40} 40)"><circle r="26" fill="#fff8e7" stroke="#1b1530" stroke-width="2"/>${label(0, -9, '{北|きた}', 13)}${label(0, 22, '{南|みなみ}', 11)}${label(17, 9, '{東|ひがし}', 11)}${label(-17, 9, '{西|にし}', 11)}</g>
  </svg>`
}

// ── Cena “encontrar o objeto” ───────────────────────────────
const catSVG = (
  x,
  y,
  color = '#ff9a4d'
) => `<g transform="translate(${x - 12} ${y - 12})">
  <path d="M2 4 L7 10 L17 10 L22 4 L22 22 L2 22 Z" fill="${color}" stroke="#1b1530" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="8" cy="15" r="1.8" fill="#1b1530"/><circle cx="16" cy="15" r="1.8" fill="#1b1530"/><path d="M11 18 h2" stroke="#e86a7a" stroke-width="2"/></g>`
const flagSVG = (x, y) =>
  `<g transform="translate(${x - 8} ${y - 26})"><rect x="0" y="0" width="3" height="28" fill="#5a3420"/><path d="M3 1 L20 6 L3 11 Z" fill="#e53935" stroke="#1b1530" stroke-width="1.5"/></g>`

function objSVG(o, part = 'all') {
  const { x, y, w, h } = o
  switch (o.kind) {
    case 'table':
      return `<rect x="${x}" y="${y}" width="${w}" height="10" rx="2" fill="#c48a52" stroke="#1b1530" stroke-width="2"/><rect x="${x + 6}" y="${y + 10}" width="6" height="${h - 10}" fill="#8a5a32" stroke="#1b1530" stroke-width="2"/><rect x="${x + w - 12}" y="${y + 10}" width="6" height="${h - 10}" fill="#8a5a32" stroke="#1b1530" stroke-width="2"/>`
    case 'box': {
      const back = `<path d="M${x} ${y} l-10 -12 h20 l6 12 M${x + w} ${y} l10 -12 h-20 l-6 12" fill="#c8955a" stroke="#1b1530" stroke-width="2"/><rect x="${x}" y="${y}" width="${w}" height="8" fill="#7a5228"/>`
      const front = `<rect x="${x}" y="${y + 4}" width="${w}" height="${h - 4}" fill="#d9a86a" stroke="#1b1530" stroke-width="2"/>`
      return part === 'back' ? back : part === 'front' ? front : back + front
    }
    case 'car':
      return `<rect x="${x}" y="${y + 12}" width="${w}" height="${h - 20}" rx="8" fill="#d9534f" stroke="#1b1530" stroke-width="2"/><rect x="${x + 18}" y="${y}" width="${w - 40}" height="16" rx="5" fill="#b33c38" stroke="#1b1530" stroke-width="2"/><circle cx="${x + 18}" cy="${y + h - 6}" r="7" fill="#222"/><circle cx="${x + w - 18}" cy="${y + h - 6}" r="7" fill="#222"/>`
    case 'tree':
      return `<rect x="${x + w / 2 - 6}" y="${y + 55}" width="12" height="${h - 55}" fill="#7a4a2a" stroke="#1b1530" stroke-width="2"/><circle cx="${x + w / 2}" cy="${y + 35}" r="${w / 2}" fill="#3f9a48" stroke="#1b1530" stroke-width="2"/>`
    case 'pongo':
      return `<circle cx="${x + 15}" cy="${y + 14}" r="12" fill="#e07b2e" stroke="#1b1530" stroke-width="2"/><circle cx="${x + 20}" cy="${y + 15}" r="6" fill="#f6cf9f"/><rect x="${x + 5}" y="${y + 26}" width="20" height="24" rx="6" fill="#e07b2e" stroke="#1b1530" stroke-width="2"/><text x="${x + 15}" y="${y - 4}" font-size="11" text-anchor="middle">👀→</text>`
    case 'person':
      return `<circle cx="${x + 20}" cy="${y + 12}" r="11" fill="#f3c9a0" stroke="#1b1530" stroke-width="2"/><circle cx="${x + 13}" cy="${y + 11}" r="2" fill="#1b1530"/><rect x="${x + 8}" y="${y + 24}" width="24" height="40" rx="6" fill="#3c6fd6" stroke="#1b1530" stroke-width="2"/><rect x="${x + 10}" y="${y + 64}" width="8" height="26" fill="#34495e"/><rect x="${x + 22}" y="${y + 64}" width="8" height="26" fill="#34495e"/><text x="${x + 20}" y="${y - 6}" font-size="11" text-anchor="middle">←👀</text>`
    default:
      return ''
  }
}

/** Cena SVG; spots clicáveis com data-id. highlight = id do spot em destaque. */
export function findSceneSVG(sceneId, { clickable = true, only, highlight } = {}) {
  const sc = FIND_SCENES[sceneId]
  const spots = sc.spots.filter((s) => !only || only.includes(s.id))
  const insideSpots = spots.filter((s) => s.inside)
  const spotSVG = (s) => {
    const art =
      s.icon === 'flag'
        ? flagSVG(s.x, s.y)
        : catSVG(s.x, s.y, s.id === highlight ? '#ff7a3d' : '#ffc38a')
    const ring = `<circle class="ring" cx="${s.x}" cy="${s.y - (s.icon === 'flag' ? 12 : 0)}" r="16" fill="transparent" stroke="${s.id === highlight ? '#ff7a3d' : 'transparent'}" stroke-width="3" stroke-dasharray="4 3"/>`
    return `<g class="${clickable ? 'hot' : ''}" data-id="${s.id}" role="button" tabindex="0">${art}${ring}</g>`
  }
  const objs = sc.objects
    .map((o) =>
      o.kind === 'box' && insideSpots.length
        ? objSVG(o, 'back') + insideSpots.map(spotSVG).join('') + objSVG(o, 'front')
        : objSVG(o)
    )
    .join('')
  return `<svg viewBox="0 0 360 180" width="560" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="150" width="360" height="30" fill="#e8dcc0"/><line x1="0" y1="150" x2="360" y2="150" stroke="#1b1530" stroke-width="2"/>
    ${objs}${spots
      .filter((s) => !s.inside)
      .map(spotSVG)
      .join('')}
  </svg>`
}

// ── Grade de rotas ──────────────────────────────────────────
export const GRID = { ox: 50, oy: 40, dx: 90, dy: 70 }
export const nodeXY = (c, r) => ({ x: GRID.ox + c * GRID.dx, y: GRID.oy + r * GRID.dy })

export function routeGridSVG(item, { clickable = false } = {}) {
  const { cols, rows } = item.grid
  let lines = ''
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = nodeXY(c, r)
      if (c + 1 < cols) {
        const b = nodeXY(c + 1, r)
        lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#5a5f6e" stroke-width="16" stroke-linecap="round"/>`
      }
      if (r + 1 < rows) {
        const b = nodeXY(c, r + 1)
        lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#5a5f6e" stroke-width="16" stroke-linecap="round"/>`
      }
    }
  let nodes = ''
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const { x, y } = nodeXY(c, r)
      nodes += `<g class="${clickable ? 'hot' : ''}" data-node="${c},${r}"><circle class="ring" cx="${x}" cy="${y}" r="13" fill="#fff8e7" stroke="#1b1530" stroke-width="2"/></g>`
    }
  const marks = (item.landmarks || [])
    .map((l) => {
      const { x, y } = nodeXY(l.c, l.r)
      return label(x, y - 18, l.label, 16)
    })
    .join('')
  const goal = item.goal
    ? (() => {
        const { x, y } = nodeXY(item.goal.c, item.goal.r)
        return `<text x="${x}" y="${y + 7}" font-size="18" text-anchor="middle">🏁</text>`
      })()
    : ''
  const s = nodeXY(item.start.c, item.start.r)
  const rot = { N: 0, E: 90, S: 180, W: 270 }[item.start.facing]
  const w = GRID.ox * 2 + (cols - 1) * GRID.dx
  const h = GRID.oy * 2 + (rows - 1) * GRID.dy
  return `<svg viewBox="0 0 ${w + 50} ${h}" width="${Math.min(560, (w + 50) * 1.4)}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#8fd17f"/>${lines}${nodes}${marks}${goal}
    <g class="pongo" transform="translate(${s.x} ${s.y})"><g class="pr" transform="rotate(${rot})"><circle r="11" fill="#e07b2e" stroke="#1b1530" stroke-width="2"/><path d="M0 -20 L7 -9 L-7 -9 Z" fill="#ff7a3d" stroke="#1b1530" stroke-width="2"/></g></g>
    <g transform="translate(${w + 20} 34)"><circle r="22" fill="#fff8e7" stroke="#1b1530" stroke-width="2"/>${label(0, -6, '{北|きた}', 12)}${label(0, 19, '{南|みなみ}', 9)}${label(14, 7, '{東|ひがし}', 9)}${label(-14, 7, '{西|にし}', 9)}</g>
  </svg>`
}

/** Simula instruções numa grade aberta: gira e anda um quarteirão. */
export function simulateGrid(item, instructions) {
  const order = ['N', 'E', 'S', 'W']
  let { c, r, facing } = item.start
  const path = [{ c, r, facing }]
  for (const ins of instructions) {
    const turn = { straight: 0, right: 1, left: 3 }[ins]
    facing = order[(order.indexOf(facing) + turn) % 4]
    c += VEC[facing][0]
    r += VEC[facing][1]
    if (c < 0 || r < 0 || c >= item.grid.cols || r >= item.grid.rows)
      return { ok: false, path, out: true }
    path.push({ c, r, facing })
  }
  return { ok: true, path, end: { c, r }, facing }
}

/** Bússola com braços clicáveis (puzzle de direção). */
export function compassPickerSVG(facing) {
  const pts = { N: [100, 34], E: [166, 104], S: [100, 172], W: [34, 104] }
  const arms = Object.entries(pts)
    .map(
      ([d, [x, y]]) =>
        `<g class="hot" data-dir="${d}" role="button" tabindex="0"><circle class="ring" cx="${x}" cy="${y - 6}" r="24" fill="#fff" stroke="#1b1530" stroke-width="2"/><text x="${x}" y="${y + 2}" font-size="22" text-anchor="middle" font-family="DotGothic16, sans-serif">？</text></g>`
    )
    .join('')
  const arrow = facing
    ? `<g transform="translate(100 98) rotate(${{ N: 0, E: 90, S: 180, W: 270 }[facing]})"><circle r="16" fill="#e07b2e" stroke="#1b1530" stroke-width="2"/><path d="M0 -30 L9 -14 L-9 -14 Z" fill="#ff7a3d" stroke="#1b1530" stroke-width="2"/></g>`
    : `<circle cx="100" cy="98" r="6" fill="#1b1530"/>`
  return `<svg viewBox="0 0 200 200" width="240" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="98" r="90" fill="#fff8e7" stroke="#1b1530" stroke-width="3"/><path d="M100 30V166M32 98H168" stroke="#e0d3b6" stroke-width="3"/>${arms}${arrow}</svg>`
}

/** Pongo olhando para uma direção num mini-mapa com 北 em cima. */
export function facingSVG(facing) {
  const rot = { N: 0, E: 90, S: 180, W: 270 }[facing]
  const k = (d, x, y) =>
    `<text x="${x}" y="${y}" font-size="15" text-anchor="middle" font-family="DotGothic16, sans-serif">${ABS[d].kanji}</text>`
  return `<svg viewBox="0 0 200 160" width="220" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="160" fill="#8fd17f" rx="10"/><rect x="85" y="0" width="30" height="160" fill="#5a5f6e"/><rect x="0" y="65" width="200" height="30" fill="#5a5f6e"/>
    <g transform="translate(100 80) rotate(${rot})"><circle r="14" fill="#e07b2e" stroke="#1b1530" stroke-width="2"/><circle cy="-3" r="7" fill="#f6cf9f"/><path d="M0 -32 L9 -17 L-9 -17 Z" fill="#ff7a3d" stroke="#1b1530" stroke-width="2"/></g>
    ${k('N', 100, 18)}${k('S', 100, 154)}${k('E', 186, 86)}${k('W', 14, 86)}</svg>`
}
