// Gera "Mandarim_Basico_I_Metodo_Chunk.docx" a partir de content.json.
// Mesmo formato do manual de japonês da Odu Creative: capa, índice, e por lição
// objetivos, legenda de cores e 3 pontos (FORMA/FUNÇÃO/MODO, tabela de chunks,
// ✗ Errado / ✓ Correto, Erro comum e OBS).
// Uso: node build_docx.cjs [data dd/mm/aaaa]
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, Footer, PageNumber, PageBreak, BorderStyle, VerticalAlign,
} = require('docx');

const L = JSON.parse(fs.readFileSync(__dirname + '/content.json', 'utf8'));
const DATE = process.argv[2] || '05 / 10 / 2026';
const FONT = { ascii: 'Arial', hAnsi: 'Arial', cs: 'Arial', eastAsia: 'Microsoft YaHei' };
const W = 9972; // largura útil: Carta (12240) - margens 2 × 1134

// cores da legenda (as mesmas do manual de japonês), na ordem da frase chinesa
const ROLES = [
  { key: 'S', label: 'S — Sujeito / Tópico', fill: 'D6E4F0' },
  { key: 'ADV', label: 'ADV — Advérbio, tempo, lugar, auxiliar', fill: 'FDE9D9' },
  { key: 'V', label: 'V — Verbo / Predicado', fill: 'E2EFDA' },
  { key: 'O', label: 'O — Objeto / Complemento', fill: 'FFF2CC' },
  { key: 'PART', label: 'PART — Partícula final', fill: 'E4D9F0' },
];
const GREY = 'E7E6E6';
const border = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const borders = { top: border, bottom: border, left: border, right: border };

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 20, bold: o.bold, italics: o.italics, color: o.color });
const para = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 80 }, heading: o.heading,
  keepNext: o.keepNext, pageBreakBefore: o.pageBreakBefore,
});
const cell = (children, width, o = {}) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
  margins: { top: 50, bottom: 50, left: 90, right: 90 },
  verticalAlign: VerticalAlign.CENTER,
  children: (Array.isArray(children) ? children : [children]).map((c) =>
    c instanceof Paragraph ? c : para(c, { align: o.align || AlignmentType.LEFT, after: 0 })),
});
const table = (widths, rows) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  rows,
});

// ------------------------------------------------------------ capa
const cover = [
  para(run(''), { before: 3000 }),
  para(run('MANDARIM BÁSICO', { size: 56, bold: true }), { align: AlignmentType.CENTER, after: 200 }),
  para(run('汉语入门 · Hànyǔ Rùmén I', { size: 32 }), { align: AlignmentType.CENTER, after: 400 }),
  para(run('Manual de Aulas — Método Chunk (Chunking)', { size: 24 }), { align: AlignmentType.CENTER, after: 120 }),
  para(run('Odu Creative', { size: 24, bold: true }), { align: AlignmentType.CENTER, after: 600 }),
  para(run('25 lições  •  75 pontos gramaticais  •  Análise de chunks colorida', { size: 18 }), { align: AlignmentType.CENTER, after: 200 }),
  para(run(DATE, { size: 20 }), { align: AlignmentType.CENTER }),
];

// ------------------------------------------------------------ índice
const idx = [
  para(run('Índice', { size: 32, bold: true }), { pageBreakBefore: true, after: 200 }),
  table([2400, 3700, 3872], [
    new TableRow({ tableHeader: true, cantSplit: true, children: [
      cell(run('Lição', { bold: true }), 2400, { fill: GREY, align: AlignmentType.CENTER }),
      cell(run('Título', { bold: true }), 3700, { fill: GREY, align: AlignmentType.CENTER }),
      cell(run('Pinyin · Tradução', { bold: true }), 3872, { fill: GREY, align: AlignmentType.CENTER }),
    ] }),
    ...L.map((l) => new TableRow({ cantSplit: true, children: [
      cell(run(`第${l.n}课 / Lição ${l.n}`, { size: 18 }), 2400, { align: AlignmentType.CENTER }),
      cell(run(l.t, { size: 20 }), 3700),
      cell([para([run(l.py, { size: 16, italics: true })], { after: 0 }), para(run(l.pt, { size: 16 }), { after: 0 })], 3872),
    ] })),
  ]),
];

// ------------------------------------------------------------ antes de começar
const TONES = [
  ['1º tom', 'ā', 'Alto e reto, como uma nota sustentada', '妈 mā (mãe)'],
  ['2º tom', 'á', 'Sobe, como em \"Hã?\" de surpresa', '麻 má (cânhamo)'],
  ['3º tom', 'ǎ', 'Desce e sobe; na fala, muitas vezes só desce', '马 mǎ (cavalo)'],
  ['4º tom', 'à', 'Desce forte e rápido, como \"Não!\" firme', '骂 mà (xingar)'],
  ['Neutro', 'a', 'Curto e leve, sem marca', '吗 ma (partícula de pergunta)'],
];
const intro = [
  para(run('Antes de começar', { size: 32, bold: true }), { pageBreakBefore: true, after: 160, heading: HeadingLevel.HEADING_1 }),
  para(run('Os quatro tons', { size: 24, bold: true }), { after: 100 }),
  para(run('No mandarim, o tom muda o significado da sílaba. O pinyin marca o tom com um acento sobre a vogal.'), { after: 120 }),
  table([1500, 900, 4572, 3000], [
    new TableRow({ tableHeader: true, cantSplit: true, children: ['Tom', 'Marca', 'Como soa', 'Exemplo'].map((h, i) =>
      cell(run(h, { bold: true }), [1500, 900, 4572, 3000][i], { fill: GREY, align: AlignmentType.CENTER })) }),
    ...TONES.map((t) => new TableRow({ cantSplit: true, children: [
      cell(run(t[0], { bold: true }), 1500, { align: AlignmentType.CENTER }),
      cell(run(t[1], { size: 24 }), 900, { align: AlignmentType.CENTER }),
      cell(run(t[2]), 4572), cell(run(t[3]), 3000),
    ] })),
  ]),
  para(run(''), { after: 60 }),
  para([run('Mudanças de tom que aparecem no manual: ', { bold: true }),
    run('3º + 3º tom → o primeiro vira 2º (你好 se fala ní hǎo). 不 vira bú antes de 4º tom (不是 bú shì). 一 vira yí antes de 4º tom (一个 yí ge) e yì antes dos outros (一天 yì tiān). O pinyin dos exemplos já mostra o tom falado.')], { after: 160 }),
  para(run('Como ler as tabelas de chunks', { size: 24, bold: true }), { after: 100 }),
  para(run('Cada linha é uma frase dividida em blocos de sentido (chunks). As colunas seguem a ordem real da frase em chinês: lendo da esquerda para a direita, você lê a frase inteira. Por isso a coluna ADV fica entre o sujeito e o verbo: em chinês, tempo, lugar, negação e verbos auxiliares (会、想、能) vêm antes do verbo.'), { after: 100 }),
  para(run('“—” indica que a frase não usa aquele bloco. A última coluna traz o pinyin e a tradução. Treino sugerido: cubra a última coluna, leia os blocos em voz alta e depois troque um bloco por outro da mesma cor.'), { after: 100 }),
];

// ------------------------------------------------------------ lições
function legend() {
  const w = W / 5;
  return table(ROLES.map(() => w), [
    new TableRow({ cantSplit: true, children: ROLES.map((r) => cell(run(r.label, { size: 16, bold: true }), w, { fill: r.fill, align: AlignmentType.CENTER })) }),
  ]);
}

function formTable(p) {
  return table([2200, 7772], [['FORMA', p.forma], ['FUNÇÃO', p.funcao], ['MODO', p.modo]].map(([k, v]) =>
    new TableRow({ cantSplit: true, children: [
      cell(run(k, { bold: true }), 2200, { align: AlignmentType.CENTER, fill: GREY }),
      cell(run(v), 7772),
    ] })));
}

const CW = [1250, 1750, 1150, 1600, 800, 3422];
function chunkTable(p) {
  const head = new TableRow({ tableHeader: true, cantSplit: true, children: [
    ...ROLES.map((r, i) => cell(run(r.key, { bold: true }), CW[i], { fill: r.fill, align: AlignmentType.CENTER })),
    cell(run('Pinyin · Tradução', { bold: true }), CW[5], { fill: GREY, align: AlignmentType.CENTER }),
  ] });
  const rows = p.ex.map((line) => {
    const f = line.split('|');
    return new TableRow({ cantSplit: true, children: [
      ...ROLES.map((r, i) => cell(run(f[i], { size: 21 }), CW[i], { fill: ROLES[i].fill, align: AlignmentType.CENTER })),
      cell([para(run(f[5], { size: 17, italics: true }), { after: 0 }), para(run(f[6], { size: 17 }), { after: 0 })], CW[5]),
    ] });
  });
  return table(CW, [head, ...rows]);
}

function errorTable(p) {
  const w = W / 2;
  return table([w, w], [
    new TableRow({ cantSplit: true, children: [
      cell(run('✗ Errado', { bold: true, color: 'C00000' }), w, { fill: GREY, align: AlignmentType.CENTER }),
      cell(run('✓ Correto', { bold: true, color: '2E7D32' }), w, { fill: GREY, align: AlignmentType.CENTER }),
    ] }),
    new TableRow({ cantSplit: true, children: [
      cell(run('✗ ' + p.wrong), w, { align: AlignmentType.CENTER }),
      cell(run('✓ ' + p.right), w, { align: AlignmentType.CENTER }),
    ] }),
  ]);
}

const gap = () => para(run(''), { after: 60 });

function lesson(l) {
  const out = [
    para(run(DATE, { bold: true, size: 22 }), { align: AlignmentType.CENTER, pageBreakBefore: true, after: 60 }),
    para([run(`第${l.n}课 ／ `, { size: 26 }), run(`Lição ${l.n}`, { size: 26, bold: true }), run(` — ${l.t}`, { size: 26 })],
      { align: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, after: 40 }),
    para([run(l.py, { size: 18, italics: true }), run(`  ·  ${l.pt}`, { size: 18 })], { align: AlignmentType.CENTER, after: 200 }),
    para(run('Objetivos', { bold: true, size: 24 }), { after: 80 }),
    ...l.obj.map((o) => para(run('➤ ' + o), { after: 40 })),
    para(run('Legenda de Cores', { bold: true, size: 24 }), { before: 160, after: 80 }),
    legend(),
    para([run('语法 ', { size: 22 }), run('(yǔfǎ) — Gramática', { size: 20 })], { before: 200, after: 80 }),
  ];
  l.pts.forEach((p, i) => {
    out.push(
      para([run(`要点 ${'ABC'[i]} — `, { size: 22 }), run(p.title, { size: 22, bold: true })],
        { heading: HeadingLevel.HEADING_2, before: 160, after: 80, keepNext: true }),
      formTable(p), gap(), chunkTable(p), gap(), errorTable(p),
      para([run('Erro comum para ser evitado: ', { bold: true }), run(p.erro)], { before: 100, after: 80 }),
      para([run('OBS: ', { bold: true }), run(p.obs)], { after: 120 }),
    );
  });
  return out;
}

const doc = new Document({
  creator: 'Odu Creative',
  title: 'Mandarim Básico I — Manual de Aulas — Método Chunk',
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 26, color: '000000' }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 22, color: '000000' }, paragraph: { outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      run('Odu Creative  •  Mandarim Básico I  •  Página ', { size: 16 }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16 }),
    ] })] }) },
    children: [...cover, ...idx, ...intro, ...L.flatMap(lesson)],
  }],
});

const out = __dirname + '/Mandarim_Basico_I_Metodo_Chunk.docx';
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('ok', out, Math.round(b.length / 1024) + ' KB'); });
