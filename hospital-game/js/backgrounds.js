// Cenários da história em SVG (800 × 450), traço simples e cores pastel.
(function () {
  const wrap = (inner) => `<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  const floor = (c) => `<rect y="330" width="800" height="120" fill="${c}"/><path d="M0 330 H800" stroke="#000" stroke-opacity=".06" stroke-width="4"/>`;
  const sign = (x, y, w, text, fill) => `<g><rect x="${x}" y="${y}" width="${w}" height="40" rx="14" fill="${fill}"/><text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" font-family="Mochiy Pop One, sans-serif" font-size="18" fill="#3d3552">${text}</text></g>`;
  const cross = (x, y, s, c) => `<path d="M${x - s / 6} ${y - s / 2} h${s / 3} v${s / 3} h${s / 3} v${s / 3} h-${s / 3} v${s / 3} h-${s / 3} v-${s / 3} h-${s / 3} v-${s / 3} h${s / 3} z" fill="${c}"/>`;
  const plant = (x, y) => `<rect x="${x - 18}" y="${y}" width="36" height="34" rx="8" fill="#ffd3b6"/><g fill="#8fd6b4"><ellipse cx="${x - 14}" cy="${y - 16}" rx="10" ry="22" transform="rotate(-25 ${x - 14} ${y - 16})"/><ellipse cx="${x + 14}" cy="${y - 16}" rx="10" ry="22" transform="rotate(25 ${x + 14} ${y - 16})"/><ellipse cx="${x}" cy="${y - 26}" rx="10" ry="26"/></g>`;
  const windowSun = (x, y, night) => `<rect x="${x}" y="${y}" width="170" height="130" rx="16" fill="${night ? '#8f88c9' : '#cfeaff'}" stroke="#fff" stroke-width="10"/>` +
    (night ? `<circle cx="${x + 120}" cy="${y + 42}" r="20" fill="#fff6c9"/><circle cx="${x + 130}" cy="${y + 36}" r="18" fill="#8f88c9"/><circle cx="${x + 40}" cy="${y + 30}" r="3" fill="#fff"/><circle cx="${x + 70}" cy="${y + 80}" r="2.5" fill="#fff"/>`
      : `<circle cx="${x + 125}" cy="${y + 40}" r="22" fill="#ffe08a"/><g fill="#fff"><ellipse cx="${x + 55}" cy="${y + 85}" rx="30" ry="12"/><ellipse cx="${x + 75}" cy="${y + 76}" rx="20" ry="12"/></g>`) +
    `<path d="M${x + 85} ${y} v130 M${x} ${y + 65} h170" stroke="#fff" stroke-width="6"/>`;
  const clock = (x, y, h) => `<circle cx="${x}" cy="${y}" r="28" fill="#fff" stroke="#cdb4f0" stroke-width="6"/><path d="M${x} ${y} L${x} ${y - 18} M${x} ${y} L${x + 12 * Math.cos(h)} ${y + 12 * Math.sin(h)}" stroke="#3d3552" stroke-width="4" stroke-linecap="round"/>`;

  const BG = {
    bedroom: wrap(
      `<rect width="800" height="450" fill="#ffe9de"/>` +
      `<g fill="#fff" opacity=".45">${Array.from({ length: 10 }, (_, i) => `<circle cx="${40 + i * 80}" cy="${30 + (i % 2) * 40}" r="6"/>`).join('')}</g>` +
      windowSun(560, 70) + floor('#f7d3c4') +
      `<rect x="40" y="250" width="300" height="90" rx="20" fill="#cdb4f0"/><rect x="40" y="215" width="70" height="125" rx="18" fill="#b9a0e6"/><rect x="60" y="232" width="120" height="40" rx="18" fill="#fff"/><rect x="150" y="248" width="190" height="60" rx="18" fill="#ffaab8"/>` +
      `<rect x="380" y="270" width="70" height="70" rx="10" fill="#ffd3b6"/>` + clock(415, 230, -0.5) + plant(720, 300)
    ),
    reception: wrap(
      `<rect width="800" height="450" fill="#e6f7ef"/>` +
      `<rect x="0" y="0" width="800" height="70" fill="#d3f0e3"/>` + sign(300, 18, 200, 'RECEPTION', '#fff') +
      cross(110, 140, 70, '#ffaab8') + cross(690, 140, 70, '#ffaab8') + floor('#cfe9de') +
      `<rect x="180" y="250" width="440" height="110" rx="22" fill="#fff"/><rect x="180" y="250" width="440" height="22" rx="11" fill="#a8e6cf"/>` +
      `<rect x="420" y="214" width="80" height="50" rx="8" fill="#b5dcf5"/><rect x="452" y="262" width="16" height="10" fill="#9fc6e3"/>` +
      `<rect x="240" y="228" width="60" height="26" rx="6" fill="#ffeaa7"/>` + plant(70, 300) + plant(735, 300)
    ),
    waiting: wrap(
      `<rect width="800" height="450" fill="#efeaff"/>` + sign(260, 20, 280, 'WAITING ROOM', '#fff') +
      clock(660, 110, 0.6) + `<rect x="80" y="90" width="120" height="90" rx="12" fill="#fff"/><path d="M100 120 h80 M100 140 h60 M100 160 h70" stroke="#cdb4f0" stroke-width="6" stroke-linecap="round"/>` +
      floor('#ddd3f7') +
      Array.from({ length: 5 }, (_, i) => `<g><rect x="${120 + i * 120}" y="260" width="96" height="22" rx="10" fill="#ffaab8"/><rect x="${120 + i * 120}" y="212" width="96" height="52" rx="14" fill="#ffc2cd"/><rect x="${134 + i * 120}" y="280" width="8" height="50" fill="#d9a0b3"/><rect x="${194 + i * 120}" y="280" width="8" height="50" fill="#d9a0b3"/></g>`).join('') +
      `<g><circle cx="520" cy="196" r="18" fill="#ffe4d6"/><path d="M500 190 q20 -26 40 0" fill="#c9a07a"/><path d="M510 196 q4 3 8 0 M524 196 q4 3 8 0" stroke="#3b2f4a" stroke-width="2" fill="none"/><text x="545" y="176" font-family="Mochiy Pop One, sans-serif" font-size="14" fill="#9c8cd8">z z</text><rect x="504" y="212" width="34" height="40" rx="14" fill="#b5dcf5"/></g>` +
      `<g><circle cx="650" cy="190" r="18" fill="#f3d6c4"/><path d="M632 184 q18 -22 36 0" fill="#e8e8f0"/><rect x="630" y="210" width="40" height="44" rx="14" fill="#a8e6cf"/><rect x="624" y="214" width="34" height="26" rx="3" fill="#fff" stroke="#ffd3b6" stroke-width="3"/></g>` +
      plant(60, 300)
    ),
    triage: wrap(
      `<rect width="800" height="450" fill="#e8f4ff"/>` + sign(320, 20, 160, 'TRIAGE', '#fff') +
      `<path d="M0 60 Q40 200 0 330 Z" fill="#cdb4f0" opacity=".5"/>` +
      Array.from({ length: 6 }, (_, i) => `<path d="M${560 + i * 40} 40 q20 150 0 290" stroke="#b5dcf5" stroke-width="30" fill="none" opacity=".55"/>`).join('') +
      floor('#d4e7f7') +
      `<rect x="70" y="110" width="110" height="150" rx="14" fill="#fff"/><text x="125" y="150" text-anchor="middle" font-family="Mochiy Pop One, sans-serif" font-size="22" fill="#ff8fab">38.5 °C</text><path d="M90 175 h70 M90 195 h50 M90 215 h60" stroke="#b5dcf5" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="250" y="270" width="300" height="40" rx="14" fill="#fff"/><rect x="270" y="300" width="14" height="40" fill="#cfe1f2"/><rect x="516" y="300" width="14" height="40" fill="#cfe1f2"/>` +
      `<circle cx="430" cy="160" r="34" fill="#fff" stroke="#ffaab8" stroke-width="6"/><path d="M430 160 L446 142" stroke="#3d3552" stroke-width="4" stroke-linecap="round"/><text x="430" y="186" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#6f6787">120/80</text>`
    ),
    office: wrap(
      `<rect width="800" height="450" fill="#fbefff"/>` + windowSun(580, 60) +
      `<rect x="70" y="60" width="110" height="160" rx="10" fill="#fff"/>` +
      ['E', 'F P', 'T O Z', 'L P E D'].map((t, i) => `<text x="125" y="${100 + i * 34}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${30 - i * 5}" fill="#6f6787">${t}</text>`).join('') +
      floor('#ecd9f3') + `<rect x="260" y="250" width="320" height="26" rx="12" fill="#e0b89c"/><rect x="280" y="276" width="18" height="60" fill="#cfa385"/><rect x="540" y="276" width="18" height="60" fill="#cfa385"/>` +
      `<rect x="300" y="214" width="70" height="40" rx="6" fill="#b5dcf5"/><rect x="460" y="226" width="56" height="28" rx="4" fill="#fff" stroke="#ffaab8" stroke-width="3"/>` + plant(730, 300) + cross(230, 140, 46, '#ffaab8')
    ),
    pharmacy: wrap(
      `<rect width="800" height="450" fill="#eafbf0"/>` + sign(300, 18, 200, 'PHARMACY', '#fff') + cross(260, 38, 34, '#8fd6b4') + cross(540, 38, 34, '#8fd6b4') +
      [0, 1, 2].map((r) => `<rect x="60" y="${90 + r * 70}" width="680" height="12" rx="6" fill="#c9eedb"/>` +
        Array.from({ length: 11 }, (_, i) => {
          const c = ['#ffaab8', '#cdb4f0', '#b5dcf5', '#ffeaa7', '#ffd3b6'][(i + r) % 5];
          return `<rect x="${78 + i * 60}" y="${52 + r * 70}" width="34" height="38" rx="8" fill="${c}"/><rect x="${84 + i * 60}" y="${46 + r * 70}" width="22" height="10" rx="3" fill="#fff"/>`;
        }).join('')).join('') +
      floor('#cfeedd') + `<rect x="200" y="270" width="400" height="80" rx="20" fill="#fff"/><rect x="200" y="270" width="400" height="18" rx="9" fill="#a8e6cf"/>` +
      `<g transform="translate(470 238)"><rect width="44" height="34" rx="8" fill="#ffd3b6"/><rect x="6" y="-8" width="32" height="10" rx="4" fill="#fff"/><path d="M14 17 h16 M22 9 v16" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`
    ),
    living: wrap(
      `<rect width="800" height="450" fill="#fff4dc"/>` + windowSun(80, 70) + floor('#f6dfb8') +
      `<rect x="380" y="230" width="360" height="110" rx="30" fill="#a8e6cf"/><rect x="380" y="200" width="360" height="60" rx="26" fill="#bdeedb"/><rect x="420" y="246" width="90" height="40" rx="14" fill="#ffaab8"/><rect x="620" y="246" width="80" height="40" rx="14" fill="#ffeaa7"/>` +
      `<g fill="#ffaab8"><path d="M300 120 c-10 -14 -30 -4 -20 12 l20 16 l20 -16 c10 -16 -10 -26 -20 -12z"/></g>` +
      `<rect x="290" y="270" width="60" height="70" rx="8" fill="#ffd3b6"/><rect x="304" y="250" width="32" height="26" rx="6" fill="#fff"/><path d="M312 250 q8 -14 16 0" stroke="#b5dcf5" stroke-width="3" fill="none"/>` + plant(760, 300)
    ),
  };

  window.Backgrounds = BG;
})();
