// Ícones SVG originais para cada palavra do vocabulário.
const svg = (inner) =>
  `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`
const REF = '#9aa5b8'
const CAT = '#ff7a3d'
const ref = (x, y, w = 18, h = 18) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${REF}" stroke="#1b1530" stroke-width="2"/>`
const dot = (x, y, r = 5, c = CAT) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#1b1530" stroke-width="2"/>`
const arrow = (d, c = '#1b1530') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
const txt = (x, y, t, s = 14, c = '#1b1530') =>
  `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" fill="${c}" font-family="DotGothic16, sans-serif">${t}</text>`

const compass = (hi) => {
  const pts = { N: [24, 9], E: [39, 27], S: [24, 43], W: [9, 27] }
  const k = { N: '北', E: '東', S: '南', W: '西' }
  return svg(
    `<circle cx="24" cy="24" r="21" fill="#fff8e7" stroke="#1b1530" stroke-width="2"/>` +
      Object.entries(pts)
        .map(([d, [x, y]]) =>
          txt(x, y, k[d], d === hi ? 14 : 10, d === hi ? '#ff7a3d' : '#9a90b8')
        )
        .join('')
  )
}

const building = (roof, wall, mark) =>
  svg(
    `<rect x="8" y="18" width="32" height="24" fill="${wall}" stroke="#1b1530" stroke-width="2"/><rect x="5" y="10" width="38" height="10" fill="${roof}" stroke="#1b1530" stroke-width="2"/><rect x="20" y="30" width="8" height="12" fill="#5a3420"/>${mark || ''}`
  )

const ICONS = {
  'dir-N': compass('N'),
  'dir-S': compass('S'),
  'dir-E': compass('E'),
  'dir-W': compass('W'),
  'pos-ue': svg(ref(15, 22) + dot(24, 15)),
  'pos-shita': svg(
    `<rect x="10" y="14" width="28" height="5" fill="${REF}" stroke="#1b1530" stroke-width="2"/><path d="M13 19v18M35 19v18" stroke="#1b1530" stroke-width="3"/>` +
      dot(24, 31)
  ),
  'pos-naka': svg(ref(11, 14, 26, 24) + dot(24, 26)),
  'pos-soto': svg(ref(6, 16, 20, 20) + dot(37, 26)),
  'pos-mae': svg(ref(15, 6) + dot(24, 36) + arrow('M24 28v-2')),
  'pos-ushiro': svg(
    dot(24, 10, 4, '#ffd0a0') +
      ref(15, 16) +
      `<text x="24" y="46" font-size="9" text-anchor="middle">▲</text>`
  ),
  'pos-soba': svg(
    `<rect x="6" y="20" width="26" height="14" rx="4" fill="#d9534f" stroke="#1b1530" stroke-width="2"/>` +
      dot(38, 30)
  ),
  'pos-tonari': svg(
    ref(4, 14, 18, 22) +
      `<rect x="26" y="14" width="18" height="22" rx="3" fill="${CAT}" stroke="#1b1530" stroke-width="2"/>`
  ),
  'pos-aida': svg(
    ref(2, 14, 13, 22) +
      ref(33, 14, 13, 22) +
      `<rect x="17" y="14" width="14" height="22" rx="3" fill="${CAT}" stroke="#1b1530" stroke-width="2"/>`
  ),
  'pos-chikaku': svg(
    ref(6, 16) +
      dot(34, 30) +
      `<circle cx="15" cy="25" r="20" fill="none" stroke="#2fbf71" stroke-dasharray="3 3" stroke-width="2"/>`
  ),
  'pos-mukou': svg(
    `<circle cx="24" cy="18" r="10" fill="#3f9a48" stroke="#1b1530" stroke-width="2"/><rect x="21" y="26" width="6" height="12" fill="#7a4a2a"/>` +
      dot(8, 40, 4, '#ffd0a0') +
      dot(42, 40, 4) +
      arrow('M10 34 Q24 0 40 34', '#ff7a3d')
  ),
  'rel-migi': svg(arrow('M10 24h26M28 15l9 9-9 9')),
  'rel-hidari': svg(arrow('M38 24H12M20 15l-9 9 9 9')),
  'rel-migigawa': svg(
    `<rect x="18" y="4" width="12" height="40" fill="#c9c4b8"/>` +
      `<rect x="32" y="12" width="12" height="24" fill="${CAT}" stroke="#1b1530" stroke-width="2"/>` +
      arrow('M24 40V10', '#3a3157')
  ),
  'rel-hidarigawa': svg(
    `<rect x="18" y="4" width="12" height="40" fill="#c9c4b8"/>` +
      `<rect x="4" y="12" width="12" height="24" fill="${CAT}" stroke="#1b1530" stroke-width="2"/>` +
      arrow('M24 40V10', '#3a3157')
  ),
  'rel-massugu': svg(arrow('M24 42V8M15 17l9-9 9 9')),
  'dem-koko': svg(
    dot(14, 24, 7, '#ff7a3d') +
      dot(36, 24, 6, '#7fd3ff') +
      `<circle cx="14" cy="24" r="12" fill="none" stroke="#ff7a3d" stroke-width="2" stroke-dasharray="3 2"/>`
  ),
  'dem-soko': svg(
    dot(12, 24, 6, '#ff7a3d') +
      dot(34, 24, 7, '#7fd3ff') +
      `<circle cx="34" cy="24" r="12" fill="none" stroke="#7fd3ff" stroke-width="2" stroke-dasharray="3 2"/>`
  ),
  'dem-asoko': svg(
    dot(8, 34, 5, '#ff7a3d') +
      dot(18, 34, 5, '#7fd3ff') +
      dot(40, 10, 5, '#2fbf71') +
      arrow('M14 26 L36 13', '#2fbf71')
  ),
  'dem-konohen': svg(
    `<circle cx="24" cy="24" r="18" fill="#d8f7e6" stroke="#2fbf71" stroke-width="2" stroke-dasharray="4 3"/>` +
      dot(24, 24, 5)
  ),
  'bld-station': building('#8a3b3b', '#f0dcc0', txt(24, 28, '駅', 10)),
  'bld-school': building(
    '#3fa68f',
    '#f5ead2',
    `<circle cx="24" cy="15" r="3" fill="#fff"/>`
  ),
  'bld-hospital': building(
    '#8ec9ee',
    '#ffffff',
    `<path d="M24 20v8M20 24h8" stroke="#e53935" stroke-width="3"/>`
  ),
  'bld-restaurant': building(
    '#c0573a',
    '#ffd59a',
    `<path d="M10 26h28" stroke="#e53935" stroke-width="3" stroke-dasharray="3 3"/>`
  ),
  'bld-park': svg(
    `<rect x="4" y="30" width="40" height="12" fill="#6cc463"/><circle cx="16" cy="22" r="9" fill="#3f9a48" stroke="#1b1530" stroke-width="2"/><circle cx="33" cy="25" r="7" fill="#3f9a48" stroke="#1b1530" stroke-width="2"/>`
  ),
  'bld-konbini': building(
    '#e9eef2',
    '#ffffff',
    `<path d="M8 21h32" stroke="#2ecc71" stroke-width="2"/><path d="M8 24h32" stroke="#ff9f43" stroke-width="2"/>`
  ),
  'bld-library': building(
    '#4f8a3f',
    '#c98a5c',
    `<rect x="12" y="22" width="6" height="7" fill="#fff"/>`
  ),
  'bld-post': building('#d64541', '#fff3ea', txt(24, 29, '〒', 11, '#d64541')),
  'bld-bank': building('#34407a', '#d9dbe3', txt(24, 29, '¥', 11, '#8a6d00')),
  'bld-house': svg(
    `<path d="M6 22 24 8l18 14" fill="#d9534f" stroke="#1b1530" stroke-width="2"/><rect x="10" y="22" width="28" height="20" fill="#fff1d6" stroke="#1b1530" stroke-width="2"/><rect x="21" y="30" width="7" height="12" fill="#8a5a3a"/>`
  ),
  'obj-cat': svg(
    `<path d="M12 14l4 8h16l4-8 0 22H12z" fill="${CAT}" stroke="#1b1530" stroke-width="2"/><circle cx="20" cy="27" r="2"/><circle cx="28" cy="27" r="2"/>`
  ),
  'obj-box': svg(
    `<rect x="8" y="18" width="32" height="22" fill="#d9a86a" stroke="#1b1530" stroke-width="2"/><path d="M8 18l-4-8h14l4 8M40 18l4-8H30l-4 8" fill="#c8955a" stroke="#1b1530" stroke-width="2"/>`
  ),
  'obj-car': svg(
    `<rect x="4" y="20" width="40" height="14" rx="4" fill="#d9534f" stroke="#1b1530" stroke-width="2"/><rect x="12" y="12" width="22" height="10" rx="3" fill="#b33c38" stroke="#1b1530" stroke-width="2"/><circle cx="13" cy="36" r="4"/><circle cx="35" cy="36" r="4"/>`
  ),
  'obj-tree': svg(
    `<circle cx="24" cy="18" r="13" fill="#3f9a48" stroke="#1b1530" stroke-width="2"/><rect x="21" y="30" width="6" height="12" fill="#7a4a2a"/>`
  ),
  'obj-road': svg(
    `<rect x="16" y="2" width="16" height="44" fill="#4a4e5c"/><path d="M24 6v6M24 20v6M24 34v6" stroke="#f2e6b0" stroke-width="2"/>`
  ),
  'gr-arimasu': svg(
    ref(8, 16, 14, 14) +
      `<rect x="26" y="20" width="16" height="12" fill="#3c6fd6" stroke="#1b1530" stroke-width="2"/>` +
      txt(24, 46, 'ある', 10)
  ),
  'gr-imasu': svg(dot(16, 22, 7) + dot(32, 22, 7, '#ffd0a0') + txt(24, 46, 'いる', 10)),
  'gr-ikimasu': svg(
    arrow('M8 24h28M28 15l9 9-9 9', '#9b4dff') + txt(14, 14, 'へ', 12, '#9b4dff')
  ),
  'gr-magaru': svg(arrow('M14 42V22h20M27 15l8 7-8 7'))
}

export function icon(key) {
  return ICONS[key] || svg(txt(24, 30, '？', 20))
}
