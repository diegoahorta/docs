// Personagens 2D estilo anime (chibi), desenhados em SVG.
// Characters.svg(role, emotion, { full, hit }) devolve uma string <svg>.
(function () {
  const LASH = '#3b2f4a';
  const MOUTH = '#8a3f4f';

  const ROLES = {
    mika: {
      name: 'Mika', skin: '#ffe4d6', hair: '#8f7fc9', hairDark: '#6c5ca8', iris: '#7a6bd1',
      outfit: '#a8e6cf', outfitDark: '#7fcfb1', pants: '#8fa6d9', shoes: '#ffaab8', hairStyle: 'bob', extra: 'hoodie',
    },
    ren: {
      name: 'Ren', skin: '#fde1cf', hair: '#f6b07f', hairDark: '#d98d5c', iris: '#c9785a',
      outfit: '#ffe3a3', outfitDark: '#f4cd78', pants: '#9d8fc4', shoes: '#7b6fa3', hairStyle: 'short', extra: 'headset',
    },
    hana: {
      name: 'Hana', skin: '#ffe7dc', hair: '#f4a6c0', hairDark: '#e083a3', iris: '#e0739a',
      outfit: '#b5dcf5', outfitDark: '#8fc5ea', pants: '#b5dcf5', shoes: '#ffffff', hairStyle: 'ponytail', extra: 'nurse',
    },
    sato: {
      name: 'Dr. Sato', skin: '#f9dccb', hair: '#4b5577', hairDark: '#323a58', iris: '#4f6aa8',
      outfit: '#fbfbff', outfitDark: '#dcdcec', pants: '#6b7aa6', shoes: '#4b5577', hairStyle: 'short', extra: 'doctor',
    },
    kai: {
      name: 'Kai', skin: '#fde3d4', hair: '#7fcfb6', hairDark: '#58b096', iris: '#3f9c86',
      outfit: '#fbfbff', outfitDark: '#dcdcec', pants: '#c3a6e6', shoes: '#58b096', hairStyle: 'short', extra: 'coat',
    },
  };

  // Rosto de cada emoção: olhos, sobrancelhas, boca e efeitos.
  const FACES = {
    neutral:   { eyes: 'open',    brows: 'neutral', mouth: 'smile' },
    smile:     { eyes: 'happy',   brows: 'raised',  mouth: 'smile', blush: 1 },
    happy:     { eyes: 'happy',   brows: 'raised',  mouth: 'grin',  blush: 1, fx: ['sparkles'] },
    sad:       { eyes: 'teary',   brows: 'up',      mouth: 'frown', fx: ['tear'] },
    tired:     { eyes: 'half',    brows: 'neutral', mouth: 'flat' },
    stressed:  { eyes: 'squeeze', brows: 'down',    mouth: 'grimace', fx: ['scribble'] },
    anxious:   { eyes: 'wide',    brows: 'up',      mouth: 'wobbly', fx: ['sweat'] },
    relieved:  { eyes: 'closed',  brows: 'relaxed', mouth: 'smile', blush: 1, fx: ['puff'] },
    nervous:   { eyes: 'open',    brows: 'up',      mouth: 'wobbly', blush: 1, fx: ['sweat', 'sweat2'] },
    calm:      { eyes: 'closed',  brows: 'relaxed', mouth: 'smile', blush: 1, fx: ['petals'] },
    exhausted: { eyes: 'half',    brows: 'up',      mouth: 'o',     fx: ['zzz'], pale: 1 },
    worried:   { eyes: 'open',    brows: 'up',      mouth: 'frown', fx: ['sweat'] },
    sick:      { eyes: 'half',    brows: 'up',      mouth: 'wobbly', pale: 1, fx: ['gloom', 'thermo'] },
    healthy:   { eyes: 'open',    brows: 'raised',  mouth: 'grin',  blush: 1, fx: ['sparkles'] },
    weak:      { eyes: 'half',    brows: 'up',      mouth: 'flat',  pale: 1, fx: ['gloom'] },
    dizzy:     { eyes: 'spiral',  brows: 'up',      mouth: 'wobbly', fx: ['stars'] },
    nauseous:  { eyes: 'squeeze', brows: 'up',      mouth: 'wobbly', green: 1, fx: ['gloom'] },
    better:    { eyes: 'happy',   brows: 'relaxed', mouth: 'smile', blush: 1, fx: ['sparkles', 'heart'] },
    worse:     { eyes: 'teary',   brows: 'up',      mouth: 'grimace', pale: 1, fx: ['gloom', 'tear'] },
    pain:      { eyes: 'squeeze', brows: 'up',      mouth: 'grimace', fx: ['sweat'] },
    surprised: { eyes: 'wide',    brows: 'raised',  mouth: 'o' },
    fever:     { eyes: 'half',    brows: 'up',      mouth: 'flat', blush: 2, fx: ['thermo', 'sweat'] },
  };

  function star(cx, cy, r, fill) {
    const s = r * 0.32;
    return `<path d="M${cx} ${cy - r} Q${cx + s} ${cy - s} ${cx + r} ${cy} Q${cx + s} ${cy + s} ${cx} ${cy + r} Q${cx - s} ${cy + s} ${cx - r} ${cy} Q${cx - s} ${cy - s} ${cx} ${cy - r}Z" fill="${fill}"/>`;
  }

  function eye(cx, cy, type, c, side) {
    const lash = `<path d="M${cx - 15} ${cy - 11} Q${cx} ${cy - 24} ${cx + 15} ${cy - 12}" stroke="${LASH}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M${cx + side * 14} ${cy - 12} l${side * 5} -3" stroke="${LASH}" stroke-width="3" stroke-linecap="round"/>`;
    const ball = (ir, pr) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="13" ry="17" fill="#fff"/>` +
      `<ellipse cx="${cx}" cy="${cy + 2}" rx="${ir}" ry="${ir * 1.33}" fill="${c.iris}"/>` +
      `<ellipse cx="${cx}" cy="${cy + 6}" rx="${ir * 0.8}" ry="${ir * 0.55}" fill="#fff" opacity=".18"/>` +
      `<ellipse cx="${cx}" cy="${cy + 3}" rx="${pr}" ry="${pr * 1.35}" fill="#2b2340"/>` +
      `<circle cx="${cx - 4}" cy="${cy - 5}" r="4.2" fill="#fff"/>` +
      `<circle cx="${cx + 4.5}" cy="${cy + 8}" r="2" fill="#fff" opacity=".85"/>`;
    switch (type) {
      case 'happy':
        return `<path d="M${cx - 12} ${cy + 4} Q${cx} ${cy - 13} ${cx + 12} ${cy + 4}" stroke="${LASH}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      case 'closed':
        return `<path d="M${cx - 12} ${cy} Q${cx} ${cy + 9} ${cx + 12} ${cy}" stroke="${LASH}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
          `<path d="M${cx + side * 11} ${cy + 1} l${side * 4} -3" stroke="${LASH}" stroke-width="2.5" stroke-linecap="round"/>`;
      case 'squeeze': {
        const d = side < 0 ? `M${cx - 9} ${cy - 9} L${cx + 8} ${cy} L${cx - 9} ${cy + 9}` : `M${cx + 9} ${cy - 9} L${cx - 8} ${cy} L${cx + 9} ${cy + 9}`;
        return `<path d="${d}" stroke="${LASH}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      case 'spiral':
        return `<path d="M${cx} ${cy} m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 1 10 0 a7 7 0 1 1 -14 0 a9 9 0 1 1 18 0" stroke="${LASH}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
      case 'half':
        return ball(10.5, 5.5) +
          `<path d="M${cx - 17} ${cy - 24} L${cx + 17} ${cy - 24} L${cx + 17} ${cy} Q${cx} ${cy - 5} ${cx - 17} ${cy} Z" fill="${c.skinNow}"/>` +
          `<path d="M${cx - 14} ${cy - 1} Q${cx} ${cy - 6} ${cx + 14} ${cy - 1}" stroke="${LASH}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
          `<path d="M${cx - 9} ${cy + 19} Q${cx} ${cy + 22} ${cx + 9} ${cy + 19}" stroke="#c9a3c9" stroke-width="2" fill="none" opacity=".7"/>`;
      case 'wide':
        return ball(8.5, 3.2) + lash;
      case 'teary':
        return ball(10.5, 5.5) +
          `<circle cx="${cx + 3}" cy="${cy - 2}" r="2.6" fill="#fff"/>` +
          `<path d="M${cx - 12} ${cy + 12} Q${cx} ${cy + 18} ${cx + 12} ${cy + 12}" stroke="#a9dcff" stroke-width="3.5" fill="none" stroke-linecap="round"/>` + lash;
      default:
        return ball(10.5, 5.5) + lash;
    }
  }

  function brows(type, color) {
    const L = { neutral: [72, 101, 96, 98], up: [72, 103, 96, 93], raised: [72, 95, 96, 92], relaxed: [73, 99, 96, 97], down: [72, 95, 96, 103] }[type];
    const [x1, y1, x2, y2] = L;
    const r = (x) => 220 - x;
    return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 3} ${x2} ${y2}" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M${r(x1)} ${y1} Q${r((x1 + x2) / 2)} ${Math.min(y1, y2) - 3} ${r(x2)} ${y2}" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }

  function mouth(type) {
    switch (type) {
      case 'grin':
        return `<path d="M97 155 Q110 174 123 155 Z" fill="#b8475a" stroke="${MOUTH}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M103 163 Q110 170 117 163 Q110 160 103 163Z" fill="#ff9aa8"/>`;
      case 'frown': return `<path d="M101 164 Q110 155 119 164" stroke="${MOUTH}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'wobbly': return `<path d="M97 161 q4 -4 6.5 0 t6.5 0 t6.5 0 t6.5 0" stroke="${MOUTH}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'flat': return `<path d="M103 160 L117 160" stroke="${MOUTH}" stroke-width="3" stroke-linecap="round"/>`;
      case 'o': return `<ellipse cx="110" cy="161" rx="5.5" ry="6.5" fill="#b8475a" stroke="${MOUTH}" stroke-width="2"/>`;
      case 'grimace':
        return `<rect x="98" y="154" width="24" height="12" rx="6" fill="#fff" stroke="${MOUTH}" stroke-width="2.5"/>` +
          `<path d="M99 160 L121 160 M106 155 L106 165 M114 155 L114 165" stroke="${MOUTH}" stroke-width="1.6"/>`;
      default: return `<path d="M100 157 Q110 167 120 157" stroke="${MOUTH}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
  }

  function effects(list) {
    const out = [];
    for (const fx of list || []) {
      if (fx === 'sparkles') out.push(star(192, 66, 11, '#ffd36e'), star(30, 92, 8, '#ffb8cf'), star(198, 128, 6, '#b5dcf5'));
      if (fx === 'heart') out.push('<path d="M30 150 c-8 -10 -22 -2 -14 10 l14 12 l14 -12 c8 -12 -6 -20 -14 -10z" fill="#ff9fb2"/>');
      if (fx === 'tear') out.push('<path d="M79 142 q-7 13 0 17 q7 -4 0 -17z" fill="#9fd8ff" stroke="#7cc4f0" stroke-width="1.5"/>');
      if (fx === 'sweat') out.push('<path d="M170 78 q-9 15 0 20 q9 -5 0 -20z" fill="#cfeeff" stroke="#7cc4f0" stroke-width="2"/>');
      if (fx === 'sweat2') out.push('<path d="M48 96 q-6 10 0 13 q6 -3 0 -13z" fill="#cfeeff" stroke="#7cc4f0" stroke-width="1.8"/>');
      if (fx === 'gloom') out.push('<g stroke="#9c8cd8" stroke-width="2.5" stroke-linecap="round" opacity=".75"><path d="M84 108 v12"/><path d="M92 106 v16"/><path d="M128 106 v16"/><path d="M136 108 v12"/></g>');
      if (fx === 'thermo') out.push('<g transform="rotate(-18 122 160)"><rect x="118" y="157" width="46" height="7" rx="3.5" fill="#fff" stroke="#c7b4d9" stroke-width="1.5"/><rect x="138" y="159" width="22" height="3" rx="1.5" fill="#ff6b81"/><circle cx="162" cy="160.5" r="5" fill="#ff6b81"/></g>');
      if (fx === 'zzz') out.push('<g fill="#9c8cd8" font-family="Mochiy Pop One, sans-serif" font-weight="700"><text x="168" y="70" font-size="16">z</text><text x="182" y="52" font-size="22">Z</text><text x="200" y="32" font-size="14">z</text></g>');
      if (fx === 'scribble') out.push('<path d="M170 40 c12 -12 26 8 12 16 c-14 7 -24 -16 -2 -14 c18 2 12 22 -6 16 c-12 -4 -4 -20 10 -14" stroke="#6f6787" stroke-width="2.4" fill="none" stroke-linecap="round"/>');
      if (fx === 'puff') out.push('<g fill="#e8f6ff" stroke="#b5dcf5" stroke-width="2"><circle cx="146" cy="168" r="7"/><circle cx="158" cy="164" r="9"/><circle cx="170" cy="170" r="6"/></g>');
      if (fx === 'stars') out.push('<ellipse cx="110" cy="44" rx="58" ry="12" fill="none" stroke="#cdb4f0" stroke-width="2" stroke-dasharray="5 6"/>' + star(58, 46, 9, '#ffd36e') + star(150, 34, 8, '#ffb8cf') + star(166, 52, 6, '#b5dcf5'));
      if (fx === 'petals') out.push('<g fill="#ffc9d9"><ellipse cx="190" cy="80" rx="7" ry="4" transform="rotate(30 190 80)"/><ellipse cx="34" cy="120" rx="6" ry="3.5" transform="rotate(-20 34 120)"/><ellipse cx="200" cy="140" rx="5" ry="3" transform="rotate(50 200 140)"/></g>');
    }
    return out.join('');
  }

  function hair(c, layer) {
    if (layer === 'back') {
      if (c.hairStyle === 'bob')
        return `<path d="M38 125 Q32 38 110 36 Q188 38 182 125 L185 196 Q170 208 157 192 L156 150 L64 150 L63 192 Q50 208 35 196 Z" fill="${c.hair}"/>`;
      if (c.hairStyle === 'ponytail')
        return `<path d="M158 66 Q222 74 206 178 Q196 146 168 116 Z" fill="${c.hairDark}"/>` +
          `<path d="M40 122 Q34 38 110 36 Q186 38 180 122 L178 160 L42 160 Z" fill="${c.hair}"/>` +
          `<circle cx="166" cy="72" r="8" fill="#ffaab8"/>`;
      return `<path d="M42 122 Q36 40 110 38 Q184 40 178 122 Q176 140 170 150 L50 150 Q44 140 42 122 Z" fill="${c.hair}"/>`;
    }
    const bangs = c.hairStyle === 'short'
      ? `<path d="M44 122 Q40 52 110 46 Q180 52 176 122 Q170 100 160 94 L154 110 L140 86 L126 104 L112 82 L96 102 L84 84 L76 108 L64 90 Q50 100 44 122 Z" fill="${c.hair}"/>`
      : `<path d="M44 124 Q42 54 110 48 Q178 54 176 124 Q168 98 158 92 L150 114 L138 88 L122 108 L110 84 L98 108 L82 88 L72 114 L62 92 Q52 100 44 124 Z" fill="${c.hair}"/>`;
    return bangs + `<path d="M72 68 Q92 56 116 58" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35"/>`;
  }

  function outfit(c, full) {
    const arms = `<path d="M72 214 Q50 244 52 284" stroke="${c.outfit}" stroke-width="20" fill="none" stroke-linecap="round"/>` +
      `<path d="M148 214 Q170 244 168 284" stroke="${c.outfit}" stroke-width="20" fill="none" stroke-linecap="round"/>` +
      `<circle cx="52" cy="292" r="10" fill="${c.skin}"/><circle cx="168" cy="292" r="10" fill="${c.skin}"/>`;
    const legs = full
      ? `<rect x="82" y="290" width="24" height="92" rx="10" fill="${c.pants}"/><rect x="114" y="290" width="24" height="92" rx="10" fill="${c.pants}"/>` +
        `<ellipse cx="92" cy="388" rx="18" ry="10" fill="${c.shoes}" stroke="#d8cbe6" stroke-width="1.5"/><ellipse cx="128" cy="388" rx="18" ry="10" fill="${c.shoes}" stroke="#d8cbe6" stroke-width="1.5"/>`
      : '';
    let torso = `<path d="M66 304 Q62 212 110 198 Q158 212 154 304 Z" fill="${c.outfit}"/>`;
    let deco = '';
    if (c.extra === 'hoodie') {
      deco = `<path d="M84 204 Q110 228 136 204" stroke="${c.outfitDark}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M100 214 v22 M120 214 v22" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M86 262 h48 v22 q-24 8 -48 0 z" fill="${c.outfitDark}" opacity=".6"/>`;
    } else if (c.extra === 'nurse') {
      deco = `<path d="M92 202 L110 232 L128 202" stroke="${c.outfitDark}" stroke-width="5" fill="none" stroke-linejoin="round"/>` +
        `<rect x="124" y="244" width="18" height="14" rx="3" fill="${c.outfitDark}"/><path d="M130 240 v8" stroke="#ff8fab" stroke-width="3" stroke-linecap="round"/>`;
    } else if (c.extra === 'doctor' || c.extra === 'coat') {
      const shirt = c.extra === 'doctor' ? '#cdb4f0' : '#ffd3b6';
      torso = `<path d="M66 304 Q62 212 110 198 Q158 212 154 304 Z" fill="${c.outfit}" stroke="${c.outfitDark}" stroke-width="2"/>` +
        `<path d="M96 202 L110 250 L124 202 Z" fill="${shirt}"/>`;
      deco = `<path d="M96 202 L106 262 M124 202 L114 262" stroke="${c.outfitDark}" stroke-width="2.5"/>` +
        `<rect x="128" y="250" width="16" height="12" rx="2" fill="${c.outfitDark}"/><path d="M132 246 v8" stroke="#8fa6d9" stroke-width="2.5"/>`;
      if (c.extra === 'doctor')
        deco += `<path d="M90 204 Q88 244 110 250 Q132 244 130 204" stroke="#7d8bb0" stroke-width="4" fill="none"/>` +
          `<circle cx="110" cy="254" r="8" fill="#dfe6f5" stroke="#7d8bb0" stroke-width="3"/>`;
    } else if (c.extra === 'headset') {
      deco = `<path d="M92 202 L110 222 L128 202" stroke="${c.outfitDark}" stroke-width="5" fill="none" stroke-linejoin="round"/>` +
        `<rect x="122" y="236" width="24" height="15" rx="4" fill="#fff" stroke="${c.outfitDark}" stroke-width="2"/><path d="M127 243 h14" stroke="#cdb4f0" stroke-width="2.5"/>`;
    }
    return legs + arms + torso + deco;
  }

  function headwear(c) {
    if (c.extra === 'nurse')
      return `<path d="M70 62 Q110 30 150 62 L144 78 Q110 66 76 78 Z" fill="#fff" stroke="#f2c4d2" stroke-width="2"/>` +
        `<path d="M110 50 v14 M103 57 h14" stroke="#ff8fab" stroke-width="4" stroke-linecap="round"/>`;
    if (c.extra === 'headset')
      return `<path d="M42 126 Q40 30 110 30 Q180 30 178 126" stroke="#7b6fa3" stroke-width="5" fill="none"/>` +
        `<rect x="34" y="118" width="14" height="26" rx="6" fill="#9d8fc4"/><rect x="172" y="118" width="14" height="26" rx="6" fill="#9d8fc4"/>` +
        `<path d="M42 142 Q52 172 90 168" stroke="#7b6fa3" stroke-width="3" fill="none"/><circle cx="92" cy="168" r="4" fill="#7b6fa3"/>`;
    if (c.extra === 'hoodie')
      return star(150, 80, 9, '#ffd36e');
    return '';
  }

  function glasses(c) {
    if (c.extra !== 'doctor') return '';
    return `<g fill="#fff" fill-opacity=".14" stroke="#4a4a6a" stroke-width="3"><circle cx="84" cy="130" r="20"/><circle cx="136" cy="130" r="20"/></g>` +
      `<path d="M104 128 Q110 123 116 128" stroke="#4a4a6a" stroke-width="3" fill="none"/>`;
  }

  // Zonas clicáveis do jogo "Onde dói?"
  const HIT = [
    ['head', 'ellipse', 'cx="110" cy="56" rx="62" ry="24"'],
    ['eye', 'ellipse', 'cx="84" cy="130" rx="15" ry="18"'],
    ['eye', 'ellipse', 'cx="136" cy="130" rx="15" ry="18"'],
    ['ear', 'ellipse', 'cx="46" cy="134" rx="12" ry="16"'],
    ['ear', 'ellipse', 'cx="174" cy="134" rx="12" ry="16"'],
    ['nose', 'circle', 'cx="110" cy="146" r="7"'],
    ['mouth', 'ellipse', 'cx="110" cy="161" rx="14" ry="8"'],
    ['throat', 'rect', 'x="96" y="182" width="28" height="18" rx="6"'],
    ['chest', 'rect', 'x="78" y="208" width="64" height="34" rx="10"'],
    ['stomach', 'rect', 'x="80" y="246" width="60" height="42" rx="12"'],
    ['arm', 'rect', 'x="42" y="210" width="26" height="70" rx="12"'],
    ['arm', 'rect', 'x="152" y="210" width="26" height="70" rx="12"'],
    ['hand', 'circle', 'cx="52" cy="292" r="13"'],
    ['hand', 'circle', 'cx="168" cy="292" r="13"'],
    ['leg', 'rect', 'x="80" y="300" width="60" height="76" rx="10"'],
    ['foot', 'ellipse', 'cx="92" cy="388" rx="20" ry="12"'],
    ['foot', 'ellipse', 'cx="128" cy="388" rx="20" ry="12"'],
  ];

  function svg(role, emotion, opts = {}) {
    const base = ROLES[role] || ROLES.mika;
    const f = FACES[emotion] || FACES.neutral;
    const c = { ...base, skinNow: f.pale ? '#f6ebef' : f.green ? '#e6f1d6' : base.skin };
    const full = !!opts.full;
    const vb = full ? '0 0 220 404' : '0 0 220 304';
    const blush = f.blush
      ? `<g fill="#ff9fb2" opacity="${f.blush > 1 ? 0.85 : 0.5}"><ellipse cx="74" cy="152" rx="11" ry="6"/><ellipse cx="146" cy="152" rx="11" ry="6"/></g>` +
        `<g stroke="#ff8fab" stroke-width="1.5" opacity=".7"><path d="M68 150 l3 -4 M74 151 l3 -4 M140 150 l3 -4 M146 151 l3 -4"/></g>`
      : '';
    const hits = opts.hit
      ? `<g class="hit-zones">${HIT.map(([p, tag, a]) => `<${tag} data-part="${p}" ${a} class="hit"/>`).join('')}</g>`
      : '';
    const label = opts.label || `${base.name}`;
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" class="chara chara-${role}">` +
      `<ellipse cx="110" cy="${full ? 398 : 300}" rx="70" ry="8" fill="#000" opacity=".06"/>` +
      hair(c, 'back') +
      outfit(c, full) +
      `<rect x="99" y="174" width="22" height="30" rx="8" fill="${c.skinNow}"/><path d="M99 186 Q110 194 121 186" stroke="#000" stroke-opacity=".08" stroke-width="6" fill="none"/>` +
      `<ellipse cx="43" cy="134" rx="9" ry="13" fill="${c.skinNow}"/><ellipse cx="177" cy="134" rx="9" ry="13" fill="${c.skinNow}"/>` +
      `<ellipse cx="110" cy="122" rx="66" ry="62" fill="${c.skinNow}"/>` +
      (f.green ? '<ellipse cx="110" cy="122" rx="66" ry="62" fill="#b9e3a5" opacity=".25"/>' : '') +
      blush +
      eye(84, 130, f.eyes, c, -1) + eye(136, 130, f.eyes, c, 1) +
      `<path d="M108 145 q2 2 4 0" stroke="#e0a99a" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      mouth(f.mouth) +
      hair(c, 'front') +
      brows(f.brows, c.hairDark) +
      glasses(c) +
      headwear(c) +
      effects(f.fx) +
      hits +
      `</svg>`;
  }

  window.Characters = { svg, ROLES, FACES };
})();
